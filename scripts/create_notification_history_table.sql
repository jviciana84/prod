-- Crear tabla de historial de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deshabilitar RLS para evitar problemas
ALTER TABLE public.notification_history DISABLE ROW LEVEL SECURITY;

-- Permisos
GRANT ALL ON public.notification_history TO anon;
GRANT ALL ON public.notification_history TO authenticated;
GRANT ALL ON public.notification_history TO service_role;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON public.notification_history(created_at DESC);
