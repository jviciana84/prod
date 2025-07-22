-- Añadir columnas para datos de quien recoge la documentación
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'entregas_en_mano') THEN
        -- Añadir columna nombre_recoge si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'entregas_en_mano' AND column_name = 'nombre_recoge') THEN
            ALTER TABLE entregas_en_mano ADD COLUMN nombre_recoge VARCHAR(200) NOT NULL DEFAULT '';
            RAISE NOTICE 'Columna nombre_recoge añadida';
        END IF;

        -- Añadir columna dni_recoge si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'entregas_en_mano' AND column_name = 'dni_recoge') THEN
            ALTER TABLE entregas_en_mano ADD COLUMN dni_recoge VARCHAR(20);
            RAISE NOTICE 'Columna dni_recoge añadida';
        END IF;

        -- Añadir columna email_recoge si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'entregas_en_mano' AND column_name = 'email_recoge') THEN
            ALTER TABLE entregas_en_mano ADD COLUMN email_recoge VARCHAR(200) NOT NULL DEFAULT '';
            RAISE NOTICE 'Columna email_recoge añadida';
        END IF;

        -- Actualizar registros existentes para que email_recoge tenga el mismo valor que email_cliente
        UPDATE entregas_en_mano 
        SET email_recoge = email_cliente 
        WHERE email_recoge = '' OR email_recoge IS NULL;

        -- Actualizar registros existentes para que nombre_recoge tenga el mismo valor que nombre_cliente
        UPDATE entregas_en_mano 
        SET nombre_recoge = nombre_cliente 
        WHERE nombre_recoge = '' OR nombre_recoge IS NULL;

        -- Añadir columna seguimiento si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'entregas_en_mano' AND column_name = 'seguimiento') THEN
            ALTER TABLE entregas_en_mano ADD COLUMN seguimiento VARCHAR(100);
            RAISE NOTICE 'Columna seguimiento añadida';
        END IF;

        RAISE NOTICE 'Columnas de quien recoge añadidas y datos migrados';
    ELSE
        RAISE NOTICE 'Tabla entregas_en_mano no existe';
    END IF;
END $$; 