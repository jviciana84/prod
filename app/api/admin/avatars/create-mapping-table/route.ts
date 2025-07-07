import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

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

    // Verificar si la tabla ya existe
    const { data: tableExists } = await supabase.rpc("check_table_exists", {
      table_name_param: "avatar_mappings",
    })

    if (tableExists) {
      return NextResponse.json({ message: "La tabla ya existe" })
    }

    // Crear la tabla de mapeo
    const { error } = await supabase
      .from("avatar_mappings")
      .insert({
        local_path: "test_path",
        blob_url: "test_url",
      })
      .select()

    if (error && error.code !== "23505") {
      // Ignorar error de duplicado
      console.error("Error al crear tabla:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    // Eliminar el registro de prueba
    await supabase.from("avatar_mappings").delete().eq("local_path", "test_path")

    return NextResponse.json({ message: "Tabla creada correctamente" })
  } catch (error: any) {
    console.error("Error al crear tabla:", error)
    return NextResponse.json({ message: error.message || "Error al crear tabla" }, { status: 500 })
  }
}
