-- Verificar si se insertó el registro manualmente
SELECT '=== VERIFICACIÓN DE INSERCIÓN MANUAL ===' as info;

SELECT 
    'Registro 0010NBB en entregas:' as info,
    matricula,
    modelo,
    asesor,
    observaciones,
    created_at
FROM entregas 
WHERE matricula = '0010NBB';

-- Si no existe, verificar todos los registros recientes
SELECT 
    'Últimos registros en entregas:' as info,
    matricula,
    observaciones,
    created_at
FROM entregas 
ORDER BY created_at DESC 
LIMIT 5;
