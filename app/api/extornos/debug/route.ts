import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 === DEBUG SISTEMA EXTORNOS ===")

    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuario no autenticado",
        },
        { status: 401 },
      )
    }

    // Verificar tabla extornos
    const {
      data: extornos,
      error: extornosError,
      count,
    } = await supabase.from("extornos").select("*", { count: "exact" }).limit(1)

    if (extornosError) {
      console.error("❌ Error verificando tabla extornos:", extornosError)
      return NextResponse.json({
        success: false,
        error: "Error verificando tabla extornos",
        details: extornosError,
      })
    }

    // Verificar estructura de columnas
    const { data: tableInfo, error: tableError } = await supabase.rpc("get_table_structure", {
      table_name: "extornos",
    })

    const columnsVerified = tableError
      ? false
      : tableInfo?.some((col: any) => col.column_name === "documentos_adjuntos") &&
        tableInfo?.some((col: any) => col.column_name === "documentos_tramitacion") &&
        tableInfo?.some((col: any) => col.column_name === "is_test")

    // Verificar configuración de email
    const { data: emailConfig, error: emailError } = await supabase.from("extornos_email_config").select("*").single()

    console.log("✅ Diagnóstico completado:", {
      extornos_count: count,
      columns_verified: columnsVerified,
      email_config_exists: !!emailConfig && !emailError,
    })

    return NextResponse.json({
      success: true,
      extornos_count: count || 0,
      columns_verified: columnsVerified,
      email_config_exists: !!emailConfig && !emailError,
      table_structure: tableInfo || null,
      diagnostics: {
        timestamp: new Date().toISOString(),
        user_id: user.id,
        user_email: user.email,
        table_accessible: !extornosError,
        email_config_accessible: !emailError,
      },
    })
  } catch (error: any) {
    console.error("❌ Error en debug del sistema:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
