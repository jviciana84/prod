-- Configurar la plantilla de email mejorada en Supabase
-- Esta plantilla incluye texto plano para evitar ser marcada como spam

-- INSTRUCCIONES PARA CONFIGURAR EN SUPABASE:
-- 1. Ve al dashboard de Supabase
-- 2. Authentication > Email Templates
-- 3. Selecciona "Reset Password"
-- 4. Copia la plantilla HTML mejorada del archivo supabase-reset-improved.html
-- 5. Asegúrate de que el Subject sea: "Restablecer contraseña - CVO"
-- 6. Guarda los cambios

-- También configura estos ajustes en Authentication > Settings:
-- - Site URL: tu dominio principal
-- - Redirect URLs: agrega tu dominio/auth/reset-password
-- - SMTP Settings: configura tu servidor SMTP si tienes uno personalizado

-- Verificar configuración actual
SELECT 
    'Configuración de plantilla mejorada lista.' as mensaje,
    'Recuerda configurar en el dashboard de Supabase:' as instruccion_1,
    '1. Authentication > Email Templates > Reset Password' as instruccion_2,
    '2. Copiar la plantilla HTML mejorada' as instruccion_3,
    '3. Subject: "Restablecer contraseña - CVO"' as instruccion_4,
    '4. Verificar Site URL y Redirect URLs' as instruccion_5;
