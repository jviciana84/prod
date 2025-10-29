// ============================================
// API ROUTE: Actualizar Asesor
// ============================================
// Propósito: Actualizar datos de asesores (estado, vacaciones, etc.)
// Patrón: API Route con mutaciones (evita cliente zombie)
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

interface UpdateAdvisorRequest {
  advisor_id: string
  updates: {
    full_name?: string
    email?: string
    phone?: string
    specialization?: string[]
    is_active?: boolean
    is_occupied?: boolean
    is_on_vacation?: boolean
    vacation_start?: string | null
    vacation_end?: string | null
    vacation_notes?: string
    office_location?: string
    desk_number?: string
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

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
      error: "Solo administradores pueden actualizar asesores" 
    }, { status: 403 })
  }

  try {
    const body: UpdateAdvisorRequest = await request.json()
    const { advisor_id, updates } = body

    if (!advisor_id || !updates) {
      return NextResponse.json({ 
        error: "advisor_id y updates son requeridos" 
      }, { status: 400 })
    }

    console.log(`🔄 [UPDATE-ADVISOR] Actualizando asesor ${advisor_id}`)

    // Validar especialization si se proporciona
    if (updates.specialization) {
      const validTypes = ['COCHE_VN', 'COCHE_VO', 'MOTO_VN', 'MOTO_VO']
      const invalidTypes = updates.specialization.filter(t => !validTypes.includes(t))
      
      if (invalidTypes.length > 0) {
        return NextResponse.json({ 
          error: `Tipos de especialización inválidos: ${invalidTypes.join(', ')}`,
          valid_types: validTypes
        }, { status: 400 })
      }
    }

    // Si se está activando desde vacaciones, procesar regreso
    if (updates.is_on_vacation === false) {
      const { data: advisor } = await supabase
        .from('advisors')
        .select('is_on_vacation')
        .eq('id', advisor_id)
        .single()

      if (advisor && advisor.is_on_vacation) {
        console.log('🏖️ Procesando regreso de vacaciones...')
        
        // Llamar a la función SQL para procesar regreso
        const { data: returnResult, error: returnError } = await supabase
          .rpc('process_vacation_return', { advisor_uuid: advisor_id })

        if (returnError) {
          console.error('❌ Error procesando regreso:', returnError)
        } else {
          console.log('✅ Regreso procesado:', returnResult)
        }
      }
    }

    // Actualizar asesor (MUTACIÓN)
    const { data: updatedAdvisor, error: updateError } = await supabase
      .from('advisors')
      .update(updates)
      .eq('id', advisor_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error actualizando asesor:', updateError)
      throw updateError
    }

    console.log(`✅ Asesor actualizado correctamente`)

    return NextResponse.json({
      success: true,
      advisor: updatedAdvisor,
      message: "Asesor actualizado correctamente"
    })

  } catch (error: any) {
    console.error('❌ Error en update-advisor:', error)
    return NextResponse.json({ 
      error: "Error al actualizar asesor",
      details: error.message 
    }, { status: 500 })
  }
}

