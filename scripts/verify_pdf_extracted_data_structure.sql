-- Verificar estructura de la tabla pdf_extracted_data
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pdf_extracted_data'
ORDER BY ordinal_position;
