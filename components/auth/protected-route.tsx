"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client"
import { hasPermission, hasRole } from "@/lib/auth/permissions"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  requiredRole?: string
}

export default function ProtectedRoute({ children, requiredPermission, requiredRole }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkAuthorization() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/")
        return
      }

      if (requiredPermission) {
        const hasRequiredPermission = await hasPermission(requiredPermission)
        if (!hasRequiredPermission) {
          router.push("/dashboard")
          return
        }
      }

      if (requiredRole) {
        const hasRequiredRole = await hasRole(requiredRole)
        if (!hasRequiredRole) {
          router.push("/dashboard")
          return
        }
      }

      setIsAuthorized(true)
    }

    checkAuthorization()
  }, [router, requiredPermission, requiredRole, supabase])

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return isAuthorized ? <>{children}</> : null
}
