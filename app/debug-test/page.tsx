"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugTestPage() {
  const [testData, setTestData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testEndpoint = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log("🧪 Probando endpoint...")
      const response = await fetch("/api/debug-sales-dashboard")
      console.log("📡 Status:", response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("📊 Data:", data)
      setTestData(data)
      
    } catch (err) {
      console.error("❌ Error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testEndpoint()
  }, [])

  return (
    <div className="p-4 md:p-5 space-y-4">
      <h1 className="text-3xl font-bold">Test Debug</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Estado:</p>
              {loading && <p className="text-blue-600">Cargando...</p>}
              {error && <p className="text-red-600">Error: {error}</p>}
              {testData && <p className="text-green-600">✅ Funcionando</p>}
            </div>
            
            <Button onClick={testEndpoint} disabled={loading}>
              {loading ? "Probando..." : "Probar Endpoint"}
            </Button>
            
            {testData && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">Datos de Respuesta:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 