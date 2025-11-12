import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { InformeVentasMensual } from "@/components/reports/informe-ventas-mensual"
import { BarChart3, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  title: "Informe de Ventas Mensual | Dashboard",
  description: "Análisis detallado de ventas mensuales con estadísticas, precios, financiaciones y distribución geográfica",
}

export default function VentasMensualPage() {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Breadcrumbs
            className="mt-4"
            segments={[
              {
                title: "Dashboard",
                href: "/dashboard",
              },
              {
                title: "Informes",
                href: "/dashboard/reports",
              },
              {
                title: "Ventas Mensual",
                href: "/dashboard/reports/ventas-mensual",
              },
            ]}
          />
          <CompactSearchWithModal className="mt-4 lg:mt-0" />
        </div>
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Informe de Ventas Mensual</h1>
            <p className="text-muted-foreground">
              Análisis completo de ventas con estadísticas, precios, financiaciones y distribución geográfica
            </p>
          </div>
        </div>
      </div>

      <InformeVentasMensual />
    </div>
  )
}

