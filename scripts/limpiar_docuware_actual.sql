-- SCRIPT PARA LIMPIAR SISTEMA DOCUWARE ACTUAL
-- Ejecutar antes de la migración al nuevo sistema

-- 1. Limpiar materiales de solicitudes Docuware
DELETE FROM docuware_request_materials;

-- 2. Limpiar solicitudes Docuware
DELETE FROM docuware_requests;

-- 3. Limpiar emails recibidos para material@controlvo.ovh (opcional)
DELETE FROM received_emails 
WHERE to_email LIKE '%material@controlvo.ovh%';

-- 4. Limpiar solicitudes de permisos de circulación (opcional)
DELETE FROM circulation_permit_materials;
DELETE FROM circulation_permit_requests;

-- 5. Verificar que se limpiaron correctamente
SELECT 
    'docuware_requests' as tabla,
    COUNT(*) as registros
FROM docuware_requests
UNION ALL
SELECT 
    'docuware_request_materials' as tabla,
    COUNT(*) as registros
FROM docuware_request_materials
UNION ALL
SELECT 
    'received_emails (material)' as tabla,
    COUNT(*) as registros
FROM received_emails 
WHERE to_email LIKE '%material@controlvo.ovh%'
UNION ALL
SELECT 
    'circulation_permit_requests' as tabla,
    COUNT(*) as registros
FROM circulation_permit_requests
UNION ALL
SELECT 
    'circulation_permit_materials' as tabla,
    COUNT(*) as registros
FROM circulation_permit_materials;

-- 6. Mensaje de confirmación
SELECT '✅ LIMPIEZA COMPLETADA - Sistema Docuware listo para migración' as estado; 