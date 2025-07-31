-- =====================================================
-- VERIFICACIÓN Y CORRECCIÓN DE POLÍTICAS RLS EN STOCK
-- =====================================================
-- Descripción: Script para verificar y corregir políticas RLS que puedan estar bloqueando el acceso
-- =====================================================

-- 1. VERIFICAR SI RLS ESTÁ HABILITADO
SELECT
    'RLS STATUS' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'stock';

-- 2. VERIFICAR POLÍTICAS RLS EXISTENTES
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

-- 3. VERIFICAR PERMISOS DE LA TABLA
SELECT
    'PERMISOS TABLA' as info,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'stock';

-- 4. VERIFICAR SI EL USUARIO ANÓNIMO TIENE ACCESO
SELECT
    'ACCESO ANÓNIMO' as info,
    has_table_privilege('anon', 'stock', 'SELECT') as can_select,
    has_table_privilege('anon', 'stock', 'INSERT') as can_insert,
    has_table_privilege('anon', 'stock', 'UPDATE') as can_update,
    has_table_privilege('anon', 'stock', 'DELETE') as can_delete;

-- 5. VERIFICAR SI EL USUARIO AUTENTICADO TIENE ACCESO
SELECT
    'ACCESO AUTENTICADO' as info,
    has_table_privilege('authenticated', 'stock', 'SELECT') as can_select,
    has_table_privilege('authenticated', 'stock', 'INSERT') as can_insert,
    has_table_privilege('authenticated', 'stock', 'UPDATE') as can_update,
    has_table_privilege('authenticated', 'stock', 'DELETE') as can_delete;

-- 6. VERIFICAR SI HAY DATOS EN LA TABLA (sin RLS)
SELECT
    'DATOS SIN RLS' as info,
    COUNT(*) as total_registros
FROM stock;

-- 7. VERIFICAR ESTRUCTURA DE LA TABLA
SELECT
    'ESTRUCTURA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stock'
ORDER BY ordinal_position;

-- 8. SI NO HAY POLÍTICAS RLS O HAY PROBLEMAS, CREAR UNA POLÍTICA BÁSICA
-- Descomentar las siguientes líneas si es necesario:

/*
-- Crear política RLS básica para permitir SELECT a usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" ON stock
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear política RLS básica para permitir SELECT a usuarios anónimos (si es necesario)
CREATE POLICY "Enable read access for anonymous users" ON stock
    FOR SELECT
    TO anon
    USING (true);

-- Habilitar RLS si no está habilitado
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
*/ 