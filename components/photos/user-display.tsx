"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"

interface UserDisplayProps {
  userId: string
  fallback?: string
}

export default function UserDisplay({ userId, fallback = "Usuario desconocido" }: UserDisplayProps) {
  const [userName, setUserName] = useState<string>(fallback)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchUserName() {
      if (!userId) {
        setUserName(fallback)
        setIsLoading(false)
        return
      }

      try {
        // Primero intentar obtener de fotos_asignadas (si existe display_name)
        const { data: photographerData, error: photographerError } = await supabase
          .from("fotos_asignadas")
          .select("display_name")
          .eq("user_id", userId)
          .single()

        if (!photographerError && photographerData && photographerData.display_name) {
          setUserName(photographerData.display_name)
          setIsLoading(false)
          return
        }

        // Si no hay display_name, intentar obtener de profiles
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", userId)
          .single()

        if (!profileError && profileData) {
          setUserName(profileData.full_name || profileData.email || `Usuario ${userId.substring(0, 8)}...`)
          setIsLoading(false)
          return
        }

        // Si todo falla, usar el ID truncado
        setUserName(`Usuario ${userId.substring(0, 8)}...`)
      } catch (error) {
        console.error("Error al obtener nombre de usuario:", error)
        setUserName(`Usuario ${userId.substring(0, 8)}...`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserName()
  }, [userId, fallback, supabase])

  if (isLoading) {
    return <span className="text-muted-foreground">Cargando...</span>
  }

  return <span>{userName}</span>
}
