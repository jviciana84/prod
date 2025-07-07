-- Verificar que la columna confirmation_token existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'extornos' 
AND column_name = 'confirmation_token';

-- Ver extornos recientes y sus tokens
SELECT id, matricula, cliente, confirmation_token, pago_confirmado_at, created_at
FROM extornos 
ORDER BY created_at DESC 
LIMIT 5;
