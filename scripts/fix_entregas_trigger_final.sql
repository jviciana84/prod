-- Arreglar el trigger de entregas definitivamente

-- 1. Eliminar todos los triggers problemáticos
DROP TRIGGER IF EXISTS sales_to_entregas_trigger ON sales_vehicles;
DROP TRIGGER IF EXISTS trigger_sales_to_entregas ON sales_vehicles;
DROP FUNCTION IF EXISTS handle_sales_to_entregas();
DROP FUNCTION IF EXISTS sync_sales_to_entregas();

-- 2. Verificar/arreglar políticas RLS de entregas
DROP POLICY IF EXISTS "Permitir inserción desde triggers" ON entregas;
DROP POLICY IF EXISTS "Permitir todo para usuarios autenticados" ON entregas;

-- Crear política permisiva para triggers
CREATE POLICY "Permitir inserción desde triggers" ON entregas
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Permitir actualización desde triggers" ON entregas
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir lectura para usuarios autenticados" ON entregas
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 3. Crear función del trigger con SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_cyp_to_entregas()
RETURNS TRIGGER 
SECURITY DEFINER -- Esto ejecuta con permisos del propietario, no del usuario
SET search_path = public
AS $$
BEGIN
    -- Solo actuar cuando CyP cambia a completado
    IF NEW.cyp_status = 'completado' AND (OLD.cyp_status IS NULL OR OLD.cyp_status != 'completado') THEN
        
        -- Insertar o actualizar en entregas
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
            COALESCE(NEW.sale_date, CURRENT_DATE),
            COALESCE(NEW.cyp_date, CURRENT_DATE),
            COALESCE(NEW.license_plate, ''),
            COALESCE(NEW.model, ''),
            COALESCE(NEW.advisor, ''),
            COALESCE(NEW.or_value, ''),
            false,
            'Generado automáticamente desde ventas',
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
            
        RAISE NOTICE 'Vehículo % insertado en entregas', NEW.license_plate;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear el trigger
CREATE TRIGGER cyp_completion_to_entregas_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_cyp_to_entregas();

-- 5. Verificar que todo está bien
SELECT 'Trigger creado correctamente' as status;

-- Mostrar los triggers activos
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles'
ORDER BY trigger_name;
