"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, XCircle, AlertCircle, Upload, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface AvatarDiagnosticProps {
  avatars: string[]
  blobTokenAvailable: boolean
  userId: string
}

export default function AvatarDiagnostic({ avatars, blobTokenAvailable, userId }: AvatarDiagnosticProps) {
  const [isTestingApi, setIsTestingApi] = useState(false)
  const [isTestingBlob, setIsTestingBlob] = useState(false)
  const [isTestingUpdate, setIsTestingUpdate] = useState(false)
  const [apiStatus, setApiStatus] = useState<"idle" | "success" | "error">("idle")
  const [blobStatus, setBlobStatus] = useState<"idle" | "success" | "error">("idle")
  const [updateStatus, setUpdateStatus] = useState<"idle" | "success" | "error">("idle")
  const [apiMessage, setApiMessage] = useState("")
  const [blobMessage, setBlobMessage] = useState("")
  const [updateMessage, setUpdateMessage] = useState("")
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null)
  const { toast } = useToast()

  // Prueba 1: Verificar que la API de subida está accesible
  const testApiEndpoint = async () => {
    setIsTestingApi(true)
    setApiStatus("idle")
    setApiMessage("")

    try {
      const response = await fetch("/api/admin/upload-avatar", {
        method: "HEAD",
      })

      if (response.ok || response.status === 405) {
        // 405 Method Not Allowed es aceptable ya que estamos usando HEAD en un endpoint POST
        setApiStatus("success")
        setApiMessage("El endpoint de la API está accesible.")
      } else {
        setApiStatus("error")
        setApiMessage(`Error al acceder al endpoint: ${response.status} ${response.statusText}`)
      }
    } catch (error: any) {
      setApiStatus("error")
      setApiMessage(`Error al acceder al endpoint: ${error.message}`)
      console.error("Error al probar el endpoint:", error)
    } finally {
      setIsTestingApi(false)
    }
  }

  // Prueba 2: Verificar que Vercel Blob está configurado correctamente
  const testBlobUpload = async () => {
    setIsTestingBlob(true)
    setBlobStatus("idle")
    setBlobMessage("")
    setTestImageUrl(null)

    try {
      // Crear un canvas y generar una imagen de prueba
      const canvas = document.createElement("canvas")
      canvas.width = 100
      canvas.height = 100
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Dibujar un círculo de color aleatorio
        const hue = Math.floor(Math.random() * 360)
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
        ctx.beginPath()
        ctx.arc(50, 50, 40, 0, Math.PI * 2)
        ctx.fill()

        // Añadir texto
        ctx.fillStyle = "white"
        ctx.font = "14px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Test", 50, 55)
      }

      // Convertir el canvas a Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => {
          if (b) resolve(b)
          else throw new Error("No se pudo crear el blob")
        }, "image/png")
      })

      // Crear un archivo a partir del Blob
      const file = new File([blob], "test-avatar.png", { type: "image/png" })

      // Crear FormData y añadir el archivo
      const formData = new FormData()
      formData.append("file", file)

      // Enviar la solicitud
      const response = await fetch("/api/admin/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al subir la imagen de prueba")
      }

      const data = await response.json()
      setTestImageUrl(data.url)
      setBlobStatus("success")
      setBlobMessage("La subida a Vercel Blob funciona correctamente.")
    } catch (error: any) {
      setBlobStatus("error")
      setBlobMessage(`Error al subir a Vercel Blob: ${error.message}`)
      console.error("Error al probar Blob:", error)
    } finally {
      setIsTestingBlob(false)
    }
  }

  // Prueba 3: Verificar que la actualización de avatares funciona
  const testAvatarUpdate = async () => {
    if (!testImageUrl) {
      toast({
        title: "Error",
        description: "Primero debes realizar la prueba de subida a Blob",
        variant: "destructive",
      })
      return
    }

    setIsTestingUpdate(true)
    setUpdateStatus("idle")
    setUpdateMessage("")

    try {
      // Intentar actualizar el avatar del usuario actual
      const response = await fetch(`/api/admin/users/${userId}/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatarUrl: testImageUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al actualizar el avatar")
      }

      setUpdateStatus("success")
      setUpdateMessage("La actualización de avatares funciona correctamente.")
    } catch (error: any) {
      setUpdateStatus("error")
      setUpdateMessage(`Error al actualizar el avatar: ${error.message}`)
      console.error("Error al probar la actualización:", error)
    } finally {
      setIsTestingUpdate(false)
    }
  }

  // Función para renderizar el estado
  const renderStatus = (status: "idle" | "success" | "error") => {
    if (status === "success") {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    } else if (status === "error") {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Herramienta de diagnóstico</AlertTitle>
        <AlertDescription>
          Esta herramienta te permite verificar que la subida de avatares está configurada correctamente. Ejecuta las
          pruebas en orden para diagnosticar posibles problemas.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información de configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>Estado actual de la configuración de avatares</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Token de Vercel Blob:</span>
              {blobTokenAvailable ? (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Configurado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  No configurado
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Avatares predefinidos:</span>
              <Badge
                variant="outline"
                className={avatars.length > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
              >
                {avatars.length} disponibles
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Prueba 1: API Endpoint */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prueba 1: API Endpoint</CardTitle>
              {renderStatus(apiStatus)}
            </div>
            <CardDescription>Verifica que el endpoint de la API está accesible</CardDescription>
          </CardHeader>
          <CardContent>
            {apiMessage && (
              <Alert variant={apiStatus === "success" ? "default" : "destructive"} className="mb-4">
                <AlertDescription>{apiMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={testApiEndpoint} disabled={isTestingApi}>
              {isTestingApi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Probar API
            </Button>
          </CardFooter>
        </Card>

        {/* Prueba 2: Vercel Blob */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prueba 2: Vercel Blob</CardTitle>
              {renderStatus(blobStatus)}
            </div>
            <CardDescription>Verifica que la subida a Vercel Blob funciona</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {blobMessage && (
              <Alert variant={blobStatus === "success" ? "default" : "destructive"} className="mb-4">
                <AlertDescription>{blobMessage}</AlertDescription>
              </Alert>
            )}
            {testImageUrl && (
              <div className="flex flex-col items-center space-y-2">
                <div className="relative h-20 w-20 overflow-hidden rounded-full">
                  <Image
                    src={testImageUrl || "/placeholder.svg"}
                    alt="Imagen de prueba"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-xs text-muted-foreground">Imagen de prueba subida</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={testBlobUpload} disabled={isTestingBlob}>
              {isTestingBlob ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Probar Subida
            </Button>
          </CardFooter>
        </Card>

        {/* Prueba 3: Actualización de Avatar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prueba 3: Actualización</CardTitle>
              {renderStatus(updateStatus)}
            </div>
            <CardDescription>Verifica que la actualización de avatares funciona</CardDescription>
          </CardHeader>
          <CardContent>
            {updateMessage && (
              <Alert variant={updateStatus === "success" ? "default" : "destructive"} className="mb-4">
                <AlertDescription>{updateMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={testAvatarUpdate} disabled={isTestingUpdate || !testImageUrl}>
              {isTestingUpdate ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Probar Actualización
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Separator className="my-6" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Solución de problemas</h2>

        <div className="space-y-2">
          <h3 className="font-medium">Si la Prueba 1 falla:</h3>
          <ul className="list-disc pl-6 text-sm">
            <li>
              Verifica que el archivo <code>app/api/admin/upload-avatar/route.ts</code> existe y está correctamente
              implementado.
            </li>
            <li>Asegúrate de que el servidor de desarrollo está ejecutándose sin errores.</li>
            <li>Comprueba los logs del servidor para ver si hay errores relacionados con la API.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Si la Prueba 2 falla:</h3>
          <ul className="list-disc pl-6 text-sm">
            <li>
              Verifica que el token de Vercel Blob (<code>BLOB_READ_WRITE_TOKEN</code>) está configurado en las
              variables de entorno.
            </li>
            <li>Asegúrate de que tienes permisos de administrador en la aplicación.</li>
            <li>Comprueba que la integración con Vercel Blob está activa en tu proyecto de Vercel.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Si la Prueba 3 falla:</h3>
          <ul className="list-disc pl-6 text-sm">
            <li>
              Verifica que el archivo <code>app/api/admin/users/[userId]/avatar/route.ts</code> existe y está
              correctamente implementado.
            </li>
            <li>Asegúrate de que tienes permisos para actualizar avatares de usuarios.</li>
            <li>Comprueba que la conexión con la base de datos funciona correctamente.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
