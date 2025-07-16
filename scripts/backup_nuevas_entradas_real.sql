-- =====================================================
-- BACKUP NUEVAS_ENTRADAS - DATOS REALES
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Backup de nuevas_entradas con datos reales antes de implementar duc_scraper
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

-- Función para restaurar los datos exactos
CREATE OR REPLACE FUNCTION restore_nuevas_entradas_exact()
RETURNS void AS $$
BEGIN
    -- Primero limpiar la tabla
    TRUNCATE nuevas_entradas;
    
    -- Insertar los datos exactos
    INSERT INTO nuevas_entradas (
        id,
        license_plate,
        model,
        origin_location_id,
        expense_type_id,
        purchase_date,
        is_received,
        reception_date,
        expense_charge,
        created_at,
        updated_at,
        purchase_price,
        vehicle_type,
        location_id
    ) VALUES 
    (
        '58563c4c-e59f-4e39-81a6-00f83155a99b',
        '7830LKM',
        'Countryman',
        14,
        13,
        '2025-05-09',
        true,
        '2025-06-09 11:07:06.795+00',
        'VN Vilanova',
        '2025-06-07 19:31:33.13698+00',
        null,
        19500.00,
        null,
        null
    ),
    (
        '83c9d6f7-1ca7-4df2-b2ff-28095e185e21',
        '7166MTB',
        'Cooper SE',
        4,
        9,
        '2025-02-14',
        true,
        '2025-06-20 21:14:26.912+00',
        null,
        '2025-06-07 19:28:31.463506+00',
        null,
        38173.79,
        null,
        null
    ),
    (
        '915dc17e-1237-416d-8e03-1d31e07c0f0b',
        '3742MVJ',
        'ix1',
        4,
        4,
        '2025-02-01',
        true,
        '2025-06-20 21:14:34.69+00',
        null,
        '2025-06-07 19:25:44.410362+00',
        null,
        42987.30,
        null,
        null
    ),
    (
        '2b6a4423-c397-4e82-9e25-32b9952b2ee2',
        '9781LRW',
        '218d Coupe 110 kW (150 CV)',
        3,
        12,
        '2025-06-30',
        false,
        null,
        null,
        '2025-07-12 11:21:07.62024+00',
        null,
        21330.72,
        null,
        null
    ),
    (
        '204d8de0-07a1-4b28-965e-a4a8e735678e',
        '2958LRG',
        'Countryman Cooper S E ALL4 162 kW (220 CV)',
        10,
        10,
        '2025-06-26',
        false,
        null,
        null,
        '2025-07-12 11:38:58.527773+00',
        null,
        22800.00,
        null,
        null
    ),
    (
        '78306b5b-f2cc-4bf1-9b66-92e0e81ed26b',
        '9721MCH',
        'X1 sDrive18i 100 kW (136 CV)',
        14,
        13,
        '2025-06-26',
        false,
        null,
        null,
        '2025-07-12 11:58:44.450121+00',
        null,
        35086.05,
        null,
        null
    ),
    (
        '6ab52a44-8898-464e-a03c-1c152083b256',
        '4896MZZ',
        'iX2 eDrive20 150 kW (204 CV)',
        11,
        11,
        '2025-04-14',
        false,
        null,
        null,
        '2025-07-16 10:43:07.539554+00',
        null,
        45145.00,
        null,
        null
    ),
    (
        '8825c4b1-e672-4a40-a440-b7a8b0a4a420',
        '7765MWS',
        '220i Active Tourer 125 kW (170 CV)',
        4,
        9,
        '2024-11-22',
        true,
        '2025-07-16 16:19:36.771+00',
        null,
        '2025-07-16 11:47:03.975545+00',
        null,
        43250.00,
        null,
        null
    ),
    (
        'f12fdaef-78ea-4c6a-8470-e854c7fb3e10',
        '5407LPR',
        'Countryman Cooper',
        3,
        12,
        '2025-07-02',
        false,
        null,
        '',
        '2025-07-04 16:12:02.198328+00',
        null,
        21750.00,
        null,
        null
    );
    
    RAISE NOTICE 'Restauración completada: 9 registros insertados';
END;
$$ LANGUAGE plpgsql;

-- Función para restaurar desde backup con sufijo
CREATE OR REPLACE FUNCTION restore_nuevas_entradas_from_backup(backup_suffix TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE 'TRUNCATE nuevas_entradas';
    EXECUTE 'INSERT INTO nuevas_entradas SELECT * FROM nuevas_entradas' || backup_suffix;
    RAISE NOTICE 'Restauración completada desde backup: %', backup_suffix;
END;
$$ LANGUAGE plpgsql;

-- Mostrar mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'BACKUP NUEVAS_ENTRADAS COMPLETADO';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Se han respaldado 9 registros de nuevas_entradas';
    RAISE NOTICE '';
    RAISE NOTICE 'OPCIONES DE RESTAURACIÓN:';
    RAISE NOTICE '1. Restaurar datos exactos: SELECT restore_nuevas_entradas_exact();';
    RAISE NOTICE '2. Restaurar desde backup: SELECT restore_nuevas_entradas_from_backup(''sufijo_del_backup'');';
    RAISE NOTICE '=====================================================';
END $$; 