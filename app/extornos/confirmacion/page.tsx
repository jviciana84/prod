"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense, useEffect, useState } from "react"

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [success, setSuccess] = useState<boolean | null>(null)
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [manualResult, setManualResult] = useState<string>("")

  // Log para depuración
  console.log("[DEBUG] Valor de token en URL:", token)

  useEffect(() => {
    console.log("[DEBUG] useEffect ejecutado. Token:", token)
    if (!token) {
      setError("Token de confirmación no proporcionado en la URL. No se puede continuar.")
      setSuccess(false)
      return
    }
    fetch(`/api/extornos/confirm-payment?token=${token}`)
      .then(async res => {
        const html = await res.text()
        console.log("[DEBUG] Respuesta del endpoint:", html)
        if (html.includes("Pago Confirmado")) {
          setSuccess(true)
          setMessage("El pago del extorno ha sido confirmado correctamente.")
        } else if (html.includes("Token no válido") || html.includes("Error") || html.includes("No se pudo confirmar")) {
          setSuccess(false)
          // Extraer el mensaje de error del HTML si existe
          const match = html.match(/<div class=["'](?:error|warning)["'][^>]*>[\s\S]*?<h2[^>]*>(.*?)<\/h2>([\s\S]*?)<\/div>/)
          if (match) {
            setError(`${match[1].replace(/<[^>]+>/g, "").trim()}\n${match[2].replace(/<[^>]+>/g, "").trim()}`)
          } else {
            setError("Error desconocido: " + html)
          }
        } else {
          setSuccess(false)
          setError("No se pudo confirmar el pago. Respuesta inesperada del servidor: " + html)
        }
      })
      .catch((e) => {
        setSuccess(false)
        setError("Error de red al intentar confirmar el pago: " + e.message)
      })
  }, [token])

  const handleManualFetch = async () => {
    if (!token) {
      setManualResult("Token no disponible en la URL.")
      return
    }
    setManualResult("Llamando al endpoint...")
    try {
      const res = await fetch(`/api/extornos/confirm-payment?token=${token}`)
      const html = await res.text()
      setManualResult(html)
      console.log("[DEBUG][ManualFetch] Respuesta:", html)
    } catch (e: any) {
      setManualResult("Error de red: " + e.message)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            {success ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            Confirmación de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {/* Mostrar el token en pantalla para depuración */}
          <div className="text-xs text-gray-500 mb-2">Token leído de la URL: <span className="font-mono">{token || "(no token)"}</span></div>
          {/* Botón para forzar el fetch manualmente */}
          <Button onClick={handleManualFetch} className="mb-2 w-full" variant="outline">Probar confirmación manual (debug)</Button>
          {manualResult && (
            <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded text-left text-xs whitespace-pre-wrap max-h-40 overflow-auto">
              {manualResult}
            </div>
          )}
          {message && (
            <div
              className={`p-4 rounded-md ${
                success
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
              }`}
            >
              <p>{message}</p>
            </div>
          )}
          {error && (
            <div className="p-4 rounded-md bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <pre className="text-left whitespace-pre-wrap">{error}</pre>
            </div>
          )}
          <p className="text-gray-600 dark:text-gray-400">
            {success
              ? "El estado del extorno ha sido actualizado. Puede cerrar esta ventana."
              : "Si el problema persiste, por favor contacte con el administrador."}
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard/extornos">Volver al Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/">Ir al Inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}
