import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateEntregaEmailHTML } from "@/lib/email-templates/entrega-email-templates"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matricula = searchParams.get("matricula")

    if (!matricula) {
      return NextResponse.json({ error: "Matrícula es requerida" }, { status: 400 })
    }

    const supabase = await createClient()

    // Buscar la entrega REAL por matrícula
    const { data: entrega, error } = await supabase
      .from("entregas")
      .select("*")
      .eq("matricula", matricula.toUpperCase())
      .single()

    if (error || !entrega) {
      return NextResponse.json({ error: `No se encontró entrega para la matrícula ${matricula}` }, { status: 404 })
    }

    // Usar la MISMA función que se usa en el envío real
    const emailContent = generateEntregaEmailHTML(entrega, "Usuario de Prueba")

    return new NextResponse(emailContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Error generando previsualización de entrega:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
