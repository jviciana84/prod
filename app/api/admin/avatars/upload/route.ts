import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
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
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten archivos de imagen" }, { status: 400 })
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es demasiado grande. El tamaño máximo es 2MB" }, { status: 400 })
    }

    // Generar un nombre único para el archivo
    const timestamp = Date.now()
    const originalName = file.name
    const extension = originalName.split(".").pop() || "png"
    const fileName = `avatar-${timestamp}.${extension}`

    // Subir el archivo a Vercel Blob
    const blob = await put(`avatars/${fileName}`, file, {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      name: fileName,
    })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json({ error: "Error al subir el avatar" }, { status: 500 })
  }
}
