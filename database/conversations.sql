-- Tabla para guardar conversaciones de Edelweiss AI
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT ai_conversations_pkey PRIMARY KEY (id),
    CONSTRAINT ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON public.ai_conversations USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations USING btree (created_at);

-- Tabla para sesiones de conversación
CREATE TABLE IF NOT EXISTS public.ai_sessions (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT ai_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT ai_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Índices para sesiones
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON public.ai_sessions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_last_message_at ON public.ai_sessions USING btree (last_message_at);

-- Función para limpiar conversaciones antiguas (más de 30 días)
CREATE OR REPLACE FUNCTION public.cleanup_old_conversations()
RETURNS void AS $$
BEGIN
    DELETE FROM public.ai_conversations 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    DELETE FROM public.ai_sessions 
    WHERE last_message_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Función para obtener el historial de una sesión
CREATE OR REPLACE FUNCTION public.get_conversation_history(session_uuid UUID)
RETURNS TABLE (
    id UUID,
    message TEXT,
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.message,
        c.response,
        c.created_at
    FROM public.ai_conversations c
    WHERE c.session_id = session_uuid
    ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener las sesiones de un usuario
CREATE OR REPLACE FUNCTION public.get_user_sessions(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    message_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.last_message_at,
        s.created_at,
        COUNT(c.id) as message_count
    FROM public.ai_sessions s
    LEFT JOIN public.ai_conversations c ON s.id = c.session_id
    WHERE s.user_id = user_uuid
    GROUP BY s.id, s.title, s.last_message_at, s.created_at
    ORDER BY s.last_message_at DESC;
END;
$$ LANGUAGE plpgsql;
