-- Script para limpiar valores no-UUID en sales_vehicles.advisor

-- Advertencia: Este script establecerá a NULL los valores en sales_vehicles.advisor
-- que no sean UUIDs válidos. Asegúrate de hacer una copia de seguridad si es necesario.

UPDATE public.sales_vehicles
SET
    advisor = NULL,
    advisor_name = NULL -- Opcional: también puedes limpiar advisor_name si no es relevante sin un advisor ID
WHERE
    advisor IS NOT NULL
    AND NOT (advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');

-- Opcional: Si quieres ver cuántas filas se actualizaron
SELECT COUNT(*) FROM public.sales_vehicles
WHERE advisor IS NULL
AND NOT (advisor ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
