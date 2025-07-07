-- Verificar estado actual de la configuración
SELECT 'ESTADO ACTUAL' as tipo, count(*) as registros FROM extornos_email_config;

-- Ver todos los registros si existen
SELECT 'REGISTROS EXISTENTES' as tipo, * FROM extornos_email_config;

-- Limpiar tabla por si hay múltiples registros
DELETE FROM extornos_email_config;

-- Insertar configuración por defecto
INSERT INTO extornos_email_config (
    enabled,
    email_tramitador,
    email_pagador,
    cc_emails,
    created_at,
    updated_at
) VALUES (
    true,
    'tramitador@motormunich.net',
    'pagos@motormunich.net',
    ARRAY['jordi.viciana@munichgroup.es'],
    NOW(),
    NOW()
);

-- Verificar que se insertó correctamente
SELECT 'CONFIGURACIÓN FINAL' as tipo, * FROM extornos_email_config;

-- Verificar permisos RLS
SELECT 'POLÍTICAS RLS' as tipo, schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'extornos_email_config';
