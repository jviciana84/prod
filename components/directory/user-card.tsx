"use client"

import type { UserWithRoles } from "@/lib/auth/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserCardProps {
  user: UserWithRoles
}

export function UserCard({ user }: UserCardProps) {

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

    </Card>
  )
}