-- Script para solucionar problemas de RLS en las tablas de circulación
-- Ejecutar como superusuario (postgres) para permitir que el API funcione

-- 1. Desactivar RLS en circulation_permit_requests
ALTER TABLE circulation_permit_requests DISABLE ROW LEVEL SECURITY;

-- 2. Desactivar RLS en circulation_permit_materials  
ALTER TABLE circulation_permit_materials DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que RLS está desactivado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_activo
FROM pg_tables 
WHERE tablename IN ('circulation_permit_requests', 'circulation_permit_materials');

-- 4. Otorgar permisos completos al rol authenticated
GRANT ALL PRIVILEGES ON TABLE circulation_permit_requests TO authenticated;
GRANT ALL PRIVILEGES ON TABLE circulation_permit_materials TO authenticated;

-- 5. Otorgar permisos completos al rol anon (por si acaso)
GRANT ALL PRIVILEGES ON TABLE circulation_permit_requests TO anon;
GRANT ALL PRIVILEGES ON TABLE circulation_permit_materials TO anon;

-- 6. Verificar permisos otorgados
SELECT 
  grantee,
  privilege_type,
  table_name
FROM information_schema.role_table_grants 
WHERE table_name IN ('circulation_permit_requests', 'circulation_permit_materials')
AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, table_name, privilege_type;

-- 7. Crear políticas RLS básicas que permitan todo (alternativa)
-- Comentar estas líneas si prefieres mantener RLS desactivado
/*
-- Política para circulation_permit_requests
CREATE POLICY "Allow all operations for authenticated users" ON circulation_permit_requests
FOR ALL USING (auth.role() = 'authenticated');

-- Política para circulation_permit_materials  
CREATE POLICY "Allow all operations for authenticated users" ON circulation_permit_materials
FOR ALL USING (auth.role() = 'authenticated');
*/

-- 8. Verificar que las tablas son accesibles
SELECT 'circulation_permit_requests' as tabla, COUNT(*) as registros FROM circulation_permit_requests
UNION ALL
SELECT 'circulation_permit_materials' as tabla, COUNT(*) as registros FROM circulation_permit_materials; 