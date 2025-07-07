-- Crear tabla de entregas
CREATE TABLE IF NOT EXISTS public.entregas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_entrega TIMESTAMP WITH TIME ZONE DEFAULT now(),
  matricula TEXT NOT NULL,
  modelo TEXT NOT NULL,
  asesor TEXT NOT NULL,
  or TEXT NOT NULL,
  incidencia BOOLEAN DEFAULT false,
  observaciones TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Añadir comentarios a la tabla
COMMENT ON TABLE public.entregas IS 'Tabla para gestionar las entregas de vehículos a clientes';

-- Añadir comentarios a las columnas
COMMENT ON COLUMN public.entregas.id IS 'Identificador único de la entrega';
COMMENT ON COLUMN public.entregas.fecha_venta IS 'Fecha de venta del vehículo';
COMMENT ON COLUMN public.entregas.fecha_entrega IS 'Fecha programada para la entrega';
COMMENT ON COLUMN public.entregas.matricula IS 'Matrícula del vehículo a entregar';
COMMENT ON COLUMN public.entregas.modelo IS 'Modelo del vehículo';
COMMENT ON COLUMN public.entregas.asesor IS 'Nombre del asesor responsable de la venta';
COMMENT ON COLUMN public.entregas.or IS 'Número de orden o referencia';
COMMENT ON COLUMN public.entregas.incidencia IS 'Indica si hay alguna incidencia con la entrega';
COMMENT ON COLUMN public.entregas.observaciones IS 'Notas adicionales sobre la entrega';

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS entregas_fecha_venta_idx ON public.entregas (fecha_venta);
CREATE INDEX IF NOT EXISTS entregas_fecha_entrega_idx ON public.entregas (fecha_entrega);
CREATE INDEX IF NOT EXISTS entregas_matricula_idx ON public.entregas (matricula);
CREATE INDEX IF NOT EXISTS entregas_modelo_idx ON public.entregas (modelo);
CREATE INDEX IF NOT EXISTS entregas_asesor_idx ON public.entregas (asesor);
CREATE INDEX IF NOT EXISTS entregas_or_idx ON public.entregas (or);
CREATE INDEX IF NOT EXISTS entregas_incidencia_idx ON public.entregas (incidencia);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Permitir lectura a usuarios autenticados" 
  ON public.entregas FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserción a usuarios autenticados" 
  ON public.entregas FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización a usuarios autenticados" 
  ON public.entregas FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_entregas_updated_at
  BEFORE UPDATE ON public.entregas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
