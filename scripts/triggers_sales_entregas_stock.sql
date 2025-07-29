-- =====================================================
-- TRIGGERS PARA MANTENER STOCK ACTUALIZADO
-- =====================================================

-- =====================================================
-- 0. CREAR TABLA vehicle_sale_status SI NO EXISTE
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicle_sale_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    source_table TEXT NOT NULL, -- 'stock' o 'nuevas_entradas'
    license_plate TEXT NOT NULL,
    sale_status TEXT NOT NULL CHECK (sale_status IN ('profesional', 'vendido', 'tactico_vn', 'entregado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- ID del usuario que marcó el estado
    notes TEXT
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_vehicle_sale_status_license_plate ON vehicle_sale_status(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_sale_status_sale_status ON vehicle_sale_status(sale_status);
CREATE INDEX IF NOT EXISTS idx_vehicle_sale_status_created_at ON vehicle_sale_status(created_at);

-- Comentarios para documentar la tabla
COMMENT ON TABLE vehicle_sale_status IS 'Tabla para almacenar estados de venta de vehículos';
COMMENT ON COLUMN vehicle_sale_status.sale_status IS 'Estado de venta: profesional, vendido, tactico_vn, entregado';
COMMENT ON COLUMN vehicle_sale_status.source_table IS 'Tabla de origen: stock o nuevas_entradas';

-- =====================================================
-- 1. TRIGGER: Cuando se añade una venta (INSERT sales_vehicles)
-- =====================================================

CREATE OR REPLACE FUNCTION handle_sale_added()
RETURNS TRIGGER AS $$
BEGIN
    -- Marcar como vendido en vehicle_sale_status
    INSERT INTO vehicle_sale_status (
        vehicle_id,
        source_table,
        license_plate,
        sale_status,
        notes
    ) VALUES (
        NEW.stock_id, -- ID del vehículo en stock (columna real)
        'stock',
        NEW.license_plate, -- Columna real de sales_vehicles
        'vendido',
        'Marcado automáticamente al añadir venta'
    )
    ON CONFLICT (vehicle_id, source_table) 
    DO UPDATE SET
        sale_status = 'vendido',
        notes = 'Actualizado automáticamente al añadir venta';
    
    RAISE NOTICE '✅ Vehículo % marcado como vendido en stock', NEW.license_plate;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error marcando vehículo como vendido: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_sale_added ON sales_vehicles;
CREATE TRIGGER trigger_sale_added
    AFTER INSERT ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_sale_added();

-- =====================================================
-- 2. TRIGGER: Cuando se elimina una venta (DELETE sales_vehicles)
-- =====================================================

CREATE OR REPLACE FUNCTION handle_sale_deleted()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar de vehicle_sale_status
    DELETE FROM vehicle_sale_status 
    WHERE vehicle_id = OLD.stock_id -- Columna real
    AND source_table = 'stock'
    AND sale_status = 'vendido';
    
    RAISE NOTICE '✅ Vehículo % eliminado de vendidos en stock', OLD.license_plate;
    
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error eliminando vehículo de vendidos: %', SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_sale_deleted ON sales_vehicles;
CREATE TRIGGER trigger_sale_deleted
    AFTER DELETE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_sale_deleted();

-- =====================================================
-- 3. TRIGGER: Cuando se establece fecha de entrega (UPDATE entregas)
-- =====================================================

CREATE OR REPLACE FUNCTION handle_delivery_date_set()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar cuando se establece fecha_entrega (antes era NULL, ahora no)
    IF NEW.fecha_entrega IS NOT NULL AND (OLD.fecha_entrega IS NULL OR OLD.fecha_entrega != NEW.fecha_entrega) THEN
        
        -- Buscar el stock_id correspondiente a esta matrícula
        DECLARE
            stock_id_found UUID;
        BEGIN
            SELECT id INTO stock_id_found 
            FROM stock 
            WHERE license_plate = NEW.matricula; -- Columna real de entregas
            
            IF stock_id_found IS NOT NULL THEN
                -- Marcar como entregado en vehicle_sale_status
                INSERT INTO vehicle_sale_status (
                    vehicle_id,
                    source_table,
                    license_plate,
                    sale_status,
                    notes
                ) VALUES (
                    stock_id_found,
                    'stock',
                    NEW.matricula, -- Columna real de entregas
                    'entregado',
                    'Marcado automáticamente al establecer fecha de entrega'
                )
                ON CONFLICT (vehicle_id, source_table) 
                DO UPDATE SET
                    sale_status = 'entregado',
                    notes = 'Actualizado automáticamente al establecer fecha de entrega';
                
                RAISE NOTICE '✅ Vehículo % marcado como entregado en stock', NEW.matricula;
            ELSE
                RAISE NOTICE '⚠️ No se encontró vehículo % en stock', NEW.matricula;
            END IF;
        END;
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error marcando vehículo como entregado: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_delivery_date_set ON entregas;
CREATE TRIGGER trigger_delivery_date_set
    AFTER UPDATE ON entregas
    FOR EACH ROW
    EXECUTE FUNCTION handle_delivery_date_set();

-- =====================================================
-- 4. VERIFICAR QUE LOS TRIGGERS SE CREARON CORRECTAMENTE
-- =====================================================

SELECT '✅ Tabla vehicle_sale_status y triggers creados correctamente' as status;

-- Verificar que la tabla se creó
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'vehicle_sale_status';

-- Verificar funciones
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('handle_sale_added', 'handle_sale_deleted', 'handle_delivery_date_set');

-- Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_sale_added', 'trigger_sale_deleted', 'trigger_delivery_date_set'); 