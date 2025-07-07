"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const refreshAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener la sesión actual
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError)
        setError(sessionError.message)
        setUser(null)
        return
      }

      if (session?.user) {
        console.log("Usuario encontrado en sesión:", session.user.email)
        setUser(session.user)
        setError(null)
      } else {
        console.log("No hay sesión activa")
        setUser(null)
      }
    } catch (err: any) {
      console.error("Error inesperado al refrescar auth:", err)
      setError(err.message || "Error inesperado")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setError(error.message)
        return { error }
      }

      if (data.user) {
        setUser(data.user)
        console.log("Login exitoso:", data.user.email)
      }

      return { error: null }
    } catch (err: any) {
      const errorMessage = err.message || "Error inesperado al iniciar sesión"
      setError(errorMessage)
      return { error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setError(null)
    } catch (err: any) {
      console.error("Error al cerrar sesión:", err)
      setError(err.message || "Error al cerrar sesión")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Cargar estado inicial
    refreshAuth()

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        setError(null)
        setLoading(false)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setError(null)
        setLoading(false)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user)
        setError(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signOut,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
