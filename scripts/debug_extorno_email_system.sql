-- 🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA DE EMAILS DE EXTORNOS
-- Ejecutar para ver qué está fallando

-- 1. Verificar configuración de extornos
SELECT 
    '🔧 CONFIGURACIÓN EXTORNOS' as tipo,
    enabled,
    email_tramitador,
    email_pagador,
    cc_emails,
    created_at,
    updated_at
FROM extornos_email_config;

-- 2. Verificar último extorno creado
SELECT 
    '📋 ÚLTIMO EXTORNO' as tipo,
    id,
    matricula,
    cliente,
    importe,
    created_at,
    solicitado_por
FROM extornos 
ORDER BY created_at DESC 
LIMIT 1;

-- 3. Verificar si existe la tabla de configuración
SELECT 
    '📊 TABLA CONFIG' as tipo,
    COUNT(*) as registros
FROM extornos_email_config;

-- 4. Verificar variables de entorno necesarias (esto no se puede hacer en SQL)
SELECT 
    '⚠️ VARIABLES ENV' as tipo,
    'Verificar manualmente: SMTP_HOST, EXTORNO_EMAIL, EXTORNO_PASSWORD' as mensaje;
