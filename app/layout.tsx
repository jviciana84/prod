import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth/auth-provider"
import ThemeHtmlSync from "@/components/theme-html-sync"
import { RoundFavicon } from "@/components/ui/round-favicon"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CVO Dashboard",
  description: "Sistema de gestión de vehículos",
  generator: 'v0.dev',
  icons: {
    icon: '/favicon-round.svg',
    apple: '/favicon-round.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ThemeHtmlSync />
          <RoundFavicon />
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
