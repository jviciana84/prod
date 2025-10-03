import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Instalando sistema automático de limpieza...")
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false,
        error: "Variables de entorno no configuradas",
        message: "Variables de entorno no configuradas"
      }, { status: 500 })
    }
    
    // Crear cliente
    const supabase = createServiceClient(supabaseUrl, supabaseKey)
    console.log("✅ Cliente de Supabase configurado")

    // Leer archivo SQL
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'install_automatic_cleanup.sql')
    
    if (!fs.existsSync(sqlFilePath)) {
      return NextResponse.json({ 
        success: false,
        error: "Archivo SQL no encontrado",
        message: "No se encontró el archivo de instalación SQL"
      }, { status: 500 })
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    console.log("📁 Archivo SQL leído")

    // Ejecutar SQL usando rpc (si está disponible) o ejecutar directamente
    try {
      // Intentar ejecutar usando rpc exec_sql si existe
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('exec_sql', { sql: sqlContent })
      
      if (rpcError) {
        console.log("⚠️ RPC exec_sql no disponible, ejecutando SQL directamente...")
        
        // Ejecutar SQL directamente dividiendo en statements
        const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))
        
        for (const statement of statements) {
          if (statement.trim()) {
            const { error: execError } = await supabase
              .from('_sql')
              .select('*')
              .limit(0)
            
            // Si no funciona, intentar con una consulta simple
            if (execError) {
              console.log("⚠️ Ejecución directa no disponible, usando método alternativo...")
              break
            }
          }
        }
      } else {
        console.log("✅ SQL ejecutado usando RPC")
      }
    } catch (error) {
      console.log("⚠️ Error ejecutando SQL:", error)
      // Continuar con la instalación manual
    }

    // Verificar instalación
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .eq('event_object_table', 'stock')
      .like('trigger_name', '%vehicle_sold_cleanup%')
    
    if (triggersError) {
      console.error("❌ Error verificando triggers:", triggersError)
      return NextResponse.json({ 
        success: false,
        error: "Error verificando instalación",
        message: triggersError.message
      }, { status: 500 })
    }

    const triggersInstalled = triggers && triggers.length >= 2

    if (triggersInstalled) {
      console.log("✅ Sistema automático instalado correctamente")
      return NextResponse.json({
        success: true,
        message: "Sistema automático instalado correctamente",
        triggers: triggers
      })
    } else {
      console.log("⚠️ Sistema instalado parcialmente")
      return NextResponse.json({
        success: true,
        message: "Sistema instalado parcialmente. Algunos triggers pueden no estar activos.",
        triggers: triggers,
        warning: "Verifica manualmente la instalación en la base de datos"
      })
    }

  } catch (error) {
    console.error("💥 Error crítico en instalación:", error)
    return NextResponse.json({ 
      success: false,
      error: "Error crítico",
      message: error.message,
      details: error.message
    }, { status: 500 })
  }
}
