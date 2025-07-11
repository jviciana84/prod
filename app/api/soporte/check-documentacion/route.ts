import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { license_plate, tipo } = await request.json()

    if (!license_plate || !tipo) {
      return NextResponse.json(
        { error: "Matrícula y tipo son requeridos" },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Buscar en la tabla recogidas_historial
    const { data: recogida, error } = await supabase
      .from("recogidas_historial")
      .select(`
        fecha_solicitud,
        usuario_solicitante,
        materiales,
        mensajeria,
        estado
      `)
      .eq("matricula", license_plate.toUpperCase())
      .order("fecha_solicitud", { ascending: false })
      .limit(1)
      .single()

    if (error || !recogida) {
      return NextResponse.json(
        { info: "No se encontró información de recogida para este vehículo." }
      )
    }

    // Verificar si el material solicitado está en la lista
    const materiales = recogida.materiales || []
    let materialEncontrado = ""
    
    if (tipo === "Documentacion") {
      materialEncontrado = materiales.find(m => 
        m.toLowerCase().includes("documentación") || 
        m.toLowerCase().includes("ficha") || 
        m.toLowerCase().includes("permiso") ||
        m.toLowerCase().includes("documentacion")
      )
    } else if (tipo === "2ª Llave") {
      materialEncontrado = materiales.find(m => 
        m.toLowerCase().includes("llave") || 
        m.toLowerCase().includes("llaves") ||
        m.toLowerCase().includes("llav")
      )
    }

    if (!materialEncontrado) {
      return NextResponse.json(
        { info: `No se encontró información de ${tipo} para este vehículo.` }
      )
    }

    // Formatear fecha
    const fecha = new Date(recogida.fecha_solicitud).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    // Construir mensaje
    const mensaje = `El día ${fecha} ${recogida.usuario_solicitante} solicitó recogida de ${materialEncontrado} mediante ${recogida.mensajeria}. Póngase en contacto con la empresa de mensajería en el caso que no lo haya recibido.`

    return NextResponse.json({ info: mensaje })

  } catch (error) {
    console.error("Error verificando documentación:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 