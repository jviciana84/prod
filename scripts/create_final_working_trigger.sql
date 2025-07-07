-- Crear el trigger final que funciona
SELECT '=== CREANDO TRIGGER FINAL ===' as info;

-- Eliminar triggers anteriores
DROP TRIGGER IF EXISTS debug_always_trigger ON sales_vehicles;
DROP TRIGGER IF EXISTS cyp_to_entregas_trigger_new ON sales_vehicles;
DROP TRIGGER IF EXISTS cyp_to_entregas_trigger_simple ON sales_vehicles;

-- Crear función final limpia
CREATE OR REPLACE FUNCTION handle_cyp_to_entregas_final()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo procesar cuando ambos estén completados
    IF NEW.cyp_status = 'completado' AND NEW.photo_360_status = 'completado' THEN
        
        -- Insertar o actualizar en entregas
        INSERT INTO entregas (
            fecha_venta,
            matricula,
            modelo,
            asesor,
            "or",
            observaciones,
            created_at,
            updated_at
        ) VALUES (
            COALESCE(NEW.sale_date, CURRENT_TIMESTAMP),
            COALESCE(NEW.license_plate, ''),
            COALESCE(NEW.model, ''),
            COALESCE(NEW.advisor, ''),
            COALESCE(NEW.or_value, ''),
            'Creado automáticamente - CyP y Foto360 completados',
            NOW(),
            NOW()
        )
        ON CONFLICT (matricula) DO UPDATE SET
            fecha_venta = EXCLUDED.fecha_venta,
            modelo = EXCLUDED.modelo,
            asesor = EXCLUDED.asesor,
            "or" = EXCLUDED."or",
            observaciones = 'Actualizado automáticamente - ' || NOW()::text,
            updated_at = NOW();
            
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger final
CREATE TRIGGER cyp_to_entregas_final_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_cyp_to_entregas_final();

SELECT '✅ Trigger final creado' as resultado;

-- Probar inmediatamente
UPDATE sales_vehicles 
SET updated_at = NOW()
WHERE license_plate = '0010NBB';

-- Verificar resultado
SELECT 
    'RESULTADO FINAL:' as info,
    matricula,
    modelo,
    asesor,
    observaciones,
    created_at
FROM entregas 
WHERE matricula = '0010NBB';
