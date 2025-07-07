import type { Metadata } from "next"
import PhotosTable from "@/components/photos/photos-table"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { InfoIcon as InfoCircle } from "lucide-react"
import PhotosTabs from "@/components/photos/photos-tabs"

export const metadata: Metadata = {
  title: "Fotografías",
  description: "Gestión de fotografías de vehículos",
}

export default function PhotosPage() {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <Breadcrumbs />

      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-2xl font-bold">Fotografías</h1>
        <p className="text-muted-foreground flex items-center gap-2 mb-4">
          <InfoCircle className="h-4 w-4" />
          Gestión y seguimiento de fotografías de vehículos en el inventario
        </p>
      </div>

      <PhotosTabs />

      <PhotosTable />
    </div>
  )
}
