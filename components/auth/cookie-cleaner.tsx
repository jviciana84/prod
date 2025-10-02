"use client"

import { useEffect } from "react"

export function CookieCleaner() {
  useEffect(() => {
    // Función para limpiar cookies corruptas
    const clearCorruptedCookies = () => {
      console.log("🧹 [Cookie Cleaner] Limpiando cookies corruptas...")
      
      // Obtener todas las cookies
      const cookies = document.cookie.split(";")
      
      // Limpiar cada cookie
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        
        // Limpiar la cookie
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
      })
      
      console.log("✅ [Cookie Cleaner] Cookies limpiadas")
    }

    // Limpiar cookies al cargar el componente
    clearCorruptedCookies()
  }, [])

  return null // Este componente no renderiza nada
}
