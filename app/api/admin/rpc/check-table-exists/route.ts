import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tableName = url.searchParams.get("table")

    if (!tableName) {
      return NextResponse.json({ exists: false, error: "Nombre de tabla no proporcionado" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)

    // Usar la función RPC que creamos con el parámetro correcto
    const { data, error } = await supabase.rpc("check_table_exists", {
      table_name_param: tableName,
    })

    if (error) {
      console.error("Error al verificar tabla:", error)
      return NextResponse.json({ exists: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ exists: !!data })
  } catch (error: any) {
    console.error("Error al verificar tabla:", error)
    return NextResponse.json({ exists: false, error: error.message }, { status: 500 })
  }
}
