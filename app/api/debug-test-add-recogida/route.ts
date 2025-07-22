import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
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

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
    }

    // Datos de prueba
    const datosRecogida = {
      matricula: "TEST123",
      mensajeria: "MRW",
      centro_recogida: "Terrassa",
      materiales: ["Documentación", "Llaves"],
      nombre_cliente: "Cliente Test",
      direccion_cliente: "Dirección Test",
      codigo_postal: "08226",
      ciudad: "Terrassa",
      provincia: "Barcelona",
      telefono: "123456789",
      email: "test@test.com",
      observaciones_envio: "Observaciones de prueba"
    }

    // Crear objeto de recogida (simulando la función del frontend)
    const nuevaRecogida = {
      id: `temp_${Date.now()}_${Math.random()}`,
      matricula: String(datosRecogida.matricula || ""),
      mensajeria: String(datosRecogida.mensajeria || 'MRW'),
      centro_recogida: String(datosRecogida.centro_recogida || 'Terrassa'),
      materiales: Array.isArray(datosRecogida.materiales) ? datosRecogida.materiales : [],
      nombre_cliente: String(datosRecogida.nombre_cliente || ''),
      direccion_cliente: String(datosRecogida.direccion_cliente || ''),
      codigo_postal: String(datosRecogida.codigo_postal || ''),
      ciudad: String(datosRecogida.ciudad || ''),
      provincia: String(datosRecogida.provincia || ''),
      telefono: String(datosRecogida.telefono || ''),
      email: String(datosRecogida.email || ''),
      observaciones_envio: String(datosRecogida.observaciones_envio || ''),
      usuario_solicitante: String(profile?.full_name || user?.email || "Usuario"),
      usuario_solicitante_id: user?.id || null,
      estado: "pendiente"
    }

    return NextResponse.json({
      success: true,
      message: "Función de añadir recogida probada exitosamente",
      datos_entrada: datosRecogida,
      recogida_creada: nuevaRecogida,
      usuario: {
        id: user.id,
        email: user.email
      },
      perfil: profile
    })

  } catch (error) {
    console.error("Error en debug-test-add-recogida:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "No stack trace available"
    }, { status: 500 })
  }
} 