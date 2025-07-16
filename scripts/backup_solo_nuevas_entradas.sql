-- =====================================================
-- BACKUP SOLO NUEVAS_ENTRADAS
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Backup simple de nuevas_entradas antes de implementar duc_scraper
-- =====================================================

-- Crear tabla de backup con fecha
DO $$
DECLARE
    backup_suffix TEXT := '_backup_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MI');
BEGIN
    -- Backup de nuevas_entradas
    EXECUTE 'CREATE TABLE IF NOT EXISTS nuevas_entradas' || backup_suffix || ' AS SELECT * FROM nuevas_entradas';
    
    RAISE NOTICE 'Backup completado con sufijo: %', backup_suffix;
END $$;

-- Mostrar cuántos registros hay
SELECT 
    'nuevas_entradas' as tabla,
    COUNT(*) as registros
FROM nuevas_entradas;

-- Mostrar todos los registros para verificar
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

-- Función simple para restaurar
CREATE OR REPLACE FUNCTION restore_nuevas_entradas_from_backup(backup_suffix TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE 'TRUNCATE nuevas_entradas';
    EXECUTE 'INSERT INTO nuevas_entradas SELECT * FROM nuevas_entradas' || backup_suffix;
    RAISE NOTICE 'Restauración completada desde backup: %', backup_suffix;
END;
$$ LANGUAGE plpgsql;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'BACKUP NUEVAS_ENTRADAS COMPLETADO';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Para restaurar: SELECT restore_nuevas_entradas_from_backup(''sufijo_del_backup'');';
    RAISE NOTICE '=====================================================';
END $$; 