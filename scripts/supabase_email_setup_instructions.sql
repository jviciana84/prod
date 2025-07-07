-- INSTRUCCIONES PARA CONFIGURAR EMAIL EN SUPABASE
-- Sigue estos pasos exactos para evitar que los correos sean marcados como spam:

-- PASO 1: Configurar plantilla HTML
-- 1. Ve a tu dashboard de Supabase
-- 2. Authentication > Email Templates
-- 3. Selecciona "Reset Password"
-- 4. En "Subject": Restablecer contraseña - CVO
-- 5. En "Body (HTML)": Copia todo el contenido del archivo supabase-reset-final.html

-- PASO 2: Configurar versión de texto plano
-- En la misma pantalla de "Reset Password":
-- 6. Busca la opción "Plain text version" o "Text version"
-- 7. Copia todo el contenido del archivo supabase-reset-text.txt

-- PASO 3: Configurar URLs
-- En Authentication > Settings:
-- 8. Site URL: https://tu-dominio.com
-- 9. Redirect URLs: Agregar https://tu-dominio.com/auth/reset-password

-- PASO 4: Configurar SMTP (RECOMENDADO)
-- Para mejor deliverability, configura tu propio SMTP:
-- 10. Authentication > Settings > SMTP Settings
-- 11. Enable custom SMTP
-- 12. Configura con tu proveedor (Gmail, SendGrid, etc.)

-- VERIFICACIÓN
SELECT 
    'Configuración de email lista' as status,
    'Recuerda configurar AMBAS versiones: HTML y texto plano' as importante,
    'Esto evitará que sea marcado como spam' as razon;
