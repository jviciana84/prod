-- Limpiar suscripciones push corruptas
DELETE FROM user_push_subscriptions 
WHERE user_id = '4ece67b0-85a0-4b01-bdb7-f9d5b185e1b4';

-- Verificar que se limpiaron
SELECT COUNT(*) as suscripciones_restantes 
FROM user_push_subscriptions 
WHERE user_id = '4ece67b0-85a0-4b01-bdb7-f9d5b185e1b4'; 