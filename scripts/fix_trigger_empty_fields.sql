-- Corregir el trigger para dejar campos vacíos para llenar manualmente
SELECT '=== CORRIGIENDO CAMPOS VACÍOS ===' as info;

-- Función corregida que deja campos vacíos
CREATE OR REPLACE FUNCTION handle_cyp_to_entregas_final()
RETURNS TRIGGER AS $$
BEGIN
    -- Procesar cuando las 3 condiciones se cumplen
    IF NEW.cyp_status = 'completado' 
       AND NEW.photo_360_status = 'completado' 
       AND NEW.validated IS TRUE THEN
        
        INSERT INTO entregas (
            fecha_venta,
            fecha_entrega,        -- VACÍO para llenar manualmente
            matricula,
            modelo,
            asesor,
            "or",
            incidencia,
            observaciones,        -- VACÍO para llenar manualmente
            created_at,
            updated_at
        ) VALUES (
            COALESCE(NEW.sale_date, CURRENT_TIMESTAMP),
            NULL,                 -- ✅ VACÍO - fecha_entrega
            COALESCE(NEW.license_plate, ''),
            COALESCE(NEW.model, ''),
            COALESCE(NEW.advisor, ''),
            COALESCE(NEW.or_value, ''),
            false,                -- Sin incidencia por defecto
            NULL,                 -- ✅ VACÍO - observaciones
            NOW(),
            NOW()
        )
        ON CONFLICT (matricula) DO UPDATE SET
            fecha_venta = EXCLUDED.fecha_venta,
            modelo = EXCLUDED.modelo,
            asesor = EXCLUDED.asesor,
            "or" = EXCLUDED."or",
            updated_at = NOW()
            -- NO actualizar observaciones ni fecha_entrega
            ;
            
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Trigger corregido - campos vacíos para llenar manualmente' as resultado;

-- Limpiar el registro anterior con observaciones automáticas
DELETE FROM entregas WHERE matricula = '0010NBB';

-- Probar con el trigger corregido
UPDATE sales_vehicles 
SET updated_at = NOW()
WHERE license_plate = '0010NBB';

-- Verificar resultado
SELECT 
    'RESULTADO CORREGIDO:' as info,
    matricula,
    modelo,
    asesor,
    fecha_venta,
    fecha_entrega,
    observaciones,
    created_at
FROM entregas 
WHERE matricula = '0010NBB';
