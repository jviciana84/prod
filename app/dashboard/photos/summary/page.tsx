import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { InfoIcon as InfoCircle } from "lucide-react"
import PhotosSummary from "@/components/photos/photos-summary"
import { Camera } from "lucide-react"

export const metadata = {
  title: "Resumen de Fotografías",
  description: "Resumen estadístico de fotografías de vehículos",
}

export default function SummaryPage() {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <Camera className="h-8 w-8 text-yellow-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resumen de Fotografías</h1>
            <p className="text-muted-foreground">Estadísticas y resumen de fotografías</p>
          </div>
        </div>
      </div>
      <PhotosSummary />
    </div>
  )
}
