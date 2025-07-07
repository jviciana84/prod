-- Verificar los tokens de confirmación generados
SELECT 
    id,
    matricula,
    cliente,
    confirmation_token,
    pago_confirmado_at,
    created_at
FROM extornos 
ORDER BY created_at DESC 
LIMIT 10;
