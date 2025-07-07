-- Script para diagnosticar los datos de los rankings de Ventas y Financiación (Versión 2 - Más robusta)

-- 1. Verificar la estructura de la tabla sales_vehicles (columnas clave)
SELECT
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'sales_vehicles'
    AND column_name IN ('id', 'created_at', 'advisor', 'advisor_name', 'payment_method', 'vehicle_type', 'price');

-- 2. Verificar la estructura de la tabla profiles (columnas clave)
SELECT
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'profiles'
    AND column_name IN ('id', 'full_name', 'avatar_url');

-- 3. Identificar valores en sales_vehicles.advisor que NO son UUIDs válidos
-- Estos son los valores que causan el error de CAST si se intenta forzar la conversión.
-- Te mostrará todos los 'advisor' que no tienen formato de UUID.
SELECT
    DISTINCT advisor
FROM
    public.sales_vehicles
WHERE
    advisor IS NOT NULL
    AND NOT (advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');

-- 4. Contar ventas totales y financiadas para el mes actual
-- Ajusta el año y el mes según sea necesario para tu diagnóstico
-- Ejemplo: para Junio 2025
SELECT
    COUNT(*) AS total_sales_this_month,
    COUNT(CASE WHEN payment_method = 'Financiado' THEN 1 END) AS financed_sales_this_month
FROM
    public.sales_vehicles
WHERE
    created_at >= '2025-06-01 00:00:00' AND created_at < '2025-07-01 00:00:00';

-- 5. Contar ventas totales y financiadas por asesor para el mes actual (más robusto para diagnóstico)
-- Este query intentará unir con profiles solo si sv.advisor parece un UUID.
-- Si sv.advisor no es un UUID, se mostrará el advisor tal cual y se indicará que no hay match de perfil.
SELECT
    sv.advisor,
    COALESCE(p.full_name, sv.advisor_name, sv.advisor) AS advisor_display_name,
    COUNT(sv.id) AS total_sales_count,
    COUNT(CASE WHEN sv.payment_method = 'Financiado' THEN 1 END) AS financed_sales_count,
    SUM(sv.price) AS total_revenue,
    SUM(CASE WHEN sv.payment_method = 'Financiado' THEN sv.price ELSE 0 END) AS total_financed_amount,
    CASE
        WHEN sv.advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND p.id IS NOT NULL THEN 'Profile Matched (UUID)'
        WHEN sv.advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND p.id IS NULL THEN 'UUID but No Profile Match'
        ELSE 'Non-UUID Advisor'
    END AS profile_status
FROM
    public.sales_vehicles sv
LEFT JOIN
    public.profiles p ON p.id = (CASE WHEN sv.advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN CAST(sv.advisor AS UUID) ELSE NULL END)
WHERE
    sv.created_at >= '2025-06-01 00:00:00' AND sv.created_at < '2025-07-01 00:00:00'
GROUP BY
    sv.advisor, sv.advisor_name, p.full_name, p.id
ORDER BY
    total_sales_count DESC, total_revenue DESC;

-- 6. Contar ventas totales y financiadas por asesor para el año actual (más robusto para diagnóstico)
SELECT
    sv.advisor,
    COALESCE(p.full_name, sv.advisor_name, sv.advisor) AS advisor_display_name,
    COUNT(sv.id) AS total_sales_count_year,
    COUNT(CASE WHEN sv.payment_method = 'Financiado' THEN 1 END) AS financed_sales_count_year,
    SUM(sv.price) AS total_revenue_year,
    SUM(CASE WHEN sv.payment_method = 'Financiado' THEN sv.price ELSE 0 END) AS total_financed_amount_year,
    CASE
        WHEN sv.advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND p.id IS NOT NULL THEN 'Profile Matched (UUID)'
        WHEN sv.advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND p.id IS NULL THEN 'UUID but No Profile Match'
        ELSE 'Non-UUID Advisor'
    END AS profile_status
FROM
    public.sales_vehicles sv
LEFT JOIN
    public.profiles p ON p.id = (CASE WHEN sv.advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN CAST(sv.advisor AS UUID) ELSE NULL END)
WHERE
    sv.created_at >= '2025-01-01 00:00:00' AND sv.created_at < '2026-01-01 00:00:00'
GROUP BY
    sv.advisor, sv.advisor_name, p.full_name, p.id
ORDER BY
    total_sales_count_year DESC, total_revenue_year DESC;

-- 7. Verificar si hay valores nulos en columnas clave para el mes actual
SELECT
    'sales_vehicles' AS table_name,
    COUNT(*) FILTER (WHERE created_at IS NULL) AS null_created_at,
    COUNT(*) FILTER (WHERE advisor IS NULL) AS null_advisor,
    COUNT(*) FILTER (WHERE price IS NULL) AS null_price,
    COUNT(*) FILTER (WHERE payment_method IS NULL) AS null_payment_method,
    COUNT(*) FILTER (WHERE vehicle_type IS NULL) AS null_vehicle_type
FROM
    public.sales_vehicles
WHERE
    created_at >= '2025-06-01 00:00:00' AND created_at < '2025-07-01 00:00:00';

-- 8. Verificar si hay asesores en sales_vehicles que no tienen perfil
-- (Esto incluye tanto advisors que no son UUIDs como UUIDs que no existen en profiles)
SELECT DISTINCT
    sv.advisor,
    sv.advisor_name,
    CASE
        WHEN sv.advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN 'Potentially UUID'
        ELSE 'Non-UUID String'
    END AS advisor_type,
    p.id AS matched_profile_id,
    p.full_name AS matched_profile_name
FROM
    public.sales_vehicles sv
LEFT JOIN
    public.profiles p ON p.id = (CASE WHEN sv.advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN CAST(sv.advisor AS UUID) ELSE NULL END)
WHERE
    p.id IS NULL AND sv.advisor IS NOT NULL;
