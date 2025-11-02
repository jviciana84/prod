"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

export default function TestPDFExtractPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Por favor selecciona un archivo PDF")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/test-pdf-extract", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error procesando archivo")
      }

      setResult(data)
    } catch (err) {
      const errorMessage = (err as Error).message
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveData = async () => {
    if (!result?.extractedFields) {
      setError("No hay datos para guardar")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/save-pdf-extraction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extractedFields: result.extractedFields,
          originalText: result.text,
          fileName: file?.name,
          method: result.method,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error guardando datos")
      }

      setSaved(true)
      // Opcional: limpiar el formulario después de guardar
      // setFile(null)
      // setResult(null)
    } catch (err) {
      const errorMessage = (err as Error).message
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Extracción Directa de Texto de PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Extracción directa:</strong> Esta herramienta extrae texto directamente del PDF sin usar OCR. Es
              más rápida y precisa para PDFs nativos (no escaneados).
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo PDF:
              </label>
              <input
                type="file"
                id="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <Button type="submit" disabled={!file || loading} className="w-full">
              {loading ? (
                <>
                  <BMWMSpinner size={16} className="mr-2" />
                  Extrayendo texto...
                </>
              ) : (
                "Extraer Texto del PDF"
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Método utilizado:</strong> {result.method}
                  {result.pages && ` | Páginas: ${result.pages}`}
                  {result.fieldsCount && ` | Campos extraídos: ${result.fieldsCount}/18`}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveData}
                  disabled={saving || saved}
                  className="flex-1"
                  variant={saved ? "outline" : "default"}
                >
                  {saving ? (
                    <>
                      <BMWMSpinner size={16} className="mr-2" />
                      Guardando...
                    </>
                  ) : saved ? (
                    "✓ Datos Guardados"
                  ) : (
                    "Guardar Datos Extraídos"
                  )}
                </Button>

                {saved && (
                  <Button
                    onClick={() => {
                      setFile(null)
                      setResult(null)
                      setSaved(false)
                      setError("")
                    }}
                    variant="outline"
                  >
                    Procesar Otro PDF
                  </Button>
                )}
              </div>

              {saved && (
                <Alert>
                  <AlertDescription className="text-green-700">
                    ✓ Los datos han sido guardados exitosamente en la base de datos.
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="fields">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="fields">Campos Extraídos</TabsTrigger>
                  <TabsTrigger value="text">Texto Extraído</TabsTrigger>
                  <TabsTrigger value="info">Información del PDF</TabsTrigger>
                </TabsList>

                <TabsContent value="fields" className="mt-4">
                  {result.extractedFields && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Campos Extraídos:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(result.extractedFields).map(([field, value]) => (
                          <div
                            key={field}
                            className={`flex justify-between items-center p-3 rounded border ${
                              value ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                            }`}
                          >
                            <span className="text-gray-700 font-medium text-sm">{field}:</span>
                            <span className={`text-sm font-medium ${value ? "text-green-700" : "text-red-500"}`}>
                              {value || "No encontrado"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="text" className="mt-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Texto Completo Extraído:</h3>
                    <textarea
                      value={result.text || "No se extrajo texto"}
                      readOnly
                      className="w-full h-96 p-3 border border-gray-300 rounded-md bg-white text-gray-900 font-mono text-sm"
                      placeholder="El texto extraído aparecerá aquí..."
                    />
                    <Button
                      onClick={() => navigator.clipboard.writeText(result.text || "")}
                      className="mt-2 w-full"
                      variant="outline"
                    >
                      Copiar Texto Completo
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="info" className="mt-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del PDF:</h3>
                    <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result.info || {}, null, 2)}</pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
