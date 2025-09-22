"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Trash2, Check, Eye, EyeOff, Bell, BellOff } from "lucide-react"
import { toast } from "sonner"

interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  data: any
  created_at: string
  read_at: string | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showRead, setShowRead] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        toast.error("Usuario no autenticado")
        return
      }

      const { data, error } = await supabase
        .from("notification_history")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error cargando notificaciones:", error)
        toast.error("Error cargando notificaciones")
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error cargando notificaciones")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notification_history")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error) {
        console.error("Error marcando como leída:", error)
        toast.error("Error marcando como leída")
        return
      }

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      )

      // Actualizar notificación seleccionada si es la misma
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(prev => 
          prev ? { ...prev, read_at: new Date().toISOString() } : null
        )
      }

      toast.success("Notificación marcada como leída")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error marcando como leída")
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { error } = await supabase
        .from("notification_history")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", session.user.id)
        .is("read_at", null)

      if (error) {
        console.error("Error marcando todas como leídas:", error)
        toast.error("Error marcando como leídas")
        return
      }

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read_at: notif.read_at || new Date().toISOString() }))
      )

      toast.success("Todas las notificaciones marcadas como leídas")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error marcando como leídas")
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notification_history")
        .delete()
        .eq("id", notificationId)

      if (error) {
        console.error("Error eliminando notificación:", error)
        toast.error("Error eliminando notificación")
        return
      }

      // Actualizar estado local
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))

      // Limpiar selección si se eliminó la notificación seleccionada
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(null)
      }

      toast.success("Notificación eliminada")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error eliminando notificación")
    }
  }

  const filteredNotifications = showRead 
    ? notifications 
    : notifications.filter(notif => !notif.read_at)

  const unreadCount = notifications.filter(notif => !notif.read_at).length

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando notificaciones...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
            <p className="text-muted-foreground">
              {notifications.length} notificaciones totales • {unreadCount} sin leer
            </p>
          </div>
        </div>
      </div>

             <div className="flex items-center justify-end gap-2 mb-4">
         <Button
           variant="outline"
           size="sm"
           onClick={() => setShowRead(!showRead)}
         >
           {showRead ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
           {showRead ? "Ocultar leídas" : "Mostrar todas"}
         </Button>
         {unreadCount > 0 && (
           <Button
             variant="outline"
             size="sm"
             onClick={markAllAsRead}
           >
             <Check className="h-4 w-4 mr-2" />
             Marcar todas como leídas
           </Button>
         )}
       </div>

       {filteredNotifications.length === 0 ? (
         <Card className="border-dashed">
           <CardContent className="flex items-center justify-center h-32">
             <div className="text-center">
               <BellOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
               <p className="text-muted-foreground">
                 {showRead ? "No hay notificaciones" : "No hay notificaciones sin leer"}
               </p>
             </div>
           </CardContent>
         </Card>
       ) : (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
           {/* Lista de notificaciones - Panel izquierdo */}
           <div className="lg:col-span-1 border rounded-lg overflow-hidden">
             <div className="bg-muted/30 p-3 border-b">
               <h3 className="text-sm font-medium">Lista de notificaciones</h3>
             </div>
             <div className="overflow-y-auto h-full max-h-[calc(100vh-280px)]">
               {filteredNotifications.map((notification) => (
                 <div
                   key={notification.id}
                   onClick={() => setSelectedNotification(notification)}
                   className={`p-3 border-b border-border/50 cursor-pointer transition-all duration-200 hover:bg-muted/30 ${
                     selectedNotification?.id === notification.id 
                       ? "bg-muted/50 border-l-4 border-l-blue-500" 
                       : ""
                   } ${
                     !notification.read_at 
                       ? "bg-blue-50/30 dark:bg-blue-950/10" 
                       : ""
                   }`}
                 >
                   <div className="flex items-start gap-2">
                     {/* Indicador de estado */}
                     <div className="flex-shrink-0 mt-1">
                       <div className={`h-2 w-2 rounded-full ${
                         !notification.read_at 
                           ? "bg-blue-500 animate-pulse" 
                           : "bg-muted-foreground/30"
                       }`} />
                     </div>
                     
                     {/* Contenido compacto */}
                     <div className="flex-1 min-w-0">
                       <div className="flex items-start justify-between gap-2">
                         <div className="flex-1 min-w-0">
                           <h4 className="font-medium text-sm truncate">
                             {notification.title}
                           </h4>
                           <p className="text-xs text-muted-foreground truncate mt-1">
                             {notification.body}
                           </p>
                         </div>
                         
                         {/* Badge de nuevo */}
                         {!notification.read_at && (
                           <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                             Nuevo
                           </Badge>
                         )}
                       </div>
                       
                       {/* Fecha */}
                       <div className="mt-2">
                         <span className="text-[10px] text-muted-foreground">
                           {new Date(notification.created_at).toLocaleDateString("es-ES", {
                             day: "numeric",
                             month: "short",
                             hour: "2-digit",
                             minute: "2-digit",
                           })}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Detalle de notificación - Panel derecho */}
           <div className="lg:col-span-2">
             {selectedNotification ? (
               <Card className="h-full">
                 <CardHeader className="pb-3">
                   <div className="flex items-start justify-between">
                     <div className="flex-1">
                       <div className="flex items-center gap-2 mb-2">
                         <h2 className="text-xl font-semibold">{selectedNotification.title}</h2>
                         {!selectedNotification.read_at && (
                           <Badge variant="secondary" className="text-xs">
                             Nuevo
                           </Badge>
                         )}
                       </div>
                       <p className="text-sm text-muted-foreground">
                         {new Date(selectedNotification.created_at).toLocaleDateString("es-ES", {
                           day: "numeric",
                           month: "long",
                           year: "numeric",
                           hour: "2-digit",
                           minute: "2-digit",
                         })}
                         {selectedNotification.read_at && (
                           <span className="ml-2 text-muted-foreground">
                             • Leída: {new Date(selectedNotification.read_at).toLocaleDateString("es-ES", {
                               day: "numeric",
                               month: "short",
                               hour: "2-digit",
                               minute: "2-digit",
                             })}
                           </span>
                         )}
                       </p>
                     </div>
                     
                     {/* Botones de acción */}
                     <div className="flex items-center gap-2">
                       {!selectedNotification.read_at && (
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => markAsRead(selectedNotification.id)}
                         >
                           <Check className="h-4 w-4 mr-2" />
                           Marcar como leída
                         </Button>
                       )}
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => deleteNotification(selectedNotification.id)}
                         className="text-red-500 hover:text-red-700 hover:bg-red-100"
                       >
                         <Trash2 className="h-4 w-4 mr-2" />
                         Eliminar
                       </Button>
                     </div>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="prose prose-sm max-w-none">
                     <p className="text-sm leading-relaxed whitespace-pre-wrap">
                       {selectedNotification.body}
                     </p>
                   </div>
                 </CardContent>
               </Card>
             ) : (
               <Card className="h-full border-dashed">
                 <CardContent className="flex items-center justify-center h-full">
                   <div className="text-center">
                     <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                     <h3 className="text-lg font-medium text-muted-foreground mb-2">
                       Selecciona una notificación
                     </h3>
                     <p className="text-sm text-muted-foreground">
                       Haz clic en una notificación de la lista para ver su contenido completo
                     </p>
                   </div>
                 </CardContent>
               </Card>
             )}
           </div>
         </div>
       )}
    </div>
  )
} 