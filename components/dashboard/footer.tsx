"use client"

import { VersionBadge } from "@/components/version-badge"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { PerformanceMonitor } from "@/components/ui/performance-monitor"
import { APP_VERSION } from "@/lib/version"

interface FooterMessage {
  id: number
  message: string
  expiry_date: string
  created_at: string
}

interface FooterSettings {
  show_marquee: boolean
  animation_speed: number
  text_color: string
  hover_effect: boolean
}

export function DashboardFooter() {
  const [message, setMessage] = useState<string | null>(null)
  const [settings, setSettings] = useState<FooterSettings>({
    show_marquee: true,
    animation_speed: 20,
    text_color: "#666666",
    hover_effect: true,
  })

  useEffect(() => {
    // Obtener mensaje del footer desde la base de datos
    const fetchFooterMessage = async () => {
      const supabase = createClientComponentClient()
      const now = new Date().toISOString()

      try {
        // Primero obtenemos la configuración
        const { data: settingsData, error: settingsError } = await supabase
          .from("settings")
          .select("*")
          .eq("key", "footer_settings")
          .single()

        if (!settingsError && settingsData) {
          setSettings(settingsData.value)
        }

        // Luego obtenemos el mensaje activo más reciente
        const { data, error } = await supabase
          .from("footer_messages")
          .select("*")
          .gt("expiry_date", now)
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) {
          console.error("Error al obtener mensaje del footer:", error)
          return
        }

        if (data && data.length > 0) {
          setMessage(data[0].message)
        }
      } catch (err) {
        console.error("Error al procesar mensaje del footer:", err)
      }
    }

    fetchFooterMessage()
  }, [])

  // Si no hay mensaje de la BD, usar el mensaje por defecto
  const displayMessage =
    message ||
    "CVO está en fase de desarrollo y pruebas. Por favor, para reportar fallos o necesidades, contactar con Jordi Viciana."

  // Estilo dinámico para el texto en movimiento
  const marqueeStyle = {
    color: settings.text_color,
    animationDuration: `${settings.animation_speed}s`,
  }

  // Clase para el contenedor del marquee
  const marqueeContainerClass = settings.show_marquee ? "marquee-container" : "text-center px-4"

  // Clase para el contenido del marquee
  const marqueeContentClass = settings.show_marquee
    ? `marquee-content ${settings.hover_effect ? "hover-effect" : ""}`
    : ""

  return (
    <footer className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-1">
      <div className="container flex max-w-full px-2 md:px-6 lg:px-8 xl:px-10 items-center justify-between gap-2">
        <div className="text-sm md:text-sm text-muted-foreground flex-shrink-0">
          <span className="hidden md:inline">© {new Date().getFullYear()} CVO - Control Vehículos de Ocasión</span>
          <span className="md:hidden">© {new Date().getFullYear()} CVO</span>
        </div>

        {displayMessage && (
          <div className="flex-1 mx-1 md:mx-2 overflow-hidden min-w-0 hidden md:block">
            <div className={marqueeContainerClass}>
              <div className={marqueeContentClass} style={marqueeStyle}>
                {displayMessage}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <span className="text-xs md:text-sm text-muted-foreground hidden xs:inline">controlvo.ovh</span>
          <VersionBadge version={APP_VERSION} />
          <div className="relative">
            <PerformanceMonitor />
          </div>
        </div>
      </div>
    </footer>
  )
}
