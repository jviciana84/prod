-- Arreglar la constraint de entregas y limpiar duplicados
SELECT '=== ARREGLANDO CONSTRAINT DE ENTREGAS ===' as info;

-- 1. Ver registros actuales de 0010NBB
SELECT '1. REGISTROS ACTUALES DE 0010NBB:' as step;
SELECT matricula, observaciones, created_at 
FROM entregas 
WHERE matricula LIKE '%0010NBB%' OR matricula = '0010NBB'
ORDER BY created_at DESC;

-- 2. Limpiar registros duplicados/test
DELETE FROM entregas 
WHERE matricula LIKE 'TRIGGER_%' OR observaciones LIKE '%trigger%';

-- 3. Verificar si existe constraint UNIQUE
SELECT '2. VERIFICANDO CONSTRAINTS:' as step;
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'entregas'::regclass;

-- 4. Crear constraint UNIQUE si no existe
DO $$
BEGIN
    -- Intentar crear la constraint
    BEGIN
        ALTER TABLE entregas ADD CONSTRAINT entregas_matricula_unique UNIQUE (matricula);
        RAISE NOTICE '✅ Constraint UNIQUE creada en matricula';
    EXCEPTION
        WHEN duplicate_table THEN
            RAISE NOTICE '⚠️ Constraint ya existe';
        WHEN unique_violation THEN
            RAISE NOTICE '❌ Hay duplicados - limpiando primero...';
            -- Limpiar duplicados manteniendo el más reciente
            DELETE FROM entregas a USING entregas b 
            WHERE a.id < b.id AND a.matricula = b.matricula;
            -- Intentar crear constraint de nuevo
            ALTER TABLE entregas ADD CONSTRAINT entregas_matricula_unique UNIQUE (matricula);
            RAISE NOTICE '✅ Duplicados limpiados y constraint creada';
    END;
END $$;

SELECT '✅ Constraint arreglada' as resultado;
