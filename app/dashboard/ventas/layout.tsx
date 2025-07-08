import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Ventas | CVO",
  description: "Gestión de ventas de vehículos",
}

// CAMBIO: Solo padding horizontal mínimo para pruebas de ancho completo
export default function VentasLayout({ children }: { children: ReactNode }) {
  // Sin padding lateral, ancho completo
  return <div className="px-0">{children}</div>
}
