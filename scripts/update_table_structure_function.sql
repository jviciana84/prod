-- Script para actualizar la función get_table_structure
-- Ejecutar este script en Supabase SQL Editor

-- Actualizar la función get_table_structure para incluir información de claves primarias y foráneas
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
    columns.column_name::text,
    columns.data_type::text,
    (columns.is_nullable = 'YES')::boolean,
    columns.column_default::text,
    COALESCE(pk.is_primary_key, false)::boolean,
    COALESCE(fk.is_foreign_key, false)::boolean
  FROM 
    information_schema.columns columns
  LEFT JOIN (
    SELECT 
      kcu.column_name,
      true as is_primary_key
    FROM 
      information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE 
      tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_name = $1
      AND tc.table_schema = 'public'
  ) pk ON columns.column_name = pk.column_name
  LEFT JOIN (
    SELECT 
      kcu.column_name,
      true as is_foreign_key
    FROM 
      information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE 
      tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
      AND tc.table_schema = 'public'
  ) fk ON columns.column_name = fk.column_name
  WHERE 
    columns.table_name = $1
    AND columns.table_schema = 'public'
  ORDER BY 
    columns.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que la función funciona correctamente
SELECT * FROM get_table_structure('nuevas_entradas') LIMIT 5;
SELECT * FROM get_table_structure('stock') LIMIT 5; 