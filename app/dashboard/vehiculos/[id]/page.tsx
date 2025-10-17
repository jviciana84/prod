import { createServerComponentClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import VehicleManagement from "@/components/vehicles/vehicle-management"

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerComponentClient()

  // Verificar si el usuario está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return notFound()
  }

  // Obtener datos del vehículo
  const { data: vehicle } = await supabase
    .from("sales_vehicles")
    .select(`
      *,
      expense_type:expense_type_id(name)
    `)
    .eq("id", params.id)
    .single()

  if (!vehicle) {
    return notFound()
  }

  // Obtener datos de llaves
  const { data: keys } = await supabase
    .from("vehicle_keys")
    .select(`
      *,
      first_key_holder:first_key_holder(id, email, user_metadata),
      second_key_holder:second_key_holder(id, email, user_metadata),
      card_key_holder:card_key_holder(id, email, user_metadata)
    `)
    .eq("vehicle_id", params.id)
    .single()

  // Obtener datos de documentos
  const { data: documents } = await supabase
    .from("vehicle_documents")
    .select(`
      *,
      technical_sheet_holder:technical_sheet_holder(id, email, user_metadata)
    `)
    .eq("vehicle_id", params.id)
    .single()

  // Obtener historial de movimientos de llaves
  const { data: keyMovements } = await supabase
    .from("key_movements")
    .select(`
      *,
      from_user:from_user_id(id, email, user_metadata),
      to_user:to_user_id(id, email, user_metadata)
    `)
    .eq("vehicle_id", params.id)
    .order("created_at", { ascending: false })

  // Obtener historial de movimientos de documentos
  const { data: documentMovements } = await supabase
    .from("document_movements")
    .select(`
      *,
      from_user:from_user_id(id, email, user_metadata),
      to_user:to_user_id(id, email, user_metadata)
    `)
    .eq("vehicle_id", params.id)
    .order("created_at", { ascending: false })

  // Obtener lista de usuarios para los selectores
  const { data: users } = await supabase.from("profiles").select("id, full_name, alias, role").order("full_name")

  return (
    <div className="container mx-auto py-6">
      <VehicleManagement
        vehicle={vehicle}
        keys={keys || null}
        documents={documents || null}
        keyMovements={keyMovements || []}
        documentMovements={documentMovements || []}
        users={users || []}
        currentUser={session.user}
      />
    </div>
  )
}
