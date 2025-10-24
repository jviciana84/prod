"use client"

import { VersionBadge } from "@/components/version-badge"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { PerformanceMonitor } from "@/components/ui/performance-monitor"
import { MapaFlowButton } from "@/components/ui/mapa-flow-button"
import { GothicEIcon } from "@/components/ui/gothic-e-icon"

// Definir la versión actual de la aplicación
const APP_VERSION = "1.0.0"

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
  // SOLO MENSAJE HARDCODEADO CON NEGRITA
  const displayMessage = "CVO está en fase de desarrollo y pruebas. Por favor, para reportar fallos o necesidades, contactar con <strong>Jordi Viciana</strong>."

  // Estilo dinámico para el texto en movimiento
  const marqueeStyle = {
    color: "#666666",
    animation: "marquee 20s linear infinite",
  }

  // Clase para el contenedor del marquee
  const marqueeContainerClass = "marquee-container"

  // Clase para el contenido del marquee
  const marqueeContentClass = "marquee-content"

  return (
    <footer className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-1">
      <div className="container flex max-w-full px-2 md:px-6 lg:px-8 xl:px-10 items-center justify-between gap-2">
        <div className="text-sm md:text-sm text-muted-foreground flex-shrink-0">
          <span className="hidden md:inline">© {new Date().getFullYear()} CVO - Control Vehículos de Ocasión</span>
          <span className="md:hidden">© {new Date().getFullYear()} CVO</span>
        </div>

         <div className="flex-1 mx-1 md:mx-2 overflow-hidden min-w-0 hidden md:block">
           <div className={marqueeContainerClass}>
             <div 
               className={marqueeContentClass} 
               style={marqueeStyle}
               dangerouslySetInnerHTML={{ __html: displayMessage }}
             />
           </div>
         </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <span className="text-xs md:text-sm text-muted-foreground hidden xs:inline">controlvo.ovh</span>
          <VersionBadge version={APP_VERSION} />
          <div className="relative">
            <PerformanceMonitor />
          </div>
          <MapaFlowButton />
          <GothicEIcon />
        </div>
      </div>
    </footer>
  )
}
