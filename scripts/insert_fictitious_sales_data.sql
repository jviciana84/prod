-- Script para insertar datos de ventas ficticios para probar los rankings

-- Paso 1: Obtener algunos IDs de usuario existentes de la tabla profiles
-- Asegúrate de que estos IDs existan en tu tabla 'profiles'
WITH existing_advisors AS (
    SELECT id, full_name
    FROM public.profiles
    WHERE full_name IS NOT NULL AND full_name != ''
    LIMIT 5 -- Obtener hasta 5 asesores para la prueba
),
-- Paso 2: Generar datos de ventas ficticios usando los IDs de los asesores
fictitious_sales AS (
    SELECT
        gen_random_uuid() AS id,
        (SELECT id FROM existing_advisors ORDER BY RANDOM() LIMIT 1) AS advisor_id,
        (SELECT full_name FROM existing_advisors ORDER BY RANDOM() LIMIT 1) AS advisor_name_val,
        -- Asegurarse de que la fecha sea del mes actual para que aparezca en el ranking mensual
        (NOW() - (random() * interval '20 days'))::date AS created_at_date,
        CASE
            WHEN random() < 0.7 THEN 'Contado'
            ELSE 'Financiado'
        END AS payment_method_val,
        CASE
            WHEN random() < 0.8 THEN 'Coche'
            ELSE 'Moto'
        END AS vehicle_type_val,
        (FLOOR(random() * 50000) + 10000)::numeric AS price_val, -- Precios entre 10,000 y 60,000
        'Fictitious Client' AS client_name_val,
        'Fictitious Vehicle' AS vehicle_model_val,
        'Fictitious License' AS license_plate_val
    FROM generate_series(1, 20) -- Generar 20 ventas ficticias
)
-- Paso 3: Insertar los datos ficticios en sales_vehicles
INSERT INTO public.sales_vehicles (
    id, created_at, advisor, advisor_name, payment_method, vehicle_type, price,
    client_name, vehicle_model, license_plate
)
SELECT
    id,
    created_at_date,
    advisor_id::text, -- Convertir UUID a TEXT para la columna advisor
    advisor_name_val,
    payment_method_val,
    vehicle_type_val,
    price_val,
    client_name_val,
    vehicle_model_val,
    license_plate_val
FROM
    fictitious_sales;

-- Opcional: Verificar los datos insertados
SELECT * FROM public.sales_vehicles
WHERE client_name = 'Fictitious Client'
ORDER BY created_at DESC;
