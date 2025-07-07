-- Ver la definición de la función que está actualmente activa
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_cyp_to_entregas_simple';
