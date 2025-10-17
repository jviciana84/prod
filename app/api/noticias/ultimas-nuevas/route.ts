import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuración de Supabase faltante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener la noticia más reciente marcada como "nueva"
    const { data, error } = await supabase
      .from("bmw_noticias")
      .select("*")
      .eq("nueva", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No hay noticias nuevas
        return NextResponse.json(null)
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al obtener últimas noticias:", error)
    return NextResponse.json({ error: "Error al obtener noticias" }, { status: 500 })
  }
}

