-- Script para rellenar la columna sales_vehicles.advisor_id con el UUID del perfil
-- basado en el alias existente en sales_vehicles.advisor.

UPDATE sales_vehicles sv
SET
    advisor_id = p.id,
    updated_at = NOW()
FROM
    profiles p
WHERE
    sv.advisor = p.alias -- Coincide el alias de sales_vehicles con el alias del perfil
    AND sv.advisor_id IS NULL; -- Solo actualiza si advisor_id es NULL

-- Opcional: Si hay casos donde el advisor_name es el nombre completo y no hay alias,
-- y quieres intentar mapear por el nombre completo si el alias no funciona.
-- Descomenta y ajusta si es necesario.
-- UPDATE sales_vehicles sv
-- SET
--     advisor_id = p.id,
--     updated_at = NOW()
-- FROM
--     profiles p
-- WHERE
--     sv.advisor_name = p.full_name -- Coincide el nombre completo de sales_vehicles con el nombre completo del perfil
--     AND sv.advisor_id IS NULL; -- Solo actualiza si advisor_id es NULL

-- Verifica los resultados (opcional, después de ejecutar el UPDATE)
SELECT
    sv.id AS sales_vehicle_id,
    sv.license_plate,
    sv.advisor AS sales_vehicles_advisor_alias,
    sv.advisor_name AS sales_vehicles_advisor_full_name,
    sv.advisor_id AS sales_vehicles_advisor_uuid,
    p.id AS profile_id,
    p.full_name AS profile_full_name,
    p.alias AS profile_alias
FROM
    sales_vehicles sv
LEFT JOIN
    profiles p ON sv.advisor_id = p.id -- Ahora unimos por advisor_id
WHERE
    sv.advisor_id IS NOT NULL
ORDER BY
    sv.created_at DESC
LIMIT 100; -- Limita para no cargar demasiados datos
