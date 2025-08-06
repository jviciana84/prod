import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const userEmail = "viciana84@gmail.com"
    
    // Buscar en auth.users
    const { data: authUser, error: authError } = await supabase
      .from("auth.users")
      .select("*")
      .eq("email", userEmail)
      .single()

    // Buscar en profiles también
    const { data: profileUser, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", userEmail)
      .single()

    return NextResponse.json({ 
      success: true,
      searchEmail: userEmail,
      authUser: authUser || null,
      authError: authError?.message || null,
      profileUser: profileUser || null,
      profileError: profileError?.message || null
    })

  } catch (error: any) {
    console.error("Error buscando usuario:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
} 