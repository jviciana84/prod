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
      failed_reason,
      failed_date 
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
      title: "⚠️ Venta Caída",
      body: `La venta del vehículo ${license_plate} (${model}) del asesor ${advisor} ha sido marcada como caída`,
      data: {
        category: "failed_sale",
        url: "/dashboard/validados",
        license_plate,
        model,
        advisor,
        failed_reason: failed_reason || "Sin razón especificada",
        failed_date: failed_date || new Date().toISOString()
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
      message: "Notificaciones de venta caída enviadas",
      sent: notifications.length,
      recipients: adminUsers.map(u => u.full_name || u.alias),
      vehicle: license_plate,
      advisor: advisor,
      reason: failed_reason || "Sin razón especificada"
    })

  } catch (error) {
    console.error("Error enviando notificaciones de venta caída:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
