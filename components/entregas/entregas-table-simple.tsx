"use client"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

export function EntregasTableSimple() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [entregas, setEntregas] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<any>({})

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const debug: any = {}

    try {
      // 1. Obtener sesión
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      debug.session = session ? "Activa" : "No activa"
      debug.sessionError = sessionError

      if (!session?.user) {
        debug.error = "No hay sesión activa"
        setDebugInfo(debug)
        setLoading(false)
        return
      }

      setUser(session.user)
      debug.userEmail = session.user.email

      // 2. Obtener perfil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .single()

      debug.profileData = profileData
      debug.profileError = profileError

      if (profileError) {
        debug.error = "Error obteniendo perfil: " + profileError.message
        setDebugInfo(debug)
        setLoading(false)
        return
      }

      setProfile(profileData)

      // 3. Determinar filtro
      const isAdmin = profileData?.role?.toLowerCase() === "admin"
      debug.isAdmin = isAdmin
      debug.userRole = profileData?.role
      debug.fullName = profileData?.full_name

      // 4. Obtener entregas
      let query = supabase.from("entregas").select("*").order("fecha_venta", { ascending: false })

      if (!isAdmin && profileData?.full_name) {
        query = query.ilike("asesor", profileData.full_name)
        debug.filteredBy = profileData.full_name
      } else if (!isAdmin) {
        debug.error = "Usuario no admin sin full_name"
        setDebugInfo(debug)
        setLoading(false)
        return
      }

      const { data: entregasData, error: entregasError } = await query

      debug.entregasData = entregasData ? `${entregasData.length} registros` : "null"
      debug.entregasError = entregasError

      if (entregasError) {
        debug.error = "Error obteniendo entregas: " + entregasError.message
      } else {
        setEntregas(entregasData || [])
        if (entregasData && entregasData.length > 0) {
          toast.success(`Cargadas ${entregasData.length} entregas`)
        } else {
          toast.info("No se encontraron entregas")
        }
      }
    } catch (error: any) {
      debug.unexpectedError = error.message
      console.error("Error inesperado:", error)
    }

    setDebugInfo(debug)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Entregas - Debug Mode
          <Button onClick={loadData} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recargar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Debug Info */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🔍 Información de Debug:</h3>
            <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">👤 Usuario:</h3>
              <p>Email: {user.email}</p>
              <p>ID: {user.id}</p>
            </div>
          )}

          {/* Profile Info */}
          {profile && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📋 Perfil:</h3>
              <p>Nombre: {profile.full_name}</p>
              <p>Rol: {profile.role}</p>
            </div>
          )}

          {/* Entregas */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">📦 Entregas ({entregas.length}):</h3>
            {entregas.length > 0 ? (
              <div className="space-y-2">
                {entregas.slice(0, 5).map((entrega, index) => (
                  <div key={index} className="text-sm border-l-2 border-blue-500 pl-2">
                    <p>
                      <strong>Matrícula:</strong> {entrega.matricula}
                    </p>
                    <p>
                      <strong>Asesor:</strong> {entrega.asesor}
                    </p>
                    <p>
                      <strong>Modelo:</strong> {entrega.modelo}
                    </p>
                  </div>
                ))}
                {entregas.length > 5 && <p className="text-sm text-gray-600">... y {entregas.length - 5} más</p>}
              </div>
            ) : (
              <p className="text-gray-600">No hay entregas para mostrar</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
