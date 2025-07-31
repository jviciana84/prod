-- =====================================================
-- CREAR FUNCIÓN PARA EJECUTAR SQL DINÁMICO
-- =====================================================

-- Función para ejecutar SQL dinámico (solo para uso interno)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    query_result record;
    results_array json[] := '{}';
BEGIN
    -- Ejecutar el SQL y capturar resultados
    FOR query_result IN EXECUTE sql LOOP
        results_array := array_append(results_array, to_json(query_result));
    END LOOP;
    
    result := json_build_object(
        'success', true,
        'results', results_array,
        'executed_at', now()
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'executed_at', now()
        );
END;
$$;

-- Comentario sobre seguridad
COMMENT ON FUNCTION exec_sql(text) IS 'Función para ejecutar SQL dinámico desde GitHub Actions. Solo para uso interno y automatizado.'; 