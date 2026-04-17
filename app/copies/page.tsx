'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Teacher {
  id: string
  name: string
}

interface CopyType {
  id: string
  name: string
  price: number
}

interface Copy {
  id: string
  teacher_id: string
  copy_type_id: string
  date: string
  quantity: number
  teachers: { name: string }
  copy_types: { name: string; price: number }
}

export default function Copies() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [copyTypes, setCopyTypes] = useState<CopyType[]>([])
  const [teacherId, setTeacherId] = useState('')
  const [copyTypeId, setCopyTypeId] = useState('')
  const [date, setDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiesOfDay, setCopiesOfDay] = useState<Copy[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingQuantity, setEditingQuantity] = useState('')

  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    fetchTeachers()
    fetchCopyTypes()
    // Establecer la fecha actual como default
    const today = getTodayDate()
    setDate(today)
    fetchCopiesOfDay(today)
  }, [])

  const fetchTeachers = async () => {
    const { data, error } = await supabase.from('teachers').select('*')
    if (error) console.error(error)
    else setTeachers(data || [])
  }

  const fetchCopyTypes = async () => {
    const { data, error } = await supabase.from('copy_types').select('*')
    if (error) console.error(error)
    else setCopyTypes(data || [])
  }

  const fetchCopiesOfDay = async (dateStr: string) => {
    const { data, error } = await supabase
      .from('copies')
      .select(`
        *,
        teachers (name),
        copy_types (name, price)
      `)
      .eq('date', dateStr)
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    else setCopiesOfDay(data || [])
  }

  const addCopy = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('copies').insert([{
      teacher_id: teacherId,
      copy_type_id: copyTypeId,
      date,
      quantity: parseInt(quantity)
    }])
    setLoading(false)
    if (error) console.error(error)
    else {
      // Solo limpiar la cantidad, mantener profesor y tipo de copia seleccionados
      setQuantity('')
      // Actualizar la tabla de copias del día
      fetchCopiesOfDay(date)
    }
  }

  const updateCopy = async (copyId: string) => {
    const { error } = await supabase
      .from('copies')
      .update({ quantity: parseInt(editingQuantity) })
      .eq('id', copyId)
    if (error) console.error(error)
    else {
      setEditingId(null)
      setEditingQuantity('')
      fetchCopiesOfDay(date)
    }
  }

  const deleteCopy = async (copyId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      const { error } = await supabase
        .from('copies')
        .delete()
        .eq('id', copyId)
      if (error) console.error(error)
      else {
        fetchCopiesOfDay(date)
      }
    }
  }

  // Filtrar copias por profesor seleccionado si hay uno
  const filteredCopies = teacherId 
    ? copiesOfDay.filter(copy => copy.teacher_id === teacherId)
    : copiesOfDay

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <a href="/" className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">← Volver al menú</a>
      </div>
      <h1 className="text-2xl font-bold mb-4">Registrar Copias</h1>
      <form onSubmit={addCopy} className="mb-4">
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className="border p-2 mr-2"
          required
        >
          <option value="">Seleccionar profesor</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
        <select
          value={copyTypeId}
          onChange={(e) => setCopyTypeId(e.target.value)}
          className="border p-2 mr-2"
          required
        >
          <option value="">Seleccionar tipo de copia</option>
          {copyTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            fetchCopiesOfDay(e.target.value)
          }}
          className="border p-2 mr-2"
          required
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Cantidad"
          className="border p-2 mr-2"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Registrando...' : 'Registrar'}
        </button>
      </form>

      <h2 className="text-xl font-bold mb-4">Copias del día ({date}) {teacherId && '- ' + teachers.find(t => t.id === teacherId)?.name}</h2>
      {filteredCopies.length === 0 ? (
        <p className="text-gray-500">No hay copias registradas para este día {teacherId ? 'para este profesor' : ''}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-green-500 text-white">
              <tr>
                <th className="border p-2 text-left">Profesor</th>
                <th className="border p-2 text-left">Tipo de Copia</th>
                <th className="border p-2 text-right">Cantidad</th>
                <th className="border p-2 text-right">Precio Unit.</th>
                <th className="border p-2 text-right">Subtotal</th>
                <th className="border p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCopies.map((copy) => (
                <tr key={copy.id} className="hover:bg-gray-100">
                  <td className="border p-2">{copy.teachers.name}</td>
                  <td className="border p-2">{copy.copy_types.name}</td>
                  <td className="border p-2 text-right">
                    {editingId === copy.id ? (
                      <input
                        type="number"
                        value={editingQuantity}
                        onChange={(e) => setEditingQuantity(e.target.value)}
                        className="border p-1 w-16 text-right"
                        required
                      />
                    ) : (
                      copy.quantity
                    )}
                  </td>
                  <td className="border p-2 text-right">S/ {copy.copy_types.price.toFixed(2)}</td>
                  <td className="border p-2 text-right font-semibold">
                    S/ {editingId === copy.id 
                      ? (parseInt(editingQuantity || '0') * copy.copy_types.price).toFixed(2)
                      : (copy.quantity * copy.copy_types.price).toFixed(2)
                    }
                  </td>
                  <td className="border p-2 text-center">
                    {editingId === copy.id ? (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => updateCopy(copy.id)}
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditingQuantity('')
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(copy.id)
                            setEditingQuantity(copy.quantity.toString())
                          }}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteCopy(copy.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-200 font-bold">
                <td colSpan={5} className="border p-2 text-right">Total:</td>
                <td className="border p-2 text-right">
                  S/ {Math.round(filteredCopies.reduce((sum, copy) => sum + copy.quantity * copy.copy_types.price, 0)).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}