"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function DebugNotificationsPage() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testResults, setTestResults] = useState<any[]>([])

  const supabase = createClientComponentClient()

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)
    const results: any = {}

    try {
      // 1. Verificar autenticación
      console.log("🔍 Verificando autenticación...")
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      results.session = { session: !!session, error: sessionError?.message }
      setSession(session)

      if (session) {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        results.user = { user: !!user, id: user?.id, email: user?.email, error: userError?.message }
        setUser(user)
      }

      // 2. Verificar tablas de notificaciones
      console.log("🗄️ Verificando tablas...")
      
      // Verificar notification_history
      const { data: historyData, error: historyError } = await supabase
        .from("notification_history")
        .select("count", { count: "exact", head: true })
      results.notification_history = { 
        exists: !historyError, 
        error: historyError?.message,
        count: historyData?.length || 0
      }

      // Verificar user_notification_preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from("user_notification_preferences")
        .select("count", { count: "exact", head: true })
      results.user_notification_preferences = { 
        exists: !prefsError, 
        error: prefsError?.message,
        count: prefsData?.length || 0
      }

      // Verificar user_push_subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from("user_push_subscriptions")
        .select("count", { count: "exact", head: true })
      results.user_push_subscriptions = { 
        exists: !subsError, 
        error: subsError?.message,
        count: subsData?.length || 0
      }

      // 3. Verificar variables de entorno
      results.env = {
        hasVapidPublic: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        hasVapidPrivate: !!process.env.VAPID_PRIVATE_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }

      setDebugInfo(results)
    } catch (error) {
      console.error("Error en diagnóstico:", error)
      results.error = error.message
    } finally {
      setLoading(false)
    }
  }

  const testNotificationAPI = async () => {
    if (!user) {
      toast.error("No hay usuario autenticado")
      return
    }

    const tests = [
      {
        name: "API de prueba simple",
        url: "/api/notifications/test-simple",
        method: "POST",
        body: {
          title: "🧪 Prueba de diagnóstico",
          body: "Esta es una prueba del sistema de notificaciones",
          data: { url: "/dashboard" }
        }
      },
      {
        name: "API de campana",
        url: "/api/notifications/bell",
        method: "POST",
        body: {
          title: "🧪 Prueba de campana",
          body: "Esta es una prueba de notificaciones de campana",
          data: { url: "/dashboard" }
        }
      }
    ]

    const results = []
    for (const test of tests) {
      try {
        console.log(`🧪 Probando: ${test.name}`)
        const response = await fetch(test.url, {
          method: test.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(test.body)
        })

        const result = await response.json()
        results.push({
          name: test.name,
          success: response.ok,
          status: response.status,
          data: result
        })

        if (response.ok) {
          toast.success(`${test.name}: ✅ Exitoso`)
        } else {
          toast.error(`${test.name}: ❌ Error - ${result.error}`)
        }
      } catch (error) {
        results.push({
          name: test.name,
          success: false,
          error: error.message
        })
        toast.error(`${test.name}: ❌ Error - ${error.message}`)
      }
    }

    setTestResults(results)
  }

  const createTestNotification = async () => {
    if (!user) {
      toast.error("No hay usuario autenticado")
      return
    }

    try {
      const { error } = await supabase
        .from("notification_history")
        .insert({
          user_id: user.id,
          title: "🧪 Notificación de prueba manual",
          body: "Esta notificación fue creada manualmente desde el diagnóstico",
          data: { url: "/dashboard", source: "debug" },
          created_at: new Date().toISOString(),
        })

      if (error) {
        toast.error(`Error creando notificación: ${error.message}`)
      } else {
        toast.success("Notificación de prueba creada manualmente")
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Ejecutando diagnóstico...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🔍 Diagnóstico de Notificaciones</h1>

      {/* Información del Usuario */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Sesión activa</span>
              <Badge variant={session ? "default" : "secondary"}>
                {session ? "Sí" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Usuario autenticado</span>
              <Badge variant={user ? "default" : "secondary"}>
                {user ? "Sí" : "No"}
              </Badge>
            </div>
            {user && (
              <>
                <div className="flex items-center justify-between">
                  <span>ID del usuario</span>
                  <span className="text-sm text-muted-foreground">{user.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estado de las Tablas */}
      <Card>
        <CardHeader>
          <CardTitle>🗄️ Estado de las Tablas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(debugInfo).map(([key, value]: [string, any]) => {
              if (key === 'session' || key === 'user' || key === 'env') return null
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <span>{key}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={value.exists ? "default" : "destructive"}>
                      {value.exists ? "✅ Existe" : "❌ No existe"}
                    </Badge>
                    {value.count !== undefined && (
                      <Badge variant="outline">{value.count} registros</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Variables de Entorno */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Variables de Entorno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {debugInfo.env && Object.entries(debugInfo.env).map(([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between">
                <span>{key}</span>
                <Badge variant={value ? "default" : "destructive"}>
                  {value ? "✅ Configurada" : "❌ No configurada"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pruebas */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Pruebas</CardTitle>
          <CardDescription>Prueba las APIs de notificaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={testNotificationAPI}>
                Probar APIs
              </Button>
              <Button onClick={createTestNotification} variant="outline">
                Crear Notificación Manual
              </Button>
              <Button onClick={runDiagnostics} variant="outline">
                Re-ejecutar Diagnóstico
              </Button>
            </div>

            {testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Resultados de las Pruebas:</h4>
                {testResults.map((result, index) => (
                  <div key={index} className="p-2 border rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.name}</span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "✅ Exitoso" : "❌ Falló"}
                      </Badge>
                    </div>
                    {result.status && (
                      <p className="text-sm text-muted-foreground">
                        Status: {result.status}
                      </p>
                    )}
                    {result.error && (
                      <p className="text-sm text-red-600">
                        Error: {result.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

             {/* Información de Debug */}
       <Card>
         <CardHeader>
           <CardTitle>📊 Información Completa</CardTitle>
         </CardHeader>
         <CardContent>
           <pre className="text-xs bg-black text-white p-2 rounded overflow-auto max-h-96">
             {JSON.stringify(debugInfo, null, 2)}
           </pre>
         </CardContent>
       </Card>
    </div>
  )
} 