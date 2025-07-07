-- OPCIÓN: Agregar la condición de validado al trigger
SELECT '=== ¿AGREGAR CONDICIÓN DE VALIDADO? ===' as info;

-- Función con las 3 condiciones (incluyendo validated)
CREATE OR REPLACE FUNCTION handle_cyp_to_entregas_with_validation()
RETURNS TRIGGER AS $$
BEGIN
    -- Procesar cuando las 3 condiciones se cumplen
    IF NEW.cyp_status = 'completado' 
       AND NEW.photo_360_status = 'completado' 
       AND NEW.validated IS TRUE THEN
        
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
            'Creado automáticamente - CyP, Foto360 y VALIDADO',
            NOW(),
            NOW()
        )
        ON CONFLICT (matricula) DO UPDATE SET
            fecha_venta = EXCLUDED.fecha_venta,
            modelo = EXCLUDED.modelo,
            asesor = EXCLUDED.asesor,
            "or" = EXCLUDED."or",
            observaciones = 'Actualizado automáticamente - VALIDADO - ' || NOW()::text,
            updated_at = NOW();
            
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '
OPCIONES:
1️⃣ MANTENER ACTUAL: Solo CyP + Foto360 completados
2️⃣ AGREGAR VALIDACIÓN: CyP + Foto360 + Validado = TRUE

¿Cuál prefieres?
' as opciones;
