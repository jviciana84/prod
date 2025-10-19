import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient(await cookies())
    const body = await request.json()
    
    const {
      page = 1,
      itemsPerPage = 20,
      sessionId,
      userId,
      searchTerm,
      showHidden = false,
    } = body

    // Construir query de conversaciones
    let query = supabase
      .from("ai_conversations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

    // Aplicar filtros
    if (sessionId && sessionId !== "all") {
      query = query.eq("session_id", sessionId)
    }

    if (userId && userId !== "all") {
      query = query.eq("user_id", userId)
    }

    if (searchTerm) {
      query = query.or(`message.ilike.%${searchTerm}%,response.ilike.%${searchTerm}%`)
    }

    if (!showHidden) {
      query = query.eq("is_hidden", false)
    }

    const { data: conversations, error, count } = await query

    if (error) {
      console.error("Error fetching conversations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: conversations || [],
      count: count || 0,
    })
  } catch (error) {
    console.error("Unexpected error in conversations list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

