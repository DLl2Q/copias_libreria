'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'

const CopiesSection = dynamic(() => import('./components/CopiesSection'), { ssr: false })
const TeachersSection = dynamic(() => import('./components/TeachersSection'), { ssr: false })
const CopyTypesSection = dynamic(() => import('./components/CopyTypesSection'), { ssr: false })
const ReportsSection = dynamic(() => import('./components/ReportsSection'), { ssr: false })

type Section = 'home' | 'copies' | 'teachers' | 'copy-types' | 'reports'

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <p className="text-gray-600">Cargando...</p>
  </div>
)

export default function Home() {
  const [currentSection, setCurrentSection] = useState<Section>('home')

  const renderSection = () => {
    switch (currentSection) {
      case 'copies':
        return <Suspense fallback={<LoadingSpinner />}><CopiesSection /></Suspense>
      case 'teachers':
        return <Suspense fallback={<LoadingSpinner />}><TeachersSection /></Suspense>
      case 'copy-types':
        return <Suspense fallback={<LoadingSpinner />}><CopyTypesSection /></Suspense>
      case 'reports':
        return <Suspense fallback={<LoadingSpinner />}><ReportsSection /></Suspense>
      default:
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-8 text-blue-600">Gestión de Copias</h1>
            <p className="text-gray-600 mb-8 text-lg">Selecciona una opción del menú</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => setCurrentSection('copies')}
                className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg font-semibold transition"
              >
                📋 Registrar Copias
              </button>
              <button
                onClick={() => setCurrentSection('teachers')}
                className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg font-semibold transition"
              >
                👨‍🏫 Profesores
              </button>
              <button
                onClick={() => setCurrentSection('copy-types')}
                className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg font-semibold transition"
              >
                📄 Tipos de Copia
              </button>
              <button
                onClick={() => setCurrentSection('reports')}
                className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-lg font-semibold transition"
              >
                📊 Reportes
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Copias Librería</h1>
            {currentSection !== 'home' && (
              <button
                onClick={() => setCurrentSection('home')}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition"
              >
                ← Volver al menú
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {renderSection()}
      </main>

      <footer className="bg-gray-200 text-center py-4 mt-8">
        <p className="text-gray-600">© 2024 Gestión de Copias Librería</p>
      </footer>
    </div>
  )
}