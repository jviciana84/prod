-- Verificar las propiedades de la columna expense_charge en la tabla stock
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
