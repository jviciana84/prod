-- Añadir columna is_locked a la tabla fotos_asignadas
ALTER TABLE fotos_asignadas 
ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;

-- Crear índice para mejorar el rendimiento de consultas por bloqueo
CREATE INDEX idx_fotos_asignadas_locked ON fotos_asignadas(is_locked);

-- Comentario para documentar el propósito del campo
COMMENT ON COLUMN fotos_asignadas.is_locked IS 'Indica si el fotógrafo tiene su porcentaje bloqueado y no debe ser afectado por el reparto equitativo'; 