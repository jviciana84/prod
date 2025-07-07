-- Habilitar RLS en la tabla entregas
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'entregas';

-- Mostrar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'entregas';
