// ============================================
// API ROUTE: Eliminar Asesor
// ============================================
// Propósito: Eliminar (desactivar) asesor de ventas
// Patrón: API Route con mutaciones (evita cliente zombie)
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

interface DeleteAdvisorRequest {
  advisor_id: string
  hard_delete?: boolean // true = eliminar, false = desactivar (por defecto)
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createServerClient(cookieStore)

  // Verificar autenticación
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ 
      error: "No autorizado" 
    }, { status: 401 })
  }

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ 
      error: "Solo administradores pueden eliminar asesores" 
    }, { status: 403 })
  }

  try {
    const body: DeleteAdvisorRequest = await request.json()
    const { advisor_id, hard_delete = false } = body

    if (!advisor_id) {
      return NextResponse.json({ 
        error: "advisor_id es requerido" 
      }, { status: 400 })
    }

    console.log(`🗑️ [DELETE-ADVISOR] ${hard_delete ? 'Eliminando' : 'Desactivando'} asesor ${advisor_id}`)

    if (hard_delete) {
      // Eliminación física (solo si no tiene historial)
      const { error: deleteError } = await supabase
        .from('advisors')
        .delete()
        .eq('id', advisor_id)

      if (deleteError) {
        console.error('❌ Error eliminando asesor:', deleteError)
        throw deleteError
      }

      console.log(`✅ Asesor eliminado físicamente`)
      return NextResponse.json({
        success: true,
        message: "Asesor eliminado correctamente"
      })
    } else {
      // Desactivación (recomendado - preserva historial)
      const { data: updatedAdvisor, error: updateError } = await supabase
        .from('advisors')
        .update({ is_active: false })
        .eq('id', advisor_id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error desactivando asesor:', updateError)
        throw updateError
      }

      console.log(`✅ Asesor desactivado correctamente`)
      return NextResponse.json({
        success: true,
        advisor: updatedAdvisor,
        message: "Asesor desactivado correctamente"
      })
    }

  } catch (error: any) {
    console.error('❌ Error en delete-advisor:', error)
    return NextResponse.json({ 
      error: "Error al eliminar asesor",
      details: error.message 
    }, { status: 500 })
  }
}


