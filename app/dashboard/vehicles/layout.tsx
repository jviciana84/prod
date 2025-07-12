import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vehículos | CVO",
  description: "Gestión de vehículos en inventario",
}

export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  )
}
