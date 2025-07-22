import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Script SQL para arreglar la tabla
    const fixScript = `
      DO $$
      BEGIN
          -- Crear tabla si no existe
          IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_email_config') THEN
              CREATE TABLE recogidas_email_config (
                  id SERIAL PRIMARY KEY,
                  enabled BOOLEAN NOT NULL DEFAULT true,
                  email_agencia VARCHAR(200) NOT NULL DEFAULT 'recogidas@mrw.es',
                  email_remitente VARCHAR(200) NOT NULL DEFAULT 'recogidas@controlvo.ovh',
                  nombre_remitente VARCHAR(200) NOT NULL DEFAULT 'Recogidas - Sistema CVO',
                  asunto_template VARCHAR(300) NOT NULL DEFAULT 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes',
                  cc_emails TEXT[] DEFAULT '{}',
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
          END IF;
          
          -- Añadir columnas faltantes
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'email_remitente') THEN
              ALTER TABLE recogidas_email_config ADD COLUMN email_remitente VARCHAR(200) NOT NULL DEFAULT 'recogidas@controlvo.ovh';
          END IF;
          
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'nombre_remitente') THEN
              ALTER TABLE recogidas_email_config ADD COLUMN nombre_remitente VARCHAR(200) NOT NULL DEFAULT 'Recogidas - Sistema CVO';
          END IF;
          
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'asunto_template') THEN
              ALTER TABLE recogidas_email_config ADD COLUMN asunto_template VARCHAR(300) NOT NULL DEFAULT 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes';
          END IF;
          
          -- Actualizar registros existentes
          UPDATE recogidas_email_config 
          SET 
              email_remitente = COALESCE(email_remitente, 'recogidas@controlvo.ovh'),
              nombre_remitente = COALESCE(nombre_remitente, 'Recogidas - Sistema CVO'),
              asunto_template = COALESCE(asunto_template, 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes'),
              updated_at = NOW()
          WHERE email_remitente IS NULL OR nombre_remitente IS NULL OR asunto_template IS NULL;
          
          -- Actualizar formato antiguo del asunto
          UPDATE recogidas_email_config 
          SET 
              asunto_template = 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes',
              updated_at = NOW()
          WHERE asunto_template = 'Recogidas Motor Munich - {cantidad} solicitudes';
      END $$;
    `

    // Ejecutar el script
    const { error } = await supabase.rpc('exec_sql', { sql_query: fixScript })

    if (error) {
      console.error("Error ejecutando script:", error)
      return NextResponse.json({ 
        error: "Error ejecutando script de arreglo",
        details: error.message 
      }, { status: 500 })
    }

    // Verificar el resultado
    const { data: config, error: configError } = await supabase
      .from("recogidas_email_config")
      .select("*")
      .single()

    if (configError) {
      return NextResponse.json({ 
        error: "Error verificando configuración",
        details: configError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Tabla recogidas_email_config arreglada exitosamente",
      config 
    })

  } catch (error) {
    console.error("Error en debug-fix-recogidas-config:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 