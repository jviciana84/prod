-- Diagnóstico de registros en sales_vehicles con advisor_id NULL
-- Intenta encontrar perfiles coincidentes para ayudar a depurar por qué advisor_id no se rellena.

SELECT
    sv.id AS sales_vehicle_id,
    sv.license_plate,
    sv.order_date,
    sv.advisor AS sales_vehicles_advisor_alias, -- El alias que tienes en sales_vehicles
    sv.advisor_name AS sales_vehicles_advisor_full_name, -- El nombre completo que tienes en sales_vehicles
    sv.advisor_id AS sales_vehicles_current_advisor_uuid, -- El UUID actual (esperamos que sea NULL aquí)
    p_alias.id AS profile_id_by_alias_match, -- ID del perfil si coincide con sv.advisor (alias)
    p_alias.full_name AS profile_full_name_by_alias_match,
    p_alias.alias AS profile_alias_by_alias_match,
    p_name.id AS profile_id_by_name_match, -- ID del perfil si coincide con sv.advisor_name (full_name)
    p_name.full_name AS profile_full_name_by_name_match,
    p_name.alias AS profile_alias_by_name_match
FROM
    sales_vehicles sv
LEFT JOIN
    profiles p_alias ON sv.advisor = p_alias.alias -- Intenta coincidir por alias
LEFT JOIN
    profiles p_name ON sv.advisor_name = p_name.full_name -- Intenta coincidir por nombre completo
WHERE
    sv.advisor_id IS NULL
ORDER BY
    sv.order_date DESC;
