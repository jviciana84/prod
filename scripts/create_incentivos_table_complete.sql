-- Crear tabla incentivos con todos los campos necesarios
CREATE TABLE IF NOT EXISTS incentivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Datos básicos de la venta/entrega
    fecha_entrega TIMESTAMP WITH TIME ZONE NOT NULL,
    matricula VARCHAR(20) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    asesor VARCHAR(100) NOT NULL,
    
    -- Datos financieros (vienen de sales_vehicles)
    forma_pago VARCHAR(50),
    precio_venta NUMERIC(10,2),
    precio_compra NUMERIC(10,2),
    dias_stock INTEGER,
    
    -- Campos que rellena administración después
    garantia NUMERIC(10,2) DEFAULT 0,
    gastos_360 NUMERIC(10,2) DEFAULT 0,
    
    -- Indicadores booleanos (los pone director VO/admin)
    antiguedad BOOLEAN DEFAULT false,
    financiado BOOLEAN DEFAULT false,
    
    -- Incentivos extra
    otros NUMERIC(10,2) DEFAULT 0,
    observaciones_otros TEXT,
    
    -- Campos de cálculo (se llenan desde incentivos_config)
    gastos_estructura NUMERIC(10,2) DEFAULT 0,
    importe_antiguedad NUMERIC(10,2) DEFAULT 0,
    importe_financiado NUMERIC(10,2) DEFAULT 0,
    
    -- Campos de control
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, procesado, pagado
    enviado_por UUID REFERENCES auth.users(id),
    procesado_por UUID REFERENCES auth.users(id),
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_procesado TIMESTAMP WITH TIME ZONE,
    
    -- Referencias
    entrega_id TEXT, -- ID de la tabla entregas
    sales_vehicle_id UUID REFERENCES sales_vehicles(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de configuración de incentivos
CREATE TABLE IF NOT EXISTS incentivos_config (
    id SERIAL PRIMARY KEY,
    concepto VARCHAR(50) UNIQUE NOT NULL, -- 'gastos_estructura', 'antiguedad', 'financiado'
    importe NUMERIC(10,2) NOT NULL,
    activo BOOLEAN DEFAULT true,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO incentivos_config (concepto, importe, descripcion) VALUES
('gastos_estructura', 500.00, 'Gastos de estructura por venta'),
('antiguedad', 200.00, 'Incentivo por vehículo antiguo'),
('financiado', 150.00, 'Incentivo por venta financiada')
ON CONFLICT (concepto) DO NOTHING;

-- Habilitar RLS
ALTER TABLE incentivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentivos_config ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (solo admin por ahora)
CREATE POLICY "Solo admin puede ver incentivos" ON incentivos FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

CREATE POLICY "Solo admin puede gestionar config incentivos" ON incentivos_config FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_incentivos_matricula ON incentivos(matricula);
CREATE INDEX IF NOT EXISTS idx_incentivos_asesor ON incentivos(asesor);
CREATE INDEX IF NOT EXISTS idx_incentivos_fecha_entrega ON incentivos(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_incentivos_estado ON incentivos(estado);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_incentivos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER trigger_update_incentivos_updated_at
    BEFORE UPDATE ON incentivos
    FOR EACH ROW
    EXECUTE FUNCTION update_incentivos_updated_at();

CREATE TRIGGER trigger_update_incentivos_config_updated_at
    BEFORE UPDATE ON incentivos_config
    FOR EACH ROW
    EXECUTE FUNCTION update_incentivos_updated_at();
