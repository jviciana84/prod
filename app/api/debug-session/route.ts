import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)
    
    // Obtener todas las cookies
    const allCookies = cookieStore.getAll()
    
    // Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Verificar usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      session: {
        exists: !!session,
        error: sessionError?.message,
        access_token: session?.access_token ? "present" : "missing",
        refresh_token: session?.refresh_token ? "present" : "missing"
      },
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        error: userError?.message
      },
      cookies: {
        count: allCookies.length,
        names: allCookies.map(c => c.name)
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
} 