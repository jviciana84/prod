-- =====================================================
-- DIAGNÓSTICO COMPLETO DE LA TABLA STOCK
-- =====================================================
-- Descripción: Script para diagnosticar problemas con la tabla stock
-- =====================================================

-- 1. VERIFICAR ESTRUCTURA DE LA TABLA
SELECT 
    'ESTRUCTURA TABLA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stock' 
ORDER BY ordinal_position;

-- 2. VERIFICAR SI RLS ESTÁ HABILITADO
SELECT
    'RLS STATUS' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'stock';

-- 3. VERIFICAR POLÍTICAS RLS EXISTENTES
SELECT
    'POLÍTICAS RLS' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'stock';

-- 4. VERIFICAR PERMISOS DE LA TABLA
SELECT
    'PERMISOS TABLA' as info,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'stock';

-- 5. VERIFICAR SI EL USUARIO ANÓNIMO TIENE ACCESO
SELECT
    'ACCESO ANÓNIMO' as info,
    has_table_privilege('anon', 'stock', 'SELECT') as can_select,
    has_table_privilege('anon', 'stock', 'INSERT') as can_insert,
    has_table_privilege('anon', 'stock', 'UPDATE') as can_update,
    has_table_privilege('anon', 'stock', 'DELETE') as can_delete;

-- 6. VERIFICAR SI EL USUARIO AUTENTICADO TIENE ACCESO
SELECT
    'ACCESO AUTENTICADO' as info,
    has_table_privilege('authenticated', 'stock', 'SELECT') as can_select,
    has_table_privilege('authenticated', 'stock', 'INSERT') as can_insert,
    has_table_privilege('authenticated', 'stock', 'UPDATE') as can_update,
    has_table_privilege('authenticated', 'stock', 'DELETE') as can_delete;

-- 7. VERIFICAR DATOS EN LA TABLA (sin RLS)
SELECT
    'DATOS SIN RLS' as info,
    COUNT(*) as total_registros
FROM stock;

-- 8. VERIFICAR DATOS CON RLS (como usuario anónimo)
SELECT
    'DATOS CON RLS (ANÓNIMO)' as info,
    COUNT(*) as total_registros
FROM stock;

-- 9. VERIFICAR CONEXIÓN Y CONFIGURACIÓN
SELECT
    'CONFIGURACIÓN' as info,
    current_database() as database_name,
    current_user as current_user,
    session_user as session_user;

-- 10. VERIFICAR TRIGGERS EN LA TABLA
SELECT
    'TRIGGERS' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'stock'; 