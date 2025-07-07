-- Añadir columna body_status a la tabla stock
ALTER TABLE stock ADD COLUMN IF NOT EXISTS body_status VARCHAR(20) DEFAULT 'pendiente';

-- Añadir columna work_center a la tabla stock
ALTER TABLE stock ADD COLUMN IF NOT EXISTS work_center VARCHAR(50);

-- Añadir columna external_provider a la tabla stock
ALTER TABLE stock ADD COLUMN IF NOT EXISTS external_provider VARCHAR(100);
