-- Script completo para configurar el sistema de notificaciones
-- Ejecutar este script en Supabase SQL Editor

-- 1. Crear tabla de tipos de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name CHARACTER VARYING NOT NULL UNIQUE,
  description TEXT,
  category CHARACTER VARYING NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Crear tabla de historial de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  notification_type_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status CHARACTER VARYING DEFAULT 'sent',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de preferencias de usuario
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type_id UUID NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_notification_preferences_notification_type_id_fkey FOREIGN KEY (notification_type_id) REFERENCES public.notification_types(id)
);

-- 4. Crear tabla de suscripciones push
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Deshabilitar RLS en todas las tablas para evitar problemas
ALTER TABLE public.notification_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_push_subscriptions DISABLE ROW LEVEL SECURITY;

-- 6. Otorgar permisos
GRANT ALL ON public.notification_types TO anon;
GRANT ALL ON public.notification_types TO authenticated;
GRANT ALL ON public.notification_types TO service_role;

GRANT ALL ON public.notification_history TO anon;
GRANT ALL ON public.notification_history TO authenticated;
GRANT ALL ON public.notification_history TO service_role;

GRANT ALL ON public.user_notification_preferences TO anon;
GRANT ALL ON public.user_notification_preferences TO authenticated;
GRANT ALL ON public.user_notification_preferences TO service_role;

GRANT ALL ON public.user_push_subscriptions TO anon;
GRANT ALL ON public.user_push_subscriptions TO authenticated;
GRANT ALL ON public.user_push_subscriptions TO service_role;

-- 7. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON public.notification_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id ON public.user_push_subscriptions(user_id);

-- 8. Insertar tipos de notificaciones básicos
INSERT INTO public.notification_types (name, description, category, is_critical) VALUES
('key_delivery', 'Entrega de llaves', 'vehiculos', true),
('vehicle_ready', 'Vehículo listo', 'vehiculos', false),
('incident_created', 'Nueva incidencia', 'incidencias', true),
('incident_resolved', 'Incidencia resuelta', 'incidencias', false),
('delivery_scheduled', 'Entrega programada', 'entregas', false),
('delivery_completed', 'Entrega completada', 'entregas', false)
ON CONFLICT (name) DO NOTHING;

-- 9. Verificar que las tablas se crearon correctamente
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('notification_types', 'notification_history', 'user_notification_preferences', 'user_push_subscriptions')
ORDER BY table_name; 