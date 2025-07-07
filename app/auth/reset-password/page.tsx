"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClientComponentClient } from "@/lib/supabase/client"
import { VersionBadge } from "@/components/version-badge"
import { AnimatedGridBackground } from "@/components/ui/animated-grid-background"
import { CardiogramLine } from "@/components/ui/cardiogram-line"
import { Logo } from "@/components/ui/logo"

const APP_VERSION = "1.0.0" // Asegúrate que esta versión sea la correcta o la obtengas dinámicamente

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const processResetLink = async () => {
      try {
        const fullUrl = window.location.href
        const queryString = window.location.search
        const hashFragment = window.location.hash

        console.log("=== PROCESANDO ENLACE DE RESET (v2) ===")
        console.log("URL Completa:", fullUrl)
        console.log("Query String:", queryString)
        console.log("Fragmento Hash:", hashFragment)

        let debugText = `URL: ${fullUrl}\nSearch: ${queryString}\nHash: ${hashFragment}\n`

        const queryParams = new URLSearchParams(queryString)
        const hashParams = new URLSearchParams(hashFragment.substring(1)) // Quita el '#'

        const codeFromQuery = queryParams.get("code")
        const errorFromQuery = queryParams.get("error")
        const errorCodeFromQuery = queryParams.get("error_code")
        const errorDescriptionFromQuery = queryParams.get("error_description")

        const accessTokenFromHash = hashParams.get("access_token")
        const refreshTokenFromHash = hashParams.get("refresh_token")
        const errorFromHash = hashParams.get("error") // Puede haber error en el hash también
        const errorCodeFromHash = hashParams.get("error_code")
        const errorDescriptionFromHash = hashParams.get("error_description")
        const typeFromHash = hashParams.get("type")

        debugText += `Code (Query): ${codeFromQuery || "No"}\n`
        debugText += `Access Token (Hash): ${accessTokenFromHash ? "Presente" : "No"}\n`
        debugText += `Refresh Token (Hash): ${refreshTokenFromHash ? "Presente" : "No"}\n`
        debugText += `Type (Hash): ${typeFromHash || "No"}\n`

        setDebugInfo(debugText)

        const finalError = errorFromQuery || errorFromHash
        const finalErrorCode = errorCodeFromQuery || errorCodeFromHash
        const finalErrorDescription = errorDescriptionFromQuery || errorDescriptionFromHash

        if (finalError) {
          // Manejo específico para "otp_expired" o "user_not_found" que a veces vienen como "access_denied"
          if (
            finalError === "access_denied" &&
            (finalErrorCode === "otp_expired" ||
              finalErrorCode === "user_not_found" ||
              finalErrorDescription?.includes("expired"))
          ) {
            setError("El enlace de restablecimiento ha expirado o es inválido. Por favor, solicita uno nuevo.")
          } else {
            setError(`Error en el enlace: ${finalErrorDescription || finalError}`)
          }
          return
        }

        // Flujo 1: Supabase envía tokens en el HASH (típico para recovery con {{ .ConfirmationURL }})
        if (accessTokenFromHash && refreshTokenFromHash && typeFromHash === "recovery") {
          console.log("Detectado flujo de recuperación con tokens en HASH. Estableciendo sesión...")
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessTokenFromHash,
            refresh_token: refreshTokenFromHash,
          })

          if (sessionError) {
            console.error("Error estableciendo sesión desde HASH:", sessionError)
            setError("Error al procesar el enlace (sesión HASH): " + sessionError.message)
            return
          }
          console.log("Sesión establecida correctamente desde HASH.")
          // Verificar si realmente tenemos un usuario después de setSession
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            console.log("Usuario autenticado después de setSession:", user.email)
            setIsReady(true)
            setError(null)
          } else {
            console.error("setSession tuvo éxito pero no hay usuario.")
            setError("No se pudo verificar la sesión. Intenta solicitar un nuevo enlace.")
          }
          return
        }

        // Flujo 2: Supabase envía un 'code' en la QUERY STRING
        // (Esto podría pasar si el template de email se personalizó para usar `?code={{.Token}}` en lugar de `{{.ConfirmationURL}}`)
        if (codeFromQuery) {
          console.log("Detectado 'code' en Query String. Intentando verificar OTP (recovery)...")
          const { data, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: codeFromQuery,
            type: "recovery",
          })

          if (otpError) {
            console.error("Error verificando OTP desde Query String:", otpError)
            setError("Código de verificación inválido o expirado (desde query): " + otpError.message)
            return
          }
          console.log("OTP verificado correctamente desde Query String. Usuario:", data.user?.email)
          setIsReady(true)
          setError(null)
          return
        }

        // Si no hay parámetros válidos después de que no hubo errores explícitos en la URL
        if (!accessTokenFromHash && !codeFromQuery) {
          console.log("No se encontraron parámetros de verificación (ni tokens en hash, ni código en query).")
          setError("No se encontró información de verificación en el enlace. Puede haber expirado o ser incorrecto.")
        }
      } catch (e: any) {
        console.error("Error crítico procesando enlace:", e)
        setError("Error crítico procesando el enlace: " + e.message)
      }
    }

    processResetLink()
  }, [supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isReady) {
      setError("El enlace no ha sido verificado correctamente. No se puede cambiar la contraseña.")
      return
    }
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }
    if (password.length < 8) {
      // O la longitud que tengas configurada en Supabase
      setError("La contraseña debe tener al menos 8 caracteres")
      setIsLoading(false)
      return
    }

    try {
      console.log("Actualizando contraseña para el usuario actual...")
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw updateError
      }
      console.log("Contraseña actualizada exitosamente.")
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente. Redirigiendo al login...",
      })
      setTimeout(() => {
        router.push("/") // Redirige a la página de login
      }, 2000)
    } catch (error: any) {
      console.error("Error al actualizar contraseña:", error)
      setError(error.message || "Error al actualizar la contraseña")
      toast({
        title: "Error al actualizar contraseña",
        description: error.message || "Por favor, intenta nuevamente o solicita un nuevo enlace.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestNewLink = () => {
    router.push("/reset-password") // Redirige a la página para solicitar el email de reset
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedGridBackground />
      <CardiogramLine />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md z-10">
        <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-background/80">
          <CardHeader className="space-y-1 text-center pt-4 pb-2">
            <div className="flex justify-center items-center">
              <div className="w-auto h-[125px] flex items-center justify-center">
                <Logo size="xl" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight mt-0">Establecer Nueva Contraseña</CardTitle>
            <CardDescription>Crea una nueva contraseña para tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-2 bg-muted/50 rounded text-xs overflow-auto max-h-32">
              <strong>Debug Info:</strong>
              <pre className="whitespace-pre-wrap text-xs">{debugInfo}</pre>
              <p className="mt-2">
                <strong>Estado:</strong> {isReady ? "✅ Listo para cambiar contraseña" : "⏳ Procesando enlace..."}
              </p>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{error}</p>
                    {(error.includes("expirado") ||
                      error.includes("inválido") ||
                      error.includes("Error al procesar el enlace")) && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 px-0 h-auto text-destructive hover:underline"
                        onClick={handleRequestNewLink}
                      >
                        Solicitar nuevo enlace
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {isReady && !error && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 text-sm">
                ✅ Enlace verificado correctamente. Puedes establecer tu nueva contraseña.
              </div>
            )}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={!isReady || isLoading}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={!isReady || isLoading}
                    placeholder="Repetir contraseña"
                  />
                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"
                    }
                    className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !isReady}>
                {isLoading ? "Actualizando..." : "Establecer Nueva Contraseña"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center">
            <div className="text-sm text-muted-foreground">
              <Link href="/" className="text-primary hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} CVO. Todos los derechos reservados.
              </div>
              <VersionBadge version={APP_VERSION} />
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
