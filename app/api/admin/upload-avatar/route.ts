import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario es administrador
    const { data: userRoles } = await supabase.rpc("get_user_role_names", {
      user_id_param: session.user.id,
    })

    const isAdmin = userRoles && (userRoles.includes("admin") || userRoles.includes("Administrador"))

    if (!isAdmin) {
      return NextResponse.json({ message: "No tienes permisos para realizar esta acción" }, { status: 403 })
    }

    // Obtener el archivo del formulario
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ message: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    // Validar el tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "El archivo debe ser una imagen" }, { status: 400 })
    }

    // Validar el tamaño del archivo (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ message: "La imagen no debe superar los 2MB" }, { status: 400 })
    }

    // Generar un nombre único para el archivo
    const filename = `avatar-${nanoid()}.${file.name.split(".").pop()}`

    // Subir el archivo a Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
    })

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error("Error al subir avatar:", error)
    return NextResponse.json({ message: error.message || "Error al subir avatar" }, { status: 500 })
  }
}
