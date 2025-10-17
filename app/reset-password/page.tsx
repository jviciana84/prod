"use client"

import type React from "react"
import { useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Mail, ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { VersionBadge } from "@/components/version-badge"
import { AnimatedGridBackground } from "@/components/ui/animated-grid-background"
import { CardiogramLine } from "@/components/ui/cardiogram-line"
import { Logo } from "@/components/ui/logo"

const APP_VERSION = "1.0.0"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    if (!email) {
      setError("Por favor, introduce tu email")
      setIsLoading(false)
      return
    }

    try {
      console.log("Enviando solicitud de restablecimiento para:", email)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error("Error al enviar email:", error)
        setError(error.message)
      } else {
        console.log("Email enviado correctamente")
        setMessage("Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada y spam.")
        setEmail("") // Limpiar el campo
      }
    } catch (error: any) {
      console.error("Error inesperado:", error)
      setError("Error inesperado al enviar el email")
    } finally {
      setIsLoading(false)
    }
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
            <CardTitle className="text-2xl font-bold tracking-tight mt-0">Restablecer Contraseña</CardTitle>
            <CardDescription>Introduce tu email para recibir un enlace de recuperación</CardDescription>
          </CardHeader>

          <CardContent>
            {message && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 text-sm">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{message}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 text-center">
            <div className="text-sm text-muted-foreground">
              <Link href="/" className="text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
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
