'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Copy {
  id: string
  teacher_id: string
  copy_type_id: string
  date: string
  quantity: number
  teachers: { name: string }
  copy_types: { name: string; price: number }
}

interface Teacher {
  id: string
  name: string
}

export default function ReportsSection() {
  const [copies, setCopies] = useState<Copy[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  useEffect(() => {
    fetchTeachers()
    fetchCopies()
  }, [])

  const fetchTeachers = async () => {
    const { data, error } = await supabase.from('teachers').select('*').order('name')
    if (error) console.error(error)
    else setTeachers(data || [])
  }

  const fetchCopies = async () => {
    const { data, error } = await supabase
      .from('copies')
      .select(`
        *,
        teachers (name),
        copy_types (name, price)
      `)
    if (error) console.error(error)
    else setCopies(data || [])
  }

  const groupBy = (data: Copy[], key: (item: Copy) => string) => {
    const grouped: { [key: string]: Copy[] } = {}
    data.forEach(item => {
      const k = key(item)
      if (!grouped[k]) grouped[k] = []
      grouped[k].push(item)
    })
    return grouped
  }

  const getWeekRange = (items: Copy[]) => {
    if (items.length === 0) return ''
    
    const dates = items.map(item => new Date(item.date + 'T00:00:00')).sort((a, b) => a.getTime() - b.getTime())
    const firstDate = dates[0]
    
    // Calcular inicio de semana (lunes) para la primera fecha
    const dayOfWeek = firstDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(firstDate.getTime() + mondayOffset * 24 * 60 * 60 * 1000)
    
    // Calcular fin de semana (viernes)
    const weekEnd = new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000)
    
    const formatDate = (date: Date) => date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
  }

  const getKey = (copy: Copy) => {
    const d = new Date(copy.date)
    if (reportType === 'daily') return copy.date
    if (reportType === 'weekly') {
      // Calcular semanas desde la fecha del primer consumo
      const allDates = filteredCopies.map(c => new Date(c.date + 'T00:00:00')).sort((a, b) => a.getTime() - b.getTime())
      const firstDate = allDates[0]
      
      // Ajustar al lunes más cercano (o mantener la fecha si ya es lunes)
      const dayOfWeek = firstDate.getDay() // 0 = domingo, 1 = lunes, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Si es domingo, ir al lunes anterior
      const weekStart = new Date(firstDate.getTime() + mondayOffset * 24 * 60 * 60 * 1000)
      
      const daysSinceFirst = Math.floor((d.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const week = Math.max(1, daysSinceFirst + 1) // Asegurar que nunca sea menor a 1
      return `W${week}`
    }
    if (reportType === 'monthly') {
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      return `${year}-M${month}`
    }
    return copy.date
  }

  const formatPeriod = (key: string, items?: Copy[]) => {
    if (reportType === 'daily') {
      return new Date(key + 'T00:00:00').toLocaleDateString('es-PE')
    }
    if (reportType === 'weekly') {
      const week = key.replace('W', '')
      const range = items ? getWeekRange(items) : ''
      return `Semana ${parseInt(week)} - ${range.charAt(0).toUpperCase() + range.slice(1).toLowerCase()}`
    }
    if (reportType === 'monthly') {
      const [year, month] = key.split('-M')
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      return `${months[parseInt(month) - 1]} ${year}`
    }
  }

  const calculateTotal = (items: Copy[]) => {
    return items.reduce((sum, item) => sum + item.quantity * item.copy_types.price, 0)
  }

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-PE')
  }

  const filteredCopies = selectedTeacherId 
    ? copies.filter(copy => copy.teacher_id === selectedTeacherId)
    : copies

  const grouped = groupBy(filteredCopies, getKey)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reportes</h1>
      <div className="mb-4 flex gap-4">
        <div>
          <label className="mr-2 font-semibold">Tipo de Reporte:</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="border p-2 rounded"
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Profesor:</label>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Todos los profesores</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </div>
      </div>
      {filteredCopies.length === 0 ? (
        <p className="text-gray-500">No hay registros</p>
      ) : reportType === 'weekly' ? (
        // Reporte semanal: mostrar resumen por semana
        <div>
          {Object.entries(grouped)
            .sort((a, b) => {
              // Ordenar por fecha de la copia más reciente en cada semana (orden ascendente)
              const getLatestDateInWeek = (items: Copy[]) => {
                const dates = items.map(item => new Date(item.date + 'T00:00:00'))
                return new Date(Math.max(...dates.map(d => d.getTime())))
              }
              return getLatestDateInWeek(a[1]).getTime() - getLatestDateInWeek(b[1]).getTime()
            })
            .map(([period, items]) => {
              const itemsByTeacher = items.reduce((acc: { [key: string]: Copy[] }, item) => {
                const key = item.teacher_id
                if (!acc[key]) acc[key] = []
                acc[key].push(item)
                return acc
              }, {})

              return (
                <div key={period} className="mb-6">
                  <h2 className="text-xl font-bold mb-2 bg-blue-100 p-2 rounded">{formatPeriod(period, items)}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mb-2">
                      <thead className="bg-blue-500 text-white">
                        <tr>
                          <th className="border p-2 text-left">Profesor</th>
                          <th className="border p-2 text-left">Resumen</th>
                          <th className="border p-2 text-right">Total Copias</th>
                          <th className="border p-2 text-right">Precio Unit.</th>
                          <th className="border p-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(itemsByTeacher).map(([teacherId, teacherCopies]) => {
                          const totalCopies = teacherCopies.reduce((sum, c) => sum + c.quantity, 0)
                          const totalCost = teacherCopies.reduce((sum, c) => sum + c.quantity * c.copy_types.price, 0)
                          return (
                            <tr key={teacherId} className="hover:bg-gray-100">
                              <td className="border p-2 font-semibold">{teacherCopies[0].teachers.name}</td>
                              <td className="border p-2">Resumen semanal</td>
                              <td className="border p-2 text-right font-semibold">{totalCopies}</td>
                              <td className="border p-2 text-right">-</td>
                              <td className="border p-2 text-right font-semibold">S/ {totalCost.toFixed(2)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-gray-200 p-2 rounded text-right font-bold">
                    Total Semana: S/ {Math.round(calculateTotal(items) * 100) / 100}
                  </div>
                </div>
              )
            })}
          <div className="bg-blue-200 p-3 rounded text-right font-bold text-lg">
            Total General: S/ {Math.round(calculateTotal(filteredCopies) * 100) / 100}
          </div>
        </div>
      ) : reportType === 'monthly' ? (
        // Reporte mensual: mostrar resumen por mes
        <div>
          {Object.entries(grouped)
            .sort((a, b) => {
              // Ordenar por mes ascendente
              return a[0].localeCompare(b[0])
            })
            .map(([period, items]) => {
              const itemsByTeacher = items.reduce((acc: { [key: string]: Copy[] }, item) => {
                const key = item.teacher_id
                if (!acc[key]) acc[key] = []
                acc[key].push(item)
                return acc
              }, {})

              return (
                <div key={period} className="mb-6">
                  <h2 className="text-xl font-bold mb-2 bg-blue-100 p-2 rounded">{formatPeriod(period, items)}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mb-2">
                      <thead className="bg-blue-500 text-white">
                        <tr>
                          <th className="border p-2 text-left">Profesor</th>
                          <th className="border p-2 text-left">Resumen</th>
                          <th className="border p-2 text-right">Total Copias</th>
                          <th className="border p-2 text-right">Precio Unit.</th>
                          <th className="border p-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(itemsByTeacher).map(([teacherId, teacherCopies]) => {
                          const totalCopies = teacherCopies.reduce((sum, c) => sum + c.quantity, 0)
                          const totalCost = teacherCopies.reduce((sum, c) => sum + c.quantity * c.copy_types.price, 0)
                          return (
                            <tr key={teacherId} className="hover:bg-gray-100">
                              <td className="border p-2 font-semibold">{teacherCopies[0].teachers.name}</td>
                              <td className="border p-2">Resumen mensual</td>
                              <td className="border p-2 text-right font-semibold">{totalCopies}</td>
                              <td className="border p-2 text-right">-</td>
                              <td className="border p-2 text-right font-semibold">S/ {totalCost.toFixed(2)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-gray-200 p-2 rounded text-right font-bold">
                    Total Mes: S/ {Math.round(calculateTotal(items) * 100) / 100}
                  </div>
                </div>
              )
            })}
          <div className="bg-blue-200 p-3 rounded text-right font-bold text-lg">
            Total General: S/ {Math.round(calculateTotal(filteredCopies) * 100) / 100}
          </div>
        </div>
      ) : (
        // Reporte diario: mostrar tabla única
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-blue-500 text-white">
              <tr>
                <th className="border p-2 text-left">Fecha</th>
                <th className="border p-2 text-left">Profesor</th>
                <th className="border p-2 text-left">Tipo de Copia</th>
                <th className="border p-2 text-right">Cantidad</th>
                <th className="border p-2 text-right">Precio Unit.</th>
                <th className="border p-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {filteredCopies
                .sort((a, b) => {
                  // Ordenar por fecha ascendente
                  return new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime()
                })
                .map((copy) => (
                  <tr key={copy.id} className="hover:bg-gray-100">
                    <td className="border p-2">{formatDate(copy.date)}</td>
                    <td className="border p-2">{copy.teachers.name}</td>
                    <td className="border p-2">{copy.copy_types.name}</td>
                    <td className="border p-2 text-right">{copy.quantity}</td>
                    <td className="border p-2 text-right">S/ {copy.copy_types.price.toFixed(2)}</td>
                    <td className="border p-2 text-right font-semibold">S/ {(copy.quantity * copy.copy_types.price).toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="bg-gray-200 p-2 rounded text-right font-bold mt-2">
            Total General: S/ {Math.round(calculateTotal(filteredCopies) * 100) / 100}
          </div>
        </div>
      )}
    </div>
  )
}
