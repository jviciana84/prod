-- Verificar si las tablas de incentivos ya existen
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%incentivo%'
ORDER BY table_name;
