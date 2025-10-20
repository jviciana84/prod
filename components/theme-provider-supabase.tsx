"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { UserPreferences } from "@/types/user-preferences"

type Theme = "light" | "dark" | "system" | "ocre"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark" | "ocre"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProviderSupabase({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | "ocre">("dark")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Cargar tema desde Supabase al inicializar
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // 1. Primero intentar cargar desde Supabase
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: preferences, error } = await supabase
            .from("user_preferences")
            .select("theme")
            .eq("user_id", user.id)
            .single()

          if (!error && preferences?.theme) {
            console.log("🎨 Tema cargado desde Supabase:", preferences.theme)
            setThemeState(preferences.theme as Theme)
            return
          }
        }

        // 2. Si no hay usuario o no hay preferencias, cargar desde localStorage
        const savedTheme = localStorage.getItem('theme') as Theme
        if (savedTheme) {
          console.log("🎨 Tema cargado desde localStorage:", savedTheme)
          setThemeState(savedTheme)
        }
      } catch (error) {
        console.error("Error cargando tema:", error)
        // Fallback a localStorage
        const savedTheme = localStorage.getItem('theme') as Theme
        if (savedTheme) {
          setThemeState(savedTheme)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [supabase])

  // Resolver tema (system -> light/dark basado en preferencias del sistema)
  useEffect(() => {
    if (theme === "system") {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setResolvedTheme(systemTheme)
    } else {
      setResolvedTheme(theme)
    }
  }, [theme])

  // Aplicar tema al DOM
  useEffect(() => {
    if (isLoading) return

    const html = document.documentElement
    const body = document.body
    
    // Remover todas las clases
    html.classList.remove('light', 'dark', 'ocre')
    body.classList.remove('light', 'dark', 'ocre')
    
    // Agregar clase correcta
    html.classList.add(resolvedTheme)
    body.classList.add(resolvedTheme)
    
    console.log('🎨 Tema aplicado al DOM:', resolvedTheme)
  }, [resolvedTheme, isLoading])

  // Función para cambiar tema
  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme)
      
      // Guardar en localStorage (fallback)
      localStorage.setItem('theme', newTheme)
      
      // Guardar en Supabase si hay usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            theme: newTheme,
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error("Error guardando tema en Supabase:", error)
        } else {
          console.log("🎨 Tema guardado en Supabase:", newTheme)
        }
      }
    } catch (error) {
      console.error("Error cambiando tema:", error)
    }
  }

  if (isLoading) {
    return <div className="dark">{children}</div>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProviderSupabase')
  }
  return context
}
