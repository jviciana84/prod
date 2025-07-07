-- Verificar las políticas RLS de la tabla pdf_extracted_data
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pdf_extracted_data';

-- También verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'pdf_extracted_data';
