-- Script para configurar tipos de notificaciones
-- Ejecutar en Supabase SQL Editor

-- Primero, asegurar que la tabla notification_types existe
CREATE TABLE IF NOT EXISTS public.notification_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_critical BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar tipos de notificaciones básicos
INSERT INTO public.notification_types (name, description, category, is_critical) VALUES
-- Vehículos
('vehicle_inspection_ready', 'Vehículo listo para inspección', 'vehiculos', false),
('vehicle_delivery_scheduled', 'Entrega de vehículo programada', 'vehiculos', true),
('vehicle_delivery_completed', 'Entrega de vehículo completada', 'vehiculos', false),
('vehicle_incident_reported', 'Nueva incidencia reportada', 'vehiculos', true),
('vehicle_incident_resolved', 'Incidencia resuelta', 'vehiculos', false),

-- Documentación
('document_ready', 'Documentación lista para recoger', 'documentacion', false),
('document_delivered', 'Documentación entregada', 'documentacion', false),
('document_expired', 'Documentación próxima a expirar', 'documentacion', true),

-- Llaves
('keys_ready', 'Llaves listas para recoger', 'llaves', false),
('keys_delivered', 'Llaves entregadas', 'llaves', false),
('keys_missing', 'Llaves faltantes', 'llaves', true),

-- Entregas
('delivery_scheduled', 'Entrega programada', 'entregas', false),
('delivery_in_progress', 'Entrega en progreso', 'entregas', false),
('delivery_completed', 'Entrega completada', 'entregas', false),
('delivery_delayed', 'Entrega retrasada', 'entregas', true),

-- Sistema
('system_maintenance', 'Mantenimiento del sistema', 'sistema', false),
('system_error', 'Error del sistema', 'sistema', true),
('system_update', 'Actualización del sistema', 'sistema', false),

-- Usuarios
('user_assigned', 'Usuario asignado a tarea', 'usuarios', false),
('user_permission_changed', 'Permisos de usuario modificados', 'usuarios', true),
('user_login', 'Nuevo inicio de sesión', 'usuarios', false),

-- Reportes
('report_ready', 'Reporte listo', 'reportes', false),
('report_error', 'Error en reporte', 'reportes', true),

-- General
('info', 'Información general', 'general', false),
('warning', 'Advertencia', 'general', true),
('success', 'Operación exitosa', 'general', false),
('error', 'Error general', 'general', true)
ON CONFLICT (name) DO NOTHING;

-- Crear tabla de preferencias de usuario si no existe
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type_id UUID NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, notification_type_id)
);

-- Configurar RLS para notification_types
ALTER TABLE public.notification_types ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_types
CREATE POLICY "notification_types_select_policy" ON public.notification_types
  FOR SELECT USING (true);

CREATE POLICY "notification_types_insert_policy" ON public.notification_types
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "notification_types_update_policy" ON public.notification_types
  FOR UPDATE USING (auth.role() = 'service_role');

-- Configurar RLS para user_notification_preferences
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para user_notification_preferences
CREATE POLICY "user_preferences_select_policy" ON public.user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_policy" ON public.user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_policy" ON public.user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Verificar los tipos agregados
SELECT 
  name,
  description,
  category,
  is_critical,
  is_active
FROM public.notification_types 
ORDER BY category, name; 