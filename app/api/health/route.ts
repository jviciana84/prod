import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "edge"

/**
 * Health check endpoint para monitorear estado del sistema
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    // 1. Verificar conexión a Supabase
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)
    
    let dbStatus = "unknown"
    let dbLatency = 0
    
    try {
      const dbStartTime = Date.now()
      const { error } = await supabase.from("profiles").select("id").limit(1)
      dbLatency = Date.now() - dbStartTime
      
      if (error) {
        dbStatus = "error"
        console.error("Health check - DB error:", error)
      } else {
        dbStatus = "ok"
      }
    } catch (e) {
      dbStatus = "error"
      console.error("Health check - DB exception:", e)
    }

    // 2. Verificar variables de entorno críticas
    const envStatus = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      openaiKey: !!process.env.OPENAI_API_KEY,
    }

    const allEnvOk = Object.values(envStatus).every(v => v)

    // 3. Calcular tiempo total
    const totalLatency = Date.now() - startTime

    // 4. Determinar estado general
    const isHealthy = dbStatus === "ok" && allEnvOk
    const status = isHealthy ? "healthy" : "unhealthy"

    const response = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          latency: dbLatency,
        },
        environment: {
          status: allEnvOk ? "ok" : "error",
          details: envStatus,
        },
      },
      latency: totalLatency,
    }

    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Health check failed:", error)
    
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        latency: Date.now() - startTime,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    )
  }
}


