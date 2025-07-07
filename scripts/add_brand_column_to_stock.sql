-- Añadir la columna 'brand' a la tabla 'stock' si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock' AND column_name='brand') THEN
        ALTER TABLE stock ADD COLUMN brand TEXT;
        RAISE NOTICE 'Columna "brand" añadida a la tabla "stock".';
    ELSE
        RAISE NOTICE 'La columna "brand" ya existe en la tabla "stock".';
    END IF;
END
$$;

-- Opcional: Si quieres rellenar los datos de 'brand' para los vehículos existentes
-- Esto asume que tienes una lógica para determinar la marca a partir del modelo o matrícula
-- Por ejemplo, si el modelo contiene "BMW" o "MINI"
UPDATE stock
SET brand = CASE
    WHEN model ILIKE '%BMW%' THEN 'BMW'
    WHEN model ILIKE '%MINI%' THEN 'MINI'
    ELSE NULL -- O un valor por defecto si no se puede determinar
END
WHERE brand IS NULL;

-- Si tienes una tabla 'sales_vehicles' con datos de marca que quieres sincronizar
-- UPDATE stock s
-- SET brand = sv.brand
-- FROM sales_vehicles sv
-- WHERE s.license_plate = sv.license_plate
-- AND s.brand IS NULL
-- AND sv.brand IS NOT NULL;

-- Asegurar que la política de RLS permite la lectura de esta nueva columna si es necesario
-- Si ya tienes una política de SELECT general (e.g., TRUE), no necesitas hacer nada.
-- Si tienes políticas más restrictivas, asegúrate de que 'brand' esté incluida o que la política sea lo suficientemente amplia.
