"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Shield } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

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

  const {
    isSupported,
    isSubscribed,
    isLoading: pushLoading,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications()

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) throw error

      setUser(user)
      if (user) {
        await loadNotificationSettings()
      }
    } catch (error) {
      console.error("Error cargando usuario:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadNotificationSettings = async () => {
    try {
      // Por ahora usamos datos mock ya que no tenemos las tablas creadas
      const mockTypes = [
        {
          id: "1",
          name: "key_delivery",
          description: "Entrega de llaves",
          category: "vehiculos",
          is_critical: true,
          is_active: true,
        },
        {
          id: "2",
          name: "vehicle_ready",
          description: "Vehículo listo",
          category: "vehiculos",
          is_critical: false,
          is_active: true,
        },
      ]

      setNotificationTypes(mockTypes)
      setPreferences([])
    } catch (error) {
      console.error("Error cargando configuración:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración de notificaciones",
        variant: "destructive",
      })
    }
  }

  const updatePreference = async (notificationTypeId: string, enabled: boolean) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para cambiar las preferencias",
        variant: "destructive",
      })
      return
    }

    setUpdating(notificationTypeId)
    try {
      // Por ahora solo mostramos el toast, sin guardar en BD
      toast({
        title: "Configuración actualizada",
        description: `Notificación ${enabled ? "activada" : "desactivada"} correctamente`,
      })

      // Actualizar estado local
      setPreferences((prev) => {
        const existing = prev.find((p) => p.notification_type_id === notificationTypeId)
        if (existing) {
          return prev.map((p) => (p.notification_type_id === notificationTypeId ? { ...p, is_enabled: enabled } : p))
        } else {
          return [...prev, { notification_type_id: notificationTypeId, is_enabled: enabled }]
        }
      })
    } catch (error) {
      console.error("Error actualizando preferencia:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const handlePushToggle = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para activar notificaciones",
        variant: "destructive",
      })
      return
    }

    try {
      if (isSubscribed) {
        await unsubscribe()
        toast({
          title: "Notificaciones desactivadas",
          description: "Ya no recibirás notificaciones push",
        })
      } else {
        await subscribe()
        toast({
          title: "Notificaciones activadas",
          description: "Ahora recibirás notificaciones push",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la configuración de notificaciones",
        variant: "destructive",
      })
    }
  }

  const getPreferenceValue = (notificationTypeId: string) => {
    const pref = preferences.find((p) => p.notification_type_id === notificationTypeId)
    return pref?.is_enabled ?? true
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
    incidencias: "Incidencias",
    vehiculos: "Vehículos",
    fotos: "Fotografías",
    incentivos: "Incentivos",
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso requerido</CardTitle>
          <CardDescription>Debes estar autenticado para configurar las notificaciones</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones no soportadas</CardTitle>
          <CardDescription>Tu navegador no soporta notificaciones push</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Control principal de notificaciones push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>Recibe notificaciones aunque la aplicación esté cerrada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">{isSubscribed ? "Notificaciones activadas" : "Notificaciones desactivadas"}</p>
              <p className="text-sm text-muted-foreground">Estado del permiso: {permission}</p>
              <p className="text-sm text-muted-foreground">Usuario: {user.email}</p>
            </div>
            <Button onClick={handlePushToggle} disabled={pushLoading} variant={isSubscribed ? "outline" : "default"}>
              {pushLoading ? "Procesando..." : isSubscribed ? "Desactivar" : "Activar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración por tipo de notificación */}
      {isSubscribed && (
        <div className="space-y-4">
          {Object.entries(groupedTypes).map(([category, types]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{categoryNames[category] || category}</CardTitle>
                <CardDescription>Configura qué notificaciones quieres recibir de esta categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {types.map((type) => (
                    <div key={type.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{type.description}</p>
                          {type.is_critical && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Crítica
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{type.name}</p>
                      </div>
                      <Switch
                        checked={getPreferenceValue(type.id)}
                        onCheckedChange={(checked) => updatePreference(type.id, checked)}
                        disabled={updating === type.id || type.is_critical}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
