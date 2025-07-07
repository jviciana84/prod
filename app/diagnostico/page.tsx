"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function DiagnosticoPage() {
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDiagnostico() {
      try {
        const response = await fetch("/api/diagnostico")
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        const data = await response.json()
        setDiagnostico(data)
      } catch (err: any) {
        setError(err.message || "Error desconocido al cargar el diagnóstico")
      } finally {
        setLoading(false)
      }
    }

    fetchDiagnostico()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico del Sistema</CardTitle>
            <CardDescription>Verificando conexiones y configuración...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-gray-300 mb-4"></div>
              <div className="h-4 w-48 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-36 bg-gray-300 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico del Sistema</CardTitle>
          <CardDescription>
            Resultados del diagnóstico generado el {new Date(diagnostico?.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Estado de Conexiones</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium">Supabase:</span>
                {diagnostico?.supabase ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-4 w-4 mr-1" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-4 w-4 mr-1" /> Error
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium">Blob Storage:</span>
                {diagnostico?.blob?.status ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-4 w-4 mr-1" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-4 w-4 mr-1" /> Error
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {diagnostico?.problemas?.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Problemas Detectados</h3>
              <ul className="space-y-2">
                {diagnostico.problemas.map((problema: string, index: number) => (
                  <li key={index} className="p-2 border rounded bg-red-50 text-red-800">
                    {problema}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {diagnostico?.sugerencias?.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Sugerencias</h3>
              <ul className="space-y-2">
                {diagnostico.sugerencias.map((sugerencia: string, index: number) => (
                  <li key={index} className="p-2 border rounded bg-blue-50 text-blue-800">
                    {sugerencia}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {diagnostico?.blob?.url && (
            <div>
              <h3 className="text-lg font-medium mb-2">Prueba de Blob Storage</h3>
              <div className="p-2 border rounded">
                <p>
                  Archivo de prueba:{" "}
                  <a
                    href={diagnostico.blob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {diagnostico.blob.url}
                  </a>
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium mb-2">Información del Entorno</h3>
            <div className="p-2 border rounded">
              <p>
                Entorno: <span className="font-mono">{diagnostico?.entorno || "No disponible"}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
