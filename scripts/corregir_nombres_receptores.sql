-- SCRIPT PARA CORREGIR NOMBRES DE RECEPTORES EN SOLICITUDES EXISTENTES
-- Actualiza receiver_alias con el nombre completo del asesor

-- Actualizar solicitudes existentes con el nombre completo del asesor
UPDATE key_document_requests 
SET receiver_alias = profiles.full_name
FROM profiles 
WHERE key_document_requests.receiver_alias = profiles.alias
AND profiles.full_name IS NOT NULL;

-- Verificar los cambios
SELECT 
    kdr.license_plate,
    kdr.requester,
    kdr.receiver_alias,
    p.full_name as nombre_completo,
    p.alias as alias_original
FROM key_document_requests kdr
LEFT JOIN profiles p ON kdr.receiver_alias = p.alias OR kdr.receiver_alias = p.full_name
ORDER BY kdr.created_at DESC
LIMIT 10;

-- Mostrar estadísticas
SELECT 
    'Solicitudes actualizadas' as estado,
    COUNT(*) as total
FROM key_document_requests 
WHERE receiver_alias IS NOT NULL; 