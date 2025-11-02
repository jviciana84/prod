"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

export default function TestSavePdfPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testData = {
    extractedFields: {
      "Nº PEDIDO": "TEST-001",
      "FECHA DE PEDIDO": "25/01/2025",
      "NOMBRE Y APELLIDOS O EMPRESA": "Juan Pérez García",
      "D.N.I. Ó N.I.F.": "12345678A",
      EMAIL: "juan.perez@email.com",
      "TFNO. PARTICULAR": "666123456",
      DOMICILIO: "Calle Test 123",
      CIUDAD: "Barcelona",
      "C.P.": "08001",
      PROVINCIA: "Barcelona",
      "Nº DE MATRÍCULA": "1234ABC",
      "Nº BASTIDOR": "WBWSS91050P123456",
      MODELO: "BMW X3 xDrive20d",
      Comercial: "Carlos Vendedor",
      "PORTAL ORIGEN": "Web BMW",
      BANCO: "BMW BANK",
      TOTAL: "45.000,00",
      DESCUENTO: "2.500,00",
    },
    originalText: "Texto de prueba del PDF...",
    fileName: "test-pedido.pdf",
    method: "test",
  }

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("Enviando datos de prueba:", testData)

      const response = await fetch("/api/save-pdf-extraction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      })

      const responseText = await response.text()
      console.log("Respuesta raw:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`Respuesta no es JSON válido: ${responseText}`)
      }

      if (!response.ok) {
        throw new Error(data.error || `Error HTTP ${response.status}`)
      }

      setResult(data)
      console.log("Resultado exitoso:", data)
    } catch (err: any) {
      console.error("Error en la prueba:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Guardado PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Datos de prueba:</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>

          <Button onClick={handleTest} disabled={loading} className="w-full">
            {loading ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Probando...
              </>
            ) : (
              "Probar Guardado"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div>
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <pre className="bg-green-100 dark:bg-green-900 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
