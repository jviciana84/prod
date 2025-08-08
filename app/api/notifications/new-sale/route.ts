import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      license_plate, 
      model, 
      advisor, 
      advisor_id,
      sale_date,
      sale_price,
      discount,
      client_name
    } = body

    if (!license_plate || !advisor) {
      return NextResponse.json(
        { error: "license_plate y advisor son requeridos" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar usuarios con roles Admin, Supervisor y Director
    const { data: adminUsers, error: adminError } = await supabase
      .from("profiles")
      .select("id, full_name, alias, role")
      .or("role.ilike.admin,role.ilike.supervisor,role.ilike.director")

    if (adminError) {
      console.error("Error obteniendo usuarios admin:", adminError)
      return NextResponse.json(
        { error: "Error obteniendo usuarios administradores" },
        { status: 500 }
      )
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.error("No se encontraron usuarios admin/supervisor/director")
      return NextResponse.json(
        { error: "No se encontraron usuarios administradores" },
        { status: 404 }
      )
    }

    // Crear notificaciones para todos los usuarios admin
    const notifications = adminUsers.map(user => ({
      user_id: user.id,
      title: "🚗 Nueva Venta",
      body: `Nueva venta registrada: ${license_plate} (${model}) por ${advisor}`,
      data: {
        category: "new_sale",
        url: "/dashboard/sales",
        license_plate,
        model,
        advisor,
        sale_date: sale_date || new Date().toISOString(),
        sale_price: sale_price || "No especificado",
        discount: discount || "No especificado",
        client_name: client_name || "No especificado"
      },
      created_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from("notification_history")
      .insert(notifications)

    if (insertError) {
      console.error("Error insertando notificaciones:", insertError)
      return NextResponse.json(
        { error: "Error guardando notificaciones" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Notificaciones de nueva venta enviadas",
      sent: notifications.length,
      recipients: adminUsers.map(u => u.full_name || u.alias),
      vehicle: license_plate,
      advisor: advisor,
      model: model
    })

  } catch (error) {
    console.error("Error enviando notificaciones de nueva venta:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
