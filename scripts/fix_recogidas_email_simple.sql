-- Script simplificado para solucionar problemas de emails de recogidas
-- Ejecutar cada sección por separado si hay errores

-- 1. Crear tabla recogidas_pendientes
CREATE TABLE IF NOT EXISTS recogidas_pendientes (
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

-- Crear índices para recogidas_pendientes
CREATE INDEX IF NOT EXISTS idx_recogidas_pendientes_matricula ON recogidas_pendientes(matricula);
CREATE INDEX IF NOT EXISTS idx_recogidas_pendientes_fecha ON recogidas_pendientes(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_recogidas_pendientes_estado ON recogidas_pendientes(estado);
CREATE INDEX IF NOT EXISTS idx_recogidas_pendientes_usuario ON recogidas_pendientes(usuario_solicitante_id);

-- 2. Verificar y añadir columnas a recogidas_historial
ALTER TABLE recogidas_historial ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMP WITH TIME ZONE;
ALTER TABLE recogidas_historial ADD COLUMN IF NOT EXISTS seguimiento VARCHAR(100);

-- Crear índices para recogidas_historial si no existen
CREATE INDEX IF NOT EXISTS idx_recogidas_historial_matricula ON recogidas_historial(matricula);
CREATE INDEX IF NOT EXISTS idx_recogidas_historial_fecha ON recogidas_historial(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_recogidas_historial_estado ON recogidas_historial(estado);
CREATE INDEX IF NOT EXISTS idx_recogidas_historial_envio ON recogidas_historial(fecha_envio);

-- 3. Crear tabla recogidas_email_config si no existe
CREATE TABLE IF NOT EXISTS recogidas_email_config (
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

-- 4. Insertar configuración por defecto si no existe
INSERT INTO recogidas_email_config (
    enabled,
    email_agencia,
    email_remitente,
    nombre_remitente,
    asunto_template,
    cc_emails
) 
SELECT 
    true,
    'recogidas@mrw.es',
    'recogidas@controlvo.ovh',
    'Recogidas - Sistema CVO',
    'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes',
    '{}'
WHERE NOT EXISTS (SELECT 1 FROM recogidas_email_config);

-- 5. Mostrar estadísticas
SELECT 
    'recogidas_pendientes' as tabla,
    COUNT(*) as registros
FROM recogidas_pendientes
UNION ALL
SELECT 
    'recogidas_historial' as tabla,
    COUNT(*) as registros
FROM recogidas_historial
UNION ALL
SELECT 
    'recogidas_email_config' as tabla,
    COUNT(*) as registros
FROM recogidas_email_config; 