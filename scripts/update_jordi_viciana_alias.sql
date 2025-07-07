-- Este script actualiza el campo 'alias' en la tabla 'profiles' para el usuario Jordi Viciana.
-- Asume que el email 'jordi.viciana@munichgroup.es' es el identificador único para Jordi.
-- Si el email no es el correcto, por favor, ajústalo.
UPDATE profiles
SET alias = 'JordiVi'
WHERE id = (SELECT id FROM auth.users WHERE email = 'jordi.viciana@munichgroup.es');

-- Si no estás seguro del email o prefieres usar el full_name (menos robusto si hay duplicados):
-- UPDATE profiles
-- SET alias = 'JordiVi'
-- WHERE full_name = 'Jordi Viciana Sánchez';
