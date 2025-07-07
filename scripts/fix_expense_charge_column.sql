-- Si necesitas modificar la columna, puedes usar estos comandos:

-- 1. Si necesitas cambiar el tipo de datos a VARCHAR(100):
ALTER TABLE stock ALTER COLUMN expense_charge TYPE VARCHAR(100);

-- 2. Si necesitas hacer la columna nullable (permitir valores NULL):
ALTER TABLE stock ALTER COLUMN expense_charge DROP NOT NULL;

-- 3. Si necesitas eliminar un valor predeterminado:
ALTER TABLE stock ALTER COLUMN expense_charge DROP DEFAULT;

-- 4. Si necesitas añadir un valor predeterminado:
-- ALTER TABLE stock ALTER COLUMN expense_charge SET DEFAULT NULL;

-- Verificar que los cambios se han aplicado correctamente
SELECT 
    column_name, 
    data_type, 
    character_maximum_length, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'stock' 
    AND column_name = 'expense_charge';
