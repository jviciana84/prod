-- SCRIPT PARA VERIFICAR QUE LAS OBSERVACIONES ESTÉN LIMPIAS
-- Verifica que no queden observaciones con "Migrado desde venta existente"

-- Verificar solicitudes con observaciones incorrectas
SELECT
    'SOLICITUDES CON OBSERVACIONES INCORRECTAS' as tipo,
    license_plate,
    requester,
    observations,
    created_at
FROM key_document_requests
WHERE observations LIKE '%Migrado desde venta existente%'
   OR observations LIKE '%migrado%'
   OR observations LIKE '%existente%';

-- Verificar materiales con observaciones incorrectas
SELECT
    'MATERIALES CON OBSERVACIONES INCORRECTAS' as tipo,
    material_type,
    material_label,
    observations,
    created_at
FROM key_document_materials
WHERE observations LIKE '%Migrado desde venta existente%'
   OR observations LIKE '%migrado%'
   OR observations LIKE '%existente%';

-- Mostrar estadísticas generales
SELECT
    'ESTADÍSTICAS GENERALES' as seccion,
    'Solicitudes con observaciones vacías' as tipo,
    COUNT(*) as total
FROM key_document_requests
WHERE observations = '' OR observations IS NULL
UNION ALL
SELECT
    'ESTADÍSTICAS GENERALES' as seccion,
    'Materiales con observaciones vacías' as tipo,
    COUNT(*) as total
FROM key_document_materials
WHERE observations = '' OR observations IS NULL
UNION ALL
SELECT
    'ESTADÍSTICAS GENERALES' as seccion,
    'Materiales con texto correcto' as tipo,
    COUNT(*) as total
FROM key_document_materials
WHERE observations = 'Generado automáticamente desde venta';

-- Mostrar algunas solicitudes recientes para verificar
SELECT
    'SOLICITUDES RECIENTES' as seccion,
    license_plate,
    requester,
    observations,
    created_at
FROM key_document_requests
ORDER BY created_at DESC
LIMIT 10;

-- Mostrar algunos materiales recientes para verificar
SELECT
    'MATERIALES RECIENTES' as seccion,
    material_type,
    material_label,
    observations,
    created_at
FROM key_document_materials
ORDER BY created_at DESC
LIMIT 10;

-- Mensaje final
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM key_document_requests 
            WHERE observations LIKE '%Migrado desde venta existente%'
        ) OR EXISTS (
            SELECT 1 FROM key_document_materials 
            WHERE observations LIKE '%Migrado desde venta existente%'
        )
        THEN '⚠️ AÚN HAY OBSERVACIONES INCORRECTAS - EJECUTAR SCRIPT DE LIMPIEZA'
        ELSE '✅ TODAS LAS OBSERVACIONES ESTÁN LIMPIAS'
    END as estado; 