"use client"

import type React from "react"
import { useEffect } from "react"
import { fixCorruptedCookies } from "@/utils/fix-auth"
import { cn } from "@/lib/utils"
import { fontSans } from "@/lib/fonts"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

function CookieCleanup() {
  useEffect(() => {
    // Limpiar cookies corruptas al cargar la aplicación
    try {
      const fixed = fixCorruptedCookies()
      if (fixed) {
        console.log("🔧 Cookies corruptas limpiadas al iniciar la aplicación")
      }
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
