-- DIAGNÓSTICO Y ARREGLO FINAL DE CONFIGURACIÓN DE EXTORNOS

-- Paso 1: Verificar si la tabla existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'extornos_email_config'
        ) 
        THEN '✅ Tabla extornos_email_config existe'
        ELSE '❌ Tabla extornos_email_config NO existe'
    END as estado_tabla;

-- Paso 2: Verificar datos existentes
SELECT 
    'Datos actuales en extornos_email_config:' as info,
    COUNT(*) as total_registros
FROM extornos_email_config;

-- Mostrar datos si existen
SELECT * FROM extornos_email_config LIMIT 5;

-- Paso 3: Limpiar y recrear la configuración
DELETE FROM extornos_email_config;

-- Paso 4: Insertar configuración por defecto
INSERT INTO extornos_email_config (
    id,
    enabled,
    email_tramitador,
    email_pagador,
    cc_emails,
    created_at,
    updated_at
) VALUES (
    1,
    true,
    '',
    '',
    '[]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    email_tramitador = EXCLUDED.email_tramitador,
    email_pagador = EXCLUDED.email_pagador,
    cc_emails = EXCLUDED.cc_emails,
    updated_at = NOW();

-- Paso 5: Verificar que se insertó correctamente
SELECT 
    '✅ Configuración insertada:' as resultado,
    id,
    enabled,
    email_tramitador,
    email_pagador,
    cc_emails,
    created_at
FROM extornos_email_config;

-- Paso 6: Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '⚠️ RLS activado - puede causar problemas'
        ELSE '✅ RLS desactivado - correcto'
    END as estado_rls
FROM pg_tables 
WHERE tablename = 'extornos_email_config';

-- Paso 7: Si RLS está activado, desactivarlo temporalmente
ALTER TABLE extornos_email_config DISABLE ROW LEVEL SECURITY;

-- Paso 8: Verificación final
SELECT 
    'VERIFICACIÓN FINAL:' as titulo,
    COUNT(*) as registros_totales,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ CONFIGURACIÓN LISTA'
        ELSE '❌ FALTA CONFIGURACIÓN'
    END as estado
FROM extornos_email_config;
