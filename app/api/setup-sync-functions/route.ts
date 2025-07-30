import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase con rol de servicio
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Configurando funciones de sincronización...')
    
    // Script para crear las funciones de sincronización
    const setupScript = `
      -- 1. Crear función sync_photos_with_sales
      CREATE OR REPLACE FUNCTION sync_photos_with_sales()
      RETURNS TABLE(
          processed_count INTEGER,
          removed_count INTEGER,
          message TEXT
      ) AS $$
      DECLARE
          sold_vehicle RECORD;
          photos_count INTEGER;
          total_processed INTEGER := 0;
          total_removed INTEGER := 0;
      BEGIN
          -- Log de inicio
          RAISE NOTICE '🔄 Iniciando sincronización de fotos con ventas...';
          
          -- Procesar todos los vehículos vendidos
          FOR sold_vehicle IN 
              SELECT DISTINCT license_plate 
              FROM sales_vehicles 
              WHERE license_plate IS NOT NULL
          LOOP
              -- Contar registros en fotos para este vehículo
              SELECT COUNT(*) INTO photos_count
              FROM fotos 
              WHERE license_plate = sold_vehicle.license_plate;
              
              -- Si hay registros en fotos, eliminarlos
              IF photos_count > 0 THEN
                  DELETE FROM fotos 
                  WHERE license_plate = sold_vehicle.license_plate;
                  
                  total_removed := total_removed + photos_count;
                  RAISE NOTICE '✅ Vehículo % eliminado de fotos (% registros)', 
                      sold_vehicle.license_plate, photos_count;
              END IF;
              
              total_processed := total_processed + 1;
          END LOOP;
          
          RETURN QUERY SELECT 
              total_processed,
              total_removed,
              'Sincronización completada. Vehículos procesados: ' || total_processed || 
              ', Registros eliminados de fotos: ' || total_removed;
              
          RAISE NOTICE '✅ Sincronización completada. Procesados: %, Eliminados: %', 
              total_processed, total_removed;
      END;
      $$ LANGUAGE plpgsql;

      -- 2. Crear función check_photos_sales_inconsistencies
      CREATE OR REPLACE FUNCTION check_photos_sales_inconsistencies()
      RETURNS TABLE(
          license_plate TEXT,
          model TEXT,
          sale_date TIMESTAMP,
          advisor TEXT,
          photos_status TEXT,
          inconsistency_type TEXT
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              sv.license_plate,
              sv.model,
              sv.sale_date,
              COALESCE(sv.advisor_name, sv.advisor) as advisor,
              CASE 
                  WHEN f.license_plate IS NULL THEN 'NO TIENE FOTOS'
                  WHEN f.photos_completed = false THEN 'FOTOS PENDIENTES'
                  ELSE 'FOTOS COMPLETADAS'
              END as photos_status,
              'VENDIDO EN FOTOS PENDIENTES' as inconsistency_type
          FROM sales_vehicles sv
          LEFT JOIN fotos f ON sv.license_plate = f.license_plate
          WHERE f.license_plate IS NOT NULL 
          AND f.photos_completed = false
          ORDER BY sv.sale_date DESC;
      END;
      $$ LANGUAGE plpgsql;

      -- 3. Crear función handle_vehicle_sold_remove_from_photos
      CREATE OR REPLACE FUNCTION handle_vehicle_sold_remove_from_photos()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Log de inicio
          RAISE NOTICE '🔄 Procesando vehículo vendido: %', NEW.license_plate;
          
          -- Eliminar de la tabla fotos si existe
          DELETE FROM fotos 
          WHERE license_plate = NEW.license_plate;
          
          RAISE NOTICE '✅ Vehículo % eliminado de fotos (vendido)', NEW.license_plate;
          
          RETURN NEW;
      EXCEPTION
          WHEN OTHERS THEN
              RAISE NOTICE '❌ Error eliminando de fotos: %', SQLERRM;
              RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- 4. Crear trigger para eliminar de fotos al vender
      DROP TRIGGER IF EXISTS trigger_remove_from_photos_on_sale ON sales_vehicles;
      CREATE TRIGGER trigger_remove_from_photos_on_sale
          AFTER INSERT ON sales_vehicles
          FOR EACH ROW
          EXECUTE FUNCTION handle_vehicle_sold_remove_from_photos();

      -- 5. Comentarios para documentar
      COMMENT ON FUNCTION sync_photos_with_sales() IS 'Sincronización manual de fotos con ventas';
      COMMENT ON FUNCTION check_photos_sales_inconsistencies() IS 'Verifica inconsistencias entre fotos y ventas';
      COMMENT ON FUNCTION handle_vehicle_sold_remove_from_photos() IS 'Elimina automáticamente vehículos de fotos cuando se venden';
    `
    
    // Ejecutar el script usando una función RPC simple
    const { data: result, error: setupError } = await supabase
      .rpc('execute_sql', { sql_script: setupScript })
    
    if (setupError) {
      console.error('❌ Error configurando funciones:', setupError)
      return NextResponse.json({
        success: false,
        error: setupError.message
      }, { status: 500 })
    }
    
    console.log('✅ Funciones de sincronización configuradas correctamente')
    
    return NextResponse.json({
      success: true,
      message: 'Funciones de sincronización configuradas correctamente',
      result
    })
    
  } catch (error: any) {
    console.error('❌ Error inesperado:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 