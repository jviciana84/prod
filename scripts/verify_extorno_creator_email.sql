-- Reemplaza 'TU_USER_ID_DEL_EXTORNO' con el UUID real del campo 'created_by' del extorno.
SELECT 
    id,
    email,
    full_name,
    role,
    alias
FROM profiles
WHERE id = 'TU_USER_ID_DEL_EXTORNO';
