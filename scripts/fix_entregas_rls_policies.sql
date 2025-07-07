-- Verificar políticas actuales de la tabla entregas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'entregas';

-- Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'entregas';

-- Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Users can view entregas" ON entregas;
DROP POLICY IF EXISTS "Users can insert entregas" ON entregas;
DROP POLICY IF EXISTS "Users can update entregas" ON entregas;
DROP POLICY IF EXISTS "Users can delete entregas" ON entregas;
DROP POLICY IF EXISTS "Enable read access for all users" ON entregas;
DROP POLICY IF EXISTS "Enable insert access for all users" ON entregas;
DROP POLICY IF EXISTS "Enable update access for all users" ON entregas;
DROP POLICY IF EXISTS "Enable delete access for all users" ON entregas;

-- Crear políticas más permisivas para usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" ON entregas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON entregas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON entregas
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON entregas
    FOR DELETE USING (auth.role() = 'authenticated');

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'entregas';
