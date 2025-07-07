-- Este script obtiene las ventas de Jordi Viciana en junio de 2025,
-- incluyendo información de su perfil para diagnosticar el problema del nombre.
SELECT
    sv.license_plate,
    sv.order_date,
    sv.price,
    sv.payment_method,
    sv.vehicle_type,
    sv.advisor AS sales_advisor_id, -- ID del asesor en sales_vehicles (debería ser UUID)
    sv.advisor_name,
    p.id AS profile_id, -- ID del perfil en la tabla profiles
    p.full_name AS profile_full_name,
    p.alias AS profile_alias
FROM
    sales_vehicles sv
LEFT JOIN
    profiles p ON sv.advisor = p.id -- Intenta unir por el ID del asesor
WHERE
    sv.order_date >= '2025-06-01' AND sv.order_date < '2025-07-01'
    AND (
        sv.advisor_name ILIKE '%Jordi Viciana%' OR
        p.full_name ILIKE '%Jordi Viciana%' OR
        p.alias ILIKE '%JordiVi%'
    );
