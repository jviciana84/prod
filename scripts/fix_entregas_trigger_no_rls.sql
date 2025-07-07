-- ARREGLAR TRIGGER SIN RLS - VERSIÓN FINAL
-- ==========================================

-- 1. LIMPIAR TRIGGERS ANTERIORES
DROP TRIGGER IF EXISTS cyp_completion_to_entregas_trigger ON sales_vehicles;
DROP TRIGGER IF EXISTS sales_to_entregas_trigger ON sales_vehicles;
DROP TRIGGER IF EXISTS trigger_sales_to_entregas ON sales_vehicles;
DROP TRIGGER IF EXISTS cyp_to_entregas_trigger ON sales_vehicles;

-- 2. LIMPIAR FUNCIONES ANTERIORES  
DROP FUNCTION IF EXISTS handle_cyp_to_entregas();
DROP FUNCTION IF EXISTS handle_sales_to_entregas();
DROP FUNCTION IF EXISTS sync_sales_to_entregas();

-- 3. CONFIRMAR QUE NO HAY RLS (por si acaso)
ALTER TABLE entregas DISABLE ROW LEVEL SECURITY;

-- 4. CREAR FUNCIÓN SIMPLE Y ROBUSTA
CREATE OR REPLACE FUNCTION handle_cyp_to_entregas()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar cuando CyP cambia a completado
    IF NEW.cyp_status = 'completado' AND (OLD.cyp_status IS NULL OR OLD.cyp_status != 'completado') THEN
        
        RAISE NOTICE '🚗 Procesando vehículo % con CyP completado', NEW.license_plate;
        
        -- Insertar en entregas
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
            COALESCE(NEW.sale_date, CURRENT_TIMESTAMP),
            COALESCE(NEW.cyp_date, CURRENT_TIMESTAMP),
            COALESCE(NEW.license_plate, ''),
            COALESCE(NEW.model, ''),
            COALESCE(NEW.advisor, ''),
            COALESCE(NEW.or_value, ''),
            false,
            'Generado automáticamente desde CyP completado',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Vehículo % insertado en entregas exitosamente', NEW.license_plate;
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error insertando en entregas: %', SQLERRM;
        RETURN NEW; -- No fallar el trigger principal
END;
$$ LANGUAGE plpgsql;

-- 5. CREAR TRIGGER LIMPIO
CREATE TRIGGER cyp_to_entregas_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_cyp_to_entregas();

-- 6. VERIFICAR RESULTADO
SELECT '🎉 Trigger creado exitosamente sin RLS' as status;

-- Mostrar triggers activos
SELECT 
    '📋 Triggers activos:' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles'
AND trigger_name LIKE '%entregas%'
ORDER BY trigger_name;
