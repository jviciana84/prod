-- Crear tabla document_movements si no existe
CREATE TABLE IF NOT EXISTS document_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    document_type TEXT NOT NULL,
    from_user_id UUID REFERENCES auth.users(id),
    to_user_id UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    confirmed BOOLEAN DEFAULT FALSE,
    rejected BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    notes TEXT
);

-- Crear tabla key_movements si no existe
CREATE TABLE IF NOT EXISTS key_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    key_type TEXT NOT NULL,
    from_user_id UUID REFERENCES auth.users(id),
    to_user_id UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    confirmed BOOLEAN DEFAULT FALSE,
    rejected BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    notes TEXT
);

-- Crear foreign key hacia sales_vehicles si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_vehicles') THEN
        -- Agregar foreign key para document_movements
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'document_movements_vehicle_id_fkey'
        ) THEN
            ALTER TABLE document_movements 
            ADD CONSTRAINT document_movements_vehicle_id_fkey 
            FOREIGN KEY (vehicle_id) REFERENCES sales_vehicles(id);
        END IF;
        
        -- Agregar foreign key para key_movements
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'key_movements_vehicle_id_fkey'
        ) THEN
            ALTER TABLE key_movements 
            ADD CONSTRAINT key_movements_vehicle_id_fkey 
            FOREIGN KEY (vehicle_id) REFERENCES sales_vehicles(id);
        END IF;
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE document_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_movements ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS básicas
DROP POLICY IF EXISTS "Users can view their own document movements" ON document_movements;
CREATE POLICY "Users can view their own document movements" ON document_movements
    FOR SELECT USING (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id
    );

DROP POLICY IF EXISTS "Users can insert document movements" ON document_movements;
CREATE POLICY "Users can insert document movements" ON document_movements
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can update their received document movements" ON document_movements;
CREATE POLICY "Users can update their received document movements" ON document_movements
    FOR UPDATE USING (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can view their own key movements" ON key_movements;
CREATE POLICY "Users can view their own key movements" ON key_movements
    FOR SELECT USING (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id
    );

DROP POLICY IF EXISTS "Users can insert key movements" ON key_movements;
CREATE POLICY "Users can insert key movements" ON key_movements
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can update their received key movements" ON key_movements;
CREATE POLICY "Users can update their received key movements" ON key_movements
    FOR UPDATE USING (auth.uid() = to_user_id);
