-- =====================================================
-- CREAR FUNCIÓN RPC PARA VERIFICAR SINCRONIZACIÓN
-- =====================================================
-- Descripción: Crea una función RPC que ejecuta el script
-- de verificación de funciones de sincronización
-- =====================================================

-- Función RPC para verificar funciones de sincronización
CREATE OR REPLACE FUNCTION verify_sync_functions()
RETURNS TABLE(
    info TEXT,
    tipo TEXT,
    nombre_funcion TEXT,
    estado TEXT
) AS $$
BEGIN
    -- Verificar funciones existentes
    RETURN QUERY
    SELECT 
        'Funciones de sincronización'::TEXT as info,
        'Funciones de sincronización'::TEXT as tipo,
        proname::TEXT as nombre_funcion,
        CASE 
            WHEN proname IN ('sync_photos_with_sales', 'check_photos_sales_inconsistencies', 'handle_vehicle_sold_remove_from_photos') 
            THEN '✅ EXISTE'
            ELSE '❌ NO EXISTE'
        END::TEXT as estado
    FROM pg_proc 
    WHERE proname IN ('sync_photos_with_sales', 'check_photos_sales_inconsistencies', 'handle_vehicle_sold_remove_from_photos')
    
    UNION ALL
    
    -- Verificar triggers existentes
    SELECT 
        'Triggers de sincronización'::TEXT as info,
        'Triggers de sincronización'::TEXT as tipo,
        tgname::TEXT as nombre_funcion,
        CASE 
            WHEN tgname = 'trigger_remove_from_photos_on_sale' 
            THEN '✅ EXISTE'
            ELSE '❌ NO EXISTE'
        END::TEXT as estado
    FROM pg_trigger 
    WHERE tgname = 'trigger_remove_from_photos_on_sale';
    
    -- Log de verificación
    RAISE NOTICE '🔍 Verificación de funciones de sincronización completada';
END;
$$ LANGUAGE plpgsql;

-- Comentario para documentar
COMMENT ON FUNCTION verify_sync_functions() IS 'Verifica el estado de las funciones de sincronización entre fotos y ventas'; 