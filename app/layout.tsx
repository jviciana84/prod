import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth/auth-provider"
import { PushProcessor } from "@/components/push-processor"
import { PWAInstaller } from "@/components/pwa-installer"

// import ThemeHtmlSync from "@/components/theme-html-sync"
// import { RoundFavicon } from "@/components/ui/round-favicon"
// import { ThemeScript } from "@/components/theme-script"
// import { ThemeInitializer } from "@/components/theme-initializer"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

export const metadata: Metadata = {
  title: "CVO Dashboard",
  description: "Sistema de gestión de vehículos CVO - App instalable",
  generator: 'v0.dev',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-round.svg', type: 'image/svg+xml' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon-round.svg'
  },
  other: {
    'theme-color': '#000000',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'CVO Dashboard',
    'mobile-web-app-capable': 'yes',
    'application-name': 'CVO Dashboard',
    'msapplication-TileColor': '#000000'
  },
  openGraph: {
    title: 'CVO Dashboard',
    description: 'Sistema de gestión de vehículos CVO - App instalable',
    type: 'website',
    locale: 'es_ES'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* <ThemeScript /> */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {/* <ThemeInitializer /> */}
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem 
          disableTransitionOnChange
          storageKey="theme"
        >
          {/* <ThemeHtmlSync /> */}
          {/* <RoundFavicon /> */}
          <AuthProvider>
            {children}
            <Toaster />
            <PushProcessor />
            <PWAInstaller />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
