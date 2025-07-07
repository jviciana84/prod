-- Paso 3: Insertar configuración por defecto
INSERT INTO extornos_email_config (id) VALUES (1) 
ON CONFLICT (id) DO NOTHING;

SELECT 'Configuración por defecto insertada' as status;
