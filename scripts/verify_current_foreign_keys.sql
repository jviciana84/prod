-- Verificar todas las foreign keys existentes en las tablas de movimientos
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('document_movements', 'key_movements')
ORDER BY tc.table_name, kcu.column_name;

-- Verificar si las tablas existen
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('document_movements', 'key_movements', 'profiles')
    AND table_schema = 'public';

-- Verificar si auth.users existe
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'users' 
    AND table_schema = 'auth';
