"use client"

import { useEffect } from "react"

export function ThemeInitializer() {
  useEffect(() => {
    // Ejecutar inmediatamente al montar
    const initializeTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme')
        let theme = 'dark' // Tema por defecto
        
        if (savedTheme) {
          if (savedTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            theme = systemTheme
          } else {
            theme = savedTheme
          }
        }
        
        // Aplicar tema inmediatamente
        const html = document.documentElement
        const body = document.body
        
        // Remover todas las clases
        html.classList.remove('light', 'dark', 'ocre')
        body.classList.remove('light', 'dark', 'ocre')
        
        // Agregar clase correcta
        html.classList.add(theme)
        body.classList.add(theme)
        
        console.log('🎨 ThemeInitializer: Tema aplicado:', theme)
      } catch (error) {
        console.error('Error al inicializar tema:', error)
        // Fallback
        document.documentElement.classList.add('dark')
        document.body.classList.add('dark')
      }
    }
    
    // Ejecutar inmediatamente
    initializeTheme()
    
    // También ejecutar después de un pequeño delay para asegurar
    const timer = setTimeout(initializeTheme, 10)
    
    return () => clearTimeout(timer)
  }, [])

  return null
} 