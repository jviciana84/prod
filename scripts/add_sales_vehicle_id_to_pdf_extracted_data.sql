-- Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pdf_extracted_data'
        AND column_name = 'sales_vehicle_id'
    ) THEN
        -- Añadir la columna sales_vehicle_id
        ALTER TABLE pdf_extracted_data ADD COLUMN sales_vehicle_id UUID;
        
        -- Añadir índice para mejorar el rendimiento
        CREATE INDEX idx_pdf_extracted_data_sales_vehicle_id ON pdf_extracted_data(sales_vehicle_id);
        
        -- Comentario para la columna
        COMMENT ON COLUMN pdf_extracted_data.sales_vehicle_id IS 'ID del vehículo en ventas asociado a esta extracción de PDF';
    END IF;
END $$;

-- Actualizar los permisos RLS para la nueva columna
ALTER TABLE pdf_extracted_data ENABLE ROW LEVEL SECURITY;

-- Asegurar que la política existe y tiene los permisos correctos
DROP POLICY IF EXISTS "Permitir acceso completo a administradores" ON pdf_extracted_data;
CREATE POLICY "Permitir acceso completo a administradores" ON pdf_extracted_data
    USING (
        (SELECT role_id FROM user_roles WHERE user_id = auth.uid() AND role_id = 1) IS NOT NULL
    )
    WITH CHECK (
        (SELECT role_id FROM user_roles WHERE user_id = auth.uid() AND role_id = 1) IS NOT NULL
    );

-- Política para usuarios autenticados (solo lectura)
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON pdf_extracted_data;
CREATE POLICY "Permitir lectura a usuarios autenticados" ON pdf_extracted_data
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
