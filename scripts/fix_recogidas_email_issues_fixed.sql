-- Script para solucionar problemas de emails de recogidas (VERSIÓN CORREGIDA)
DO $$
DECLARE
    config_count INTEGER;
    pendientes_count INTEGER;
    historial_count INTEGER;
    config_count_final INTEGER;
BEGIN
    RAISE NOTICE '🔧 INICIANDO REPARACIÓN DE SISTEMA DE EMAILS DE RECOGIDAS';
    RAISE NOTICE '=====================================================';
    
    -- 1. Verificar y crear tabla recogidas_pendientes
    RAISE NOTICE '1️⃣ Verificando tabla recogidas_pendientes...';
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_pendientes') THEN
        RAISE NOTICE '   ❌ Tabla recogidas_pendientes NO existe - CREANDO...';
        
        CREATE TABLE recogidas_pendientes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            matricula VARCHAR(20) NOT NULL,
            mensajeria VARCHAR(50) DEFAULT 'MRW',
            centro_recogida VARCHAR(100) DEFAULT 'Terrassa',
            materiales TEXT[] DEFAULT '{}',
            nombre_cliente VARCHAR(200),
            direccion_cliente TEXT,
            codigo_postal VARCHAR(10),
            ciudad VARCHAR(100),
            provincia VARCHAR(100),
            telefono VARCHAR(20),
            email VARCHAR(200),
            observaciones_envio TEXT,
            usuario_solicitante VARCHAR(200) NOT NULL,
            usuario_solicitante_id UUID,
            estado VARCHAR(50) DEFAULT 'pendiente',
            fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices
        CREATE INDEX idx_recogidas_pendientes_matricula ON recogidas_pendientes(matricula);
        CREATE INDEX idx_recogidas_pendientes_fecha ON recogidas_pendientes(fecha_solicitud);
        CREATE INDEX idx_recogidas_pendientes_estado ON recogidas_pendientes(estado);
        CREATE INDEX idx_recogidas_pendientes_usuario ON recogidas_pendientes(usuario_solicitante_id);
        
        -- Crear trigger para updated_at
        CREATE OR REPLACE FUNCTION update_recogidas_pendientes_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trigger_update_recogidas_pendientes_updated_at
            BEFORE UPDATE ON recogidas_pendientes
            FOR EACH ROW
            EXECUTE FUNCTION update_recogidas_pendientes_updated_at();
            
        RAISE NOTICE '   ✅ Tabla recogidas_pendientes creada exitosamente';
    ELSE
        RAISE NOTICE '   ✅ Tabla recogidas_pendientes ya existe';
    END IF;
    
    -- 2. Verificar tabla recogidas_historial
    RAISE NOTICE '2️⃣ Verificando tabla recogidas_historial...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_historial') THEN
        RAISE NOTICE '   ✅ Tabla recogidas_historial existe';
        
        -- Verificar columna fecha_envio
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_historial' AND column_name = 'fecha_envio') THEN
            RAISE NOTICE '   ❌ Columna fecha_envio NO existe - AÑADIENDO...';
            ALTER TABLE recogidas_historial ADD COLUMN fecha_envio TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE '   ✅ Columna fecha_envio añadida';
        ELSE
            RAISE NOTICE '   ✅ Columna fecha_envio existe';
        END IF;
        
        -- Verificar columna seguimiento
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_historial' AND column_name = 'seguimiento') THEN
            RAISE NOTICE '   ❌ Columna seguimiento NO existe - AÑADIENDO...';
            ALTER TABLE recogidas_historial ADD COLUMN seguimiento VARCHAR(100);
            RAISE NOTICE '   ✅ Columna seguimiento añadida';
        ELSE
            RAISE NOTICE '   ✅ Columna seguimiento existe';
        END IF;
    ELSE
        RAISE NOTICE '   ❌ Tabla recogidas_historial NO existe - CREANDO...';
        
        CREATE TABLE recogidas_historial (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            matricula VARCHAR(20) NOT NULL,
            mensajeria VARCHAR(50) DEFAULT 'MRW',
            centro_recogida VARCHAR(100) DEFAULT 'Terrassa',
            materiales TEXT[] DEFAULT '{}',
            nombre_cliente VARCHAR(200),
            direccion_cliente TEXT,
            codigo_postal VARCHAR(10),
            ciudad VARCHAR(100),
            provincia VARCHAR(100),
            telefono VARCHAR(20),
            email VARCHAR(200),
            observaciones_envio TEXT,
            usuario_solicitante VARCHAR(200) NOT NULL,
            usuario_solicitante_id UUID,
            estado VARCHAR(50) DEFAULT 'solicitada',
            fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            fecha_envio TIMESTAMP WITH TIME ZONE,
            seguimiento VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices
        CREATE INDEX idx_recogidas_historial_matricula ON recogidas_historial(matricula);
        CREATE INDEX idx_recogidas_historial_fecha ON recogidas_historial(fecha_solicitud);
        CREATE INDEX idx_recogidas_historial_estado ON recogidas_historial(estado);
        CREATE INDEX idx_recogidas_historial_envio ON recogidas_historial(fecha_envio);
        
        RAISE NOTICE '   ✅ Tabla recogidas_historial creada exitosamente';
    END IF;
    
    -- 3. Verificar configuración de email
    RAISE NOTICE '3️⃣ Verificando configuración de email...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_email_config') THEN
        RAISE NOTICE '   ✅ Tabla recogidas_email_config existe';
        
        -- Verificar si hay configuración
        SELECT COUNT(*) INTO config_count FROM recogidas_email_config;
        
        IF config_count = 0 THEN
            RAISE NOTICE '   ❌ No hay configuración - CREANDO CONFIGURACIÓN POR DEFECTO...';
            
            INSERT INTO recogidas_email_config (
                enabled,
                email_agencia,
                email_remitente,
                nombre_remitente,
                asunto_template,
                cc_emails
            ) VALUES (
                true,
                'recogidas@mrw.es',
                'recogidas@controlvo.ovh',
                'Recogidas - Sistema CVO',
                'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes',
                '{}'
            );
            
            RAISE NOTICE '   ✅ Configuración por defecto creada';
        ELSE
            RAISE NOTICE '   ✅ Configuración existente encontrada (% registros)', config_count;
        END IF;
    ELSE
        RAISE NOTICE '   ❌ Tabla recogidas_email_config NO existe - CREANDO...';
        
        CREATE TABLE recogidas_email_config (
            id SERIAL PRIMARY KEY,
            enabled BOOLEAN DEFAULT true,
            email_agencia VARCHAR(200) NOT NULL,
            email_remitente VARCHAR(200) NOT NULL,
            nombre_remitente VARCHAR(200) NOT NULL,
            asunto_template TEXT NOT NULL,
            cc_emails TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insertar configuración por defecto
        INSERT INTO recogidas_email_config (
            enabled,
            email_agencia,
            email_remitente,
            nombre_remitente,
            asunto_template,
            cc_emails
        ) VALUES (
            true,
            'recogidas@mrw.es',
            'recogidas@controlvo.ovh',
            'Recogidas - Sistema CVO',
            'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes',
            '{}'
        );
        
        RAISE NOTICE '   ✅ Tabla y configuración por defecto creadas';
    END IF;
    
    -- 4. Mostrar estadísticas finales
    RAISE NOTICE '4️⃣ Estadísticas finales...';
    
    SELECT COUNT(*) INTO pendientes_count FROM recogidas_pendientes;
    SELECT COUNT(*) INTO historial_count FROM recogidas_historial;
    SELECT COUNT(*) INTO config_count_final FROM recogidas_email_config;
    
    RAISE NOTICE '   📊 Recogidas pendientes: %', pendientes_count;
    RAISE NOTICE '   📊 Recogidas en historial: %', historial_count;
    RAISE NOTICE '   📊 Configuraciones de email: %', config_count_final;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ REPARACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '🎯 Próximos pasos:';
    RAISE NOTICE '   1. Ejecuta la prueba en /debug-test-recogidas-email';
    RAISE NOTICE '   2. Añade recogidas pendientes si es necesario';
    RAISE NOTICE '   3. Configura las variables SMTP en el entorno';
    RAISE NOTICE '   4. Prueba el envío de emails';
    
END $$; 