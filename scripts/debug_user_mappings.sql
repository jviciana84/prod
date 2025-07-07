-- Script para diagnosticar el sistema de mapeos de usuarios

-- 1. Verificar si existe la tabla user_asesor_mapping
SELECT 
  'user_asesor_mapping' as tabla,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_asesor_mapping'
  ) THEN 'Existe' ELSE 'No existe' END as estado;

-- 2. Ver estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_asesor_mapping'
ORDER BY ordinal_position;

-- 3. Contar registros en la tabla
SELECT 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN active = true THEN 1 END) as activos,
  COUNT(CASE WHEN active = false THEN 1 END) as inactivos
FROM user_asesor_mapping;

-- 4. Ver todos los mapeos existentes
SELECT 
  id,
  user_id,
  profile_name,
  asesor_alias,
  email,
  active,
  created_at
FROM user_asesor_mapping
ORDER BY created_at DESC;

-- 5. Verificar asesores únicos en entregas
SELECT 
  asesor,
  COUNT(*) as cantidad_entregas
FROM entregas
WHERE asesor IS NOT NULL AND asesor != ''
GROUP BY asesor
ORDER BY cantidad_entregas DESC
LIMIT 10;

-- 6. Verificar usuarios en profiles
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as con_nombre
FROM profiles;

-- 7. Verificar funciones RPC
SELECT 
  'get_user_emails' as funcion,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_user_emails'
  ) THEN 'Existe' ELSE 'No existe' END as estado
UNION ALL
SELECT 
  'get_user_email' as funcion,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_user_email'
  ) THEN 'Existe' ELSE 'No existe' END as estado;

-- 8. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_asesor_mapping';
