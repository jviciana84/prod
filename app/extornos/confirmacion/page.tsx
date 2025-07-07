"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle, Upload, FileText, Euro, User, Calendar, CreditCard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Suspense, useEffect, useState } from "react"

interface ExtornoData {
  id: number
  matricula: string
  cliente: string
  numero_cliente?: string
  concepto: string
  importe: number
  numero_cuenta: string
  concesion: number
  estado: string
  fecha_solicitud: string
  created_at: string
}

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [success, setSuccess] = useState<boolean | null>(null)
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [manualResult, setManualResult] = useState<string>("")
  const [extornoData, setExtornoData] = useState<ExtornoData | null>(null)
  const [justificante, setJustificante] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmationForm, setShowConfirmationForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    setError("")
    setSuccess(null)
    if (!token) {
      setError("Token de confirmación no proporcionado en la URL. No se puede continuar.")
      setSuccess(false)
      setIsLoading(false)
      return
    }
    fetch(`/api/extornos/get-extorno-by-token?token=${token}`)
      .then(async res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        if (data.success) {
          setExtornoData(data.extorno)
          setShowConfirmationForm(true)
        } else {
          setError(data.message || "No se pudo obtener la información del extorno")
          setSuccess(false)
        }
      })
      .catch((e) => {
        setError("Error de red al obtener información del extorno: " + e.message)
        setSuccess(false)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token])

  const handleJustificanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setJustificante(file)
    }
  }

  const handleConfirmarConJustificante = async () => {
    if (!token || !extornoData) {
      setError("Token o datos del extorno no disponibles")
      return
    }

    // El justificante es opcional
    if (!justificante) {
      console.log("⚠️ Confirmando pago sin justificante")
    }

    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("token", token)
      if (justificante) {
        formData.append("justificante", justificante)
      }

      const response = await fetch("/api/extornos/confirm-payment-with-justificante", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setMessage("Pago confirmado exitosamente con justificante. Se ha enviado un email a todos los implicados.")
      } else {
        setError(result.message || "Error al confirmar el pago")
        setSuccess(false)
      }
    } catch (e: any) {
      setError("Error de red: " + e.message)
      setSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
                <span className="text-blue-700 dark:text-blue-300 font-semibold">Cargando...</span>
              </div>
            ) : success ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : showConfirmationForm ? (
              <FileText className="h-8 w-8 text-blue-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            {isLoading
              ? "Cargando información del extorno..."
              : success
              ? "Pago Confirmado"
              : showConfirmationForm
              ? "Confirmar Pago con Justificante"
              : "Confirmación de Pago"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mostrar el token en pantalla para depuración */}
          <div className="text-xs text-gray-500 mb-2">Token leído de la URL: <span className="font-mono">{token || "(no token)"}</span></div>
          
          {/* Estado de carga visual */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
              <p className="text-blue-700 dark:text-blue-300 text-lg font-medium">Cargando información del extorno...</p>
            </div>
          )}

          {/* Información del extorno */}
          {!isLoading && extornoData && showConfirmationForm && !success && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información del Extorno
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">ID:</span>
                  <span className="font-mono">#{extornoData.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Matrícula:</span>
                  <span className="font-mono font-bold">{extornoData.matricula}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Cliente:</span>
                  <span>{extornoData.cliente}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Nº Cliente:</span>
                  <span>{extornoData.numero_cliente || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Importe:</span>
                  <span className="font-bold text-green-600">
                    {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(extornoData.importe)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Nº Cuenta:</span>
                  <span className="font-mono">{extornoData.numero_cuenta}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Concepto:</span>
                  <span className="col-span-1">{extornoData.concepto}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Concesión:</span>
                  <span>{extornoData.concesion === 1 ? "Motor Múnich SA" : "Motor Múnich Cadí"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de justificante */}
          {!isLoading && showConfirmationForm && !success && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Adjuntar Justificante de Pago
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="justificante" className="text-sm font-medium">
                    Seleccione el archivo justificante (PDF, imagen, etc.)
                  </Label>
                  <Input
                    id="justificante"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                    onChange={handleJustificanteChange}
                    className="mt-1"
                  />
                  {justificante ? (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Archivo seleccionado: {justificante.name}
                    </p>
                  ) : (
                    <p className="text-sm text-blue-600 mt-1">
                      ℹ️ El justificante es opcional. Puede confirmar sin adjuntar archivo.
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleConfirmarConJustificante}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Pago
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Botón para forzar el fetch manualmente (debug) */}
          {!isLoading && (
            <Button onClick={handleManualFetch} className="w-full" variant="outline">Probar confirmación manual (debug)</Button>
          )}
          {manualResult && !isLoading && (
            <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded text-left text-xs whitespace-pre-wrap max-h-40 overflow-auto">
              {manualResult}
            </div>
          )}

          {/* Mensajes de éxito/error */}
          {!isLoading && message && (
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
          {!isLoading && error && (
            <div className="p-4 rounded-md bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <pre className="text-left whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          <p className="text-gray-600 dark:text-gray-400 text-center">
            {isLoading
              ? "Por favor, espera mientras se carga la información..."
              : success
              ? "El estado del extorno ha sido actualizado y se ha enviado un email con el justificante. Puede cerrar esta ventana."
              : showConfirmationForm
              ? "Revise la información del extorno y adjunte el justificante de pago para confirmar."
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
