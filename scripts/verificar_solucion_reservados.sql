-- =====================================================
-- VERIFICAR QUE LA SOLUCIÓN FUNCIONA
-- =====================================================
-- Descripción: Verificar que todos los vehículos reservados están correctamente
-- sincronizados después de aplicar la solución
-- =====================================================

-- 1. VERIFICAR QUE NO HAY VEHÍCULOS RESERVADOS SIN SINCRONIZAR
SELECT 
    'VERIFICACIÓN FINAL' as info,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ TODOS LOS VEHÍCULOS RESERVADOS ESTÁN SINCRONIZADOS'
        ELSE '❌ AÚN HAY ' || COUNT(*) || ' VEHÍCULOS RESERVADOS SIN SINCRONIZAR'
    END as resultado
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND (s.is_sold IS NULL OR s.is_sold = false);

-- 2. VERIFICAR QUE TODOS LOS RESERVADOS ESTÁN EN SALES_VEHICLES
SELECT 
    'VERIFICACIÓN SALES_VEHICLES' as info,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ TODOS LOS RESERVADOS ESTÁN EN SALES_VEHICLES'
        ELSE '❌ AÚN HAY ' || COUNT(*) || ' RESERVADOS SIN SALES_VEHICLES'
    END as resultado
FROM duc_scraper ds
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND sv.license_plate IS NULL;

-- 3. VERIFICAR QUE TODOS LOS RESERVADOS ESTÁN MARCADOS EN FOTOS
SELECT 
    'VERIFICACIÓN FOTOS' as info,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ TODOS LOS RESERVADOS ESTÁN MARCADOS EN FOTOS'
        ELSE '❌ AÚN HAY ' || COUNT(*) || ' RESERVADOS SIN MARCAR EN FOTOS'
    END as resultado
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND (f.estado_pintura IS NULL OR f.estado_pintura != 'vendido');

-- 4. MOSTRAR RESUMEN FINAL
SELECT 
    'RESUMEN FINAL' as info,
    COUNT(DISTINCT ds."Matrícula") as total_reservados_csv,
    COUNT(DISTINCT s.license_plate) as marcados_stock,
    COUNT(DISTINCT f.license_plate) as marcados_fotos,
    COUNT(DISTINCT sv.license_plate) as en_sales_vehicles
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate AND s.is_sold = true
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate AND f.estado_pintura = 'vendido'
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL;

-- 5. MOSTRAR EJEMPLOS DE VEHÍCULOS CORRECTAMENTE PROCESADOS
SELECT 
    'EJEMPLOS DE VEHÍCULOS PROCESADOS CORRECTAMENTE' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    s.is_sold,
    f.estado_pintura,
    sv.license_plate as en_sales
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
ORDER BY ds.last_seen_date DESC
LIMIT 5; 