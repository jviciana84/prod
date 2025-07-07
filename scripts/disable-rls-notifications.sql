-- DESHABILITAR RLS COMPLETAMENTE EN LA TABLA DE NOTIFICACIONES
ALTER TABLE public.user_push_subscriptions DISABLE ROW LEVEL SECURITY;

-- VERIFICAR QUE SE DESHABILITÓ
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_push_subscriptions';
