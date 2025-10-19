import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Cargar sesiones
    const { data: sessions, error: sessionsError } = await supabase
      .from("ai_sessions")
      .select("*")
      .order("last_message_at", { ascending: false })

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError)
      return NextResponse.json({ error: sessionsError.message }, { status: 500 })
    }

    // Cargar usuarios únicos
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        sessions: sessions || [],
        users: profiles || [],
      },
    })
  } catch (error) {
    console.error("Unexpected error in sessions API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

