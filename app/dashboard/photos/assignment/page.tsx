import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { InfoIcon as InfoCircle } from "lucide-react"
import PhotosTabs from "@/components/photos/photos-tabs"
import PhotographerAssignments from "@/components/photos/photographer-assignments"

export const metadata = {
  title: "Asignación de Fotografías",
  description: "Gestión de asignaciones de fotógrafos",
}

export default function AssignmentPage() {
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

      <PhotographerAssignments />
    </div>
  )
}
