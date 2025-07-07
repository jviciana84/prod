-- Actualizar el nombre del perfil de Jordi Viciana Sánchez a Jordi Viciana
UPDATE user_asesor_mapping
SET profile_name = 'Jordi Viciana'
WHERE email = 'jordi.viciana@munichgroup.es' AND profile_name = 'Jordi Viciana Sánchez';

SELECT 'Mapeo actualizado para Jordi Viciana:' as info;
SELECT * FROM user_asesor_mapping WHERE email = 'jordi.viciana@munichgroup.es';
