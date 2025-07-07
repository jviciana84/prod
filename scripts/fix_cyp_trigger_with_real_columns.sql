-- Arreglar el trigger usando los nombres de columnas correctos

-- Primero eliminar cualquier trigger existente
DROP TRIGGER IF EXISTS cyp_completion_trigger ON sales_vehicles;
DROP TRIGGER IF EXISTS sync_to_entregas_trigger ON sales_vehicles;
DROP FUNCTION IF EXISTS handle_cyp_completion();
DROP FUNCTION IF EXISTS sync_to_entregas();

-- Crear función con nombres de columnas correctos (ajustar según el resultado del diagnóstico)
CREATE OR REPLACE FUNCTION handle_sales_to_entregas()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar si el estado cambia a 'completado' o similar
    IF NEW.cyp_status = 'completado' OR NEW.status = 'completado' THEN
        
        -- Insertar en entregas con manejo de errores
        BEGIN
            INSERT INTO entregas (
                fecha_venta,
                fecha_entrega,
                matricula,
                modelo,
                asesor,
                "or",
                incidencia,
                observaciones,
                created_at,
                updated_at
            ) VALUES (
                COALESCE(NEW.fecha_venta, NEW.sale_date, CURRENT_DATE),
                COALESCE(NEW.fecha_entrega, NEW.delivery_date, CURRENT_DATE),
                COALESCE(NEW.matricula, NEW.license_plate, ''),
                COALESCE(NEW.modelo, NEW.model, ''),
                COALESCE(NEW.asesor, NEW.advisor, NEW.sales_person, ''),
                COALESCE(NEW."or", NEW.or_number, ''),
                false, -- incidencia por defecto
                COALESCE(NEW.observaciones, NEW.observations, ''),
                NOW(),
                NOW()
            )
            ON CONFLICT (matricula) DO UPDATE SET
                fecha_venta = EXCLUDED.fecha_venta,
                fecha_entrega = EXCLUDED.fecha_entrega,
                modelo = EXCLUDED.modelo,
                asesor = EXCLUDED.asesor,
                "or" = EXCLUDED."or",
                observaciones = EXCLUDED.observaciones,
                updated_at = NOW();
                
        EXCEPTION WHEN OTHERS THEN
            -- Log el error pero no fallar la transacción principal
            RAISE WARNING 'Error insertando en entregas para matricula %: % - %', 
                COALESCE(NEW.matricula, NEW.license_plate), SQLSTATE, SQLERRM;
            -- No hacer RETURN NULL para no cancelar la actualización original
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
CREATE TRIGGER sales_to_entregas_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_sales_to_entregas();

SELECT 'Trigger creado con manejo de errores' as status;
