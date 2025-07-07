"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function syncEntregas() {
  console.log("🔄 [syncEntregas] Iniciando sincronización de entregas...")
  const supabase = createClient()

  try {
    // Obtener el usuario actual para RLS si es necesario
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("❌ [syncEntregas] Error de autenticación:", userError?.message)
      return { success: false, message: "Usuario no autenticado." }
    }
    console.log(`✅ [syncEntregas] Usuario autenticado: ${user.id} (${user.email})`)

    // Llama a la función de la base de datos para sincronizar
    // Asumiendo que tienes una función en Supabase llamada `sync_entregas_data`
    // que maneja la lógica de sincronización.
    // Si no existe, deberías crearla en tu base de datos.
    const { data, error: rpcError } = await supabase.rpc("sync_entregas_data")

    if (rpcError) {
      console.error("❌ [syncEntregas] Error al llamar a la función RPC 'sync_entregas_data':", rpcError.message)
      return { success: false, message: `Error de sincronización: ${rpcError.message}` }
    }

    console.log("✅ [syncEntregas] Sincronización completada exitosamente. Datos:", data)

    // Revalidar la ruta para que los datos se actualicen en el frontend
    revalidatePath("/dashboard/entregas")
    revalidatePath("/dashboard/incentivos") // También revalidar incentivos si la sincronización afecta esta tabla

    return { success: true, message: "Entregas sincronizadas correctamente." }
  } catch (error: any) {
    console.error("❌ [syncEntregas] Error inesperado durante la sincronización:", error.message)
    return { success: false, message: `Error inesperado: ${error.message}` }
  }
}
