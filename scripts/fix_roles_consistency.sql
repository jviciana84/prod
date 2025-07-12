-- Script para corregir la consistencia de roles entre BD y código
-- Ejecutar este script para asegurar que los roles coincidan con lo que espera el código

-- 1. Agregar el rol 'director' que falta
INSERT INTO public.roles (name, description)
VALUES ('director', 'Director con permisos administrativos')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 2. Agregar el rol 'supervisor' en minúscula (además del existente 'Supervisor')
INSERT INTO public.roles (name, description)
VALUES ('supervisor', 'Supervisor con permisos de supervisión')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 3. Verificar todos los roles disponibles
SELECT 'Roles disponibles después de la corrección:' as info;
SELECT id, name, description, created_at
FROM roles 
ORDER BY name;

-- 4. Verificar que los roles críticos existen
SELECT 'Verificación de roles críticos:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM roles WHERE name = 'admin') THEN '✅ admin existe'
        ELSE '❌ admin NO existe'
    END as admin_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM roles WHERE name = 'supervisor') THEN '✅ supervisor existe'
        ELSE '❌ supervisor NO existe'
    END as supervisor_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM roles WHERE name = 'director') THEN '✅ director existe'
        ELSE '❌ director NO existe'
    END as director_status; 