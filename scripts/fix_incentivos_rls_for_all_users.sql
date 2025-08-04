-- Script para corregir las políticas de RLS de incentivos
-- Permite acceso a todos los usuarios para las operaciones básicas

-- Verificar el estado actual de RLS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('incentivos', 'incentivos_config') 
AND schemaname = 'public';

-- Verificar políticas existentes
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('incentivos', 'incentivos_config') 
AND schemaname = 'public';

-- Eliminar políticas existentes que puedan estar bloqueando
DROP POLICY IF EXISTS "Solo admin puede ver incentivos" ON public.incentivos;
DROP POLICY IF EXISTS "Solo admin puede gestionar config incentivos" ON public.incentivos_config;
DROP POLICY IF EXISTS "Admins can do everything on incentivos" ON public.incentivos;
DROP POLICY IF EXISTS "Admins can do everything on incentivos_config" ON public.incentivos_config;

-- Crear políticas más permisivas para incentivos
CREATE POLICY "Todos pueden ver incentivos" ON public.incentivos
FOR SELECT USING (true);

CREATE POLICY "Todos pueden insertar incentivos" ON public.incentivos
FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar incentivos" ON public.incentivos
FOR UPDATE USING (true) WITH CHECK (true);

-- Crear políticas más permisivas para incentivos_config
CREATE POLICY "Todos pueden ver incentivos_config" ON public.incentivos_config
FOR SELECT USING (true);

CREATE POLICY "Todos pueden insertar incentivos_config" ON public.incentivos_config
FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar incentivos_config" ON public.incentivos_config
FOR UPDATE USING (true) WITH CHECK (true);

-- Verificar que las políticas se crearon correctamente
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('incentivos', 'incentivos_config') 
AND schemaname = 'public';

-- Verificar que RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('incentivos', 'incentivos_config') 
AND schemaname = 'public'; 