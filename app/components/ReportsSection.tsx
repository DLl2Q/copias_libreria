'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Copy {
  id: string
  teacher_id: string
  copy_type_id: string
  date: string
  quantity: number
  paid: boolean
  paid_date?: string
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
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const markAsPaid = async (copyIds: string[], scope: 'individual' | 'weekly' | 'monthly') => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('copies')
        .update({ 
          paid: true, 
          paid_date: new Date().toISOString() 
        })
        .in('id', copyIds)
      
      if (error) {
        console.error(error)
        alert('Error al marcar como pagado')
      } else {
        await fetchCopies()
        alert(`${scope === 'individual' ? 'Producto' : scope === 'weekly' ? 'Semana' : 'Mes'} marcado como pagado`)
      }
    } catch (err) {
      console.error(err)
      alert('Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  const markIndividualAsPaid = async (copyId: string) => {
    await markAsPaid([copyId], 'individual')
  }

  const markWeekAsPaid = async (weekKey: string) => {
    const weekCopies = filteredCopies.filter(copy => getKey(copy) === weekKey && !copy.paid)
    const copyIds = weekCopies.map(copy => copy.id)
    if (copyIds.length > 0) {
      await markAsPaid(copyIds, 'weekly')
    } else {
      alert('No hay productos pendientes de pago en esta semana')
    }
  }

  const markMonthAsPaid = async (monthKey: string) => {
    const monthCopies = filteredCopies.filter(copy => getKey(copy) === monthKey && !copy.paid)
    const copyIds = monthCopies.map(copy => copy.id)
    if (copyIds.length > 0) {
      await markAsPaid(copyIds, 'monthly')
    } else {
      alert('No hay productos pendientes de pago en este mes')
    }
  }

  const groupBy = (data: Copy[], key: (item: Copy) => string) => {
    const grouped: { [key: string]: Copy[] } = {}
    data.forEach(item => {
      let k = key(item)
      
            
      if (!grouped[k]) grouped[k] = []
      grouped[k].push(item)
    })
    return grouped
  }

  const getWeekRange = (items: Copy[]) => {
    if (items.length === 0) return ''
    
    const dates = items.map(item => new Date(item.date + 'T00:00:00')).sort((a, b) => a.getTime() - b.getTime())
    const firstDate = dates[0]
    const lastDate = dates[dates.length - 1]
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
    }
    return `${formatDate(firstDate)} - ${formatDate(lastDate)}`
  }

  const getKey = (copy: Copy) => {
    const d = new Date(copy.date)
    if (reportType === 'daily') return copy.date
    if (reportType === 'weekly') {
      const year = d.getFullYear()
      // Usar un cálculo de semana más robusto basado en ISO 8601
      const firstDayOfYear = new Date(year, 0, 1)
      const daysSinceFirstDay = Math.floor((d.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000))
      const week = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7)
      return `${year}-W${week}`
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
      const [year, week] = key.split('-W')
      const range = items ? getWeekRange(items) : ''
      return `Semana ${parseInt(week)} - ${range}`
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

const displayCopies = editMode 
    ? filteredCopies 
    : filteredCopies.filter(copy => !copy.paid)

  
  const grouped = groupBy(displayCopies, getKey)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reportes</h1>
      <div className="mb-4 flex gap-4 flex-wrap">
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
        <div>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded font-semibold transition ${
              editMode 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            disabled={loading}
          >
            {editMode ? 'Salir de Edición' : 'Modo Edición'}
          </button>
        </div>
      </div>
      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-500">No hay registros</p>
      ) : (
        Object.entries(grouped)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([period, items]) => {
            const itemsByTeacher = reportType !== 'daily' 
              ? items.reduce((acc: { [key: string]: Copy[] }, item) => {
                  const key = item.teacher_id
                  if (!acc[key]) acc[key] = []
                  acc[key].push(item)
                  return acc
                }, {})
              : null

            return (
              <div key={period} className="mb-6">
                <h2 className="text-xl font-bold mb-2 bg-blue-100 p-2 rounded">{formatPeriod(period, items)}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 mb-2">
                    <thead className="bg-blue-500 text-white">
                      <tr>
                        {reportType === 'daily' && <th className="border p-2 text-left">Fecha</th>}
                        <th className="border p-2 text-left">Profesor</th>
                        <th className="border p-2 text-left">Tipo de Copia</th>
                        <th className="border p-2 text-right">Cantidad</th>
                        <th className="border p-2 text-right">Precio Unit.</th>
                        <th className="border p-2 text-right">Subtotal</th>
                        {editMode && <th className="border p-2 text-left">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {reportType === 'daily' ? (
                        items.map((copy) => (
                          <tr key={copy.id} className="hover:bg-gray-100">
                            <td className="border p-2">{formatDate(copy.date)}</td>
                            <td className="border p-2">{copy.teachers.name}</td>
                            <td className="border p-2">{copy.copy_types.name}</td>
                            <td className="border p-2 text-right">{copy.quantity}</td>
                            <td className="border p-2 text-right">S/ {copy.copy_types.price.toFixed(2)}</td>
                            <td className="border p-2 text-right font-semibold">S/ {(copy.quantity * copy.copy_types.price).toFixed(2)}</td>
                            {editMode && (
                              <td className="border p-2">
                                {!copy.paid ? (
                                  <button
                                    onClick={() => markIndividualAsPaid(copy.id)}
                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                    disabled={loading}
                                  >
                                    Marcar Pagado
                                  </button>
                                ) : (
                                  <span className="text-green-600 font-semibold text-sm">Pagado</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        Object.entries(itemsByTeacher!).map(([teacherId, teacherCopies]) => {
                          const totalCopies = teacherCopies.reduce((sum, c) => sum + c.quantity, 0)
                          const totalCost = teacherCopies.reduce((sum, c) => sum + c.quantity * c.copy_types.price, 0)
                          return (
                            <tr key={teacherId} className="hover:bg-gray-100">
                              <td className="border p-2 font-semibold">{teacherCopies[0].teachers.name}</td>
                              <td className="border p-2">Resumen</td>
                              <td className="border p-2 text-right font-semibold">{totalCopies}</td>
                              <td className="border p-2 text-right">-</td>
                              <td className="border p-2 text-right font-semibold">S/ {totalCost.toFixed(2)}</td>
                              {editMode && (
                                <td className="border p-2">
                                  <button
                                    onClick={() => reportType === 'weekly' ? markWeekAsPaid(period) : markMonthAsPaid(period)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                    disabled={loading}
                                  >
                                    Marcar {reportType === 'weekly' ? 'Semana' : 'Mes'} Pagado
                                  </button>
                                </td>
                              )}
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-200 p-2 rounded text-right font-bold">
                  Total: S/ {Math.round(calculateTotal(items) * 100) / 100}
                </div>
              </div>
            )
          })
      )}
      <div className="bg-blue-200 p-3 rounded text-right font-bold text-lg mt-6">
        Total General: S/ {Math.round(calculateTotal(displayCopies) * 100) / 100}
      </div>
    </div>
  )
}
