"use client"

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/singleton'

export default function DebugStockClient() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setLoading(true)
    setError(null)
    const testResults: any = {}

    try {
      console.log("🔍 Iniciando tests de cliente...")
      const supabase = getSupabaseClient()

      // Test 1: Verificar cliente
      console.log("🔌 Test 1: Verificando cliente...")
      testResults.clientCheck = {
        hasClient: !!supabase,
        timestamp: new Date().toISOString()
      }

      // Test 2: Consulta simple
      console.log("📡 Test 2: Consulta simple...")
      const startTime = Date.now()
      const { data: simpleData, error: simpleError } = await supabase
        .from('stock')
        .select('id, license_plate')
        .limit(1)
      const endTime = Date.now()

      testResults.simpleQuery = {
        success: !simpleError,
        count: simpleData?.length || 0,
        error: simpleError?.message || null,
        duration: endTime - startTime,
        timestamp: new Date().toISOString()
      }

      // Test 3: Consulta con count
      console.log("📊 Test 3: Consulta con count...")
      const countStart = Date.now()
      const { count, error: countError } = await supabase
        .from('stock')
        .select('*', { count: 'exact', head: true })
      const countEnd = Date.now()

      testResults.countQuery = {
        success: !countError,
        count: count || 0,
        error: countError?.message || null,
        duration: countEnd - countStart,
        timestamp: new Date().toISOString()
      }

      // Test 4: Consulta completa
      console.log("📋 Test 4: Consulta completa...")
      const fullStart = Date.now()
      const { data: fullData, error: fullError } = await supabase
        .from('stock')
        .select('*')
        .limit(5)
      const fullEnd = Date.now()

      testResults.fullQuery = {
        success: !fullError,
        count: fullData?.length || 0,
        error: fullError?.message || null,
        duration: fullEnd - fullStart,
        timestamp: new Date().toISOString()
      }

      // Test 5: Verificar configuración
      console.log("⚙️ Test 5: Verificando configuración...")
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      testResults.config = {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: supabaseAnonKey?.length || 0,
        urlPreview: supabaseUrl?.substring(0, 50) + "..." || null,
        keyPreview: supabaseAnonKey?.substring(0, 20) + "..." || null
      }

      setResults(testResults)
      console.log("✅ Tests completados:", testResults)

    } catch (err) {
      console.error("💥 Error en tests:", err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Stock Client</h1>
      
      <div className="mb-6">
        <button 
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Ejecutando tests...' : 'Ejecutar tests'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(results).map(([testName, testResult]: [string, any]) => (
          <div key={testName} className="border rounded p-4">
            <h3 className="font-semibold mb-2">{testName}</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
} 