-- Verificar el estado actual de RLS en la tabla entregas
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'entregas';

-- Ver las políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'entregas';

-- Eliminar todas las políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON entregas;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON entregas;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON entregas;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON entregas;
DROP POLICY IF EXISTS "Users can view entregas" ON entregas;
DROP POLICY IF EXISTS "Users can insert entregas" ON entregas;
DROP POLICY IF EXISTS "Users can update entregas" ON entregas;
DROP POLICY IF EXISTS "Users can delete entregas" ON entregas;

-- Crear políticas más permisivas que funcionen tanto para usuarios como para triggers
CREATE POLICY "Allow all operations for authenticated users and service role" ON entregas
    FOR ALL USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'role' = 'authenticated'
    )
    WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'role' = 'authenticated'
    );

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'entregas';

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'entregas';
