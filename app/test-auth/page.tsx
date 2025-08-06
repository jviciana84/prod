"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@/lib/supabase/client"

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError)
        setError(`Error de sesión: ${sessionError.message}`)
        return
      }

      setSession(session)

      if (!session) {
        setError("No hay sesión activa")
        setUser(null)
        return
      }

      // Obtener usuario
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error("Error obteniendo usuario:", userError)
        setError(`Error obteniendo usuario: ${userError.message}`)
        return
      }

      setUser(user)
    } catch (error) {
      console.error("Error general:", error)
      setError(`Error inesperado: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(`Error cerrando sesión: ${error.message}`)
      } else {
        setUser(null)
        setSession(null)
        setError("Sesión cerrada")
      }
    } catch (error) {
      setError(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Verificando autenticación...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🧪 Prueba de Autenticación</h1>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Autenticación</CardTitle>
          <CardDescription>Información sobre la sesión actual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">✅ Autenticación Exitosa</h3>
              <p className="text-green-600">Usuario autenticado correctamente</p>
            </div>
          )}

          {session && (
            <div className="space-y-2">
              <h4 className="font-medium">Información de Sesión:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          )}

          {user && (
            <div className="space-y-2">
              <h4 className="font-medium">Información de Usuario:</h4>
              <div className="space-y-1 text-sm">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Email Verificado:</strong> {user.email_confirmed_at ? "Sí" : "No"}</p>
                <p><strong>Creado:</strong> {new Date(user.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={checkAuth}>
              Verificar Autenticación
            </Button>
            {user && (
              <Button onClick={signOut} variant="destructive">
                Cerrar Sesión
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Pasos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Si la autenticación funciona correctamente, puedes:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Ir a <a href="/dashboard/settings" className="text-blue-600 hover:underline">Configuración</a> para probar las notificaciones</li>
              <li>Verificar que las notificaciones funcionan correctamente</li>
              <li>Configurar las preferencias de notificación</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 