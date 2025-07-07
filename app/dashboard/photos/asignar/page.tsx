import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Camera } from "lucide-react"
import AssignExistingVehicles from "@/components/photos/assign-existing-vehicles"

export const metadata: Metadata = {
  title: "Asignar Fotógrafos | Dashboard",
  description: "Asignar fotógrafos a vehículos existentes",
}

export default function AssignPhotographersPage() {
  return (
    <div className="flex flex-col gap-5 p-4 md:p-8">
      <div className="flex flex-col gap-4">
        <Breadcrumbs
          segments={[
            {
              title: "Dashboard",
              href: "/dashboard",
            },
            {
              title: "Fotografías",
              href: "/dashboard/photos",
            },
            {
              title: "Asignar Fotógrafos",
              href: "/dashboard/photos/asignar",
            },
          ]}
        />
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Asignar Fotógrafos a Vehículos</h1>
        </div>
      </div>

      <div className="grid gap-6">
        <AssignExistingVehicles />
      </div>
    </div>
  )
}
