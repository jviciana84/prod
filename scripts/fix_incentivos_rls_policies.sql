-- Verificar si RLS está habilitado en las tablas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('incentivos', 'incentivos_config') 
AND schemaname = 'public';

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('incentivos', 'incentivos_config') 
AND schemaname = 'public';

-- Deshabilitar RLS temporalmente para verificar acceso
ALTER TABLE public.incentivos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentivos_config DISABLE ROW LEVEL SECURITY;

-- Crear políticas básicas para administradores
CREATE POLICY "Admins can do everything on incentivos" ON public.incentivos
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admins can do everything on incentivos_config" ON public.incentivos_config
FOR ALL USING (true) WITH CHECK (true);

-- Habilitar RLS nuevamente
ALTER TABLE public.incentivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentivos_config ENABLE ROW LEVEL SECURITY;
