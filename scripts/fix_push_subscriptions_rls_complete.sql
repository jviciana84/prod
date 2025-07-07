-- Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_push_subscriptions'
);

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eliminar TODAS las políticas RLS existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_push_subscriptions' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.user_push_subscriptions';
    END LOOP;
END $$;

-- Habilitar RLS en la tabla
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS nuevas
-- 1. Usuarios pueden ver sus propias suscripciones
CREATE POLICY "Usuarios pueden ver sus propias suscripciones"
ON public.user_push_subscriptions
FOR SELECT
USING (auth.uid()::text = user_id);

-- 2. Usuarios pueden insertar sus propias suscripciones
CREATE POLICY "Usuarios pueden insertar sus propias suscripciones"
ON public.user_push_subscriptions
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- 3. Usuarios pueden actualizar sus propias suscripciones
CREATE POLICY "Usuarios pueden actualizar sus propias suscripciones"
ON public.user_push_subscriptions
FOR UPDATE
USING (auth.uid()::text = user_id);

-- 4. Administradores pueden ver todas las suscripciones
CREATE POLICY "Administradores pueden ver todas las suscripciones"
ON public.user_push_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'administrador')
  )
);

-- 5. Administradores pueden gestionar todas las suscripciones
CREATE POLICY "Administradores pueden gestionar todas las suscripciones"
ON public.user_push_subscriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'administrador')
  )
);

-- 6. Permitir acceso al servicio para notificaciones
CREATE POLICY "Servicio puede acceder a todas las suscripciones"
ON public.user_push_subscriptions
FOR ALL
USING (auth.role() = 'service_role');

-- 7. Política especial para usuarios de prueba (sin autenticación)
CREATE POLICY "Permitir suscripciones de prueba"
ON public.user_push_subscriptions
FOR ALL
USING (user_id LIKE 'test-user-%');

-- Verificar políticas creadas
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_push_subscriptions' 
ORDER BY policyname;
