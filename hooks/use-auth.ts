"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  profile: { id: string; full_name: string | null; role: string | null; avatar_url: string | null } | null // Añadir el perfil con id
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    profile: null, // Inicializar perfil como null
  })

  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.warn("Error al obtener sesión:", error.message)
          
          // Solo loggear el error, no limpiar cookies automáticamente
          // Las cookies base64 ahora se manejan con safeGetCookie en middleware
          if (error.message.includes("JSON") || 
              error.message.includes("parse") || 
              error.message.includes("base64") ||
              error.message.includes("Unexpected token")) {
            console.warn("⚠️ Error de parsing detectado, pero usando safeGetCookie para manejar cookies base64")
          }
          
          if (mounted) {
            setAuthState({ user: null, loading: false, error: error.message, profile: null })
          }
          return
        }

        let userProfile = null
        if (session?.user) {
          // Obtener el perfil del usuario de la tabla 'profiles'
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, role, avatar_url") // Seleccionar también el id y avatar
            .eq("id", session.user.id)
            .single()

          if (profileError) {
            console.error("Error al obtener el perfil del usuario:", profileError)
          } else {
            userProfile = profileData
          }
        }

        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            loading: false,
            error: null,
            profile: userProfile, // Asignar el perfil obtenido
          })
        }
      } catch (err) {
        console.error("Error inesperado al obtener sesión:", err)
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            error: "Error de autenticación",
            profile: null,
          })
        }
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        let userProfile = null
        if (session?.user) {
          // Obtener el perfil del usuario de la tabla 'profiles' en cada cambio de estado
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, role, avatar_url")
            .eq("id", session.user.id)
            .single()

          if (profileError) {
            console.error("Error al obtener el perfil del usuario en cambio de estado:", profileError)
          } else {
            userProfile = profileData
          }
        }

        setAuthState({
          user: session?.user ?? null,
          loading: false,
          error: null,
          profile: userProfile, // Asignar el perfil obtenido
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return authState
}
