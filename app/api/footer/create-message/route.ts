import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: "Falta el mensaje" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("footer_messages")
      .insert({
        message: message.trim(),
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("❌ [API] Error creating footer message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

