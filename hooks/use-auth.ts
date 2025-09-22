"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { createClientComponentClient } from "@/lib/supabase/client"

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

  const supabase = createClientComponentClient()

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
          
          // Si hay error de cookies corruptas, limpiar y reintentar
          if (error.message.includes("JSON") || 
              error.message.includes("parse") || 
              error.message.includes("base64") ||
              error.message.includes("Unexpected token")) {
            console.log("🚨 Cookies corruptas detectadas en useAuth, limpiando...")
            
            // Limpiar cookies corruptas
            document.cookie.split(";").forEach((cookie) => {
              const [name] = cookie.trim().split("=")
              if (name && name.startsWith("sb-")) {
                document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
                document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`
                document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`
              }
            })
            
            // Forzar recarga después de limpiar cookies
            window.location.reload()
            return
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
