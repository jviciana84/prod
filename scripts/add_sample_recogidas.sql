-- Añadir recogidas de muestra para testing
-- Solo ejecutar si quieres probar el envío de emails

-- Recogida 1
INSERT INTO recogidas_pendientes (
    matricula,
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
    usuario_solicitante
) VALUES (
    '1234ABC',
    'Terrassa',
    ARRAY['Documentación', 'Llaves'],
    'Juan Pérez',
    'Calle Mayor 123',
    '08221',
    'Terrassa',
    'Barcelona',
    '666123456',
    'juan@example.com',
    'Recoger en horario de mañana',
    'Usuario Test'
);

-- Recogida 2
INSERT INTO recogidas_pendientes (
    matricula,
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
    usuario_solicitante
) VALUES (
    '5678DEF',
    'Barcelona',
    ARRAY['Documentación'],
    'María García',
    'Avenida Diagonal 456',
    '08013',
    'Barcelona',
    'Barcelona',
    '666789012',
    'maria@example.com',
    'Entregar antes de las 18:00',
    'Usuario Test'
);

-- Mostrar resultado
SELECT 
    'Recogidas añadidas' as accion,
    COUNT(*) as total
FROM recogidas_pendientes
WHERE usuario_solicitante = 'Usuario Test'; 