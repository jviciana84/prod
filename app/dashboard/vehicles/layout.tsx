import type React from "react"
import type { Metadata } from "next"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Car, BarChart3, AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Vehículos | CVO",
  description: "Gestión de vehículos en inventario",
}

export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="container mx-auto py-4">
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory" asChild>
              <Link href="/dashboard/vehicles" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span>Inventario</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="stats" asChild>
              <Link href="/dashboard/vehicles/stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Estadísticas</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="premature-sales" asChild>
              <Link href="/dashboard/vehicles/ventas-prematuras" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Ventas Prematuras</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  )
}
