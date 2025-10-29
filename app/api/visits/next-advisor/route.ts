// ============================================
// API ROUTE: Obtener Siguiente Asesor
// ============================================
// Propósito: Calcular qué asesor debe atender la siguiente visita
// Algoritmo: Round-robin equitativo con gestión de vacaciones
// Patrón: API Route (evita cliente zombie)
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

interface NextAdvisorRequest {
  visit_type: 'COCHE_VN' | 'COCHE_VO' | 'MOTO_VN' | 'MOTO_VO'
  client_name?: string
  client_phone?: string
  had_appointment?: boolean
  appointment_with?: string
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

  try {
    const body: NextAdvisorRequest = await request.json()
    const { visit_type, client_name, client_phone, had_appointment, appointment_with } = body

    // Validar tipo de visita
    if (!['COCHE_VN', 'COCHE_VO', 'MOTO_VN', 'MOTO_VO'].includes(visit_type)) {
      return NextResponse.json({ 
        error: "Tipo de visita inválido" 
      }, { status: 400 })
    }

    console.log(`🔍 [NEXT-ADVISOR] Buscando asesor para: ${visit_type}`)

    // 1. Si el cliente tenía cita, intentar asignar a ese asesor
    if (had_appointment && appointment_with) {
      console.log(`📅 Cliente tenía cita con: ${appointment_with}`)
      
      const { data: appointmentAdvisor } = await supabase
        .from('advisors')
        .select('*')
        .eq('full_name', appointment_with)
        .eq('is_active', true)
        .eq('is_on_vacation', false)
        .contains('specialization', [visit_type])
        .single()

      if (appointmentAdvisor) {
        console.log(`✅ Asesor de cita disponible: ${appointmentAdvisor.full_name}`)
        return NextResponse.json({
          advisor: appointmentAdvisor,
          reason: 'had_appointment',
          message: `Cliente tiene cita previa con ${appointmentAdvisor.full_name}`
        })
      }
    }

    // 2. Obtener asesores activos que pueden atender este tipo
    const { data: availableAdvisors, error: advisorsError } = await supabase
      .from('advisors')
      .select('*')
      .eq('is_active', true)
      .eq('is_on_vacation', false)
      .contains('specialization', [visit_type])
      .order('current_turn_priority', { ascending: true })
      .order('total_visits', { ascending: true })

    if (advisorsError) {
      console.error('❌ Error obteniendo asesores:', advisorsError)
      throw advisorsError
    }

    if (!availableAdvisors || availableAdvisors.length === 0) {
      console.log('⚠️ No hay asesores disponibles para este tipo de visita')
      return NextResponse.json({ 
        error: `No hay asesores disponibles para ${visit_type}`,
        available_advisors: 0
      }, { status: 404 })
    }

    console.log(`✅ ${availableAdvisors.length} asesores disponibles`)

    // 3. Verificar límite diario (si está habilitado)
    const { data: config } = await supabase
      .from('visit_queue_config')
      .select('*')
      .single()

    let selectedAdvisor = availableAdvisors[0]

    if (config?.enable_daily_limit && config.max_visits_per_advisor_per_day) {
      // Filtrar asesores que no hayan alcanzado el límite diario
      const advisorsUnderLimit = availableAdvisors.filter(
        adv => adv.visits_today < config.max_visits_per_advisor_per_day
      )

      if (advisorsUnderLimit.length > 0) {
        selectedAdvisor = advisorsUnderLimit[0]
        console.log(`📊 Usando límite diario: ${config.max_visits_per_advisor_per_day} visitas/día`)
      } else {
        console.log('⚠️ Todos los asesores alcanzaron el límite diario')
        return NextResponse.json({ 
          error: `Todos los asesores han alcanzado el límite diario de ${config.max_visits_per_advisor_per_day} visitas`,
          limit_reached: true
        }, { status: 429 })
      }
    }

    console.log(`👤 Asesor seleccionado: ${selectedAdvisor.full_name}`)
    console.log(`📊 Prioridad actual: ${selectedAdvisor.current_turn_priority}`)
    console.log(`📈 Total visitas: ${selectedAdvisor.total_visits}`)
    console.log(`📅 Visitas hoy: ${selectedAdvisor.visits_today}`)

    // 4. Actualizar contadores del asesor (MUTACIÓN - correcto en API Route)
    const { error: updateError } = await supabase
      .from('advisors')
      .update({
        current_turn_priority: selectedAdvisor.current_turn_priority + 1,
        total_visits: selectedAdvisor.total_visits + 1,
        visits_today: selectedAdvisor.visits_today + 1,
        last_visit_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', selectedAdvisor.id)

    if (updateError) {
      console.error('❌ Error actualizando asesor:', updateError)
      throw updateError
    }

    // 5. Registrar la asignación en historial (MUTACIÓN - correcto en API Route)
    const { error: assignmentError } = await supabase
      .from('visit_assignments')
      .insert({
        advisor_id: selectedAdvisor.id,
        advisor_name: selectedAdvisor.full_name,
        visit_type,
        client_name,
        client_phone,
        had_appointment,
        appointment_with,
        assigned_by: session.user.id,
        assigned_by_name: session.user.email || 'Usuario',
        status: 'assigned'
      })

    if (assignmentError) {
      console.error('❌ Error registrando asignación:', assignmentError)
      throw assignmentError
    }

    console.log(`✅ Visita asignada correctamente`)

    // 6. Devolver información del asesor
    return NextResponse.json({
      advisor: {
        id: selectedAdvisor.id,
        full_name: selectedAdvisor.full_name,
        email: selectedAdvisor.email,
        phone: selectedAdvisor.phone,
        office_location: selectedAdvisor.office_location,
        desk_number: selectedAdvisor.desk_number,
        is_occupied: selectedAdvisor.is_occupied,
        visits_today: selectedAdvisor.visits_today + 1 // Valor actualizado
      },
      visit_type,
      reason: 'next_in_queue',
      message: `Visita asignada a ${selectedAdvisor.full_name}`,
      queue_info: {
        total_available: availableAdvisors.length,
        position_in_queue: 1
      }
    })

  } catch (error: any) {
    console.error('❌ Error en next-advisor:', error)
    return NextResponse.json({ 
      error: "Error al obtener siguiente asesor",
      details: error.message 
    }, { status: 500 })
  }
}


