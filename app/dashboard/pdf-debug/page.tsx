"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function PDFDebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testPDFExtraction = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Datos de prueba simulando un PDF extraído
      const testData = {
        extractedFields: {
          "Nº PEDIDO": "TEST-001",
          "FECHA DE PEDIDO": "15/01/2024",
          "NOMBRE Y APELLIDOS O EMPRESA": "Juan Pérez García",
          "D.N.I. Ó N.I.F.": "12345678A",
          EMAIL: "juan.perez@email.com",
          "TFNO. PARTICULAR": "666123456",
          DOMICILIO: "Calle Test 123",
          CIUDAD: "Barcelona",
          "C.P.": "08001",
          PROVINCIA: "Barcelona",
          "Nº DE MATRÍCULA": "TEST123",
          "Nº BASTIDOR": "WBADT43452G123456",
          MODELO: "BMW X3 xDrive20d",
          Comercial: "Carlos Vendedor",
          "PORTAL ORIGEN": "Web",
          BANCO: "BMW BANK",
          TOTAL: "45.000,00",
          DESCUENTO: "2.000,00",
        },
        fileName: "test-pdf.pdf",
        method: "test",
      }

      const response = await fetch("/api/save-pdf-extraction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      })

      const data = await response.json()
      setResult({
        status: response.status,
        success: response.ok,
        data: data,
      })
    } catch (error) {
      setResult({
        status: "ERROR",
        success: false,
        data: {
          error: "Error de conexión",
          details: error instanceof Error ? error.message : "Error desconocido",
        },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug PDF Extraction</CardTitle>
          <CardDescription>Prueba la extracción y guardado de datos PDF para ver errores específicos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testPDFExtraction} disabled={loading} className="w-full">
            {loading ? "Probando..." : "Probar Extracción PDF"}
          </Button>

          {result && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                <h3 className={`font-semibold ${result.success ? "text-green-800" : "text-red-800"}`}>
                  {result.success ? "✅ Éxito" : "❌ Error"} - Status: {result.status}
                </h3>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Respuesta Completa:</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={JSON.stringify(result.data, null, 2)}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {!result.success && result.data.attemptedData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Datos que se intentaron insertar:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={JSON.stringify(result.data.attemptedData, null, 2)}
                      readOnly
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
