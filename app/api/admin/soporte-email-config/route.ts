import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener configuración
    const { data, error } = await supabase
      .from("soporte_email_config")
      .select("*")
      .limit(1)
      .single()

    if (error) {
      console.error("Error obteniendo configuración:", error)

      // Si no existe configuración, crear una por defecto
      if (error.code === "PGRST116") {
        console.log("Creando configuración por defecto...")

        const defaultConfig = {
          id: 1,
          enabled: true,
          sender_email: "soporte@controlvo.com",
          sender_name: "Sistema CVO - Soporte",
          cc_emails: [],
          subject_template: "Ticket Nº {ticket_number} | {license_plate}",
          body_template: `Estimado cliente,

Se ha registrado correctamente su ticket de soporte.

Detalles del ticket:
- Número de ticket: {ticket_number}
- Fecha de generación: {created_date}
- Tiempo desde la venta: {time_since_sale}
- Email: {client_email}
- Teléfono: {client_phone}

En la mayor brevedad posible será respondido a sus consultas.

Saludos cordiales,
Equipo de Soporte CVO`
        }

        const { data: newConfig, error: insertError } = await supabase
          .from("soporte_email_config")
          .insert(defaultConfig)
          .select()
          .single()

        if (insertError) {
          console.error("Error creando configuración por defecto:", insertError)
          return NextResponse.json(defaultConfig)
        }

        console.log("Configuración por defecto creada")
        return NextResponse.json(newConfig)
      }

      return NextResponse.json({
        id: 1,
        enabled: true,
        sender_email: "soporte@controlvo.com",
        sender_name: "Sistema CVO - Soporte",
        cc_emails: [],
        subject_template: "Ticket Nº {ticket_number} | {license_plate}",
        body_template: `Estimado cliente,

Se ha registrado correctamente su ticket de soporte.

Detalles del ticket:
- Número de ticket: {ticket_number}
- Fecha de generación: {created_date}
- Tiempo desde la venta: {time_since_sale}
- Email: {client_email}
- Teléfono: {client_phone}

En la mayor brevedad posible será respondido a sus consultas.

Saludos cordiales,
Equipo de Soporte CVO`
      })
    }

    console.log("Configuración obtenida exitosamente")
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error crítico en API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const config = await request.json()

    console.log("Guardando configuración de email de soporte...")

    // Verificar que el usuario esté autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Usuario no autenticado:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("Usuario autenticado para guardar:", {
      userId: user.id,
      email: user.email,
    })

    // Preparar datos para guardar
    const configToSave = {
      id: 1,
      enabled: Boolean(config.enabled),
      sender_email: config.sender_email || "soporte@controlvo.com",
      sender_name: config.sender_name || "Sistema CVO - Soporte",
      cc_emails: Array.isArray(config.cc_emails) ? config.cc_emails : [],
      subject_template: config.subject_template || "Ticket Nº {ticket_number} | {license_plate}",
      body_template: config.body_template || `Estimado cliente,

Se ha registrado correctamente su ticket de soporte.

Detalles del ticket:
- Número de ticket: {ticket_number}
- Fecha de generación: {created_date}
- Tiempo desde la venta: {time_since_sale}
- Email: {client_email}
- Teléfono: {client_phone}

En la mayor brevedad posible será respondido a sus consultas.

Saludos cordiales,
Equipo de Soporte CVO`,
      updated_at: new Date().toISOString(),
    }

    console.log("Datos preparados para guardar:", configToSave)

    // Intentar upsert
    const { data, error } = await supabase
      .from("soporte_email_config")
      .upsert(configToSave)
      .select()
      .single()

    if (error) {
      console.error("Error guardando configuración:", error)
      return NextResponse.json(
        {
          error: "Error guardando configuración",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log("Configuración guardada exitosamente:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error crítico guardando configuración:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
} 