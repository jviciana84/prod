-- =====================================================
-- VERIFICAR SINCRONIZACIÓN FOTOS vs STOCK
-- =====================================================
-- Descripción: Verificar que los vehículos marcados como vendido en fotos
-- estén correctamente marcados como vendidos en stock
-- =====================================================

-- 1. VEHÍCULOS MARCADOS COMO VENDIDO EN FOTOS
SELECT
    'VEHÍCULOS VENDIDOS EN FOTOS' as info,
    license_plate,
    model,
    photos_completed,
    estado_pintura,
    created_at
FROM fotos
WHERE estado_pintura = 'vendido'
ORDER BY created_at DESC;

-- 2. VERIFICAR SI ESTOS VEHÍCULOS ESTÁN EN STOCK
SELECT
    'SINCRONIZACIÓN FOTOS vs STOCK' as info,
    f.license_plate,
    f.model as foto_model,
    s.model as stock_model,
    f.estado_pintura,
    s.is_sold,
    s.mechanical_status,
    s.body_status,
    CASE 
        WHEN s.license_plate IS NULL THEN '❌ NO EN STOCK'
        WHEN s.is_sold = true THEN '✅ VENDIDO EN STOCK'
        WHEN s.is_sold = false THEN '❌ DISPONIBLE EN STOCK (INCORRECTO)'
        WHEN s.is_sold IS NULL THEN '❌ SIN ESTADO EN STOCK'
    END as estado_sincronizacion
FROM fotos f
LEFT JOIN stock s ON f.license_plate = s.license_plate
WHERE f.estado_pintura = 'vendido'
ORDER BY f.created_at DESC;

-- 3. VEHÍCULOS QUE DEBERÍAN ESTAR MARCADOS COMO VENDIDOS EN STOCK
SELECT
    'VEHÍCULOS QUE FALTAN MARCADOS COMO VENDIDOS' as info,
    f.license_plate,
    f.model,
    f.estado_pintura,
    s.is_sold,
    s.mechanical_status,
    s.body_status
FROM fotos f
LEFT JOIN stock s ON f.license_plate = s.license_plate
WHERE f.estado_pintura = 'vendido'
AND (s.is_sold = false OR s.is_sold IS NULL)
ORDER BY f.created_at DESC;

-- 4. CONTAR VEHÍCULOS POR ESTADO DE SINCRONIZACIÓN
SELECT
    'RESUMEN SINCRONIZACIÓN' as info,
    COUNT(*) as total_vehiculos_vendidos_en_fotos,
    COUNT(CASE WHEN s.is_sold = true THEN 1 END) as vendidos_en_stock,
    COUNT(CASE WHEN s.is_sold = false OR s.is_sold IS NULL THEN 1 END) as no_sincronizados
FROM fotos f
LEFT JOIN stock s ON f.license_plate = s.license_plate
WHERE f.estado_pintura = 'vendido'; 