import type { Metadata } from "next"
import PhotosTable from "@/components/photos/photos-table"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { InfoIcon as InfoCircle } from "lucide-react"
import PhotosTabs from "@/components/photos/photos-tabs"
import { Camera } from "lucide-react"

export const metadata: Metadata = {
  title: "Fotografías",
  description: "Gestión de fotografías de vehículos",
}

export default function PhotosPage() {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <Camera className="h-8 w-8 text-yellow-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fotos</h1>
            <p className="text-muted-foreground">Gestión y subida de fotografías</p>
          </div>
        </div>
      </div>

      <PhotosTabs />

      <PhotosTable />
    </div>
  )
}
