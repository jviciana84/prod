-- Función para obtener informes de incidencias
CREATE OR REPLACE FUNCTION obtener_informe_incidencias(fecha_inicio TIMESTAMP)
RETURNS TABLE (
  tipo TEXT,
  total_incidencias BIGINT, -- Renombrado para coincidir con el uso en el frontend
  resueltas BIGINT,
  pendientes BIGINT,
  entregas_con_esta_incidencia BIGINT, -- Número de entregas únicas que tienen este tipo de incidencia
  tiempo_medio_resolucion NUMERIC, -- En horas
  total_entregas_unicas_con_incidencias BIGINT -- Total de entregas únicas con al menos una incidencia válida en el período
) AS $$
DECLARE
  tipos_validos TEXT[] := ARRAY[
    'CARROCERIA', 
    'MECANICA', 
    'LIMPIEZA', 
    '2ª LLAVE', 
    'FICHA TECNICA', 
    'PERMISO CIRCULACION'
  ];
  v_total_entregas_con_alguna_incidencia BIGINT;
BEGIN

  -- Calcular el total de entregas únicas con al menos una incidencia válida en el período
  SELECT COUNT(DISTINCT e.id)
  INTO v_total_entregas_con_alguna_incidencia
  FROM entregas e
  WHERE e.fecha_venta >= fecha_inicio 
    AND e.incidencia = TRUE 
    AND EXISTS (
      SELECT 1
      FROM unnest(e.tipos_incidencia) AS ti
      WHERE ti = ANY(tipos_validos)
    );

  RETURN QUERY
  WITH incidencias_base AS (
    -- Desanidar todos los tipos de incidencia de las entregas que tienen alguna incidencia
    SELECT 
      e.id as entrega_id,
      unnest(e.tipos_incidencia) AS tipo_incidencia_original,
      e.fecha_venta
    FROM entregas e
    WHERE e.fecha_venta >= fecha_inicio AND e.incidencia = TRUE
  ),
  incidencias_filtradas AS (
    -- Filtrar solo por los tipos válidos y realizar mapeos si es necesario en el futuro
    SELECT 
      ib.entrega_id,
      -- Ejemplo de mapeo futuro: CASE ib.tipo_incidencia_original WHEN 'PINTURA' THEN 'CARROCERIA' ELSE ib.tipo_incidencia_original END AS tipo_incidencia,
      ib.tipo_incidencia_original AS tipo_incidencia,
      ib.fecha_venta
    FROM incidencias_base ib
    WHERE ib.tipo_incidencia_original = ANY(tipos_validos) -- Filtrar por tipos válidos
  ),
  incidencias_por_tipo AS (
    -- Contar el total de incidencias y el número de entregas únicas para cada tipo de incidencia válido
    SELECT 
      if.tipo_incidencia,
      COUNT(*) AS num_total_incidencias_por_tipo,
      COUNT(DISTINCT if.entrega_id) AS num_entregas_con_esta_incidencia
    FROM incidencias_filtradas if
    GROUP BY if.tipo_incidencia
  ),
  incidencias_resueltas AS (
    -- Contar incidencias resueltas y calcular tiempo medio de resolución para cada tipo válido
    SELECT 
      h.tipo_incidencia,
      COUNT(*) AS num_resueltas,
      AVG(EXTRACT(EPOCH FROM (h.fecha - e.fecha_venta)) / 3600) AS tiempo_medio -- en horas
    FROM incidencias_historial h
    JOIN entregas e ON h.entrega_id = e.id -- Unir con entregas para obtener fecha_venta
    WHERE h.accion = 'resuelta' 
      AND e.fecha_venta >= fecha_inicio -- Asegurar que la entrega (y por tanto la incidencia) esté en el período
      AND h.tipo_incidencia = ANY(tipos_validos) -- Filtrar por tipos válidos
    GROUP BY h.tipo_incidencia
  )
  SELECT 
    ipt.tipo_incidencia AS tipo,
    ipt.num_total_incidencias_por_tipo AS total_incidencias,
    COALESCE(ir.num_resueltas, 0) AS resueltas,
    ipt.num_total_incidencias_por_tipo - COALESCE(ir.num_resueltas, 0) AS pendientes,
    ipt.num_entregas_con_esta_incidencia AS entregas_con_esta_incidencia,
    COALESCE(ir.tiempo_medio, 0) AS tiempo_medio_resolucion,
    COALESCE(v_total_entregas_con_alguna_incidencia, 0) AS total_entregas_unicas_con_incidencias
  FROM incidencias_por_tipo ipt
  LEFT JOIN incidencias_resueltas ir ON ipt.tipo_incidencia = ir.tipo_incidencia
  ORDER BY ipt.num_total_incidencias_por_tipo DESC;
END;
$$ LANGUAGE plpgsql;

-- Permisos para la función (si no existen o necesitas re-aplicarlos)
GRANT EXECUTE ON FUNCTION obtener_informe_incidencias(TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_informe_incidencias(TIMESTAMP) TO service_role;
