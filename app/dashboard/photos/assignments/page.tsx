import { supabaseAdmin } from "@/lib/supabaseClient"
import PhotographerAssignments from "@/components/photos/photographer-assignments"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export default async function PhotographerAssignmentsPage() {
  // Obtener asignaciones de fotógrafos con información de vehículos y fotógrafos
  const { data: assignments, error } = await supabaseAdmin
    .from("vehicle_photographer_assignments")
    .select(`
      id,
      vehicle_id,
      photographer_id,
      assigned_at,
      status,
      vehicle:vehicle_id(id, license_plate, model),
      photographer:photographer_id(id, email)
    `)
    .order("assigned_at", { ascending: false })

  // Obtener fotógrafos activos con sus porcentajes
  const { data: photographers, error: photographersError } = await supabaseAdmin
    .from("photo_assignments")
    .select(`
      id,
      user_id,
      percentage,
      is_active,
      user:user_id(id, email)
    `)
    .eq("is_active", true)
    .order("percentage", { ascending: false })

  // Obtener estadísticas de asignaciones por fotógrafo
  const { data: stats, error: statsError } = await supabaseAdmin
    .from("vehicle_photographer_assignments")
    .select(`
      photographer_id,
      count(*),
      photographer:photographer_id(email)
    `)
    .eq("status", "pending")
    .group("photographer_id, photographer(email)")

  return (
    <div className="container mx-auto py-6">
      <Breadcrumbs className="mt-4" />
      <h1 className="text-2xl font-bold mb-6">Asignaciones de Fotógrafos</h1>

      <PhotographerAssignments
        assignments={assignments || []}
        photographers={photographers || []}
        stats={stats || []}
      />
    </div>
  )
}
