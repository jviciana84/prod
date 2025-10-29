// ============================================
// API ROUTE: Crear Asesor
// ============================================
// Propósito: Crear nuevo asesor de ventas
// Patrón: API Route con mutaciones (evita cliente zombie)
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

interface CreateAdvisorRequest {
  profile_id?: string
  full_name: string
  email?: string
  phone?: string
  specialization: string[]
  office_location?: string
  desk_number?: string
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
      error: "Solo administradores pueden crear asesores" 
    }, { status: 403 })
  }

  try {
    const body: CreateAdvisorRequest = await request.json()
    const { profile_id, full_name, email, phone, specialization, office_location, desk_number } = body

    // Validaciones
    if (!full_name || !specialization || specialization.length === 0) {
      return NextResponse.json({ 
        error: "full_name y specialization son requeridos" 
      }, { status: 400 })
    }

    // Validar especialization
    const validTypes = ['COCHE_VN', 'COCHE_VO', 'MOTO_VN', 'MOTO_VO']
    const invalidTypes = specialization.filter((t: string) => !validTypes.includes(t))
    
    if (invalidTypes.length > 0) {
      return NextResponse.json({ 
        error: `Tipos de especialización inválidos: ${invalidTypes.join(', ')}`,
        valid_types: validTypes
      }, { status: 400 })
    }

    console.log(`➕ [CREATE-ADVISOR] Creando asesor: ${full_name}`)

    // Crear asesor (MUTACIÓN)
    const { data: newAdvisor, error: createError } = await supabase
      .from('advisors')
      .insert({
        profile_id,
        full_name,
        email,
        phone,
        specialization,
        office_location,
        desk_number,
        is_active: true,
        current_turn_priority: 0,
        total_visits: 0,
        visits_today: 0,
        created_by: session.user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creando asesor:', createError)
      throw createError
    }

    console.log(`✅ Asesor creado correctamente: ${newAdvisor.id}`)

    return NextResponse.json({
      success: true,
      advisor: newAdvisor,
      message: "Asesor creado correctamente"
    })

  } catch (error: any) {
    console.error('❌ Error en create-advisor:', error)
    return NextResponse.json({ 
      error: "Error al crear asesor",
      details: error.message 
    }, { status: 500 })
  }
}


