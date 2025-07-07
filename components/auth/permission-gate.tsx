"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import type { UserRole } from "@/lib/permissions"

interface PermissionGateProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  isVehicleOwner?: boolean
  fallback?: ReactNode
}

/**
 * Componente que muestra su contenido solo si el usuario tiene los permisos necesarios
 */
export function PermissionGate({
  children,
  allowedRoles = [],
  isVehicleOwner = false,
  fallback = null,
}: PermissionGateProps) {
  const [hasPermission, setHasPermission] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkPermission() {
      try {
        setIsLoading(true)

        // Verificar si el usuario está autenticado
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setHasPermission(false)
          return
        }

        // Obtener el rol del usuario
        const { data: userData, error } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

        if (error || !userData) {
          console.error("Error al verificar permisos:", error)
          setHasPermission(false)
          return
        }

        const userRole = userData.role as UserRole

        // Si es admin o supervisor, siempre tiene permiso
        if (userRole === "admin" || userRole === "supervisor") {
          setHasPermission(true)
          return
        }

        // Si hay roles permitidos específicos, verificar si el usuario tiene alguno de ellos
        if (allowedRoles.length > 0 && allowedRoles.includes(userRole)) {
          setHasPermission(true)
          return
        }

        // Si es el propietario del vehículo (vendedor) y se requiere ser propietario
        if (isVehicleOwner && userRole === "vendedor") {
          setHasPermission(true)
          return
        }

        // Por defecto, no tiene permiso
        setHasPermission(false)
      } catch (error) {
        console.error("Error al verificar permisos:", error)
        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [allowedRoles, isVehicleOwner, supabase])

  if (isLoading) {
    return <div className="animate-pulse">Verificando permisos...</div>
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}
