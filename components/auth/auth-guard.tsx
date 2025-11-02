"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = "/" }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!loading && !user) {
      // Mostrar formulario de login en lugar de redirigir
      setShowLoginForm(true)
    } else if (!loading && user) {
      // Verificar si el usuario autenticado necesita cambiar su contraseña
      const forcePasswordChange = user.user_metadata?.force_password_change
      if (forcePasswordChange) {
        router.push("/force-password-change")
        return
      }
    }
  }, [user, loading, router, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLoginError(error.message)
      } else {
        console.log("Login exitoso:", data)
        
        // Verificar si el usuario necesita cambiar su contraseña
        const forcePasswordChange = data.user?.user_metadata?.force_password_change
        console.log("Force password change flag:", forcePasswordChange)

        if (forcePasswordChange) {
          router.push("/force-password-change")
          return
        }

        setShowLoginForm(false)
        // El hook useAuth debería detectar automáticamente el cambio
      }
    } catch (error: any) {
      setLoginError(error.message || "Error inesperado")
    } finally {
      setLoginLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-6">
            <BMWMSpinner size={24} className="mr-2" />
            <span>Verificando autenticación...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user && showLoginForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder al dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loginLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loginLoading}
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 text-sm">{loginError}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <BMWMSpinner size={16} className="mr-2" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/debug-auth")}
                disabled={loginLoading}
              >
                Ir a Debug de Autenticación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-6">
            <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
            <span>No autenticado</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
