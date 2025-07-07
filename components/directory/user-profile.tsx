"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Phone, Calendar, Clock, Activity, Building, User } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"

interface UserProfileProps {
  user: any // Usamos any temporalmente para evitar problemas con la estructura de datos
}

interface UserActivity {
  id: string
  user_id: string
  action: string
  resource: string
  created_at: string
  details?: string
}

export default function UserProfile({ user }: UserProfileProps) {
  const router = useRouter()
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Simulamos obtener las actividades del usuario
        // En una implementación real, esto sería una llamada a la API
        setIsLoading(false)

        // Datos de ejemplo para mostrar
        const mockActivities: UserActivity[] = [
          {
            id: "1",
            user_id: user.id,
            action: "login",
            resource: "auth",
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
            details: "Inicio de sesión exitoso",
          },
          {
            id: "2",
            user_id: user.id,
            action: "view",
            resource: "transport",
            created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 horas atrás
            details: "Visualizó la lista de transportes",
          },
          {
            id: "3",
            user_id: user.id,
            action: "update",
            resource: "profile",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 días atrás
            details: "Actualizó su perfil",
          },
          {
            id: "4",
            user_id: user.id,
            action: "create",
            resource: "transport",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 días atrás
            details: "Creó un nuevo registro de transporte",
          },
          {
            id: "5",
            user_id: user.id,
            action: "view",
            resource: "settings",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 días atrás
            details: "Accedió a la configuración",
          },
        ]

        setActivities(mockActivities)
      } catch (error) {
        console.error("Error al cargar actividades:", error)
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [user.id])

  // Función para obtener el color del badge según el rol
  const getRoleBadgeColor = (roleName: string) => {
    const roleColors: Record<string, string> = {
      admin: "bg-red-100 text-red-800 hover:bg-red-200",
      supervisor: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      logística: "bg-green-100 text-green-800 hover:bg-green-200",
      "asesor ventas": "bg-purple-100 text-purple-800 hover:bg-purple-200",
      mecánica: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      carrocería: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    }

    return roleColors[roleName?.toLowerCase()] || "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }

  // Función para obtener el icono según el tipo de actividad
  const getActivityIcon = (action: string) => {
    switch (action) {
      case "login":
        return <Activity className="h-4 w-4 text-green-500" />
      case "logout":
        return <Activity className="h-4 w-4 text-red-500" />
      case "view":
        return <Activity className="h-4 w-4 text-blue-500" />
      case "update":
        return <Activity className="h-4 w-4 text-yellow-500" />
      case "create":
        return <Activity className="h-4 w-4 text-purple-500" />
      case "delete":
        return <Activity className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al directorio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta de información del usuario */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4 bmw-m-border">
                <AvatarImage src={user.avatar_url || ""} alt={user.full_name || user.email} />
                <AvatarFallback className="text-2xl">
                  {user.full_name
                    ? user.full_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)
                    : user.email.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-center">{user.full_name || "Sin nombre"}</CardTitle>
              <CardDescription className="text-center mt-1">{user.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Información personal
                </h3>
                <div className="space-y-2">
                  {user.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.position && (
                    <div className="flex items-center text-sm">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{user.position}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Miembro desde {format(new Date(user.created_at), "dd/MM/yyyy", { locale: es })}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Roles y permisos</h3>
                <div className="flex flex-wrap gap-1">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role: any) => (
                      <Badge key={role.id} variant="outline" className={getRoleBadgeColor(role.name)}>
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin roles asignados</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de actividad reciente */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Actividad reciente
            </CardTitle>
            <CardDescription>Historial de actividades del usuario en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start">
                      <div className="bg-muted rounded-full p-2 mr-3">{getActivityIcon(activity.action)}</div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {activity.details || `${activity.action} en ${activity.resource}`}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <time dateTime={activity.created_at}>
                            {format(new Date(activity.created_at), "dd/MM/yyyy HH:mm", {
                              locale: es,
                            })}
                          </time>
                          <span className="mx-2">•</span>
                          <span>
                            {formatDistanceToNow(new Date(activity.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay actividad reciente para mostrar</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline" size="sm" disabled>
              Ver más actividades
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
