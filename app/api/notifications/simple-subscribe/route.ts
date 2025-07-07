import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Crear cliente Supabase directamente con las variables de entorno
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export async function POST(request: Request) {
  try {
    console.log("🚀 Iniciando suscripción simple...")

    // Extraer datos
    const data = await request.json()
    console.log("📦 Datos recibidos:", { hasData: !!data })

    // Crear un ID de prueba
    const testId = "test-" + Date.now()

    // Insertar directamente con el cliente service_role
    const { data: result, error } = await supabase.from("user_push_subscriptions").insert({
      user_id: testId,
      endpoint: data.endpoint || "test-endpoint",
      p256dh: data.p256dh || "test-p256dh",
      auth: data.auth || "test-auth",
    })

    if (error) {
      console.error("❌ Error de Supabase:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    console.log("✅ Suscripción guardada correctamente")
    return NextResponse.json({ success: true, id: testId })
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
