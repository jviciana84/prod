'use client'

import { useState } from 'react'

export default function TestSvgLoad() {
  const [svgMethod, setSvgMethod] = useState<'img' | 'object' | 'inline'>('img')
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4">🧪 Test SVG Loading</h1>
        
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setSvgMethod('img')}
            className={`px-4 py-2 rounded ${svgMethod === 'img' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Método &lt;img&gt;
          </button>
          <button
            onClick={() => setSvgMethod('object')}
            className={`px-4 py-2 rounded ${svgMethod === 'object' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Método &lt;object&gt;
          </button>
          <button
            onClick={() => setSvgMethod('inline')}
            className={`px-4 py-2 rounded ${svgMethod === 'inline' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Método inline (fetch)
          </button>
        </div>
        
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
          <h2 className="font-bold mb-2">SVG: frontal.svg</h2>
          
          {svgMethod === 'img' && (
            <img 
              src="/svg/new_car_svg/frontal.svg" 
              alt="Frontal del coche"
              className="w-full max-w-2xl mx-auto"
              onLoad={() => console.log('✅ SVG cargado con <img>')}
              onError={(e) => console.error('❌ Error cargando SVG con <img>', e)}
            />
          )}
          
          {svgMethod === 'object' && (
            <object 
              data="/svg/new_car_svg/frontal.svg" 
              type="image/svg+xml"
              className="w-full max-w-2xl mx-auto"
              onLoad={() => console.log('✅ SVG cargado con <object>')}
            >
              Tu navegador no soporta SVG con object
            </object>
          )}
          
          {svgMethod === 'inline' && (
            <InlineSvg />
          )}
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm font-bold text-blue-800">📝 Instrucciones:</p>
          <ul className="text-sm text-blue-700 list-disc list-inside">
            <li>Abre la consola del navegador (F12)</li>
            <li>Mira si hay errores de carga</li>
            <li>Verifica que el SVG se muestre correctamente</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function InlineSvg() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  useState(() => {
    fetch('/svg/new_car_svg/frontal.svg')
      .then(res => {
        console.log('Response status:', res.status)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(text => {
        console.log('✅ SVG cargado inline, tamaño:', text.length)
        console.log('Primeros 200 chars:', text.substring(0, 200))
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        console.error('❌ Error cargando SVG inline:', err)
        setError(err.message)
        setLoading(false)
      })
  })
  
  if (loading) return <div className="text-center p-4">Cargando...</div>
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>
  
  return (
    <div 
      className="w-full max-w-2xl mx-auto"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}




