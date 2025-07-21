-- SCRIPT PARA LIMPIAR OBSERVACIONES EXISTENTES
-- Elimina el texto "Migrado desde venta existente" de las observaciones

-- Limpiar observaciones en solicitudes principales
UPDATE key_document_requests
SET observations = ''
WHERE observations = 'Migrado desde venta existente';

-- Limpiar observaciones en materiales
UPDATE key_document_materials
SET observations = ''
WHERE observations = 'Migrado desde venta existente';

-- Verificar los cambios
SELECT
    'Solicitudes limpiadas' as tipo,
    COUNT(*) as total
FROM key_document_requests
WHERE observations = ''
UNION ALL
SELECT
    'Materiales limpiados' as tipo,
    COUNT(*) as total
FROM key_document_materials
WHERE observations = '';

-- Mostrar algunas solicitudes para verificar
SELECT
    license_plate,
    requester,
    observations,
    created_at
FROM key_document_requests
ORDER BY created_at DESC
LIMIT 5;

-- Mostrar algunos materiales para verificar
SELECT
    material_type,
    material_label,
    observations,
    created_at
FROM key_document_materials
ORDER BY created_at DESC
LIMIT 5;

-- Mensaje de confirmación
SELECT 'OBSERVACIONES LIMPIADAS CORRECTAMENTE' as estado; 