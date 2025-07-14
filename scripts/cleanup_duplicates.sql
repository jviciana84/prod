-- Script para limpiar duplicados y corregir datos corruptos
-- Ejecutar este script en Supabase SQL Editor

-- 1. Ver duplicados por message_id
SELECT message_id, COUNT(*) as count
FROM docuware_requests 
WHERE message_id IS NOT NULL
GROUP BY message_id 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Ver solicitudes con license_plate 8753MBS
SELECT id, email_subject, license_plate, receiver_alias, message_id, created_at
FROM docuware_requests 
WHERE license_plate = '8753MBS'
ORDER BY created_at DESC;

-- 3. Ver materiales duplicados para 8753MBS
SELECT dr.id, dr.license_plate, drm.material_type, drm.material_label, drm.selected
FROM docuware_requests dr
JOIN docuware_request_materials drm ON dr.id = drm.docuware_request_id
WHERE dr.license_plate = '8753MBS'
ORDER BY dr.created_at DESC, drm.material_type;

-- 4. Limpiar duplicados (mantener solo la más reciente)
DELETE FROM docuware_requests 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY message_id ORDER BY created_at DESC) as rn
    FROM docuware_requests 
    WHERE message_id IN (
      SELECT message_id 
      FROM docuware_requests 
      WHERE message_id IS NOT NULL
      GROUP BY message_id 
      HAVING COUNT(*) > 1
    )
  ) t WHERE rn > 1
);

-- 5. Actualizar receiver_alias para solicitudes que lo tengan como null
UPDATE docuware_requests 
SET receiver_alias = 'jordivi'
WHERE receiver_alias IS NULL 
AND email_subject LIKE '%JORDIVI%';

-- 6. Verificar resultado
SELECT license_plate, receiver_alias, message_id, created_at
FROM docuware_requests 
WHERE license_plate LIKE '%875%'
ORDER BY created_at DESC; 