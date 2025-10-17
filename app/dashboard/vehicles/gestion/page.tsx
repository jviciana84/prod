import { createServerComponentClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

export default async function KeyDocumentManagementPage() {
  const supabase = await createServerComponentClient()

  // Verificar si el usuario está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return notFound()
  }

  // Obtener vehículos con llaves y documentos
  const { data: vehicles } = await supabase
    .from("sales_vehicles")
    .select(`
      id,
      license_plate,
      model,
      status,
      vehicle_type
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  // Obtener movimientos pendientes de confirmación para el usuario actual
  const { data: pendingKeyMovements } = await supabase
    .from("key_movements")
    .select(`
      id,
      vehicle_id,
      key_type,
      reason,
      created_at,
      confirmation_deadline,
      from_user:from_user_id(id, email, user_metadata),
      vehicle:vehicle_id(license_plate, model)
    `)
    .eq("to_user_id", session.user.id)
    .eq("confirmed", false)
    .order("created_at", { ascending: false })

  // Obtener movimientos pendientes de documentos para el usuario actual
  const { data: pendingDocMovements } = await supabase
    .from("document_movements")
    .select(`
      id,
      vehicle_id,
      document_type,
      reason,
      created_at,
      confirmation_deadline,
      from_user:from_user_id(id, email, user_metadata),
      vehicle:vehicle_id(license_plate, model)
    `)
    .eq("to_user_id", session.user.id)
    .eq("confirmed", false)
    .order("created_at", { ascending: false })

  // Obtener estadísticas de llaves
  const { data: keyStats } = await supabase.rpc("get_key_stats")

  // Obtener estadísticas de documentos
  const { data: docStats } = await supabase.rpc("get_document_stats")

  // Obtener llaves que el usuario actual tiene asignadas
  const { data: assignedKeys } = await supabase
    .from("vehicle_keys")
    .select(`
      id,
      vehicle_id,
      license_plate,
      first_key_status,
      second_key_status,
      card_key_status,
      vehicle:vehicle_id(model)
    `)
    .or(
      `first_key_holder.eq.${session.user.id},second_key_holder.eq.${session.user.id},card_key_holder.eq.${session.user.id}`,
    )

  // Obtener documentos que el usuario actual tiene asignados
  const { data: assignedDocs } = await supabase
    .from("vehicle_documents")
    .select(`
      id,
      vehicle_id,
      license_plate,
      technical_sheet_status,
      vehicle:vehicle_id(model)
    `)
    .eq("technical_sheet_holder", session.user.id)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Llaves y Documentación</h1>
      <p>Esta página está en construcción.</p>
      {/* <KeyDocumentDashboard
        vehicles={vehicles || []}
        pendingKeyMovements={pendingKeyMovements || []}
        pendingDocMovements={pendingDocMovements || []}
        keyStats={keyStats || null}
        docStats={docStats || null}
        assignedKeys={assignedKeys || []}
        assignedDocs={assignedDocs || []}
        currentUser={session.user}
      /> */}
    </div>
  )
}
