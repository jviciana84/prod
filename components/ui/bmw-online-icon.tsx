import * as React from "react"

interface BmwOnlineIconProps {
  className?: string
  strokeWidth?: number
}

export function BmwOnlineIcon({ className, strokeWidth = 2 }: BmwOnlineIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Diseño basado en el ícono BMW Online - Representando conectividad/noticias */}
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

// Ícono alternativo usando el ícono Newspaper de lucide
export { Newspaper as BmwNewsIcon } from "lucide-react"

