-- Paso 5: Verificar que todo esté correcto
SELECT 
    'extornos_email_config' as tabla,
    COUNT(*) as registros,
    CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ Sin datos' END as estado
FROM extornos_email_config;

-- Verificar estructura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'extornos_email_config' 
ORDER BY ordinal_position;

-- Verificar RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'extornos_email_config';
