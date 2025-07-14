"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function useThemeSync() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentTheme, setCurrentTheme] = useState("dark")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const active = resolvedTheme || theme || "dark"
    setCurrentTheme(active)

    // Sincronizar el DOM inmediatamente
    if (typeof document !== "undefined") {
      const html = document.documentElement
      const body = document.body
      
      // Remover todas las clases de tema
      html.classList.remove("light", "dark", "ocre")
      body.classList.remove("light", "dark", "ocre")
      
      // Agregar la clase del tema activo
      html.classList.add(active)
      body.classList.add(active)
      
      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === "development") {
        console.log("🎨 useThemeSync:", { theme, resolvedTheme, active, mounted })
      }
    }
  }, [theme, resolvedTheme, mounted])

  return {
    currentTheme,
    mounted,
    theme,
    resolvedTheme
  }
} 