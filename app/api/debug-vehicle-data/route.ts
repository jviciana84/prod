import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const matricula = searchParams.get('matricula')

    if (!matricula) {
      return NextResponse.json({ error: "Matrícula requerida" }, { status: 400 })
    }

    const results = {
      timestamp: new Date().toISOString(),
      matricula: matricula.toUpperCase(),
      user: {
        id: user.id,
        email: user.email
      },
      searchResults: {} as any,
      errors: [] as any[]
    }

    // Buscar en sales_vehicles (única tabla con datos del cliente)
    try {
      const { data, error } = await supabase
        .from('sales_vehicles')
        .select('*')
        .ilike('license_plate', `%${matricula}%`)
        .limit(5)

      if (error) {
        results.errors.push({
          table: 'sales_vehicles',
          error: error.message,
          code: error.code
        })
      } else {
        results.searchResults.sales_vehicles = {
          count: data?.length || 0,
          data: data || []
        }
      }
    } catch (error) {
      results.errors.push({
        table: 'sales_vehicles',
        error: "Error buscando en tabla",
        details: error
      })
    }

    // Buscar específicamente por matrícula exacta en sales_vehicles
    try {
      const { data: exactMatch, error: exactError } = await supabase
        .from('sales_vehicles')
        .select('*')
        .eq('license_plate', matricula.toUpperCase())
        .single()

      if (exactError && exactError.code !== 'PGRST116') {
        results.errors.push({
          operation: "exact_match_sales_vehicles",
          error: exactError.message,
          code: exactError.code
        })
      } else if (exactMatch) {
        results.searchResults.exactMatchSalesVehicles = exactMatch
      }
    } catch (error) {
      results.errors.push({
        operation: "exact_match_sales_vehicles",
        error: "Error en búsqueda exacta en sales_vehicles",
        details: error
      })
    }

    // Mostrar estructura de datos encontrados
    if (results.searchResults.sales_vehicles?.data?.length > 0) {
      const vehicle = results.searchResults.sales_vehicles.data[0]
      results.searchResults.vehicleData = {
        matricula: vehicle.license_plate,
        client_name: vehicle.client_name,
        client_address: vehicle.client_address,
        client_postal_code: vehicle.client_postal_code,
        client_city: vehicle.client_city,
        client_province: vehicle.client_province,
        client_phone: vehicle.client_phone,
        client_email: vehicle.client_email,
        // Mostrar todas las columnas disponibles
        allColumns: Object.keys(vehicle)
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error
    }, { status: 500 })
  }
} 