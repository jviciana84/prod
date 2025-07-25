-- Script MAESTRO: PREPARAR SISTEMA DE RECOGIDAS
-- ==============================================
-- Este script ejecuta los 3 scripts en orden para preparar el sistema completo

-- PASO 1: LIMPIAR DATOS EXISTENTES
-- =================================
\echo '🔄 PASO 1: Limpiando datos existentes...'

-- Limpiar tabla entregas_en_mano
DELETE FROM entregas_en_mano;
ALTER SEQUENCE entregas_en_mano_id_seq RESTART WITH 1;

-- Limpiar tabla recogidas_historial
DELETE FROM recogidas_historial;
ALTER SEQUENCE recogidas_historial_id_seq RESTART WITH 1;

\echo '✅ Limpieza completada'

-- PASO 2: INSERTAR DATOS DE PRUEBA
-- =================================
\echo '🔄 PASO 2: Insertando datos de prueba...'

-- Función para generar tokens aleatorios
CREATE OR REPLACE FUNCTION generar_token_aleatorio()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Insertar datos de prueba en entregas_en_mano
INSERT INTO entregas_en_mano (
    matricula, email_cliente, materiales, nombre_cliente, nombre_recoge, dni_recoge, email_recoge,
    usuario_solicitante, usuario_solicitante_id, token_confirmacion, estado, fecha_solicitud,
    fecha_envio, email_enviado, email_enviado_at, message_id, created_at, updated_at
) VALUES 
('1234ABC', 'juan.perez@test.com', ARRAY['Permiso circulación', 'Ficha técnica'], 'Juan Pérez García', 'María López', '12345678A', 'maria.lopez@test.com', 'Admin Sistema', gen_random_uuid(), generar_token_aleatorio(), 'confirmado', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', true, NOW() - INTERVAL '5 days', 'msg_001_' || extract(epoch from now()), NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
('5678DEF', 'ana.garcia@test.com', ARRAY['Pegatina Medioambiental', 'COC', '2ª Llave'], 'Ana García Martínez', 'Carlos Ruiz', '87654321B', 'carlos.ruiz@test.com', 'Admin Sistema', gen_random_uuid(), generar_token_aleatorio(), 'enviado', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', true, NOW() - INTERVAL '2 days', 'msg_002_' || extract(epoch from now()), NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('9012GHI', 'luis.rodriguez@test.com', ARRAY['Permiso circulación', 'Ficha técnica', 'CardKey'], 'Luis Rodríguez Sánchez', 'Carmen Vega', '11223344C', 'carmen.vega@test.com', 'Admin Sistema', gen_random_uuid(), generar_token_aleatorio(), 'enviado', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', true, NOW() - INTERVAL '1 day', 'msg_003_' || extract(epoch from now()), NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('3456JKL', 'sara.martin@test.com', ARRAY['Permiso circulación'], 'Sara Martín López', 'Pedro Jiménez', '55667788D', 'pedro.jimenez@test.com', 'Admin Sistema', gen_random_uuid(), generar_token_aleatorio(), 'confirmado', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', true, NOW() - INTERVAL '10 days', 'msg_004_' || extract(epoch from now()), NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
('7890MNO', 'david.hernandez@test.com', ARRAY['Ficha técnica', 'Pegatina Medioambiental', '2ª Llave', 'CardKey'], 'David Hernández Torres', 'Laura Moreno', '99887766E', 'laura.moreno@test.com', 'Admin Sistema', gen_random_uuid(), generar_token_aleatorio(), 'enviado', NOW(), NOW(), true, NOW(), 'msg_005_' || extract(epoch from now()), NOW(), NOW()),
('1111PQR', 'elena.diaz@test.com', ARRAY['Permiso circulación', 'COC'], 'Elena Díaz Castro', 'Roberto Silva', NULL, 'roberto.silva@test.com', 'Admin Sistema', gen_random_uuid(), generar_token_aleatorio(), 'enviado', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', true, NOW() - INTERVAL '3 hours', 'msg_006_' || extract(epoch from now()), NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
('2222STU', 'miguel.torres@test.com', ARRAY['Permiso circulación', 'Documentación personalizada', 'Manual de usuario'], 'Miguel Torres Vega', 'Isabel Castro', '11223344F', 'isabel.castro@test.com', 'Admin Sistema', gen_random_uuid(), generar_token_aleatorio(), 'enviado', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', true, NOW() - INTERVAL '6 hours', 'msg_007_' || extract(epoch from now()), NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
('3333VWX', 'patricia.morales@test.com', ARRAY['Ficha técnica', 'Pegatina Medioambiental'], 'Patricia Morales Ruiz', 'Fernando López', '55667788G', 'fernando.lopez@test.com', 'Admin Sistema', gen_random_uuid(), generar_token_aleatorio(), 'confirmado', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', true, NOW() - INTERVAL '12 hours', 'msg_008_' || extract(epoch from now()), NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 hour');

-- Insertar datos de prueba en recogidas_historial
INSERT INTO recogidas_historial (
    matricula, mensajeria, centro_recogida, materiales, nombre_cliente, direccion_cliente, codigo_postal, ciudad, provincia, telefono, email, observaciones_envio, usuario_solicitante, usuario_solicitante_id, seguimiento, estado, fecha_solicitud, fecha_envio, fecha_entrega, created_at, updated_at
) VALUES 
('4444YZA', 'MRW', 'Terrassa', ARRAY['Permiso circulación', 'Ficha técnica'], 'Roberto Silva Castro', 'Calle Mayor 123', '08225', 'Terrassa', 'Barcelona', '666777888', 'roberto.silva@test.com', 'Entregar en horario de mañana', 'Admin Sistema', gen_random_uuid(), 'MRW123456789', 'entregada', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days'),
('5555BCD', 'Seur', 'Barcelona', ARRAY['Pegatina Medioambiental', 'COC'], 'Carmen Vega Martín', 'Avenida Diagonal 456', '08013', 'Barcelona', 'Barcelona', '999888777', 'carmen.vega@test.com', 'Fragil, manejar con cuidado', 'Admin Sistema', gen_random_uuid(), 'SEUR987654321', 'en_transito', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('6666EFG', 'DHL', 'Madrid', ARRAY['2ª Llave', 'CardKey'], 'Pedro Jiménez Torres', 'Calle Gran Vía 789', '28013', 'Madrid', 'Madrid', '555444333', 'pedro.jimenez@test.com', 'Entregar solo al titular', 'Admin Sistema', gen_random_uuid(), NULL, 'solicitada', NOW() - INTERVAL '1 day', NULL, NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

\echo '✅ Datos de prueba insertados'

-- PASO 3: CARGAR VEHÍCULOS ENTREGADOS
-- ====================================
\echo '🔄 PASO 3: Cargando vehículos entregados...'

-- Insertar vehículos entregados que no estén en la tabla entregas
INSERT INTO entregas (
    fecha_venta, fecha_entrega, matricula, modelo, asesor, "or", incidencia, observaciones, created_at, updated_at
)
SELECT 
    sv.sale_date,
    sv.sale_date + INTERVAL '7 days',
    sv.license_plate,
    sv.model,
    sv.advisor,
    sv.or_value,
    false,
    'Vehículo cargado automáticamente desde sales_vehicles',
    NOW(),
    NOW()
FROM sales_vehicles sv
WHERE sv.sale_date IS NOT NULL
AND sv.license_plate IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM entregas e WHERE e.matricula = sv.license_plate
)
ON CONFLICT (matricula) DO UPDATE SET
    fecha_venta = EXCLUDED.fecha_venta,
    fecha_entrega = EXCLUDED.fecha_entrega,
    modelo = EXCLUDED.modelo,
    asesor = EXCLUDED.asesor,
    "or" = EXCLUDED."or",
    observaciones = EXCLUDED.observaciones,
    updated_at = NOW();

-- Actualizar fechas de entrega para vehículos que no la tienen
UPDATE entregas 
SET 
    fecha_entrega = fecha_venta + INTERVAL '7 days',
    observaciones = COALESCE(observaciones, '') || ' - Fecha de entrega actualizada automáticamente',
    updated_at = NOW()
WHERE fecha_entrega IS NULL AND fecha_venta IS NOT NULL;

\echo '✅ Vehículos cargados'

-- PASO 4: CREAR VISTA PARA FACILITAR CONSULTAS
-- ============================================
\echo '🔄 PASO 4: Creando vista para consultas...'

CREATE OR REPLACE VIEW vehiculos_para_recoger AS
SELECT 
    e.id,
    e.matricula,
    e.modelo,
    e.asesor,
    e.fecha_entrega,
    e.fecha_venta,
    sv.client_name,
    sv.client_email,
    sv.client_phone,
    sv.client_address,
    sv.client_postal_code,
    sv.client_city,
    sv.client_province,
    sv.brand,
    CASE 
        WHEN eem.id IS NOT NULL THEN 'entrega_en_mano'
        WHEN rh.id IS NOT NULL THEN 'mensajeria'
        ELSE 'disponible'
    END as tipo_recogida,
    eem.estado as estado_entrega_mano,
    rh.estado as estado_recogida_mensajeria
FROM entregas e
LEFT JOIN sales_vehicles sv ON e.matricula = sv.license_plate
LEFT JOIN entregas_en_mano eem ON e.matricula = eem.matricula
LEFT JOIN recogidas_historial rh ON e.matricula = rh.matricula
WHERE e.fecha_entrega IS NOT NULL
ORDER BY e.fecha_entrega DESC;

\echo '✅ Vista creada'

-- PASO 5: LIMPIAR FUNCIONES TEMPORALES
-- ====================================
DROP FUNCTION IF EXISTS generar_token_aleatorio();

-- PASO 6: VERIFICACIÓN FINAL
-- ===========================
\echo '🔄 PASO 6: Verificación final...'

SELECT 'RESUMEN FINAL:' as info;

SELECT 
    'entregas_en_mano' as tabla,
    COUNT(*) as registros
FROM entregas_en_mano
UNION ALL
SELECT 
    'recogidas_historial' as tabla,
    COUNT(*) as registros
FROM recogidas_historial
UNION ALL
SELECT 
    'entregas con fecha_entrega' as tabla,
    COUNT(*) as registros
FROM entregas
WHERE fecha_entrega IS NOT NULL;

SELECT 'Estados de entregas en mano:' as info;
SELECT estado, COUNT(*) as cantidad
FROM entregas_en_mano
GROUP BY estado;

SELECT 'Estados de recogidas por mensajería:' as info;
SELECT estado, COUNT(*) as cantidad
FROM recogidas_historial
GROUP BY estado;

SELECT 'Vehículos disponibles para recogidas:' as info;
SELECT 
    matricula,
    modelo,
    client_name,
    tipo_recogida,
    fecha_entrega
FROM vehiculos_para_recoger
LIMIT 5;

\echo '🎉 SISTEMA DE RECOGIDAS PREPARADO COMPLETAMENTE'
SELECT '✅ PREPARACIÓN COMPLETADA' as status;
SELECT 'El sistema de recogidas está listo para usar con datos de prueba' as info; 