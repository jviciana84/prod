import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { list } from "@vercel/blob"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  // Verificar autenticación y permisos
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
    // Listar todos los avatares en el directorio "avatars"
    const { blobs } = await list({ prefix: "avatars/" })

    // Transformar los datos para la respuesta
    const avatars = blobs.map((blob) => ({
      url: blob.url,
      name: blob.pathname.split("/").pop() || "Sin nombre",
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }))

    return NextResponse.json({ avatars })
  } catch (error) {
    console.error("Error listing avatars:", error)
    return NextResponse.json({ error: "Error al listar los avatares" }, { status: 500 })
  }
}
