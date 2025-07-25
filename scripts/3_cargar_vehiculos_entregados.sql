-- Script 3: CARGAR VEHÍCULOS ENTREGADOS
-- =====================================

-- Verificar vehículos que ya tienen fecha de entrega
SELECT 'Vehículos con fecha de entrega:' as info;
SELECT 
    matricula,
    modelo,
    asesor,
    fecha_entrega,
    fecha_venta
FROM entregas 
WHERE fecha_entrega IS NOT NULL
ORDER BY fecha_entrega DESC;

-- Verificar vehículos en sales_vehicles que podrían tener entregas
SELECT 'Vehículos en sales_vehicles con fecha de venta:' as info;
SELECT 
    license_plate,
    model,
    advisor,
    sale_date,
    client_name,
    client_email
FROM sales_vehicles 
WHERE sale_date IS NOT NULL
ORDER BY sale_date DESC;

-- Insertar vehículos entregados que no estén en la tabla entregas
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
)
SELECT 
    sv.sale_date,
    sv.sale_date + INTERVAL '7 days', -- Simular entrega 7 días después de la venta
    sv.license_plate,
    sv.model,
    sv.advisor,
    sv.or_value,
    false,
    'Vehículo cargado automáticamente desde sales_vehicles',
    NOW(),
    NOW()
FROM sales_vehicles sv
WHERE sv.sale_date IS NOT NULL
AND sv.license_plate IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM entregas e 
    WHERE e.matricula = sv.license_plate
)
ON CONFLICT (matricula) DO UPDATE SET
    fecha_venta = EXCLUDED.fecha_venta,
    fecha_entrega = EXCLUDED.fecha_entrega,
    modelo = EXCLUDED.modelo,
    asesor = EXCLUDED.asesor,
    "or" = EXCLUDED."or",
    observaciones = EXCLUDED.observaciones,
    updated_at = NOW();

-- Actualizar fechas de entrega para vehículos que no la tienen
UPDATE entregas 
SET 
    fecha_entrega = fecha_venta + INTERVAL '7 days',
    observaciones = COALESCE(observaciones, '') || ' - Fecha de entrega actualizada automáticamente',
    updated_at = NOW()
WHERE fecha_entrega IS NULL 
AND fecha_venta IS NOT NULL;

-- Verificar resultado final
SELECT 'Vehículos cargados en entregas:' as info;
SELECT 
    matricula,
    modelo,
    asesor,
    fecha_venta,
    fecha_entrega,
    CASE 
        WHEN fecha_entrega IS NOT NULL THEN 'Con entrega'
        ELSE 'Sin entrega'
    END as estado_entrega
FROM entregas 
ORDER BY fecha_entrega DESC NULLS LAST;

-- Estadísticas de vehículos
SELECT 'Estadísticas de vehículos:' as info;
SELECT 
    'Total vehículos en entregas' as descripcion,
    COUNT(*) as cantidad
FROM entregas
UNION ALL
SELECT 
    'Vehículos con fecha de entrega' as descripcion,
    COUNT(*) as cantidad
FROM entregas
WHERE fecha_entrega IS NOT NULL
UNION ALL
SELECT 
    'Vehículos sin fecha de entrega' as descripcion,
    COUNT(*) as cantidad
FROM entregas
WHERE fecha_entrega IS NULL
UNION ALL
SELECT 
    'Vehículos en sales_vehicles' as descripcion,
    COUNT(*) as cantidad
FROM sales_vehicles
WHERE sale_date IS NOT NULL;

-- Verificar vehículos que aparecerán en recogidas
SELECT 'Vehículos disponibles para recogidas:' as info;
SELECT 
    e.matricula,
    e.modelo,
    e.asesor,
    e.fecha_entrega,
    CASE 
        WHEN eem.id IS NOT NULL THEN 'Tiene entrega en mano'
        WHEN rh.id IS NOT NULL THEN 'Tiene recogida por mensajería'
        ELSE 'Disponible para recogida'
    END as estado_recogida
FROM entregas e
LEFT JOIN entregas_en_mano eem ON e.matricula = eem.matricula
LEFT JOIN recogidas_historial rh ON e.matricula = rh.matricula
WHERE e.fecha_entrega IS NOT NULL
ORDER BY e.fecha_entrega DESC;

-- Crear vista para facilitar consultas
CREATE OR REPLACE VIEW vehiculos_para_recoger AS
SELECT 
    e.id,
    e.matricula,
    e.modelo,
    e.asesor,
    e.fecha_entrega,
    e.fecha_venta,
    sv.client_name,
    sv.client_email,
    sv.client_phone,
    sv.client_address,
    sv.client_postal_code,
    sv.client_city,
    sv.client_province,
    sv.brand,
    CASE 
        WHEN eem.id IS NOT NULL THEN 'entrega_en_mano'
        WHEN rh.id IS NOT NULL THEN 'mensajeria'
        ELSE 'disponible'
    END as tipo_recogida,
    eem.estado as estado_entrega_mano,
    rh.estado as estado_recogida_mensajeria
FROM entregas e
LEFT JOIN sales_vehicles sv ON e.matricula = sv.license_plate
LEFT JOIN entregas_en_mano eem ON e.matricula = eem.matricula
LEFT JOIN recogidas_historial rh ON e.matricula = rh.matricula
WHERE e.fecha_entrega IS NOT NULL
ORDER BY e.fecha_entrega DESC;

-- Verificar la vista creada
SELECT 'Vista vehiculos_para_recoger creada:' as info;
SELECT 
    matricula,
    modelo,
    client_name,
    tipo_recogida,
    fecha_entrega
FROM vehiculos_para_recoger
LIMIT 10;

-- Resumen final
SELECT '✅ CARGA DE VEHÍCULOS COMPLETADA' as status;
SELECT 'Los vehículos entregados han sido cargados y están disponibles para recogidas' as info; 