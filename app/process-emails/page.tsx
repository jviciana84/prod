"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ProcessEmailsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleProcessEmails = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)
    try {
      const response = await fetch("/api/process-emails")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error desconocido")
      }

      setResult(JSON.stringify(data.processedEmails, null, 2))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Procesador de Correos</CardTitle>
          <CardDescription>
            Haz clic en el botón para iniciar el proceso de lectura de correos no leídos desde el servidor IMAP de OVH.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Button onClick={handleProcessEmails} disabled={isLoading}>
              {isLoading ? "Procesando..." : "Iniciar Proceso"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          {result && (
            <div className="w-full">
              <h3 className="font-semibold text-green-600">Proceso completado:</h3>
              <ScrollArea className="h-64 w-full rounded-md border p-4 mt-2">
                <pre className="text-sm">{result}</pre>
              </ScrollArea>
            </div>
          )}
          {error && (
            <div className="w-full">
              <h3 className="font-semibold text-red-600">Error:</h3>
              <div className="w-full rounded-md border bg-red-50 dark:bg-red-900/20 p-4 mt-2">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
