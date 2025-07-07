-- Ver el mapeo de Sara que acabas de crear
SELECT 'MAPEO DE SARA:' as info;
SELECT * FROM user_asesor_mapping WHERE asesor_alias = 'SaraMe';

-- Ver cuántas entregas tiene SaraMe
SELECT 'ENTREGAS DE SaraMe:' as info;
SELECT COUNT(*) as total_entregas_sara FROM entregas WHERE asesor = 'SaraMe';

-- Ver todos los mapeos actuales
SELECT 'TODOS LOS MAPEOS:' as info;
SELECT 
    profile_name,
    asesor_alias,
    email,
    active,
    created_at
FROM user_asesor_mapping 
WHERE active = true
ORDER BY created_at DESC;

-- Ver por qué no encuentra emails - verificar funciones RPC
SELECT 'VERIFICAR FUNCIONES RPC:' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('get_user_emails', 'get_user_email');
