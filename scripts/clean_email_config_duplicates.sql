-- Eliminar configuraciones duplicadas, manteniendo solo la más reciente
DELETE FROM email_config 
WHERE id NOT IN (
  SELECT id 
  FROM email_config 
  ORDER BY updated_at DESC 
  LIMIT 1
);

-- Verificar que solo queda una configuración
SELECT * FROM email_config ORDER BY updated_at DESC;
