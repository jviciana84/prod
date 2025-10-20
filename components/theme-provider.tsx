"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"

type Theme = "light" | "dark" | "ocre" | "system"

interface ThemeContextType {
  theme: Theme | undefined
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark" | "ocre" | undefined
  systemTheme: "light" | "dark" | undefined
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme | undefined>(undefined)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | "ocre" | undefined>(undefined)
  const [systemTheme, setSystemTheme] = useState<"light" | "dark" | undefined>(undefined)
  const [mounted, setMounted] = useState(false)
  const supabase = createClientComponentClient()

  // Detectar tema del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light")
    }
    
    updateSystemTheme()
    mediaQuery.addEventListener("change", updateSystemTheme)
    
    return () => mediaQuery.removeEventListener("change", updateSystemTheme)
  }, [])

  // Cargar tema desde la base de datos
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // ✅ CONSULTA: usar cliente directo (sin API Route)
          const { data: preferences, error } = await supabase
            .from("user_preferences")
            .select("theme")
            .eq("user_id", user.id)
            .single()

          if (!error && preferences?.theme) {
            setThemeState(preferences.theme as Theme)
            setMounted(true)
            return
          }
        }
        
        // Sin usuario o sin preferencias: usar "dark" por defecto
        setThemeState("dark")
      } catch (error) {
        console.error("Error cargando tema:", error)
        setThemeState("dark")
      } finally {
        setMounted(true)
      }
    }

    loadTheme()
  }, [supabase])

  // Resolver tema (system -> light/dark)
  useEffect(() => {
    if (!theme || !systemTheme) return

    if (theme === "system") {
      setResolvedTheme(systemTheme)
    } else {
      setResolvedTheme(theme as "light" | "dark" | "ocre")
    }
  }, [theme, systemTheme])

  // Aplicar tema al DOM
  useEffect(() => {
    if (!mounted || !resolvedTheme) return

    const root = document.documentElement
    
    // Remover todas las clases de tema
    root.classList.remove("light", "dark", "ocre")
    
    // Añadir clase del tema actual
    root.classList.add(resolvedTheme)
    
    // Actualizar atributo data-theme para compatibilidad
    root.setAttribute("data-theme", resolvedTheme)
  }, [resolvedTheme, mounted])

  // Función para cambiar tema
  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme)

      // ✅ MUTACIÓN: usar API Route obligatoria
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const response = await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: newTheme }),
        })

        if (!response.ok) {
          console.error("Error guardando tema en base de datos")
        }
      }
    } catch (error) {
      console.error("Error cambiando tema:", error)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, systemTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Durante SSR o hidratación inicial, retornar valores por defecto en lugar de lanzar error
  if (context === undefined) {
    // En desarrollo, advertir pero no romper
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('useTheme debe usarse dentro de ThemeProvider')
    }
    // Retornar valores por defecto seguros
    return {
      theme: undefined,
      setTheme: () => {},
      resolvedTheme: undefined,
      systemTheme: undefined,
    }
  }
  return context
}
