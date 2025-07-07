-- 1. Verificar que la tabla entregas existe
SELECT 'TABLA ENTREGAS EXISTE:' as test, COUNT(*) as total_registros FROM entregas;

-- 2. Verificar estructura de la tabla
SELECT 'ESTRUCTURA ENTREGAS:' as test, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'entregas' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Intentar insertar UN REGISTRO MANUAL directamente
INSERT INTO entregas (
    fecha_venta,
    fecha_entrega,
    matricula,
    modelo,
    asesor,
    "or",
    incidencia,
    observaciones,
    created_at,
    updated_at
) VALUES (
    NOW(),
    NULL,
    'TEST123',
    'TEST MODEL',
    'TEST ASESOR',
    'TEST OR',
    false,
    '',
    NOW(),
    NOW()
);

-- 4. Verificar que se insertó
SELECT 'DESPUÉS DE INSERT MANUAL:' as test, COUNT(*) as cantidad FROM entregas WHERE matricula = 'TEST123';

-- 5. Limpiar el test
DELETE FROM entregas WHERE matricula = 'TEST123';

SELECT 'TEST BÁSICO COMPLETADO' as resultado;
