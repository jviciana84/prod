-- Script mejorado para rellenar la columna sales_vehicles.advisor_id con el UUID del perfil.
-- Prioriza la coincidencia por alias, luego por nombre completo.

UPDATE sales_vehicles sv
SET
    advisor_id = COALESCE(p_alias.id, p_name.id), -- Usa el ID del perfil encontrado por alias, si no, por nombre
    updated_at = NOW()
FROM
    sales_vehicles sv_inner -- Usamos un alias para la tabla interna en el FROM
LEFT JOIN
    profiles p_alias ON sv_inner.advisor = p_alias.alias
LEFT JOIN
    profiles p_name ON sv_inner.advisor_name = p_name.full_name
WHERE
    sv.id = sv_inner.id -- Asegura que la actualización se aplique al registro correcto
    AND sv.advisor_id IS NULL -- Solo actualiza si advisor_id es NULL
    AND (p_alias.id IS NOT NULL OR p_name.id IS NOT NULL); -- Solo actualiza si se encontró una coincidencia

-- Opcional: Verifica los resultados después de ejecutar el UPDATE
SELECT
    sv.id AS sales_vehicle_id,
    sv.license_plate,
    sv.advisor AS sales_vehicles_advisor_alias,
    sv.advisor_name AS sales_vehicles_advisor_full_name,
    sv.advisor_id AS sales_vehicles_updated_advisor_uuid,
    p.full_name AS profile_full_name_after_update,
    p.alias AS profile_alias_after_update
FROM
    sales_vehicles sv
LEFT JOIN
    profiles p ON sv.advisor_id = p.id
WHERE
    sv.advisor_id IS NOT NULL
ORDER BY
    sv.updated_at DESC
LIMIT 100;
