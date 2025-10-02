'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'

export default function ForcePasswordChangePage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      console.log("🔍 [Force Password Change] Verificando usuario...")
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log("🔍 [Force Password Change] Resultado de getSession:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          error: error?.message
        })

        if (error) {
          console.error("❌ [Force Password Change] Error obteniendo sesión:", error)
          setError("Error de autenticación. Por favor, inicia sesión nuevamente.")
          return
        }

        if (!session?.user) {
          console.log("❌ [Force Password Change] No hay sesión, redirigiendo al login...")
          router.push("/")
          return
        }

        // Verificar si realmente necesita cambiar la contraseña
        const forceChange = session.user.user_metadata?.force_password_change
        console.log("🔍 [Force Password Change] Flag force_password_change:", forceChange)

        if (!forceChange) {
          console.log("✅ [Force Password Change] No necesita cambiar contraseña, redirigiendo al dashboard...")
          router.push("/dashboard")
          return
        }

        console.log("✅ [Force Password Change] Usuario verificado, mostrando formulario...")
        setUser(session.user)
      } catch (err) {
        console.error("❌ [Force Password Change] Error inesperado:", err)
        setError("Error inesperado. Por favor, recarga la página.")
      }
    }

    checkUser()
  }, [router, supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      console.log("🔄 [Force Password Change] Enviando solicitud de cambio de contraseña...")
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña')
      }

      console.log("✅ [Force Password Change] Contraseña cambiada exitosamente")
      
      // Redirigir al dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error("❌ [Force Password Change] Error:", err)
      setError(err.message || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando usuario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Cambio de Contraseña Obligatorio
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Por seguridad, debes cambiar tu contraseña antes de continuar.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nueva Contraseña</CardTitle>
            <CardDescription>
              Ingresa tu contraseña actual y establece una nueva contraseña segura.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
