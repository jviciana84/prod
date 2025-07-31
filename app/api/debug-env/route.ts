import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log("🔍 Verificando variables de entorno...")
    
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    }
    
    // Verificar si las variables están definidas
    const hasSupabaseUrl = !!envVars.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseKey = !!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const urlLength = envVars.NEXT_PUBLIC_SUPABASE_URL?.length || 0
    const keyLength = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
    
    console.log("✅ Variables de entorno verificadas")
    console.log("📊 URL length:", urlLength, "Key length:", keyLength)
    
    return NextResponse.json(
      { 
        status: 'ok', 
        message: 'Environment variables check completed',
        environment: {
          nodeEnv: envVars.NODE_ENV,
          vercelEnv: envVars.VERCEL_ENV,
          vercelUrl: envVars.VERCEL_URL
        },
        supabase: {
          hasUrl: hasSupabaseUrl,
          hasKey: hasSupabaseKey,
          urlLength: urlLength,
          keyLength: keyLength,
          urlPreview: hasSupabaseUrl ? envVars.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + "..." : null,
          keyPreview: hasSupabaseKey ? envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "..." : null
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error("💥 Excepción en debug-env:", error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 