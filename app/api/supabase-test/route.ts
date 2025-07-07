import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("🔍 Probando conexión a Supabase...")

    // Crear cliente Supabase directamente
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Probar una consulta simple
    const { data, error } = await supabase.from("user_push_subscriptions").select("count(*)").limit(1)

    if (error) {
      console.error("❌ Error de Supabase:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "URL configurada" : "URL no configurada",
          key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Key configurada" : "Key no configurada",
        },
        { status: 500 },
      )
    }

    // Verificar variables de entorno
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
    }

    return NextResponse.json({
      success: true,
      data,
      env: envCheck,
    })
  } catch (error) {
    console.error("💥 Error general:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
