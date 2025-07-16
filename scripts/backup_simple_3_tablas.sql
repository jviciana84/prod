-- =====================================================
-- BACKUP SIMPLE - SOLO 3 TABLAS PRINCIPALES
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Backup de nuevas_entradas, stock y fotos antes de implementar duc_scraper
-- =====================================================

-- Crear tablas de backup con sufijo _backup_YYYYMMDD
DO $$
DECLARE
    backup_suffix TEXT := '_backup_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MI');
BEGIN
    -- Backup de nuevas_entradas (solo 4 registros)
    EXECUTE 'CREATE TABLE IF NOT EXISTS nuevas_entradas' || backup_suffix || ' AS SELECT * FROM nuevas_entradas';
    
    -- Backup de stock
    EXECUTE 'CREATE TABLE IF NOT EXISTS stock' || backup_suffix || ' AS SELECT * FROM stock';
    
    -- Backup de fotos
    EXECUTE 'CREATE TABLE IF NOT EXISTS fotos' || backup_suffix || ' AS SELECT * FROM fotos';
    
    RAISE NOTICE 'Backup completado con sufijo: %', backup_suffix;
END $$;

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
ORDER BY tabla;

-- Mostrar los 4 registros de nuevas_entradas para verificar
SELECT 
    id,
    license_plate,
    model,
    vehicle_type,
    is_received,
    status,
    created_at
FROM nuevas_entradas
ORDER BY created_at;

-- Crear función simple para restaurar solo estas 3 tablas
CREATE OR REPLACE FUNCTION restore_3_tablas_from_backup(backup_suffix TEXT)
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
    
    RAISE NOTICE 'Restauración completada desde backup: %', backup_suffix;
END;
$$ LANGUAGE plpgsql;

-- Mostrar mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'BACKUP SIMPLE COMPLETADO';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Se han respaldado solo las 3 tablas principales:';
    RAISE NOTICE '- nuevas_entradas (4 registros)';
    RAISE NOTICE '- stock';
    RAISE NOTICE '- fotos';
    RAISE NOTICE '';
    RAISE NOTICE 'Para restaurar: SELECT restore_3_tablas_from_backup(''sufijo_del_backup'');';
    RAISE NOTICE '=====================================================';
END $$; 