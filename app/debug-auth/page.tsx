"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, User, Database, Cookie, Key } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export default function DebugAuthPage() {
  const { user, loading } = useAuth()
  const [sessionData, setSessionData] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const [localStorage, setLocalStorage] = useState<any>({})
  const [dbConnection, setDbConnection] = useState<boolean | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadDebugInfo()
  }, [])

  const loadDebugInfo = async () => {
    try {
      // Obtener sesión
      const { data: session, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        setAuthError(sessionError.message)
      } else {
        setSessionData(session)
      }

      // Obtener perfil si hay usuario
      if (session?.session?.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.session.user.id)
          .single()

        if (!profileError) {
          setProfileData(profile)
        }
      }

      // Probar conexión a la base de datos
      const { data: testData, error: dbError } = await supabase.from("profiles").select("count").limit(1)

      setDbConnection(!dbError)

      // Obtener cookies
      const allCookies = document.cookie.split(";").map((cookie) => cookie.trim())
      setCookies(allCookies)

      // Obtener localStorage
      const localStorageData: any = {}
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key) {
          localStorageData[key] = window.localStorage.getItem(key)
        }
      }
      setLocalStorage(localStorageData)
    } catch (error: any) {
      setAuthError(error.message)
    }
  }

  const handleManualLogin = async () => {
    const email = prompt("Email:")
    const password = prompt("Password:")

    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        alert("Login exitoso!")
        loadDebugInfo()
      }
    }
  }

  const handleClearAuth = () => {
    // Limpiar localStorage
    window.localStorage.clear()

    // Limpiar cookies de Supabase
    const supabaseCookies = cookies.filter((cookie) => cookie.includes("sb-"))
    supabaseCookies.forEach((cookie) => {
      const cookieName = cookie.split("=")[0]
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })

    // Cerrar sesión
    supabase.auth.signOut()

    alert("Auth limpiado. Recarga la página.")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug de Autenticación</h1>
          <p className="text-muted-foreground">Información completa del estado de autenticación</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDebugInfo} variant="outline">
            Refrescar
          </Button>
          <Button onClick={handleManualLogin} variant="default">
            Login Manual
          </Button>
          <Button onClick={handleClearAuth} variant="destructive">
            Limpiar Auth
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estado de Autenticación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Estado de Autenticación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Estado:</span>
              {loading ? (
                <Badge variant="secondary">Cargando...</Badge>
              ) : user ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Autenticado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No autenticado
                </Badge>
              )}
            </div>

            {user && (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">ID:</span> {user.id}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
                <div>
                  <span className="font-medium">Rol:</span> {user.role || "Sin rol"}
                </div>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{authError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conexión a Base de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Conexión a Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="font-medium">Estado:</span>
              {dbConnection === null ? (
                <Badge variant="secondary">Verificando...</Badge>
              ) : dbConnection ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Error de conexión
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datos de Sesión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Datos de Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionData?.session ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Access Token:</span>{" "}
                  {sessionData.session.access_token ? "✓ Presente" : "✗ Ausente"}
                </div>
                <div>
                  <span className="font-medium">Refresh Token:</span>{" "}
                  {sessionData.session.refresh_token ? "✓ Presente" : "✗ Ausente"}
                </div>
                <div>
                  <span className="font-medium">Expira:</span>{" "}
                  {new Date(sessionData.session.expires_at * 1000).toLocaleString()}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay sesión activa</p>
            )}
          </CardContent>
        </Card>

        {/* Datos de Perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            {profileData ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span> {profileData.full_name || "Sin nombre"}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {profileData.email}
                </div>
                <div>
                  <span className="font-medium">Posición:</span> {profileData.position || "Sin posición"}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No se encontraron datos de perfil</p>
            )}
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Cookies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cookies.length > 0 ? (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {cookies.map((cookie, index) => (
                  <div key={index} className="text-xs font-mono bg-gray-50 p-2 rounded">
                    {cookie}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay cookies</p>
            )}
          </CardContent>
        </Card>

        {/* LocalStorage */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>LocalStorage</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(localStorage).length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(localStorage).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="font-medium">{key}:</span>
                    <div className="font-mono bg-gray-50 p-2 rounded mt-1 break-all">
                      {typeof value === "string" ? value.substring(0, 200) : JSON.stringify(value).substring(0, 200)}
                      {(typeof value === "string" ? value.length : JSON.stringify(value).length) > 200 && "..."}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay datos en localStorage</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
