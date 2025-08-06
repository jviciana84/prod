-- Agregar más tipos de notificaciones útiles
-- Ejecutar este script en Supabase SQL Editor

-- Insertar tipos de notificaciones adicionales
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

-- Verificar los tipos agregados
SELECT 
  name,
  description,
  category,
  is_critical,
  is_active
FROM public.notification_types 
WHERE name IN (
  'vehicle_inspection_ready',
  'vehicle_delivery_scheduled',
  'vehicle_delivery_completed',
  'vehicle_incident_reported',
  'vehicle_incident_resolved',
  'document_ready',
  'document_delivered',
  'document_expired',
  'keys_ready',
  'keys_delivered',
  'keys_missing',
  'delivery_scheduled',
  'delivery_in_progress',
  'delivery_completed',
  'delivery_delayed',
  'system_maintenance',
  'system_error',
  'system_update',
  'user_assigned',
  'user_permission_changed',
  'user_login',
  'report_ready',
  'report_error',
  'info',
  'warning',
  'success',
  'error'
)
ORDER BY category, name; 