-- Verificar la estructura actual de las tablas
SELECT column_name, is_nullable, column_default, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_quarterly_objectives' 
AND column_name = 'id';

SELECT column_name, is_nullable, column_default, data_type 
FROM information_schema.columns 
WHERE table_name = 'financial_penetration_objectives' 
AND column_name = 'id';

-- Hacer que la columna id sea nullable y tenga un valor por defecto
-- Esto permitirá que los upserts funcionen correctamente
ALTER TABLE public.sales_quarterly_objectives 
ALTER COLUMN id DROP NOT NULL;

ALTER TABLE public.sales_quarterly_objectives 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.financial_penetration_objectives 
ALTER COLUMN id DROP NOT NULL;

ALTER TABLE public.financial_penetration_objectives 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verificar que los cambios se aplicaron correctamente
SELECT column_name, is_nullable, column_default, data_type 
FROM information_schema.columns 
WHERE table_name IN ('sales_quarterly_objectives', 'financial_penetration_objectives') 
AND column_name = 'id';
