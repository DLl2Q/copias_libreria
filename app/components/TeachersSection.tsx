'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Teacher {
  id: string
  name: string
  created_at: string
}

export default function TeachersSection() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    const { data, error } = await supabase.from('teachers').select('*').order('name')
    if (error) console.error(error)
    else setTeachers(data || [])
  }

  const addTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('teachers').insert([{ name }])
    if (error) console.error(error)
    else {
      setName('')
      fetchTeachers()
    }
  }

  const updateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase
      .from('teachers')
      .update({ name: editingName })
      .eq('id', editingId)
    if (error) console.error(error)
    else {
      setEditingId(null)
      setEditingName('')
      fetchTeachers()
    }
  }

  const checkAndDeleteTeacher = async (id: string) => {
    setDeleteError('')
    const { data: copies, error } = await supabase
      .from('copies')
      .select('id', { count: 'exact' })
      .eq('teacher_id', id)
    
    if (error) {
      console.error(error)
      setDeleteError('Error al verificar copias')
      return
    }

    if (copies && copies.length > 0) {
      setDeleteError(`No se puede eliminar. Este profesor tiene ${copies.length} copias registradas.`)
      setDeletingId(null)
      return
    }

    const { error: deleteError } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id)
    
    if (deleteError) console.error(deleteError)
    else {
      setDeletingId(null)
      fetchTeachers()
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Profesores</h1>
      
      <form onSubmit={addTeacher} className="mb-6 p-4 bg-gray-100 rounded">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del profesor"
          className="border p-2 mr-2 rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Agregar</button>
      </form>

      {deleteError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {deleteError}
        </div>
      )}

      {teachers.length === 0 ? (
        <p className="text-gray-500">No hay profesores registrados</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-green-500 text-white">
              <tr>
                <th className="border p-2 text-left">Nombre</th>
                <th className="border p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-100">
                  <td className="border p-2">
                    {editingId === teacher.id ? (
                      <form onSubmit={updateTeacher} className="flex gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="border p-1 rounded flex-1"
                          required
                        />
                        <button type="submit" className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Guardar</button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null)
                            setEditingName('')
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                        >
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      teacher.name
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {editingId !== teacher.id && (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(teacher.id)
                            setEditingName(teacher.name)
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          Editar
                        </button>
                        {deletingId === teacher.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => checkAndDeleteTeacher(teacher.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => {
                                setDeletingId(null)
                                setDeleteError('')
                              }}
                              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(teacher.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
