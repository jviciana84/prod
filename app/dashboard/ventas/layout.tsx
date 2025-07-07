import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Ventas | CVO",
  description: "Gestión de ventas de vehículos",
}

export default function VentasLayout({ children }: { children: ReactNode }) {
  return <div className="p-6">{children}</div>
}
