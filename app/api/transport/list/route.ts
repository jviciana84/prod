import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getUserRoles } from "@/lib/auth/permissions"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Obtener sesión del usuario
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener sedes para el formulario
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("*")
      .order("name")

    if (locationsError) {
      console.error("Error al cargar sedes:", locationsError)
    }

    // Cambiar la consulta a nuevas_entradas
    const { data: transports, error: transportsError } = await supabase
      .from("nuevas_entradas")
      .select("*")
      .order("purchase_date", { ascending: false })

    if (transportsError) {
      console.error("Error al cargar datos de transporte:", transportsError)
    }

    // Si tenemos transportes, cargar los datos relacionados
    let transportesConRelaciones = []
    if (transports && transports.length > 0) {
      // Crear un mapa de ubicaciones para búsqueda rápida
      const locationMap = locations
        ? locations.reduce((map: any, loc: any) => {
            map[loc.id] = loc
            return map
          }, {})
        : {}

      // Obtener tipos de gastos
      const { data: expenseTypes } = await supabase.from("expense_types").select("*")

      // Crear un mapa de tipos de gastos para búsqueda rápida
      const expenseTypeMap = expenseTypes
        ? expenseTypes.reduce((map: any, type: any) => {
            map[type.id] = type
            return map
          }, {})
        : {}

      // Combinar los datos manualmente
      transportesConRelaciones = transports.map((transport: any) => ({
        ...transport,
        origin_location: locationMap[transport.origin_location_id] || null,
        expense_type: expenseTypeMap[transport.expense_type_id] || null,
      }))
    }

    // Obtener roles del usuario
    const userRoles = await getUserRoles()

    return NextResponse.json({
      data: {
        transports: transportesConRelaciones || [],
        locations: locations || [],
        userRoles: userRoles || [],
      },
    })
  } catch (error) {
    console.error("Unexpected error in transport list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

