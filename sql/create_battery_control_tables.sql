-- ============================================
-- CONTROL DE BATERÍAS XEV/PHEV
-- Fecha: 20 de Octubre de 2025
-- ============================================

-- 1. Tabla principal: battery_control
-- ============================================
CREATE TABLE IF NOT EXISTS public.battery_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Datos del vehículo (sincronizados desde duc_scraper)
  vehicle_chassis TEXT NOT NULL UNIQUE, -- "Chasis"
  vehicle_ecode TEXT, -- "e-code"
  vehicle_plate TEXT, -- "Matrícula"
  vehicle_brand TEXT, -- "Marca"
  vehicle_model TEXT, -- "Modelo"
  vehicle_color TEXT, -- "Color Carrocería"
  vehicle_body TEXT, -- "Carrocería"
  vehicle_type TEXT NOT NULL, -- XEV o PHEV (desde "Tipo motor")
  
  -- Datos de control de batería
  charge_percentage INTEGER DEFAULT 0 CHECK (charge_percentage >= 0 AND charge_percentage <= 100),
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'revisado')),
  status_date TIMESTAMPTZ, -- Fecha del último cambio de estado
  is_charging BOOLEAN DEFAULT false,
  observations TEXT,
  
  -- Auditoría (oculto para usuarios normales)
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_battery_control_chassis ON public.battery_control(vehicle_chassis);
CREATE INDEX IF NOT EXISTS idx_battery_control_status ON public.battery_control(status);
CREATE INDEX IF NOT EXISTS idx_battery_control_type ON public.battery_control(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_battery_control_plate ON public.battery_control(vehicle_plate);

-- Comentarios
COMMENT ON TABLE public.battery_control IS 'Control de carga de baterías de vehículos XEV y PHEV';
COMMENT ON COLUMN public.battery_control.charge_percentage IS 'Porcentaje de carga de la batería (0-100)';
COMMENT ON COLUMN public.battery_control.status IS 'Estado: pendiente o revisado';
COMMENT ON COLUMN public.battery_control.is_charging IS 'Indica si el vehículo está cargando actualmente';
COMMENT ON COLUMN public.battery_control.updated_by IS 'Usuario que realizó la última actualización (para estadísticas internas)';

-- ============================================
-- 2. Tabla de configuración: battery_control_config
-- ============================================
CREATE TABLE IF NOT EXISTS public.battery_control_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Configuración de reinicio automático
  days_to_reset INTEGER DEFAULT 7 CHECK (days_to_reset > 0),
  days_alert_1 INTEGER DEFAULT 3 CHECK (days_alert_1 > 0),
  
  -- Niveles de carga XEV (vehículos 100% eléctricos)
  xev_charge_ok INTEGER DEFAULT 80 CHECK (xev_charge_ok >= 0 AND xev_charge_ok <= 100),
  xev_charge_sufficient INTEGER DEFAULT 50 CHECK (xev_charge_sufficient >= 0 AND xev_charge_sufficient <= 100),
  xev_charge_insufficient INTEGER DEFAULT 30 CHECK (xev_charge_insufficient >= 0 AND xev_charge_insufficient <= 100),
  
  -- Niveles de carga PHEV (híbridos enchufables)
  phev_charge_ok INTEGER DEFAULT 70 CHECK (phev_charge_ok >= 0 AND phev_charge_ok <= 100),
  phev_charge_sufficient INTEGER DEFAULT 40 CHECK (phev_charge_sufficient >= 0 AND phev_charge_sufficient <= 100),
  phev_charge_insufficient INTEGER DEFAULT 20 CHECK (phev_charge_insufficient >= 0 AND phev_charge_insufficient <= 100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE public.battery_control_config IS 'Configuración global del sistema de control de baterías (solo admin)';
COMMENT ON COLUMN public.battery_control_config.days_to_reset IS 'Días para reiniciar automáticamente el estado a pendiente y cargando a NO';
COMMENT ON COLUMN public.battery_control_config.days_alert_1 IS 'Días desde última revisión para mostrar alerta ámbar';
COMMENT ON COLUMN public.battery_control_config.xev_charge_ok IS 'Porcentaje mínimo para nivel OK en vehículos XEV (100% eléctricos)';
COMMENT ON COLUMN public.battery_control_config.phev_charge_ok IS 'Porcentaje mínimo para nivel OK en vehículos PHEV (híbridos)';

-- Insertar configuración por defecto (solo si no existe ninguna)
INSERT INTO public.battery_control_config (days_to_reset, days_alert_1, xev_charge_ok, xev_charge_sufficient, xev_charge_insufficient, phev_charge_ok, phev_charge_sufficient, phev_charge_insufficient)
SELECT 
  7, -- Reiniciar cada 7 días
  3, -- Alerta 1 a los 3 días
  80, 50, 30, -- XEV: 80% OK, 50% suficiente, 30% insuficiente
  70, 40, 20  -- PHEV: 70% OK, 40% suficiente, 20% insuficiente
WHERE NOT EXISTS (
  SELECT 1 FROM public.battery_control_config LIMIT 1
);

-- ============================================
-- 3. Función para actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.update_battery_control_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para battery_control
DROP TRIGGER IF EXISTS set_battery_control_updated_at ON public.battery_control;
CREATE TRIGGER set_battery_control_updated_at
  BEFORE UPDATE ON public.battery_control
  FOR EACH ROW
  EXECUTE FUNCTION public.update_battery_control_updated_at();

-- Trigger para battery_control_config
DROP TRIGGER IF EXISTS set_battery_config_updated_at ON public.battery_control_config;
CREATE TRIGGER set_battery_config_updated_at
  BEFORE UPDATE ON public.battery_control_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_battery_control_updated_at();

-- ============================================
-- 4. RLS (Row Level Security) Policies
-- ============================================

-- Habilitar RLS
ALTER TABLE public.battery_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battery_control_config ENABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes si hay (para evitar duplicados)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver battery_control" ON public.battery_control;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar battery_control" ON public.battery_control;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar battery_control" ON public.battery_control;
DROP POLICY IF EXISTS "Solo admin puede ver battery_control_config" ON public.battery_control_config;
DROP POLICY IF EXISTS "Solo admin puede actualizar battery_control_config" ON public.battery_control_config;

-- Policy: Todos pueden leer battery_control (autenticados)
CREATE POLICY "Usuarios autenticados pueden ver battery_control"
  ON public.battery_control
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Todos pueden actualizar battery_control (autenticados)
CREATE POLICY "Usuarios autenticados pueden actualizar battery_control"
  ON public.battery_control
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Todos pueden insertar battery_control (autenticados)
CREATE POLICY "Usuarios autenticados pueden insertar battery_control"
  ON public.battery_control
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Solo admin puede leer configuración
CREATE POLICY "Solo admin puede ver battery_control_config"
  ON public.battery_control_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'administrador')
    )
  );

-- Policy: Solo admin puede actualizar configuración
CREATE POLICY "Solo admin puede actualizar battery_control_config"
  ON public.battery_control_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'administrador')
    )
  );

-- ============================================
-- 5. Grant de permisos
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.battery_control TO authenticated;
GRANT SELECT, UPDATE ON public.battery_control_config TO authenticated;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Verificación
SELECT 'Tablas creadas correctamente:' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('battery_control', 'battery_control_config');

