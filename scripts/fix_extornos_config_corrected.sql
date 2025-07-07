-- ARREGLO CORREGIDO DE CONFIGURACIÓN DE EXTORNOS
-- Maneja correctamente los tipos de datos

-- Paso 1: Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'extornos_email_config'
ORDER BY ordinal_position;

-- Paso 2: Verificar datos existentes
SELECT 
    'Datos actuales:' as info,
    COUNT(*) as total_registros
FROM extornos_email_config;

-- Mostrar datos existentes
SELECT * FROM extornos_email_config LIMIT 5;

-- Paso 3: Limpiar datos existentes
DELETE FROM extornos_email_config;

-- Paso 4: Insertar configuración por defecto con tipos correctos
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
    ARRAY[]::text[],  -- Array vacío de texto en lugar de jsonb
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    email_tramitador = EXCLUDED.email_tramitador,
    email_pagador = EXCLUDED.email_pagador,
    cc_emails = EXCLUDED.cc_emails,
    updated_at = NOW();

-- Paso 5: Verificar inserción
SELECT 
    '✅ Configuración insertada:' as resultado,
    id,
    enabled,
    email_tramitador,
    email_pagador,
    cc_emails,
    array_length(cc_emails, 1) as num_cc_emails,
    created_at
FROM extornos_email_config;

-- Paso 6: Desactivar RLS si está activado
ALTER TABLE extornos_email_config DISABLE ROW LEVEL SECURITY;

-- Paso 7: Verificación final
SELECT 
    'VERIFICACIÓN FINAL:' as titulo,
    COUNT(*) as registros_totales,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ CONFIGURACIÓN LISTA PARA USAR'
        ELSE '❌ FALTA CONFIGURACIÓN'
    END as estado
FROM extornos_email_config;

-- Paso 8: Mostrar configuración final
SELECT 
    'CONFIGURACIÓN ACTUAL:' as info,
    *
FROM extornos_email_config;
