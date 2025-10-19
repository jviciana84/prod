import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Intentar obtener configuración del footer
    const { data: settings, error } = await supabase
      .from("footer_settings")
      .select("*")
      .single()

    if (error) {
      // Si no existe la tabla o registro, retornar configuración por defecto
      console.log("Footer settings no encontrado, usando defaults")
      return NextResponse.json({
        show_message: false,
        message_type: "info",
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.log("Footer settings error, usando defaults:", error)
    return NextResponse.json({
      show_message: false,
      message_type: "info",
    })
  }
}

