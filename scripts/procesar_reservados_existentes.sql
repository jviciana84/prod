-- =====================================================
-- PROCESAR VEHÍCULOS RESERVADOS EXISTENTES
-- =====================================================
-- Descripción: Procesar todos los vehículos que ya están marcados como reservados
-- en el CSV pero que no se han sincronizado correctamente
-- =====================================================

-- 1. MARCAR COMO VENDIDOS EN STOCK
UPDATE stock 
SET is_sold = true 
WHERE license_plate IN (
    SELECT DISTINCT "Matrícula" 
    FROM duc_scraper 
    WHERE "Disponibilidad" ILIKE '%reservado%'
    AND "Matrícula" IS NOT NULL
)
AND (is_sold IS NULL OR is_sold = false);

-- 2. MARCAR EN FOTOS COMO VENDIDOS
UPDATE fotos 
SET estado_pintura = 'vendido' 
WHERE license_plate IN (
    SELECT DISTINCT "Matrícula" 
    FROM duc_scraper 
    WHERE "Disponibilidad" ILIKE '%reservado%'
    AND "Matrícula" IS NOT NULL
);

-- 3. INSERTAR EN SALES_VEHICLES LOS QUE NO EXISTEN
INSERT INTO sales_vehicles (
    license_plate,
    model,
    vehicle_type,
    sale_date,
    advisor,
    payment_method,
    payment_status,
    body_status,
    mechanical_status,
    validation_status,
    created_at,
    updated_at
)
SELECT 
    ds."Matrícula",
    COALESCE(ds."Modelo", 'Sin modelo'),
    'Coche',
    COALESCE(ds."Fecha disponibilidad"::timestamp, ds.last_seen_date),
    COALESCE(ds."Concesionario", 'Sin concesionario'),
    'Contado',
    'Completado',
    'Pendiente',
    'Pendiente',
    'Pendiente',
    NOW(),
    NOW()
FROM duc_scraper ds
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND sv.license_plate IS NULL;

-- 4. VERIFICAR RESULTADOS
SELECT 
    'RESULTADOS DEL PROCESAMIENTO' as info,
    COUNT(DISTINCT ds."Matrícula") as vehiculos_reservados_csv,
    COUNT(DISTINCT s.license_plate) as vehiculos_marcados_stock,
    COUNT(DISTINCT f.license_plate) as vehiculos_marcados_fotos,
    COUNT(DISTINCT sv.license_plate) as vehiculos_en_sales
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate AND s.is_sold = true
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate AND f.estado_pintura = 'vendido'
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL; 