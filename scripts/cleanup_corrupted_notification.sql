-- Limpiar notificación con icono corrupto
-- Ejecutar en Supabase SQL Editor

-- Eliminar la notificación corrupta
DELETE FROM notification_history 
WHERE id = 'a25ff767-8981-4bf3-b801-5d37c3971a0f';

-- Verificar que se eliminó
SELECT COUNT(*) as notificaciones_restantes
FROM notification_history 
WHERE title LIKE '%fotografías%'; 