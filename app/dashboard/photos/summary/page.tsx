import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { InfoIcon as InfoCircle } from "lucide-react"
import PhotosTabs from "@/components/photos/photos-tabs"
import PhotosSummary from "@/components/photos/photos-summary"

export const metadata = {
  title: "Resumen de Fotografías",
  description: "Resumen estadístico de fotografías de vehículos",
}

export default function SummaryPage() {
  return (
    <div className="container mx-auto py-6">
      <Breadcrumbs />

      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-2xl font-bold">Fotografías</h1>
        <p className="text-muted-foreground flex items-center gap-2 mb-4">
          <InfoCircle className="h-4 w-4" />
          Gestión y seguimiento de fotografías de vehículos en el inventario
        </p>
      </div>

      <PhotosTabs />

      <PhotosSummary />
    </div>
  )
}
