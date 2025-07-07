-- Diagnóstico de mapeo de asesores para ventas en un rango de fechas.
-- Muestra cómo se relacionan los campos 'advisor' y 'advisor_name' de sales_vehicles
-- con los campos 'id', 'full_name' y 'alias' de la tabla profiles.
-- Ajusta las fechas '2025-06-01' y '2025-07-01' según el mes que quieras diagnosticar.

SELECT
    sv.id AS sales_vehicle_id,
    sv.license_plate,
    sv.order_date,
    sv.price,
    sv.payment_method,
    sv.advisor AS sales_vehicles_advisor_uuid, -- El UUID del usuario en sales_vehicles
    sv.advisor_name AS sales_vehicles_advisor_name, -- El nombre de texto en sales_vehicles
    p.id AS profile_id, -- El ID del perfil en la tabla profiles (si hay coincidencia)
    p.full_name AS profile_full_name, -- El nombre completo del perfil (si hay coincidencia)
    p.alias AS profile_alias, -- El alias del perfil (si hay coincidencia)
    p.email AS profile_email -- El email del perfil (si hay coincidencia)
FROM
    sales_vehicles sv
LEFT JOIN
    profiles p ON sv.advisor = p.id -- Intenta unir sales_vehicles.advisor (UUID) con profiles.id (UUID)
WHERE
    sv.order_date >= '2025-06-01' AND sv.order_date < '2025-07-01' -- Rango de fechas para junio de 2025
ORDER BY
    sv.order_date ASC, sv.advisor_name ASC;
