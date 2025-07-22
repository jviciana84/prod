-- Añadir recogidas de prueba para testing
DO $$
BEGIN
    RAISE NOTICE '📦 AÑADIENDO RECOGIDAS DE PRUEBA...';
    
    -- Verificar si ya hay recogidas pendientes
    DECLARE
        existing_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO existing_count FROM recogidas_pendientes;
        
        IF existing_count > 0 THEN
            RAISE NOTICE '⚠️ Ya hay % recogidas pendientes. No se añadirán más.', existing_count;
        ELSE
            RAISE NOTICE '✅ Añadiendo recogidas de prueba...';
            
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
            
            -- Recogida 3
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
                '9012GHI',
                'Terrassa',
                ARRAY['Llaves', 'Tarjeta ITV'],
                'Carlos López',
                'Calle Sant Pere 789',
                '08222',
                'Terrassa',
                'Barcelona',
                '666345678',
                'carlos@example.com',
                'Cliente disponible todo el día',
                'Usuario Test'
            );
            
            RAISE NOTICE '✅ 3 recogidas de prueba añadidas exitosamente';
        END IF;
    END;
    
    -- Mostrar estadísticas
    DECLARE
        total_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO total_count FROM recogidas_pendientes;
        RAISE NOTICE '📊 Total de recogidas pendientes: %', total_count;
    END;
    
END $$; 