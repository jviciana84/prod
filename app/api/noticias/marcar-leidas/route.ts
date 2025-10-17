import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuración de Supabase faltante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Marcar todas las noticias como leídas (nueva = false)
    const { error } = await supabase.from("bmw_noticias").update({ nueva: false }).eq("nueva", true)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al marcar noticias como leídas:", error)
    return NextResponse.json({ error: "Error al actualizar noticias" }, { status: 500 })
  }
}

