-- =====================================================
-- BACKUP COMPLETO DE DATOS ACTUALES
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Backup de todas las tablas principales antes de implementar duc_scraper
-- =====================================================

-- Crear tablas de backup con sufijo _backup_YYYYMMDD
DO $$
DECLARE
    backup_suffix TEXT := '_backup_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MI');
BEGIN
    -- Backup de nuevas_entradas
    EXECUTE 'CREATE TABLE IF NOT EXISTS nuevas_entradas' || backup_suffix || ' AS SELECT * FROM nuevas_entradas';
    
    -- Backup de stock
    EXECUTE 'CREATE TABLE IF NOT EXISTS stock' || backup_suffix || ' AS SELECT * FROM stock';
    
    -- Backup de fotos
    EXECUTE 'CREATE TABLE IF NOT EXISTS fotos' || backup_suffix || ' AS SELECT * FROM fotos';
    
    -- Backup de sales_vehicles
    EXECUTE 'CREATE TABLE IF NOT EXISTS sales_vehicles' || backup_suffix || ' AS SELECT * FROM sales_vehicles';
    
    -- Backup de pedidos_validados
    EXECUTE 'CREATE TABLE IF NOT EXISTS pedidos_validados' || backup_suffix || ' AS SELECT * FROM pedidos_validados';
    
    -- Backup de entregas
    EXECUTE 'CREATE TABLE IF NOT EXISTS entregas' || backup_suffix || ' AS SELECT * FROM entregas';
    
    -- Backup de vehicle_keys
    EXECUTE 'CREATE TABLE IF NOT EXISTS vehicle_keys' || backup_suffix || ' AS SELECT * FROM vehicle_keys';
    
    -- Backup de vehicle_documents
    EXECUTE 'CREATE TABLE IF NOT EXISTS vehicle_documents' || backup_suffix || ' AS SELECT * FROM vehicle_documents';
    
    -- Backup de expense_types
    EXECUTE 'CREATE TABLE IF NOT EXISTS expense_types' || backup_suffix || ' AS SELECT * FROM expense_types';
    
    -- Backup de locations
    EXECUTE 'CREATE TABLE IF NOT EXISTS locations' || backup_suffix || ' AS SELECT * FROM locations';
    
    RAISE NOTICE 'Backup completado con sufijo: %', backup_suffix;
END $$;

-- Verificar que se crearon las tablas de backup
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.table_name) as registros
FROM (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%_backup_%'
    ORDER BY table_name
) t;

-- Mostrar estadísticas de datos respaldados
SELECT 
    'nuevas_entradas' as tabla,
    COUNT(*) as registros
FROM nuevas_entradas
UNION ALL
SELECT 
    'stock' as tabla,
    COUNT(*) as registros
FROM stock
UNION ALL
SELECT 
    'fotos' as tabla,
    COUNT(*) as registros
FROM fotos
UNION ALL
SELECT 
    'sales_vehicles' as tabla,
    COUNT(*) as registros
FROM sales_vehicles
UNION ALL
SELECT 
    'pedidos_validados' as tabla,
    COUNT(*) as registros
FROM pedidos_validados
UNION ALL
SELECT 
    'entregas' as tabla,
    COUNT(*) as registros
FROM entregas
UNION ALL
SELECT 
    'vehicle_keys' as tabla,
    COUNT(*) as registros
FROM vehicle_keys
UNION ALL
SELECT 
    'vehicle_documents' as tabla,
    COUNT(*) as registros
FROM vehicle_documents
ORDER BY tabla;

-- Crear función para restaurar datos si es necesario
CREATE OR REPLACE FUNCTION restore_from_backup(backup_suffix TEXT)
RETURNS void AS $$
BEGIN
    -- Restaurar nuevas_entradas
    EXECUTE 'TRUNCATE nuevas_entradas';
    EXECUTE 'INSERT INTO nuevas_entradas SELECT * FROM nuevas_entradas' || backup_suffix;
    
    -- Restaurar stock
    EXECUTE 'TRUNCATE stock';
    EXECUTE 'INSERT INTO stock SELECT * FROM stock' || backup_suffix;
    
    -- Restaurar fotos
    EXECUTE 'TRUNCATE fotos';
    EXECUTE 'INSERT INTO fotos SELECT * FROM fotos' || backup_suffix;
    
    -- Restaurar sales_vehicles
    EXECUTE 'TRUNCATE sales_vehicles';
    EXECUTE 'INSERT INTO sales_vehicles SELECT * FROM sales_vehicles' || backup_suffix;
    
    -- Restaurar pedidos_validados
    EXECUTE 'TRUNCATE pedidos_validados';
    EXECUTE 'INSERT INTO pedidos_validados SELECT * FROM pedidos_validados' || backup_suffix;
    
    -- Restaurar entregas
    EXECUTE 'TRUNCATE entregas';
    EXECUTE 'INSERT INTO entregas SELECT * FROM entregas' || backup_suffix;
    
    -- Restaurar vehicle_keys
    EXECUTE 'TRUNCATE vehicle_keys';
    EXECUTE 'INSERT INTO vehicle_keys SELECT * FROM vehicle_keys' || backup_suffix;
    
    -- Restaurar vehicle_documents
    EXECUTE 'TRUNCATE vehicle_documents';
    EXECUTE 'INSERT INTO vehicle_documents SELECT * FROM vehicle_documents' || backup_suffix;
    
    RAISE NOTICE 'Restauración completada desde backup: %', backup_suffix;
END;
$$ LANGUAGE plpgsql;

-- Crear función para listar backups disponibles
CREATE OR REPLACE FUNCTION list_backups()
RETURNS TABLE(backup_name TEXT, created_date TIMESTAMP) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        table_name::TEXT,
        NOW() as created_date
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%_backup_%'
    ORDER BY table_name;
END;
$$ LANGUAGE plpgsql;

-- Mostrar mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'BACKUP COMPLETADO EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Se han creado copias de seguridad de todas las tablas principales';
    RAISE NOTICE 'Para restaurar: SELECT restore_from_backup(''sufijo_del_backup'');';
    RAISE NOTICE 'Para listar backups: SELECT * FROM list_backups();';
    RAISE NOTICE '=====================================================';
END $$; 