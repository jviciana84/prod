-- 🧪 PROBAR EMAIL MANUAL PARA EL EXTORNO 24
-- Este script te dará la URL para probar manualmente

SELECT 
    '🧪 PRUEBA MANUAL' as tipo,
    'Ve a esta URL para probar el email:' as instruccion,
    '/api/extornos/send-notification' as endpoint,
    'POST con este JSON:' as metodo,
    json_build_object(
        'extorno_id', 24,
        'tipo', 'registro',
        'usuario_registra_email', 'jordi.viciana@munichgroup.es',
        'usuario_registra_nombre', 'Jordi Viciana'
    ) as json_data;

-- También mostrar datos del extorno para referencia
SELECT 
    '📋 DATOS EXTORNO 24' as tipo,
    id,
    matricula,
    cliente,
    importe,
    concepto,
    created_at
FROM extornos 
WHERE id = 24;
