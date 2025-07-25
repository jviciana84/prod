-- Script 2: INSERTAR DATOS DE PRUEBA ALEATORIOS
-- ==============================================

-- Función para generar tokens aleatorios
CREATE OR REPLACE FUNCTION generar_token_aleatorio()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Función para generar emails aleatorios
CREATE OR REPLACE FUNCTION generar_email_aleatorio(nombre TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(replace(nombre, ' ', '.') || '@test.com');
END;
$$ LANGUAGE plpgsql;

-- Insertar datos de prueba en entregas_en_mano
INSERT INTO entregas_en_mano (
    matricula,
    email_cliente,
    materiales,
    nombre_cliente,
    nombre_recoge,
    dni_recoge,
    email_recoge,
    usuario_solicitante,
    usuario_solicitante_id,
    token_confirmacion,
    estado,
    fecha_solicitud,
    fecha_envio,
    email_enviado,
    email_enviado_at,
    message_id,
    created_at,
    updated_at
) VALUES 
-- Entrega 1: Confirmada
(
    '1234ABC',
    'juan.perez@test.com',
    ARRAY['Permiso circulación', 'Ficha técnica'],
    'Juan Pérez García',
    'María López',
    '12345678A',
    'maria.lopez@test.com',
    'Admin Sistema',
    gen_random_uuid(),
    generar_token_aleatorio(),
    'confirmado',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    true,
    NOW() - INTERVAL '5 days',
    'msg_001_' || extract(epoch from now()),
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days'
),
-- Entrega 2: Enviada (pendiente de confirmación)
(
    '5678DEF',
    'ana.garcia@test.com',
    ARRAY['Pegatina Medioambiental', 'COC', '2ª Llave'],
    'Ana García Martínez',
    'Carlos Ruiz',
    '87654321B',
    'carlos.ruiz@test.com',
    'Admin Sistema',
    gen_random_uuid(),
    generar_token_aleatorio(),
    'enviado',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    true,
    NOW() - INTERVAL '2 days',
    'msg_002_' || extract(epoch from now()),
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
-- Entrega 3: Enviada (más reciente)
(
    '9012GHI',
    'luis.rodriguez@test.com',
    ARRAY['Permiso circulación', 'Ficha técnica', 'CardKey'],
    'Luis Rodríguez Sánchez',
    'Carmen Vega',
    '11223344C',
    'carmen.vega@test.com',
    'Admin Sistema',
    gen_random_uuid(),
    generar_token_aleatorio(),
    'enviado',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    true,
    NOW() - INTERVAL '1 day',
    'msg_003_' || extract(epoch from now()),
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
-- Entrega 4: Confirmada (más antigua)
(
    '3456JKL',
    'sara.martin@test.com',
    ARRAY['Permiso circulación'],
    'Sara Martín López',
    'Pedro Jiménez',
    '55667788D',
    'pedro.jimenez@test.com',
    'Admin Sistema',
    gen_random_uuid(),
    generar_token_aleatorio(),
    'confirmado',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    true,
    NOW() - INTERVAL '10 days',
    'msg_004_' || extract(epoch from now()),
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days'
),
-- Entrega 5: Enviada (hoy)
(
    '7890MNO',
    'david.hernandez@test.com',
    ARRAY['Ficha técnica', 'Pegatina Medioambiental', '2ª Llave', 'CardKey'],
    'David Hernández Torres',
    'Laura Moreno',
    '99887766E',
    'laura.moreno@test.com',
    'Admin Sistema',
    gen_random_uuid(),
    generar_token_aleatorio(),
    'enviado',
    NOW(),
    NOW(),
    true,
    NOW(),
    'msg_005_' || extract(epoch from now()),
    NOW(),
    NOW()
),
-- Entrega 6: Sin DNI
(
    '1111PQR',
    'elena.diaz@test.com',
    ARRAY['Permiso circulación', 'COC'],
    'Elena Díaz Castro',
    'Roberto Silva',
    NULL,
    'roberto.silva@test.com',
    'Admin Sistema',
    gen_random_uuid(),
    generar_token_aleatorio(),
    'enviado',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    true,
    NOW() - INTERVAL '3 hours',
    'msg_006_' || extract(epoch from now()),
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
),
-- Entrega 7: Materiales personalizados
(
    '2222STU',
    'miguel.torres@test.com',
    ARRAY['Permiso circulación', 'Documentación personalizada', 'Manual de usuario'],
    'Miguel Torres Vega',
    'Isabel Castro',
    '11223344F',
    'isabel.castro@test.com',
    'Admin Sistema',
    gen_random_uuid(),
    generar_token_aleatorio(),
    'enviado',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours',
    true,
    NOW() - INTERVAL '6 hours',
    'msg_007_' || extract(epoch from now()),
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
),
-- Entrega 8: Confirmada recientemente
(
    '3333VWX',
    'patricia.morales@test.com',
    ARRAY['Ficha técnica', 'Pegatina Medioambiental'],
    'Patricia Morales Ruiz',
    'Fernando López',
    '55667788G',
    'fernando.lopez@test.com',
    'Admin Sistema',
    gen_random_uuid(),
    generar_token_aleatorio(),
    'confirmado',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours',
    true,
    NOW() - INTERVAL '12 hours',
    'msg_008_' || extract(epoch from now()),
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '1 hour'
);

-- Insertar datos de prueba en recogidas_historial
INSERT INTO recogidas_historial (
    matricula,
    mensajeria,
    centro_recogida,
    materiales,
    nombre_cliente,
    direccion_cliente,
    codigo_postal,
    ciudad,
    provincia,
    telefono,
    email,
    observaciones_envio,
    usuario_solicitante,
    usuario_solicitante_id,
    seguimiento,
    estado,
    fecha_solicitud,
    fecha_envio,
    fecha_entrega,
    created_at,
    updated_at
) VALUES 
-- Recogida 1: Entregada
(
    '4444YZA',
    'MRW',
    'Terrassa',
    ARRAY['Permiso circulación', 'Ficha técnica'],
    'Roberto Silva Castro',
    'Calle Mayor 123',
    '08225',
    'Terrassa',
    'Barcelona',
    '666777888',
    'roberto.silva@test.com',
    'Entregar en horario de mañana',
    'Admin Sistema',
    gen_random_uuid(),
    'MRW123456789',
    'entregada',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '5 days'
),
-- Recogida 2: En tránsito
(
    '5555BCD',
    'Seur',
    'Barcelona',
    ARRAY['Pegatina Medioambiental', 'COC'],
    'Carmen Vega Martín',
    'Avenida Diagonal 456',
    '08013',
    'Barcelona',
    'Barcelona',
    '999888777',
    'carmen.vega@test.com',
    'Fragil, manejar con cuidado',
    'Admin Sistema',
    gen_random_uuid(),
    'SEUR987654321',
    'en_transito',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days',
    NULL,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
),
-- Recogida 3: Solicitada
(
    '6666EFG',
    'DHL',
    'Madrid',
    ARRAY['2ª Llave', 'CardKey'],
    'Pedro Jiménez Torres',
    'Calle Gran Vía 789',
    '28013',
    'Madrid',
    'Madrid',
    '555444333',
    'pedro.jimenez@test.com',
    'Entregar solo al titular',
    'Admin Sistema',
    gen_random_uuid(),
    NULL,
    'solicitada',
    NOW() - INTERVAL '1 day',
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
);

-- Verificar datos insertados
SELECT 'Datos insertados en entregas_en_mano:' as info;
SELECT 
    matricula,
    nombre_cliente,
    estado,
    fecha_solicitud,
    array_length(materiales, 1) as num_materiales
FROM entregas_en_mano
ORDER BY fecha_solicitud DESC;

SELECT 'Datos insertados en recogidas_historial:' as info;
SELECT 
    matricula,
    nombre_cliente,
    estado,
    fecha_solicitud,
    seguimiento
FROM recogidas_historial
ORDER BY fecha_solicitud DESC;

-- Estadísticas
SELECT 'Estadísticas:' as info;
SELECT 
    'entregas_en_mano' as tabla,
    estado,
    COUNT(*) as cantidad
FROM entregas_en_mano
GROUP BY estado
UNION ALL
SELECT 
    'recogidas_historial' as tabla,
    estado,
    COUNT(*) as cantidad
FROM recogidas_historial
GROUP BY estado;

-- Limpiar funciones temporales
DROP FUNCTION IF EXISTS generar_token_aleatorio();
DROP FUNCTION IF EXISTS generar_email_aleatorio(TEXT);

-- Resumen
SELECT '✅ DATOS DE PRUEBA INSERTADOS' as status;
SELECT 'Se han insertado 8 entregas en mano y 3 recogidas por mensajería' as info; 