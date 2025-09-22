"use client"

import type React from "react"
import { useEffect } from "react"
// fixCorruptedCookies eliminado - función inefectiva
import { cn } from "@/lib/utils"
import { fontSans } from "@/lib/fonts"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

function CookieCleanup() {
  useEffect(() => {
    // Limpiar cookies corruptas al cargar la aplicación
    try {
      // Función eliminada - era inefectiva
      console.log("🔧 Cookie cleanup deshabilitado")
    } catch (error) {
      console.error("Error al limpiar cookies:", error)
    }
  }, [])

  return null
}

interface RootLayoutClientProps {
  children: React.ReactNode
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
      <CookieCleanup />
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        {children}
        <Toaster />
      </ThemeProvider>
    </body>
  )
}
