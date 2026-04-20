'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Teacher {
  id: string
  name: string
}

interface PersonalAccount {
  id: string
  teacher_id: string
  description?: string
  created_at: string
  teachers: { name: string }
}

interface PersonalSupply {
  id: string
  personal_account_id: string
  product_name: string
  price: number
  quantity: number
  supply_date: string
  paid: boolean
  paid_date?: string
  created_at: string
}

export default function PersonalAccountsSection() {
  const [accounts, setAccounts] = useState<PersonalAccount[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [supplies, setSupplies] = useState<PersonalSupply[]>([])
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [description, setDescription] = useState('')
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productQuantity, setProductQuantity] = useState('1')
  const [supplyDate, setSupplyDate] = useState(new Date().toISOString().split('T')[0])
  
  // Edit states
  const [editingSupply, setEditingSupply] = useState<string | null>(null)
  const [editProductName, setEditProductName] = useState('')
  const [editProductPrice, setEditProductPrice] = useState('')
  const [editProductQuantity, setEditProductQuantity] = useState('')
  const [editSupplyDate, setEditSupplyDate] = useState('')

  useEffect(() => {
    fetchTeachers()
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccountId) {
      fetchSupplies(selectedAccountId)
    } else {
      setSupplies([])
    }
  }, [selectedAccountId])

  const fetchTeachers = async () => {
    const { data, error } = await supabase.from('teachers').select('*').order('name')
    if (error) console.error(error)
    else setTeachers(data || [])
  }

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('personal_accounts')
      .select(`
        *,
        teachers (name)
      `)
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    else setAccounts(data || [])
  }

  const fetchSupplies = async (accountId: string) => {
    const { data, error } = await supabase
      .from('personal_supplies')
      .select('*')
      .eq('personal_account_id', accountId)
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    else setSupplies(data || [])
  }

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacherId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('personal_accounts')
        .insert([{ 
          teacher_id: selectedTeacherId, 
          description: description || null
        }])
      
      if (error) console.error(error)
      else {
        setSelectedTeacherId('')
        setDescription('')
        fetchAccounts()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addSupply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccountId || !productName || !productPrice || !supplyDate) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('personal_supplies')
        .insert([{ 
          personal_account_id: selectedAccountId,
          product_name: productName,
          price: parseFloat(productPrice),
          quantity: parseInt(productQuantity),
          supply_date: supplyDate
        }])
      
      if (error) console.error(error)
      else {
        setProductName('')
        setProductPrice('')
        setProductQuantity('1')
        setSupplyDate(new Date().toISOString().split('T')[0])
        fetchSupplies(selectedAccountId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markSupplyAsPaid = async (supplyId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('personal_supplies')
        .update({ 
          paid: true, 
          paid_date: new Date().toISOString() 
        })
        .eq('id', supplyId)
      
      if (error) console.error(error)
      else {
        fetchSupplies(selectedAccountId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const startEditSupply = (supply: PersonalSupply) => {
    setEditingSupply(supply.id)
    setEditProductName(supply.product_name)
    setEditProductPrice(supply.price.toString())
    setEditProductQuantity(supply.quantity.toString())
    setEditSupplyDate(supply.supply_date)
  }

  const cancelEdit = () => {
    setEditingSupply(null)
    setEditProductName('')
    setEditProductPrice('')
    setEditProductQuantity('')
    setEditSupplyDate('')
  }

  const saveEditSupply = async (supplyId: string) => {
    if (!editProductName || !editProductPrice || !editProductQuantity || !editSupplyDate) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('personal_supplies')
        .update({
          product_name: editProductName,
          price: parseFloat(editProductPrice),
          quantity: parseInt(editProductQuantity),
          supply_date: editSupplyDate
        })
        .eq('id', supplyId)
      
      if (error) console.error(error)
      else {
        cancelEdit()
        fetchSupplies(selectedAccountId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const deleteSupply = async (supplyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este útil?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('personal_supplies')
        .delete()
        .eq('id', supplyId)
      
      if (error) console.error(error)
      else {
        fetchSupplies(selectedAccountId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = (items: PersonalSupply[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  const displaySupplies = editMode 
    ? supplies 
    : supplies.filter(supply => !supply.paid)

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cuentas Personales</h1>
      
      {/* Formulario para crear cuenta */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Crear Nueva Cuenta Personal</h2>
        <form onSubmit={createAccount} className="space-y-3">
          <div className="flex gap-3">
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="flex-1 border p-2 rounded"
              required
            >
              <option value="">Seleccionar Profesor</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-2 border p-2 rounded"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              Crear Cuenta
            </button>
          </div>
        </form>
      </div>

      {/* Selector de cuenta */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Seleccionar Cuenta</h2>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Seleccionar cuenta para gestionar útiles</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.teachers.name}
            </option>
          ))}
        </select>
      </div>

      {selectedAccount && (
        <>
          {/* Formulario para agregar útiles */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-3">Agregar Útiles - {selectedAccount.teachers.name}</h2>
            <form onSubmit={addSupply} className="space-y-3">
              <div className="flex gap-3 flex-wrap">
                <input
                  type="date"
                  value={supplyDate}
                  onChange={(e) => setSupplyDate(e.target.value)}
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="flex-1 min-w-[200px] border p-2 rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Cantidad"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  className="w-24 border p-2 rounded"
                  min="1"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-32 border p-2 rounded"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  disabled={loading}
                >
                  Agregar Útil
                </button>
              </div>
            </form>
          </div>

          {/* Lista de útiles y reporte */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Útiles de {selectedAccount.teachers.name}</h2>
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

            {displaySupplies.length === 0 ? (
              <p className="text-gray-500">No hay útiles registrados</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-blue-500 text-white">
                      <tr>
                        <th className="border p-2 text-left">Fecha</th>
                        <th className="border p-2 text-left">Producto</th>
                        <th className="border p-2 text-right">Precio Unit.</th>
                        <th className="border p-2 text-right">Cantidad</th>
                        <th className="border p-2 text-right">Subtotal</th>
                        {editMode && <th className="border p-2 text-left">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {displaySupplies.map((supply) => (
                        <tr key={supply.id} className="hover:bg-gray-100">
                          {editingSupply === supply.id ? (
                            <>
                              <td className="border p-2">
                                <input
                                  type="date"
                                  value={editSupplyDate}
                                  onChange={(e) => setEditSupplyDate(e.target.value)}
                                  className="w-full border p-1 rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={editProductName}
                                  onChange={(e) => setEditProductName(e.target.value)}
                                  className="w-full border p-1 rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editProductPrice}
                                  onChange={(e) => setEditProductPrice(e.target.value)}
                                  className="w-20 border p-1 rounded text-right"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={editProductQuantity}
                                  onChange={(e) => setEditProductQuantity(e.target.value)}
                                  className="w-16 border p-1 rounded text-right"
                                  min="1"
                                />
                              </td>
                              <td className="border p-2 text-right font-semibold">
                                S/ {(parseFloat(editProductPrice) * parseInt(editProductQuantity)).toFixed(2)}
                              </td>
                              {editMode && (
                                <td className="border p-2">
                                  <button
                                    onClick={() => saveEditSupply(supply.id)}
                                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm mr-1"
                                    disabled={loading}
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                                  >
                                    Cancelar
                                  </button>
                                </td>
                              )}
                            </>
                          ) : (
                            <>
                              <td className="border p-2">{new Date(supply.supply_date + 'T00:00:00').toLocaleDateString('es-PE')}</td>
                              <td className="border p-2">{supply.product_name}</td>
                              <td className="border p-2 text-right">S/ {supply.price.toFixed(2)}</td>
                              <td className="border p-2 text-right">{supply.quantity}</td>
                              <td className="border p-2 text-right font-semibold">
                                S/ {(supply.quantity * supply.price).toFixed(2)}
                              </td>
                              {editMode && (
                                <td className="border p-2">
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => startEditSupply(supply)}
                                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                                      disabled={loading}
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => deleteSupply(supply.id)}
                                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                      disabled={loading}
                                    >
                                      Eliminar
                                    </button>
                                    {!supply.paid ? (
                                      <button
                                        onClick={() => markSupplyAsPaid(supply.id)}
                                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                        disabled={loading}
                                      >
                                        Marcar Pagado
                                      </button>
                                    ) : (
                                      <span className="text-green-600 font-semibold text-sm">Pagado</span>
                                    )}
                                  </div>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-200 p-2 rounded text-right font-bold mt-2">
                  Total: S/ {Math.round(calculateTotal(displaySupplies) * 100) / 100}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
