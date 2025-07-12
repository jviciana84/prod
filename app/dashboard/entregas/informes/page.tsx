import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { InformesIncidencias } from "@/components/entregas/informes-incidencias"
import { BarChart3 } from "lucide-react"

export const metadata: Metadata = {
  title: "Informes de Incidencias | Dashboard",
  description: "Estadísticas y análisis de incidencias en entregas de vehículos",
}

export default function InformesIncidenciasPage() {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Informes de Incidencias</h1>
        </div>
      </div>

      <InformesIncidencias />
    </div>
  )
}
