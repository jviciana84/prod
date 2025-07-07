import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("🔍 Iniciando diagnóstico de notificaciones...")

    // Usar service_role para bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Verificar conexión a Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from("user_push_subscriptions")
      .select("id")
      .limit(1)

    const diagnostics = {
      timestamp: new Date().toISOString(),
      supabase: {
        connected: !connectionError,
        error: connectionError?.message || null,
        code: connectionError?.code || null,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasVapidKeys: {
          public: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          private: !!process.env.VAPID_PRIVATE_KEY,
        },
      },
    }

    // 2. Verificar tabla (simple)
    if (!connectionError) {
      diagnostics.table = {
        exists: true,
        error: null,
        message: "Tabla accesible",
      }

      // 3. Contar suscripciones existentes
      const { count, error: countError } = await supabase
        .from("user_push_subscriptions")
        .select("*", { count: "exact", head: true })

      diagnostics.subscriptions = {
        count: count || 0,
        error: countError?.message || null,
      }
    } else {
      diagnostics.table = {
        exists: false,
        error: connectionError.message,
        message: "No se puede acceder a la tabla",
      }
    }

    // 4. Usuario (siempre será false en modo service_role)
    diagnostics.auth = {
      authenticated: false,
      userId: null,
      error: "Usando service_role (sin autenticación)",
    }

    console.log("📊 Diagnóstico completo:", diagnostics)

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("💥 Error en diagnóstico:", error)
    return NextResponse.json(
      {
        error: "Error en diagnóstico",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
