"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, Settings, TestTube, CheckCircle, XCircle, Shield, LogIn, ChevronDown, ChevronRight } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { createClientComponentClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface NotificationType {
  id: string
  name: string
  description: string
  category: string
  is_critical: boolean
  is_active: boolean
}

interface UserPreference {
  notification_type_id: string
  is_enabled: boolean
}

export default function UserNotificationSettings() {
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [preferences, setPreferences] = useState<UserPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showFutureNotifications, setShowFutureNotifications] = useState(false)

  const {
    isSupported,
    isSubscribed,
    isLoading: pushLoading,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications()

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      setLoading(true)
      setAuthError(null)

      // Verificar si hay una sesión activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError)
        setAuthError("Error de autenticación")
        return
      }

      if (!session) {
        setAuthError("No hay sesión activa")
        setUser(null)
        return
      }

      // Obtener información del usuario
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error("Error obteniendo usuario:", userError)
        setAuthError("Error obteniendo información del usuario")
        return
      }

      if (!user) {
        setAuthError("Usuario no encontrado")
        setUser(null)
        return
      }

      setUser(user)
      await loadNotificationSettings()
    } catch (error) {
      console.error("Error cargando usuario:", error)
      setAuthError("Error inesperado al cargar usuario")
    } finally {
      setLoading(false)
    }
  }

  const loadNotificationSettings = async () => {
    if (!user) return

    try {
      // Definir notificaciones actuales (reales)
      const currentNotifications = [
        // Notificaciones para todos los usuarios
        {
          id: "photo_assignment",
          name: "photo_assignment",
          description: "Se te han asignado nuevas fotografías para tomar",
          category: "tareas",
          is_critical: false,
          is_active: true,
        },
        {
          id: "material_delivery",
          name: "material_delivery",
          description: "Se te ha entregado material (documentos, llaves, etc.)",
          category: "tareas",
          is_critical: false,
          is_active: true,
        },
        {
          id: "sales_360_completed",
          name: "sales_360_completed",
          description: "Has completado una venta 360 en gestión de ventas",
          category: "ventas",
          is_critical: true,
          is_active: true,
        },
        {
          id: "sales_cyp_completed",
          name: "sales_cyp_completed",
          description: "Has completado una venta CyP en gestión de ventas",
          category: "ventas",
          is_critical: true,
          is_active: true,
        },
        {
          id: "incident_reported",
          name: "incident_reported",
          description: "Se ha registrado una nueva incidencia a tu nombre",
          category: "incidencias",
          is_critical: true,
          is_active: true,
        },
        {
          id: "incident_resolved",
          name: "incident_resolved",
          description: "Se ha resuelto una incidencia que tenías asignada",
          category: "incidencias",
          is_critical: false,
          is_active: true,
        },
        // Notificaciones para admin, supervisor y director
        {
          id: "any_sale_registered",
          name: "any_sale_registered",
          description: "Se ha registrado una nueva venta en el sistema",
          category: "admin",
          is_critical: false,
          is_active: true,
        },
        {
          id: "failed_sale_registered",
          name: "failed_sale_registered",
          description: "Se ha registrado una venta caída en el sistema",
          category: "admin",
          is_critical: true,
          is_active: true,
        },
      ]

      // Definir notificaciones futuras (inventadas)
      const futureNotifications = [
        // Vehículos
        {
          id: "vehicle_inspection_ready",
          name: "vehicle_inspection_ready",
          description: "Vehículo listo para inspección",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "vehicle_delivery_scheduled",
          name: "vehicle_delivery_scheduled",
          description: "Entrega de vehículo programada",
          category: "futuras",
          is_critical: true,
          is_active: false,
        },
        {
          id: "vehicle_delivery_completed",
          name: "vehicle_delivery_completed",
          description: "Entrega de vehículo completada",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "vehicle_incident_reported",
          name: "vehicle_incident_reported",
          description: "Nueva incidencia reportada",
          category: "futuras",
          is_critical: true,
          is_active: false,
        },
        {
          id: "vehicle_incident_resolved",
          name: "vehicle_incident_resolved",
          description: "Incidencia resuelta",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        // Documentación
        {
          id: "document_ready",
          name: "document_ready",
          description: "Documentación lista para recoger",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "document_delivered",
          name: "document_delivered",
          description: "Documentación entregada",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "document_expired",
          name: "document_expired",
          description: "Documentación próxima a expirar",
          category: "futuras",
          is_critical: true,
          is_active: false,
        },
        // Llaves
        {
          id: "keys_ready",
          name: "keys_ready",
          description: "Llaves listas para recoger",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "keys_delivered",
          name: "keys_delivered",
          description: "Llaves entregadas",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "keys_missing",
          name: "keys_missing",
          description: "Llaves faltantes",
          category: "futuras",
          is_critical: true,
          is_active: false,
        },
        // Entregas
        {
          id: "delivery_scheduled",
          name: "delivery_scheduled",
          description: "Entrega programada",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "delivery_in_progress",
          name: "delivery_in_progress",
          description: "Entrega en progreso",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "delivery_completed",
          name: "delivery_completed",
          description: "Entrega completada",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "delivery_delayed",
          name: "delivery_delayed",
          description: "Entrega retrasada",
          category: "futuras",
          is_critical: true,
          is_active: false,
        },
        // Sistema
        {
          id: "system_maintenance",
          name: "system_maintenance",
          description: "Mantenimiento del sistema",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "system_error",
          name: "system_error",
          description: "Error del sistema",
          category: "futuras",
          is_critical: true,
          is_active: false,
        },
        {
          id: "system_update",
          name: "system_update",
          description: "Actualización del sistema",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        // Usuarios
        {
          id: "user_assigned",
          name: "user_assigned",
          description: "Usuario asignado a tarea",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "user_permission_changed",
          name: "user_permission_changed",
          description: "Permisos de usuario modificados",
          category: "futuras",
          is_critical: true,
          is_active: false,
        },
        {
          id: "user_login",
          name: "user_login",
          description: "Nuevo inicio de sesión",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        // Reportes
        {
          id: "report_ready",
          name: "report_ready",
          description: "Reporte listo",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "report_error",
          name: "report_error",
          description: "Error en reporte",
          category: "futuras",
          is_critical: true,
          is_active: false,
        },
        // General
        {
          id: "info",
          name: "info",
          description: "Información general",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "warning",
          name: "warning",
          description: "Advertencia",
          category: "futuras",
          is_critical: true,
          is_active: false,
        },
        {
          id: "success",
          name: "success",
          description: "Operación exitosa",
          category: "futuras",
          is_critical: false,
          is_active: false,
        },
        {
          id: "error",
          name: "error",
          description: "Error general",
          category: "futuras",
          is_critical: true,
          is_active: false,
        },
      ]

      // Combinar notificaciones actuales y futuras
      const allNotifications = [...currentNotifications, ...futureNotifications]
      setNotificationTypes(allNotifications)

      // Cargar preferencias del usuario
      const { data: prefs, error: prefsError } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)

      if (prefsError) {
        console.error("Error cargando preferencias:", prefsError)
        setPreferences([])
      } else {
        setPreferences(prefs || [])
      }
    } catch (error) {
      console.error("Error cargando configuración:", error)
      toast.error("No se pudo cargar la configuración de notificaciones")
    }
  }

  const updatePreference = async (notificationTypeId: string, enabled: boolean) => {
    if (!user) {
      toast.error("Debes estar autenticado para cambiar las preferencias")
      return
    }

    setUpdating(notificationTypeId)
    try {
      // Verificar que la sesión sigue activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast.error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.")
        return
      }

      // Verificar si ya existe la preferencia
      const existingPref = preferences.find(p => p.notification_type_id === notificationTypeId)

      if (existingPref) {
        // Actualizar preferencia existente
        const { error } = await supabase
          .from("user_notification_preferences")
          .update({ is_enabled: enabled })
          .eq("user_id", user.id)
          .eq("notification_type_id", notificationTypeId)

        if (error) {
          console.error("Error actualizando preferencia:", error)
          throw new Error(`Error actualizando preferencia: ${error.message || error.details || JSON.stringify(error)}`)
        }
      } else {
        // Crear nueva preferencia
        const { error } = await supabase
          .from("user_notification_preferences")
          .insert({
            user_id: user.id,
            notification_type_id: notificationTypeId,
            is_enabled: enabled,
          })

        if (error) {
          console.error("Error creando preferencia:", error)
          throw new Error(`Error creando preferencia: ${error.message || error.details || JSON.stringify(error)}`)
        }
      }

      // Actualizar estado local
      setPreferences(prev => {
        const filtered = prev.filter(p => p.notification_type_id !== notificationTypeId)
        return [...filtered, { notification_type_id: notificationTypeId, is_enabled: enabled }]
      })

      toast.success(`Notificación ${enabled ? 'activada' : 'desactivada'}`)
    } catch (error) {
      console.error("Error actualizando preferencia:", error)
      toast.error(`Error: ${error.message || "Error desconocido"}`)
    } finally {
      setUpdating(null)
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        toast.error(`Error refrescando sesión: ${error.message}`)
      } else {
        toast.success("Sesión refrescada correctamente")
        await loadUser() // Recargar datos del usuario
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const clearSession = async () => {
    try {
      const response = await fetch("/api/fix-session", {
        method: "POST"
      })
      
      if (response.ok) {
        toast.success("Sesión limpiada. Por favor, inicia sesión nuevamente.")
        // Redirigir al login
        window.location.href = "/"
      } else {
        const result = await response.json()
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const handlePushToggle = async () => {
    if (!user) {
      toast.error("Debes estar autenticado para activar notificaciones")
      return
    }

    try {
      // Verificar que la sesión sigue activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast.error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.")
        return
      }

      if (isSubscribed) {
        await unsubscribe()
        toast.success("Notificaciones push desactivadas")
      } else {
        await subscribe()
        toast.success("Notificaciones push activadas")
      }
    } catch (error) {
      console.error("Error en notificaciones push:", error)
      
      // Manejar errores específicos
      if (error.message.includes("iniciar sesión")) {
        toast.error("Debes iniciar sesión para activar las notificaciones push")
      } else if (error.message.includes("Permisos no concedidos")) {
        toast.error("Debes conceder permisos de notificación en tu navegador")
      } else if (error.message.includes("no están soportadas")) {
        toast.error("Tu navegador no soporta notificaciones push")
      } else {
        toast.error(`Error: ${error.message}`)
      }
    }
  }

  const getPreferenceValue = (notificationTypeId: string) => {
    const pref = preferences.find(p => p.notification_type_id === notificationTypeId)
    return pref ? pref.is_enabled : true // Por defecto activado
  }

  const testNotification = async (type: NotificationType) => {
    console.log("🧪 Función testNotification llamada para:", type.name)
    
    if (!user) {
      console.log("❌ Usuario no autenticado")
      toast.error("Debes estar autenticado para probar notificaciones")
      return
    }

    try {
      // Verificar que la sesión sigue activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast.error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.")
        return
      }

      // Crear notificación de campana
      const bellResponse = await fetch("/api/test-notification-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `🧪 Prueba: ${type.description}`,
          body: `Esta es una notificación de prueba para ${type.description}`,
          data: { 
            url: "/dashboard",
            type: type.name,
            category: type.category
          },
          userId: user?.id
        })
      })

      // Enviar notificación push
      const pushResponse = await fetch("/api/notifications/send-test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `🧪 Prueba Push: ${type.description}`,
          body: `Esta es una notificación push de prueba para ${type.description}`,
          userId: user?.id
        })
      })

      const bellResult = await bellResponse.json()
      const pushResult = await pushResponse.json()
      
      if (bellResponse.ok && pushResponse.ok) {
        toast.success(`Notificación de prueba creada (campana + push)`)
      } else {
        console.error("Error en respuesta:", { bell: bellResult, push: pushResult })
        if (bellResponse.status === 401 || pushResponse.status === 401) {
          toast.error(`Error de autenticación. Intenta refrescar la sesión.`)
        } else {
          toast.error(`Error: ${bellResult.error || pushResult.error || "Error desconocido"}`)
        }
      }
    } catch (error) {
      console.error("Error enviando notificación de prueba:", error)
      toast.error(`Error: ${error.message || "Error de conexión"}`)
    }
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const groupedTypes = notificationTypes.reduce(
    (acc, type) => {
      if (!acc[type.category]) {
        acc[type.category] = []
      }
      acc[type.category].push(type)
      return acc
    },
    {} as Record<string, NotificationType[]>,
  )

  const categoryNames = {
    tareas: "Tareas",
    ventas: "Ventas",
    incidencias: "Incidencias",
    admin: "Administración",
    futuras: "Futuras Notificaciones",
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (authError || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Autenticación Requerida
          </CardTitle>
          <CardDescription>
            {authError || "Debes iniciar sesión para configurar las notificaciones"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para configurar las notificaciones, necesitas estar autenticado en el sistema.
            </p>
            <Button onClick={() => window.location.href = "/auth/login"}>
              Iniciar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Soporte del navegador</span>
            {getStatusIcon(isSupported)}
          </div>
          <div className="flex items-center justify-between">
            <span>Permisos concedidos</span>
            <Badge variant={permission === "granted" ? "default" : "secondary"}>
              {permission}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Notificaciones push</span>
            {getStatusIcon(isSubscribed)}
          </div>
          <div className="flex items-center justify-between">
            <span>Usuario autenticado</span>
            {getStatusIcon(!!user)}
          </div>
          <div className="flex items-center justify-between">
            <span>Email del usuario</span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Tipos de notificación cargados</span>
            <Badge variant="outline">{notificationTypes.length}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Notificaciones actuales</span>
            <Badge variant="default">{notificationTypes.filter(t => t.category !== "futuras").length}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Futuras notificaciones</span>
            <Badge variant="secondary">{notificationTypes.filter(t => t.category === "futuras").length}</Badge>
          </div>
          <div className="pt-2">
            <Button
              onClick={loadUser}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Verificar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Las notificaciones push aparecen en tu escritorio incluso cuando no tienes la página abierta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificaciones push</p>
              <p className="text-sm text-muted-foreground">
                Recibe notificaciones en tu escritorio
              </p>
            </div>
            <Button
              onClick={handlePushToggle}
              disabled={!isSupported || pushLoading}
              variant={isSubscribed ? "destructive" : "default"}
            >
              {pushLoading ? "..." : isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {isSubscribed ? "Desactivar" : "Activar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones Actuales */}
      {Object.entries(groupedTypes)
        .filter(([category]) => category !== "futuras")
        .map(([category, types]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{categoryNames[category] || category}</CardTitle>
              <CardDescription>
                {category === "tareas" && "Notificaciones sobre tareas asignadas"}
                {category === "ventas" && "Notificaciones sobre ventas completadas"}
                {category === "incidencias" && "Notificaciones sobre incidencias"}
                {category === "admin" && "Notificaciones administrativas (solo para admin, supervisor y director)"}
                {category !== "tareas" && category !== "ventas" && category !== "incidencias" && category !== "admin" && "Configura qué tipos de notificaciones quieres recibir"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {types.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{type.description}</p>
                      {type.is_critical && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Crítica
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {type.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={getPreferenceValue(type.id)}
                      onCheckedChange={(enabled) => updatePreference(type.id, enabled)}
                      disabled={updating === type.id}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testNotification(type)}
                    >
                      <TestTube className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

      {/* Notificaciones Futuras (Desplegable) */}
      {groupedTypes.futuras && (
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto"
              onClick={() => setShowFutureNotifications(!showFutureNotifications)}
            >
              <div className="text-left">
                <CardTitle className="flex items-center gap-2">
                  <span>Futuras Notificaciones</span>
                  <Badge variant="secondary" className="text-xs">
                    {groupedTypes.futuras.length} tipos
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Notificaciones planificadas para futuras versiones
                </CardDescription>
              </div>
              {showFutureNotifications ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CardHeader>
          {showFutureNotifications && (
            <CardContent className="space-y-4">
              {groupedTypes.futuras.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-600">{type.description}</p>
                      <Badge variant="secondary" className="text-xs">
                        Futura
                      </Badge>
                      {type.is_critical && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Crítica
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {type.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={false}
                      disabled={true}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={true}
                    >
                      <TestTube className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Notificaciones Push:</strong> Aparecen en tu escritorio incluso cuando no tienes la página abierta.</p>
            <p><strong>Notificaciones de Campana:</strong> Aparecen en la campana del dashboard sin necesidad de permisos.</p>
            <p><strong>Notificaciones Críticas:</strong> Requieren tu atención inmediata y no se pueden cerrar automáticamente.</p>
            <p><strong>Futuras Notificaciones:</strong> Tipos de notificación planificados para próximas versiones del sistema.</p>
          </div>
          <div className="pt-2 border-t space-y-2">
            <Button onClick={refreshSession} variant="outline" size="sm">
              Refrescar Sesión
            </Button>
            <Button onClick={clearSession} variant="destructive" size="sm">
              Limpiar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
