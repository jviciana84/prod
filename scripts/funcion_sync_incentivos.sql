-- Función para sincronizar entregas a incentivos
CREATE OR REPLACE FUNCTION sync_entregas_to_incentivos()
RETURNS TABLE(
    procesados INTEGER,
    errores INTEGER,
    detalles TEXT
) AS $$
DECLARE
    config_record RECORD;
    entrega_record RECORD;
    sales_record RECORD;
    stock_record RECORD;
    dias_calculados INTEGER;
    nuevo_incentivo_id INTEGER;
    contador_procesados INTEGER := 0;
    contador_errores INTEGER := 0;
    mensaje_detalle TEXT := '';
BEGIN
    -- Obtener configuración actual
    SELECT * INTO config_record FROM incentivos_config WHERE id = 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, 1, 'No se encontró configuración en incentivos_config';
        RETURN;
    END IF;
    
    -- Procesar entregas que están marcadas para enviar a incentivos
    FOR entrega_record IN 
        SELECT * FROM entregas 
        WHERE enviado_a_incentivos = true 
        AND fecha_entrega IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM incentivos 
            WHERE incentivos.matricula = entregas.matricula 
            AND incentivos.fecha_entrega = entregas.fecha_entrega
        )
    LOOP
        BEGIN
            -- Buscar datos en sales_vehicles
            SELECT * INTO sales_record 
            FROM sales_vehicles 
            WHERE license_plate = entrega_record.matricula;
            
            IF NOT FOUND THEN
                contador_errores := contador_errores + 1;
                mensaje_detalle := mensaje_detalle || 'Error: No se encontró ' || entrega_record.matricula || ' en sales_vehicles. ';
                CONTINUE;
            END IF;
            
            -- Calcular días en stock (si existe registro en stock)
            dias_calculados := NULL;
            SELECT * INTO stock_record 
            FROM stock 
            WHERE license_plate = entrega_record.matricula;
            
            IF FOUND AND stock_record.reception_date IS NOT NULL AND sales_record.sale_date IS NOT NULL THEN
                dias_calculados := EXTRACT(DAY FROM (sales_record.sale_date - stock_record.reception_date));
            END IF;
            
            -- Insertar en incentivos
            INSERT INTO incentivos (
                fecha_entrega,
                matricula,
                modelo,
                asesor,
                forma_pago,
                precio_venta,
                precio_compra,
                dias_stock,
                gastos_estructura,
                garantia,
                gastos_360,
                antiguedad,
                financiado,
                otros,
                importe_minimo,
                margen,
                importe_total,
                tramitado,
                entrega_id,
                gastos_estructura_config_usado,
                importe_minimo_config_usado,
                porcentaje_margen_config_usado
            ) VALUES (
                entrega_record.fecha_entrega,
                entrega_record.matricula,
                entrega_record.modelo,
                entrega_record.asesor,
                sales_record.payment_method,
                sales_record.price,
                sales_record.purchase_price,
                dias_calculados,
                config_record.gastos_estructura, -- Valor de config
                0, -- garantia - lo rellena admin después
                0, -- gastos_360 - lo rellena admin después  
                false, -- antiguedad - lo marca admin después
                false, -- financiado - lo marca admin después
                0, -- otros - incentivos extra
                config_record.importe_minimo,
                CASE 
                    WHEN sales_record.price IS NOT NULL AND sales_record.purchase_price IS NOT NULL 
                    THEN (sales_record.price - sales_record.purchase_price) * config_record.porcentaje_margen / 100
                    ELSE 0 
                END, -- margen calculado
                0, -- importe_total - se calculará después
                false, -- tramitado
                entrega_record.id::TEXT,
                config_record.gastos_estructura,
                config_record.importe_minimo,
                config_record.porcentaje_margen
            ) RETURNING id INTO nuevo_incentivo_id;
            
            contador_procesados := contador_procesados + 1;
            mensaje_detalle := mensaje_detalle || 'Procesado: ' || entrega_record.matricula || ' (ID: ' || nuevo_incentivo_id || '). ';
            
        EXCEPTION WHEN OTHERS THEN
            contador_errores := contador_errores + 1;
            mensaje_detalle := mensaje_detalle || 'Error procesando ' || entrega_record.matricula || ': ' || SQLERRM || '. ';
        END;
    END LOOP;
    
    RETURN QUERY SELECT contador_procesados, contador_errores, mensaje_detalle;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la función de sincronización
SELECT * FROM sync_entregas_to_incentivos();
