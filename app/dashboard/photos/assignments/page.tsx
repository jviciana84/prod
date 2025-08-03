import { redirect } from "next/navigation"
import PhotographerAssignments from "@/components/photos/photographer-assignments"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Settings } from "lucide-react"

export default async function PhotographerAssignmentsPage() {
  try {
    return (
      <div className="p-4 md:p-5 space-y-4 pb-20">
        <div className="space-y-2">
          <Breadcrumbs className="mt-4" />
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Configuración de Asignaciones</h1>
              <p className="text-muted-foreground">Gestiona los fotógrafos y sus porcentajes de asignación</p>
            </div>
          </div>
        </div>

        <PhotographerAssignments />
      </div>
    )
  } catch (error) {
    console.error("Error en PhotographerAssignmentsPage:", error)
    redirect("/dashboard")
  }
} 