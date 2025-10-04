"use client"

import { useState, useEffect } from "react"
import type { UserWithRoles } from "@/lib/auth/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar, Mail, Phone, Clock, Activity, CreditCard, Banknote, CheckCircle, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { userActivityService, type UserActivity } from "@/lib/user-activity-service"

interface UserCardProps {
  user: UserWithRoles
}

export function UserCard({ user }: UserCardProps) {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true)
        console.log(`🔍 Cargando actividades reales para: ${user.full_name || user.email}`)
        
        // Obtener actividades reales del usuario
        const realActivities = await userActivityService.getUserActivities(
          user.id, 
          user.email, 
          user.full_name || user.email
        )
        
        setActivities(realActivities)
        console.log(`✅ Actividades cargadas para ${user.full_name}:`, realActivities.length)
      } catch (error) {
        console.error("Error al cargar actividades:", error)
        setActivities([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [user.id, user.email, user.full_name])

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

    return roleColors[roleName.toLowerCase()] || "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }

  // Función para obtener el icono según el tipo de actividad
  const getActivityIcon = (action: string, paymentMethod?: string) => {
    switch (action) {
      case "sale":
        return paymentMethod === "Financiado" 
          ? <CreditCard className="h-4 w-4 text-blue-500" />
          : <Banknote className="h-4 w-4 text-green-500" />
      case "create":
        return <Plus className="h-4 w-4 text-purple-500" />
      case "process":
        return <Activity className="h-4 w-4 text-orange-500" />
      case "login":
        return <Activity className="h-4 w-4 text-green-500" />
      case "logout":
        return <Activity className="h-4 w-4 text-red-500" />
      case "view":
        return <Activity className="h-4 w-4 text-blue-500" />
      case "update":
        return <Activity className="h-4 w-4 text-yellow-500" />
      case "delete":
        return <Activity className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card
      className={cn("overflow-hidden transition-all hover:shadow-md bmw-m-hover-border")}
    >
      <CardHeader className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-background">
              <AvatarImage src={user.avatar_url || ""} alt={user.full_name || user.email} />
              <AvatarFallback className="text-lg">
                {user.full_name
                  ? user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2)
                  : user.email.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg leading-none mb-1">{user.full_name || "Sin nombre"}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {user.roles.map((role) => (
                  <Badge key={role.id} variant="outline" className={getRoleBadgeColor(role.name)}>
                    {role.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Mail className="h-4 w-4 mr-2" />
            <span className="truncate">{user.email}</span>
          </div>

          {user.phone && (
            <div className="flex items-center text-muted-foreground">
              <Phone className="h-4 w-4 mr-2" />
              <span>{user.phone}</span>
            </div>
          )}

          {user.position && (
            <div className="flex items-center text-muted-foreground">
              <Badge variant="outline" className="mr-2">
                {user.position}
              </Badge>
            </div>
          )}

          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Miembro desde {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col items-start">
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          Actividad reciente
        </h4>

        {isLoading ? (
          <div className="w-full space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse"></div>
          </div>
        ) : activities.length > 0 ? (
          <div className="w-full space-y-1">
            {activities.slice(0, 3).map((activity) => (
              <TooltipProvider key={activity.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-muted-foreground py-1">
                      {getActivityIcon(activity.action, activity.payment_method)}
                      <span className="ml-2 truncate flex-1">
                        {activity.details || `${activity.action} en ${activity.resource}`}
                      </span>
                      {activity.price && (
                        <span className="text-xs font-mono text-green-600 dark:text-green-400 mr-2">
                          {activity.price.toLocaleString()}€
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{activity.details || `${activity.action} en ${activity.resource}`}</p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</p>
                    {activity.badge && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">Tipo: {activity.badge}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No hay actividad reciente</p>
        )}
      </CardFooter>
    </Card>
  )
}