import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { vehicleId, source, tableId, status } = await request.json()

    if (!vehicleId || !source || !tableId || !status) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Validar que el status sea válido
    const validStatuses = ['profesional', 'vendido', 'tactico_vn']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Obtener la matrícula del vehículo
    const { data: vehicleData, error: vehicleError } = await supabase
      .from(source)
      .select('license_plate')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicleData) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya existe un registro para este vehículo
    const { data: existingStatus, error: checkError } = await supabase
      .from('vehicle_sale_status')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('source_table', source)
      .single()

    if (existingStatus) {
      // Actualizar el estado existente
      const { error: updateError } = await supabase
        .from('vehicle_sale_status')
        .update({ 
          sale_status: status,
          created_at: new Date().toISOString()
        })
        .eq('vehicle_id', vehicleId)
        .eq('source_table', source)

      if (updateError) {
        console.error('Error actualizando estado de venta:', updateError)
        return NextResponse.json(
          { error: 'Error actualizando estado de venta' },
          { status: 500 }
        )
      }
    } else {
      // Insertar nuevo registro
      const { error: insertError } = await supabase
        .from('vehicle_sale_status')
        .insert({
          vehicle_id: vehicleId,
          source_table: source,
          license_plate: vehicleData.license_plate,
          sale_status: status,
          notes: `Marcado como ${status} desde el modal de vehículos ausentes`
        })

      if (insertError) {
        console.error('Error insertando estado de venta:', insertError)
        return NextResponse.json(
          { error: 'Error guardando estado de venta' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Vehículo marcado como ${status}`,
      vehicleId,
      source,
      tableId,
      status
    })

  } catch (error) {
    console.error('Error marcando vehículo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 