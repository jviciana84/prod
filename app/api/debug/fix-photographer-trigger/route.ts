import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)
    
    console.log("🔧 Iniciando corrección del trigger de asignación automática...")
    
    // Ejecutar el script SQL paso a paso
    const steps = [
      {
        name: "Crear función corregida",
        sql: `
          CREATE OR REPLACE FUNCTION auto_assign_photographer()
          RETURNS TRIGGER AS $func$
          DECLARE
            photographer_record RECORD;
            total_assigned INTEGER;
            current_assignments JSONB := '{}'::jsonb;
            best_photographer UUID := NULL;
            best_deficit NUMERIC := -1000;
            total_vehicles INTEGER;
          BEGIN
            -- Solo proceder si el nuevo registro no tiene fotógrafo asignado
            IF NEW.assigned_to IS NULL AND NEW.photos_completed IS FALSE THEN
              -- Obtener el total de vehículos asignados
              SELECT COUNT(*) INTO total_assigned FROM fotos WHERE assigned_to IS NOT NULL;
              
              -- Obtener el total de vehículos (incluyendo el nuevo)
              total_vehicles := total_assigned + 1;
              
              -- Obtener asignaciones actuales por fotógrafo
              SELECT jsonb_object_agg(assigned_to, cnt) INTO current_assignments
              FROM (
                SELECT assigned_to, COUNT(*) as cnt
                FROM fotos
                WHERE assigned_to IS NOT NULL
                GROUP BY assigned_to
              ) AS counts;
              
              -- Si no hay asignaciones, inicializar
              IF current_assignments IS NULL THEN
                current_assignments := '{}'::jsonb;
              END IF;
              
              -- Encontrar el fotógrafo con mayor déficit (no ordenar por percentage DESC)
              FOR photographer_record IN 
                SELECT 
                  user_id, 
                  percentage
                FROM fotos_asignadas
                WHERE is_active = TRUE
                ORDER BY user_id -- Ordenar por ID para distribución equitativa
              LOOP
                DECLARE
                  current_count INTEGER := COALESCE((current_assignments->>photographer_record.user_id::text)::INTEGER, 0);
                  target_count NUMERIC := total_vehicles * photographer_record.percentage / 100;
                  deficit NUMERIC := target_count - current_count;
                BEGIN
                  -- Si este fotógrafo tiene mayor déficit, seleccionarlo
                  IF deficit > best_deficit THEN
                    best_deficit := deficit;
                    best_photographer := photographer_record.user_id;
                  END IF;
                END;
              END LOOP;
              
              -- Asignar al mejor fotógrafo encontrado
              IF best_photographer IS NOT NULL THEN
                NEW.assigned_to := best_photographer;
                NEW.original_assigned_to := best_photographer;
              END IF;
            END IF;
            
            RETURN NEW;
          END;
          $func$ LANGUAGE plpgsql;
        `
      },
      {
        name: "Eliminar trigger existente",
        sql: `DROP TRIGGER IF EXISTS assign_photographer_trigger ON fotos;`
      },
      {
        name: "Crear trigger corregido",
        sql: `
          CREATE TRIGGER assign_photographer_trigger
          BEFORE INSERT ON fotos
          FOR EACH ROW
          EXECUTE FUNCTION auto_assign_photographer();
        `
      }
    ]

    const results = []
    
    for (const step of steps) {
      console.log(`📝 Ejecutando: ${step.name}`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: step.sql })
        
        if (error) {
          console.error(`❌ Error en ${step.name}:`, error)
          results.push({ step: step.name, success: false, error: error.message })
        } else {
          console.log(`✅ ${step.name} completado`)
          results.push({ step: step.name, success: true })
        }
      } catch (e) {
        console.error(`❌ Error en ${step.name}:`, e)
        results.push({ step: step.name, success: false, error: String(e) })
      }
    }

    const allSuccessful = results.every(r => r.success)
    
    if (allSuccessful) {
      console.log("🎉 Corrección del trigger completada exitosamente")
      return NextResponse.json({
        success: true,
        message: "Trigger de asignación automática corregido exitosamente",
        results
      })
    } else {
      console.log("⚠️ Algunos pasos fallaron")
      return NextResponse.json({
        success: false,
        message: "Algunos pasos de la corrección fallaron",
        results
      }, { status: 500 })
    }

  } catch (error) {
    console.error("❌ Error completo:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
} 