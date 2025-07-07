CREATE OR REPLACE FUNCTION get_table_structure(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    columns.column_name::text,
    columns.data_type::text,
    (columns.is_nullable = 'YES')::boolean,
    columns.column_default::text
  FROM 
    information_schema.columns
  WHERE 
    table_name = $1
    AND table_schema = 'public'
  ORDER BY 
    ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
