-- Solo habilitar RLS correctamente sin eliminar políticas
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

-- Verificar que funciona
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  COUNT(*) as num_policies
FROM pg_policies 
WHERE tablename = 'entregas'
GROUP BY schemaname, tablename, rowsecurity;
