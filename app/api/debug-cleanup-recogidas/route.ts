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

    // Script SQL para limpiar y restaurar
    const cleanupScript = `
      DO $$
      DECLARE
          recogida_record RECORD;
      BEGIN
          -- 1. Limpiar todo el historial de recogidas
          DELETE FROM recogidas_historial;
          RAISE NOTICE 'Historial de recogidas limpiado';
          
          -- 2. Restaurar todas las recogidas pendientes
          -- Primero, obtener todas las recogidas que estaban en el historial
          FOR recogida_record IN 
              SELECT DISTINCT 
                  v.id,
                  v.matricula,
                  v.centro_recogida,
                  v.materiales,
                  v.nombre_cliente,
                  v.direccion_cliente,
                  v.codigo_postal,
                  v.ciudad,
                  v.provincia,
                  v.telefono,
                  v.email,
                  v.observaciones_envio,
                  v.usuario_solicitante,
                  v.fecha_solicitud
              FROM recogidas_historial rh
              JOIN vehiculos v ON rh.vehiculo_id = v.id
          LOOP
              -- Insertar de vuelta en la tabla de recogidas pendientes
              INSERT INTO recogidas_pendientes (
                  vehiculo_id,
                  matricula,
                  centro_recogida,
                  materiales,
                  nombre_cliente,
                  direccion_cliente,
                  codigo_postal,
                  ciudad,
                  provincia,
                  telefono,
                  email,
                  observaciones_envio,
                  usuario_solicitante,
                  fecha_solicitud,
                  created_at
              ) VALUES (
                  recogida_record.id,
                  recogida_record.matricula,
                  recogida_record.centro_recogida,
                  recogida_record.materiales,
                  recogida_record.nombre_cliente,
                  recogida_record.direccion_cliente,
                  recogida_record.codigo_postal,
                  recogida_record.ciudad,
                  recogida_record.provincia,
                  recogida_record.telefono,
                  recogida_record.email,
                  recogida_record.observaciones_envio,
                  recogida_record.usuario_solicitante,
                  recogida_record.fecha_solicitud,
                  NOW()
              )
              ON CONFLICT (vehiculo_id) DO NOTHING;
          END LOOP;
          
          RAISE NOTICE 'Recogidas restauradas a pendientes';
          
          -- 3. Limpiar logs de email si existen
          DELETE FROM email_logs WHERE email_type = 'recogidas';
          RAISE NOTICE 'Logs de email de recogidas limpiados';
          
      END $$;
    `

    // Ejecutar el script de limpieza
    const { error } = await supabase.rpc('exec_sql', { sql_query: cleanupScript })

    if (error) {
      console.error("Error ejecutando limpieza:", error)
      return NextResponse.json({ 
        error: "Error ejecutando limpieza",
        details: error.message 
      }, { status: 500 })
    }

    // Verificar el estado después de la limpieza
    const { data: pendingCount, error: pendingError } = await supabase
      .from("recogidas_pendientes")
      .select("id", { count: "exact" })

    const { data: historyCount, error: historyError } = await supabase
      .from("recogidas_historial")
      .select("id", { count: "exact" })

    return NextResponse.json({ 
      success: true, 
      message: "Limpieza completada exitosamente",
      stats: {
        recogidas_pendientes: pendingCount?.length || 0,
        recogidas_historial: historyCount?.length || 0
      }
    })

  } catch (error) {
    console.error("Error en debug-cleanup-recogidas:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 