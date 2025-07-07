"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Mail, Phone, Briefcase, Clock, Activity, User, Shield } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { UserWithRoles } from "@/lib/auth/types"

interface UserActivity {
  id: string
  user_id: string
  action: string
  resource: string
  created_at: string
  details?: string
}

interface UserDetailDialogProps {
  user: UserWithRoles
  activities: UserActivity[]
  isOpen: boolean
  onClose: () => void
}

export function UserDetailDialog({ user, activities, isOpen, onClose }: UserDetailDialogProps) {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2">
                <AvatarImage src={user.avatar_url || ""} alt={user.full_name || user.email} />
                <AvatarFallback className="text-xl">
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
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  padding: "2px",
                  background: "linear-gradient(90deg, #0066B1 0%, #D31A30 50%, #6618C7 100%)",
                  maskImage: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                }}
              ></div>
            </div>
            <div>
              <DialogTitle className="text-2xl">{user.full_name || "Sin nombre"}</DialogTitle>
              <DialogDescription className="flex flex-wrap gap-1 mt-2">
                {user.roles.map((role) => (
                  <Badge key={role.id} variant="outline" className={getRoleBadgeColor(role.name)}>
                    {role.name}
                  </Badge>
                ))}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información de contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>{user.email}</span>
              </div>

              {user.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}

              {user.position && (
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>{user.position}</span>
                </div>
              )}

              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>Miembro desde {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Roles y permisos
            </h3>
            <div className="space-y-2">
              {user.roles.map((role) => (
                <div key={role.id} className="p-3 rounded-lg bg-muted">
                  <h4 className="font-medium">{role.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role.description || `Permisos estándar para ${role.name.toLowerCase()}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Actividad reciente
            </h3>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start p-3 rounded-lg bg-muted">
                    <div className="mt-0.5 mr-3">{getActivityIcon(activity.action)}</div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.details || `${activity.action} en ${activity.resource}`}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                        <span className="text-xs font-medium">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay actividad reciente</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
