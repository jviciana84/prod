-- Script para verificar autenticación, permisos y RLS
-- Problemas comunes que causan error 500 en APIs de Supabase

-- 1. Verificar si RLS está activo en las tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_activo
FROM pg_tables 
WHERE tablename IN ('circulation_permit_requests', 'circulation_permit_materials', 'entregas');

-- 2. Verificar políticas RLS en circulation_permit_requests
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'circulation_permit_requests';

-- 3. Verificar políticas RLS en circulation_permit_materials
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'circulation_permit_materials';

-- 4. Verificar políticas RLS en entregas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'entregas';

-- 5. Verificar permisos del rol anon (usuario no autenticado)
SELECT 
  grantee,
  privilege_type,
  table_name
FROM information_schema.role_table_grants 
WHERE table_name IN ('circulation_permit_requests', 'circulation_permit_materials', 'entregas')
AND grantee = 'anon';

-- 6. Verificar permisos del rol authenticated (usuario autenticado)
SELECT 
  grantee,
  privilege_type,
  table_name
FROM information_schema.role_table_grants 
WHERE table_name IN ('circulation_permit_requests', 'circulation_permit_materials', 'entregas')
AND grantee = 'authenticated';

-- 7. Verificar permisos del rol service_role (usado por APIs)
SELECT 
  grantee,
  privilege_type,
  table_name
FROM information_schema.role_table_grants 
WHERE table_name IN ('circulation_permit_requests', 'circulation_permit_materials', 'entregas')
AND grantee = 'service_role';

-- 8. Verificar si hay usuarios en la tabla auth.users
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as usuarios_confirmados,
  COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as usuarios_con_login
FROM auth.users;

-- 9. Verificar perfiles de usuarios
SELECT 
  COUNT(*) as total_perfiles,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as perfiles_con_email,
  COUNT(CASE WHEN alias IS NOT NULL THEN 1 END) as perfiles_con_alias
FROM profiles;

-- 10. Verificar si hay algún usuario específico para testing
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email LIKE '%jordi%' OR email LIKE '%test%'
LIMIT 5;

-- 11. Verificar si hay perfiles para usuarios específicos
SELECT 
  id,
  email,
  alias,
  full_name,
  created_at
FROM profiles 
WHERE alias LIKE '%Jordi%' OR alias LIKE '%test%'
LIMIT 5; 