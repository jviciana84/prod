"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, CheckCircle, XCircle } from "lucide-react"

export function ExtornoTokenTester() {
  const [extornoId, setExtornoId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!extornoId) {
      setResult({ success: false, message: "Por favor, introduce un ID de extorno." })
      return
    }
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/extornos/test-token-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extorno_id: extornoId }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, message: "Error de red al contactar la API.", error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test de Actualización de Token de Extorno</CardTitle>
        <CardDescription>
          Esta herramienta permite probar si la operación de actualizar el `confirmation_token` de un extorno funciona
          correctamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="extornoId" className="font-medium">
              ID del Extorno
            </label>
            <Input
              id="extornoId"
              placeholder="Introduce el UUID del extorno"
              value={extornoId}
              onChange={(e) => setExtornoId(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading || !extornoId}>
            {isLoading ? "Probando..." : "Generar y Guardar Token de Prueba"}
          </Button>
        </form>

        {result && (
          <Alert className={`mt-4 ${result.success ? "border-green-500" : "border-red-500"}`}>
            <Terminal className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              {result.success ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
              Resultado de la Prueba
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>{result.message}</p>
              {result.error && <p className="text-xs text-muted-foreground">Detalle: {result.error}</p>}
              {result.data && (
                <pre className="mt-2 w-full overflow-x-auto rounded-md bg-slate-950 p-4 text-white">
                  <code>{JSON.stringify(result.data, null, 2)}</code>
                </pre>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
