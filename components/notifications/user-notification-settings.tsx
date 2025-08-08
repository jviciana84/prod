"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, Settings, TestTube, CheckCircle, XCircle, Shield, LogIn, ChevronDown, ChevronRight } from "lucide-react"
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
  id: string
  user_id: string
  notification_type_id: string
  is_enabled: boolean
}

export default function UserNotificationSettings() {
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadNotificationData()
  }, [])

  const loadNotificationData = async () => {
    try {
      setLoading(true)

      // Obtener tipos de notificación
      const { data: types, error: typesError } = await supabase
        .from("notification_types")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })

      if (typesError) {
        console.error("Error cargando tipos de notificación:", typesError)
        toast.error("Error cargando tipos de notificación")
        return
      }

      setNotificationTypes(types || [])

      // Obtener preferencias del usuario
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: preferences, error: prefsError } = await supabase
          .from("user_notification_preferences")
          .select("*")
          .eq("user_id", user.id)

        if (prefsError) {
          console.error("Error cargando preferencias:", prefsError)
        } else {
          setUserPreferences(preferences || [])
        }
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error cargando configuración")
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePreference = async (typeId: string, enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Usuario no autenticado")
        return
      }

      // Buscar preferencia existente
      const existingPref = userPreferences.find(p => p.notification_type_id === typeId)

      if (existingPref) {
        // Actualizar preferencia existente
        const { error } = await supabase
          .from("user_notification_preferences")
          .update({ is_enabled: enabled })
          .eq("id", existingPref.id)

        if (error) {
          console.error("Error actualizando preferencia:", error)
          toast.error("Error actualizando preferencia")
          return
        }
      } else {
        // Crear nueva preferencia
        const { error } = await supabase
          .from("user_notification_preferences")
          .insert({
            user_id: user.id,
            notification_type_id: typeId,
            is_enabled: enabled
          })

        if (error) {
          console.error("Error creando preferencia:", error)
          toast.error("Error creando preferencia")
          return
        }
      }

      // Actualizar estado local
      setUserPreferences(prev => {
        const filtered = prev.filter(p => p.notification_type_id !== typeId)
        return [...filtered, {
          id: existingPref?.id || `temp-${typeId}`,
          user_id: user.id,
          notification_type_id: typeId,
          is_enabled: enabled
        }]
      })

      toast.success(`Notificación ${enabled ? "activada" : "desactivada"}`)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error actualizando preferencia")
    }
  }

  const testNotification = async () => {
    setIsSendingTest(true)
    try {
      const bellResponse = await fetch("/api/notifications/bell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🧪 Notificación de Prueba",
          body: "Esta es una notificación de prueba desde la configuración",
          data: { url: "/dashboard/settings" }
        })
      })

      if (bellResponse.ok) {
        toast.success("Notificación de prueba enviada (solo campana)")
      } else {
        toast.error("Error enviando notificación de prueba")
      }
    } catch (error) {
      console.error("Error enviando notificación de prueba:", error)
      toast.error(`Error: ${error.message || "Error de conexión"}`)
    } finally {
      setIsSendingTest(false)
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
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

  return (
    <div className="space-y-6">
      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>Configuración actual de notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Push Notifications:</span>
            <Badge className="bg-gray-400 text-white">
              <BellOff className="h-3 w-3 mr-1" />
              Anulado
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Campana:</span>
            <Badge className="bg-green-600 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Activa
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Tipos */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificaciones</CardTitle>
          <CardDescription>
            Configura qué tipos de notificaciones quieres recibir en la campana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(groupedTypes).map(([category, types]) => (
            <div key={category} className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
                onClick={() => toggleCategory(category)}
              >
                <span className="font-medium">{categoryNames[category as keyof typeof categoryNames] || category}</span>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>

              {expandedCategories.has(category) && (
                <div className="ml-4 space-y-2">
                  {types.map((type) => {
                    const isEnabled = userPreferences.find(p => p.notification_type_id === type.id)?.is_enabled ?? true
                    return (
                      <div key={type.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(enabled) => handleTogglePreference(type.id, enabled)}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Prueba de Notificación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Prueba de Notificación
          </CardTitle>
          <CardDescription>Envía una notificación de prueba a la campana</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testNotification} disabled={isSendingTest} className="w-full">
            {isSendingTest ? (
              <>
                <TestTube className="h-4 w-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Enviar Notificación de Prueba
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
