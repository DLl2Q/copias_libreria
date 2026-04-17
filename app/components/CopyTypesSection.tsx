'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface CopyType {
  id: string
  name: string
  price: number
  created_at: string
}

export default function CopyTypesSection() {
  const [copyTypes, setCopyTypes] = useState<CopyType[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingPrice, setEditingPrice] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetchCopyTypes()
  }, [])

  const fetchCopyTypes = async () => {
    const { data, error } = await supabase.from('copy_types').select('*').order('name')
    if (error) console.error(error)
    else setCopyTypes(data || [])
  }

  const addCopyType = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('copy_types').insert([{ name, price: parseFloat(price) }])
    if (error) console.error(error)
    else {
      setName('')
      setPrice('')
      fetchCopyTypes()
    }
  }

  const updateCopyType = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase
      .from('copy_types')
      .update({ name: editingName, price: parseFloat(editingPrice) })
      .eq('id', editingId)
    if (error) console.error(error)
    else {
      setEditingId(null)
      setEditingName('')
      setEditingPrice('')
      fetchCopyTypes()
    }
  }

  const checkAndDeleteCopyType = async (id: string) => {
    setDeleteError('')
    const { data: copies, error } = await supabase
      .from('copies')
      .select('id', { count: 'exact' })
      .eq('copy_type_id', id)
    
    if (error) {
      console.error(error)
      setDeleteError('Error al verificar copias')
      return
    }

    if (copies && copies.length > 0) {
      setDeleteError(`No se puede eliminar. Este tipo de copia tiene ${copies.length} registros.`)
      setDeletingId(null)
      return
    }

    const { error: deleteError } = await supabase
      .from('copy_types')
      .delete()
      .eq('id', id)
    
    if (deleteError) console.error(deleteError)
    else {
      setDeletingId(null)
      fetchCopyTypes()
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tipos de Copia</h1>
      
      <form onSubmit={addCopyType} className="mb-6 p-4 bg-gray-100 rounded">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del tipo"
          className="border p-2 mr-2 rounded"
          required
        />
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Precio"
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

      {copyTypes.length === 0 ? (
        <p className="text-gray-500">No hay tipos de copia registrados</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-green-500 text-white">
              <tr>
                <th className="border p-2 text-left">Nombre</th>
                <th className="border p-2 text-right">Precio</th>
                <th className="border p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {copyTypes.map((type) => (
                <tr key={type.id} className="hover:bg-gray-100">
                  <td className="border p-2">
                    {editingId === type.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="border p-1 rounded w-full"
                        required
                      />
                    ) : (
                      type.name
                    )}
                  </td>
                  <td className="border p-2 text-right">
                    {editingId === type.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        className="border p-1 rounded w-24 text-right"
                        required
                      />
                    ) : (
                      `S/ ${type.price.toFixed(2)}`
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {editingId === type.id ? (
                      <form onSubmit={updateCopyType} className="flex justify-center gap-2">
                        <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Guardar</button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null)
                            setEditingName('')
                            setEditingPrice('')
                          }}
                          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
                        >
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(type.id)
                            setEditingName(type.name)
                            setEditingPrice(type.price.toString())
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          Editar
                        </button>
                        {deletingId === type.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => checkAndDeleteCopyType(type.id)}
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
                            onClick={() => setDeletingId(type.id)}
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
