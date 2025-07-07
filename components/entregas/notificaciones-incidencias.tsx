"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Bell, BellOff, Check, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import type { NotificacionIncidencia } from "@/types/incidencias"

export function NotificacionesIncidencias() {
  const [notificaciones, setNotificaciones] = useState<NotificacionIncidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserAndNotificaciones = async () => {
      setLoading(true)

      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

        // Obtener notificaciones para este usuario
        const { data, error } = await supabase
          .from("notificaciones_incidencias")
          .select("*")
          .contains("destinatarios", [user.id])
          .order("fecha_creacion", { ascending: false })
          .limit(10)

        if (error) {
          console.error("Error al cargar notificaciones:", error)
          return
        }

        setNotificaciones(data || [])
      }

      setLoading(false)
    }

    fetchUserAndNotificaciones()

    // Suscribirse a nuevas notificaciones
    const channel = supabase
      .channel("notificaciones_cambios")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones_incidencias",
        },
        (payload) => {
          const nuevaNotificacion = payload.new as NotificacionIncidencia
          if (userId && nuevaNotificacion.destinatarios.includes(userId)) {
            setNotificaciones((prev) => [nuevaNotificacion, ...prev])
            toast.info("Nueva notificación de incidencia recibida")
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const marcarComoLeida = async (id: string) => {
    try {
      const { error } = await supabase.from("notificaciones_incidencias").update({ leida: true }).eq("id", id)

      if (error) {
        console.error("Error al marcar notificación como leída:", error)
        return
      }

      setNotificaciones((prev) => prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif)))
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const marcarTodasComoLeidas = async () => {
    if (notificaciones.filter((n) => !n.leida).length === 0) return

    try {
      const ids = notificaciones.filter((n) => !n.leida).map((n) => n.id)
      const { error } = await supabase.from("notificaciones_incidencias").update({ leida: true }).in("id", ids)

      if (error) {
        console.error("Error al marcar notificaciones como leídas:", error)
        return
      }

      setNotificaciones((prev) => prev.map((notif) => ({ ...notif, leida: true })))

      toast.success("Todas las notificaciones marcadas como leídas")
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.round(diffMs / 60000)

      if (diffMins < 60) {
        return `Hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`
      } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60)
        return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`
      } else {
        return format(date, "dd MMM, HH:mm", { locale: es })
      }
    } catch (e) {
      return dateString
    }
  }

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notificaciones
          {noLeidas > 0 && (
            <Badge className="ml-2" variant="destructive">
              {noLeidas}
            </Badge>
          )}
        </CardTitle>
        {noLeidas > 0 && (
          <Button variant="ghost" size="sm" onClick={marcarTodasComoLeidas} className="h-8">
            <Check className="h-4 w-4 mr-1" />
            Marcar todas como leídas
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
            <BellOff className="h-8 w-8 mb-2 opacity-50" />
            No hay notificaciones
          </div>
        ) : (
          <div className="space-y-3">
            {notificaciones.map((notif) => (
              <div key={notif.id} className={`border rounded-md p-3 ${!notif.leida ? "bg-muted/30" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {!notif.leida && <Badge variant="default">Nueva</Badge>}
                    <Badge variant="secondary">{notif.tipo_incidencia}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(notif.fecha_creacion)}</div>
                </div>
                <div className="text-sm">
                  Nueva incidencia de tipo <strong>{notif.tipo_incidencia}</strong> registrada
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => (window.location.href = `/dashboard/entregas/${notif.entrega_id}`)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Ver entrega
                  </Button>
                  {!notif.leida && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => marcarComoLeida(notif.id)}>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Marcar como leída
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
