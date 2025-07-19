-- Crear tabla para logs del scraper
CREATE TABLE IF NOT EXISTS scraper_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'success', 'warning', 'error')),
    message TEXT NOT NULL,
    scraper_run_id VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_scraper_logs_timestamp ON scraper_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_level ON scraper_logs(level);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_run_id ON scraper_logs(scraper_run_id);

-- Función para limpiar logs antiguos (mantener solo últimos 7 días)
CREATE OR REPLACE FUNCTION cleanup_old_scraper_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM scraper_logs 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE scraper_logs IS 'Tabla para almacenar logs del scraper DUC';
COMMENT ON COLUMN scraper_logs.level IS 'Nivel del log: info, success, warning, error';
COMMENT ON COLUMN scraper_logs.message IS 'Mensaje del log';
COMMENT ON COLUMN scraper_logs.scraper_run_id IS 'ID único de la ejecución del scraper'; 