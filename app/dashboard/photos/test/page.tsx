import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { InfoIcon as InfoCircle } from "lucide-react"
import PhotosTabs from "@/components/photos/photos-tabs"
import TestPanel from "@/components/auto-assignment/test-panel"

export const metadata: Metadata = {
  title: "Pruebas de Asignación",
  description: "Pruebas del sistema de asignación automática",
}

export default function TestPage() {
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

      <TestPanel />
    </div>
  )
}
