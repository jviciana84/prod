// ============================================
// API ROUTE: Redirigir Visita a Otro Asesor
// ============================================
// Propósito: Cuando el asesor asignado está ocupado, redirigir a otro
// Patrón: API Route con mutaciones (evita cliente zombie)
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

interface RedirectRequest {
  visit_assignment_id: string
  original_advisor_id: string
  redirect_reason: string
  visit_type: 'COCHE_VN' | 'COCHE_VO' | 'MOTO_VN' | 'MOTO_VO'
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

  try {
    const body: RedirectRequest = await request.json()
    const { visit_assignment_id, original_advisor_id, redirect_reason, visit_type } = body

    console.log(`🔄 [REDIRECT] Redirigiendo visita ${visit_assignment_id}`)

    // 1. Marcar asesor original como ocupado (MUTACIÓN)
    const { error: markOccupiedError } = await supabase
      .from('advisors')
      .update({ is_occupied: true })
      .eq('id', original_advisor_id)

    if (markOccupiedError) {
      console.error('❌ Error marcando asesor como ocupado:', markOccupiedError)
    }

    // 2. Buscar siguiente asesor disponible (excluyendo el ocupado)
    const { data: availableAdvisors, error: advisorsError } = await supabase
      .from('advisors')
      .select('*')
      .eq('is_active', true)
      .eq('is_on_vacation', false)
      .eq('is_occupied', false)
      .neq('id', original_advisor_id) // Excluir el asesor ocupado
      .contains('specialization', [visit_type])
      .order('current_turn_priority', { ascending: true })
      .order('total_visits', { ascending: true })

    if (advisorsError) {
      console.error('❌ Error obteniendo asesores:', advisorsError)
      throw advisorsError
    }

    if (!availableAdvisors || availableAdvisors.length === 0) {
      console.log('⚠️ No hay otros asesores disponibles')
      return NextResponse.json({ 
        error: "No hay otros asesores disponibles en este momento",
        suggestion: "Marcar al asesor original como disponible o esperar"
      }, { status: 404 })
    }

    const newAdvisor = availableAdvisors[0]
    console.log(`✅ Redirigiendo a: ${newAdvisor.full_name}`)

    // 3. Actualizar la asignación original (MUTACIÓN)
    const { error: updateAssignmentError } = await supabase
      .from('visit_assignments')
      .update({
        was_occupied: true,
        redirected_to: newAdvisor.id,
        redirected_to_name: newAdvisor.full_name,
        redirect_reason,
        status: 'assigned'
      })
      .eq('id', visit_assignment_id)

    if (updateAssignmentError) {
      console.error('❌ Error actualizando asignación:', updateAssignmentError)
      throw updateAssignmentError
    }

    // 4. Actualizar contadores del nuevo asesor (MUTACIÓN)
    const { error: updateAdvisorError } = await supabase
      .from('advisors')
      .update({
        current_turn_priority: newAdvisor.current_turn_priority + 1,
        total_visits: newAdvisor.total_visits + 1,
        visits_today: newAdvisor.visits_today + 1,
        last_visit_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', newAdvisor.id)

    if (updateAdvisorError) {
      console.error('❌ Error actualizando nuevo asesor:', updateAdvisorError)
      throw updateAdvisorError
    }

    // 5. IMPORTANTE: Devolver visita al asesor original (compensación)
    // Su prioridad NO aumenta porque estaba ocupado
    const { error: compensateError } = await supabase
      .from('advisors')
      .update({
        current_turn_priority: availableAdvisors[0].current_turn_priority // Darle la misma prioridad que el nuevo
      })
      .eq('id', original_advisor_id)

    if (compensateError) {
      console.error('❌ Error compensando asesor original:', compensateError)
    }

    console.log(`✅ Visita redirigida correctamente`)

    return NextResponse.json({
      success: true,
      original_advisor: original_advisor_id,
      new_advisor: {
        id: newAdvisor.id,
        full_name: newAdvisor.full_name,
        email: newAdvisor.email,
        phone: newAdvisor.phone,
        office_location: newAdvisor.office_location,
        desk_number: newAdvisor.desk_number
      },
      message: `Visita redirigida a ${newAdvisor.full_name}`,
      reason: redirect_reason
    })

  } catch (error: any) {
    console.error('❌ Error en redirect:', error)
    return NextResponse.json({ 
      error: "Error al redirigir visita",
      details: error.message 
    }, { status: 500 })
  }
}


