import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getUserRoles } from "@/lib/auth/permissions"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No hay sesión activa'
      }, { status: 401 })
    }

    // Obtener roles del usuario
    const userRoles = await getUserRoles()

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email
      },
      roles: userRoles,
      hasAdminAccess: userRoles.some(
        (role) => 
          role.toLowerCase() === "admin" || 
          role.toLowerCase() === "administración" ||
          role.toLowerCase() === "director" ||
          role.toLowerCase() === "supervisor"
      )
    })

  } catch (error) {
    console.error('Error al obtener roles del usuario:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error
    }, { status: 500 })
  }
} 