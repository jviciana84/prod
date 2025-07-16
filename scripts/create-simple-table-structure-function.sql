-- Crear una función simple para obtener la estructura de las tablas
-- Ejecutar este script en Supabase SQL Editor

-- Eliminar la función si existe
DROP FUNCTION IF EXISTS get_table_structure(text);

-- Crear la función simplificada
CREATE OR REPLACE FUNCTION get_table_structure(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text,
  is_primary_key boolean,
  is_foreign_key boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES')::boolean,
    c.column_default::text,
    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END::boolean,
    CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END::boolean
  FROM 
    information_schema.columns c
  LEFT JOIN (
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY' 
    AND tc.table_name = $1 
    AND tc.table_schema = 'public'
  ) pk ON c.column_name = pk.column_name
  LEFT JOIN (
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = $1 
    AND tc.table_schema = 'public'
  ) fk ON c.column_name = fk.column_name
  WHERE 
    c.table_name = $1 
    AND c.table_schema = 'public'
  ORDER BY 
    c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Probar la función
SELECT 'nuevas_entradas' as tabla, * FROM get_table_structure('nuevas_entradas') LIMIT 3;
SELECT 'stock' as tabla, * FROM get_table_structure('stock') LIMIT 3; 