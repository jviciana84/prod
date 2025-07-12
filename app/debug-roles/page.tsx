"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Users,
  Settings
} from "lucide-react"

interface DebugInfo {
  user: any
  roles: string[]
  isAdmin: boolean
  isSupervisorOrDirector: boolean
  canEdit: boolean
  error?: string
  loading: boolean
}

// Funciones de verificación de roles (versión cliente)
async function checkUserRoles(supabase: any, userId: string): Promise<string[]> {
  try {
    // Intentar obtener roles desde user_roles
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_roles")
      .select(`
        roles (
          name
        )
      `)
      .eq("user_id", userId)

    if (!userRolesError && userRoles && userRoles.length > 0) {
      return userRoles.map((ur: any) => ur.roles?.name).filter(Boolean)
    }

    // Fallback: intentar obtener desde profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (!profileError && profileData?.role) {
      return profileData.role.split(", ").map((role: string) => role.trim())
    }

    return []
  } catch (error) {
    console.error("Error obteniendo roles:", error)
    return []
  }
}

function isUserAdmin(roles: string[]): boolean {
  return roles.some(role => {
    const lowerRole = role.toLowerCase()
    return lowerRole === "admin" || 
           lowerRole === "administrador" || 
           lowerRole === "administración" ||
           lowerRole.includes("admin")
  })
}

function isUserSupervisorOrDirector(roles: string[]): boolean {
  return roles.some(role => {
    const lowerRole = role.toLowerCase()
    return lowerRole === "supervisor" || 
           lowerRole === "director" ||
           lowerRole.includes("supervisor") ||
           lowerRole.includes("director")
  })
}

function canUserEdit(roles: string[]): boolean {
  return isUserAdmin(roles) || isUserSupervisorOrDirector(roles)
}

export default function DebugRolesPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    user: null,
    roles: [],
    isAdmin: false,
    isSupervisorOrDirector: false,
    canEdit: false,
    loading: true
  })
  const [refreshing, setRefreshing] = useState(false)

  const supabase = createClientComponentClient()

  const checkPermissions = async () => {
    try {
      setDebugInfo(prev => ({ ...prev, loading: true, error: undefined }))

      // Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setDebugInfo({
          user: null,
          roles: [],
          isAdmin: false,
          isSupervisorOrDirector: false,
          canEdit: false,
          error: "Usuario no autenticado",
          loading: false
        })
        return
      }

      // Obtener roles
      const roles = await checkUserRoles(supabase, user.id)
      
      // Verificar permisos
      const isAdmin = isUserAdmin(roles)
      const isSupervisorOrDirector = isUserSupervisorOrDirector(roles)
      const canEdit = canUserEdit(roles)

      setDebugInfo({
        user,
        roles,
        isAdmin,
        isSupervisorOrDirector,
        canEdit,
        loading: false
      })

    } catch (error: any) {
      console.error("Error verificando permisos:", error)
      setDebugInfo(prev => ({
        ...prev,
        error: error.message || "Error inesperado",
        loading: false
      }))
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await checkPermissions()
    setRefreshing(false)
  }

  useEffect(() => {
    checkPermissions()
  }, [])

  if (debugInfo.loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Verificando permisos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debug de Roles y Permisos</h1>
          <p className="text-muted-foreground">
            Página de diagnóstico para verificar el sistema de roles y permisos
          </p>
        </div>
        <Button onClick={refreshData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refrescar
        </Button>
      </div>

      {debugInfo.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Error:</span>
              <span>{debugInfo.error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {debugInfo.user ? (
              <>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{debugInfo.user.email}</span>
                </div>
                <div>
                  <span className="font-medium">ID:</span>
                  <span className="ml-2 font-mono text-sm">{debugInfo.user.id}</span>
                </div>
                <div>
                  <span className="font-medium">Creado:</span>
                  <span className="ml-2">
                    {new Date(debugInfo.user.created_at).toLocaleString('es-ES')}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No hay usuario autenticado</div>
            )}
          </CardContent>
        </Card>

        {/* Roles del Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Roles del Usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debugInfo.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {debugInfo.roles.map((role, index) => (
                  <Badge key={index} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No se encontraron roles</div>
            )}
          </CardContent>
        </Card>

        {/* Permisos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>¿Es Administrador?</span>
              {debugInfo.isAdmin ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>¿Es Supervisor/Director?</span>
              {debugInfo.isSupervisorOrDirector ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>¿Puede Editar?</span>
              {debugInfo.canEdit ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estado del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Usuario Autenticado</span>
              {debugInfo.user ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Roles Obtenidos</span>
              {debugInfo.roles.length > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Permisos Verificados</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información Detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Información Detallada</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
} 