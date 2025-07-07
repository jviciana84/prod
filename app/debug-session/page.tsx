"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@/lib/supabase/client"

export default function DebugSessionPage() {
  const [cookies, setCookies] = useState<Record<string, string>>({})
  const [localStorage, setLocalStorage] = useState<Record<string, string>>({})
  const [sessionData, setSessionData] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkSession() {
      try {
        setLoading(true)

        // Obtener cookies
        const cookiesObj: Record<string, string> = {}
        document.cookie.split(";").forEach((cookie) => {
          const [name, value] = cookie.trim().split("=")
          if (name) {
            cookiesObj[name.trim()] = value || ""
          }
        })
        setCookies(cookiesObj)

        // Obtener localStorage
        const localStorageObj: Record<string, string> = {}
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key) {
            try {
              localStorageObj[key] = window.localStorage.getItem(key) || ""
            } catch (e) {
              localStorageObj[key] = "Error al leer"
            }
          }
        }
        setLocalStorage(localStorageObj)

        // Obtener sesión
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (sessionError) {
          setError(`Error al obtener sesión: ${sessionError.message}`)
        }
        setSessionData(session)

        // Obtener usuario
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) {
          setError(`Error al obtener usuario: ${userError.message}`)
        }
        setUserData(user)
      } catch (e) {
        setError(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [supabase])

  const handleForceLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: "viciana84@gmail.com",
        password: prompt("Introduce tu contraseña") || "",
      })

      if (error) {
        alert(`Error al iniciar sesión: ${error.message}`)
      } else {
        window.location.reload()
      }
    } catch (e) {
      alert(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const handleClearAllCookies = () => {
    if (confirm("¿Estás seguro de que quieres eliminar TODAS las cookies? Esto cerrará tu sesión.")) {
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split("=")[0]
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      })
      window.location.reload()
    }
  }

  return (
    <div className="container py-10 space-y-6">
      <h1 className="text-3xl font-bold">Depuración de Sesión</h1>

      {loading ? (
        <p>Cargando información de sesión...</p>
      ) : (
        <>
          {error && (
            <Card className="border-red-300 bg-red-50 dark:bg-red-900/20">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Estado de la Sesión</CardTitle>
              <CardDescription>
                {userData ? `Sesión activa como ${userData.email}` : "No hay sesión activa"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Datos de Usuario:</h3>
                  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto max-h-60">
                    {JSON.stringify(userData, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Datos de Sesión:</h3>
                  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto max-h-60">
                    {JSON.stringify(sessionData, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => window.location.reload()}>Actualizar</Button>
              <Button variant="outline" onClick={handleForceLogin}>
                Forzar inicio de sesión
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies</CardTitle>
              <CardDescription>{Object.keys(cookies).length} cookies encontradas</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto max-h-60">
                {JSON.stringify(cookies, null, 2)}
              </pre>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" onClick={handleClearAllCookies}>
                Eliminar todas las cookies
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>LocalStorage</CardTitle>
              <CardDescription>{Object.keys(localStorage).length} elementos encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto max-h-60">
                {JSON.stringify(localStorage, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
