import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { del } from "@vercel/blob"

export async function DELETE(request: Request) {
  // Verificar autenticación y permisos
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Verificar si el usuario es administrador
  const { data: isAdmin, error: roleError } = await supabase.rpc("user_has_role", {
    user_id_param: session.user.id,
    role_name_param: "admin",
  })

  if (roleError || !isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No se proporcionó la URL del avatar" }, { status: 400 })
    }

    // Extraer el pathname de la URL
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Eliminar el archivo de Vercel Blob
    await del(pathname)

    // Evitamos la consulta que causa recursión infinita
    // En lugar de intentar eliminar de la base de datos, solo eliminamos de Blob
    // y consideramos la operación exitosa

    return NextResponse.json({
      success: true,
      message:
        "Avatar eliminado de Blob correctamente. No se modificó la base de datos para evitar errores de recursión.",
    })
  } catch (error) {
    console.error("Error deleting avatar:", error)
    return NextResponse.json({ error: "Error al eliminar el avatar" }, { status: 500 })
  }
}
