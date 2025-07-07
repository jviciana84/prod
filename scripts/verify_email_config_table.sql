-- Verificar que la tabla email_config existe y tiene la estructura correcta
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'email_config'
ORDER BY ordinal_position;

-- Verificar datos actuales
SELECT * FROM email_config;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'email_config';

-- Si la tabla no existe, crearla
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_config') THEN
        CREATE TABLE email_config (
            id SERIAL PRIMARY KEY,
            enabled BOOLEAN DEFAULT true,
            sender_email VARCHAR(255) NOT NULL DEFAULT 'noreply@bmwviciana.com',
            sender_name VARCHAR(255) NOT NULL DEFAULT 'Sistema BMW Viciana',
            cc_emails TEXT[] DEFAULT '{}',
            subject_template TEXT DEFAULT 'Movimiento de llaves - {fecha}',
            body_template TEXT DEFAULT 'Se ha registrado un movimiento de llaves el {fecha}:

{materiales}

Usuario que entrega: {usuario_entrega}
Usuario que recibe: {usuario_recibe}

Este es un mensaje automático del sistema de gestión de llaves.',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Habilitar RLS
        ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

        -- Política para que solo admins puedan ver/editar
        CREATE POLICY "Admin can manage email config" ON email_config
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('admin', 'administrador')
                )
            );

        -- Insertar configuración por defecto
        INSERT INTO email_config (
            enabled,
            sender_email,
            sender_name,
            subject_template,
            body_template
        ) VALUES (
            true,
            'noreply@bmwviciana.com',
            'Sistema BMW Viciana',
            'Movimiento de llaves - {fecha}',
            'Se ha registrado un movimiento de llaves el {fecha}:

{materiales}

Usuario que entrega: {usuario_entrega}
Usuario que recibe: {usuario_recibe}

Este es un mensaje automático del sistema de gestión de llaves.'
        );

        RAISE NOTICE 'Tabla email_config creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla email_config ya existe';
    END IF;
END $$;
