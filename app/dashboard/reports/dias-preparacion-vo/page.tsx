import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Calendar, User, TrendingUp, BarChart3 } from "lucide-react"
import DiasPreparacionVOReport from "@/components/reports/dias-preparacion-vo-report"

export const metadata: Metadata = {
  title: "Días Preparación VO | Informes",
  description: "Informe de días de preparación de vehículos por asesor comercial",
}

export default function DiasPreparacionVOPage() {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4"
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
              title: "Días Preparación VO",
              href: "/dashboard/reports/dias-preparacion-vo",
            },
          ]}
        />
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Días Preparación VO</h1>
            <p className="text-muted-foreground">Análisis de tiempos de preparación por asesor comercial</p>
          </div>
        </div>
      </div>

      <DiasPreparacionVOReport />
    </div>
  )
} 