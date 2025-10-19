import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Intentar obtener mensaje del footer
    const { data: message, error } = await supabase
      .from("footer_messages")
      .select("*")
      .single()

    if (error) {
      // Si no existe la tabla o registro, retornar null
      console.log("Footer message no encontrado")
      return NextResponse.json({ message: null })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.log("Footer message error:", error)
    return NextResponse.json({ message: null })
  }
}

