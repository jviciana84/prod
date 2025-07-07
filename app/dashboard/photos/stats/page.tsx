import type { Metadata } from "next"
import AssignmentStats from "@/components/photos/assignment-stats"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export const metadata: Metadata = {
  title: "Estadísticas de Asignación | CVO",
  description: "Estadísticas de asignación de vehículos a fotógrafos",
}

export default function AssignmentStatsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Fotos", href: "/dashboard/photos" },
          { label: "Estadísticas", href: "/dashboard/photos/stats" },
        ]}
      />

      <div className="grid gap-6">
        <AssignmentStats />
      </div>
    </div>
  )
}
