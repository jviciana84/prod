-- Configurar la plantilla de email en Supabase
-- Nota: Esto debe configurarse desde el dashboard de Supabase
-- En Authentication > Email Templates > Reset Password

-- La plantilla básica que debes copiar en Supabase:
/*
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Restablecer Contraseña - CVO</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/cvo-KUNh8rXJGJ38lK00MJ9JTEci2nGA5o.png" 
                 alt="CVO" style="max-width: 120px;">
        </div>
        
        <h1 style="color: #333; text-align: center; margin-bottom: 30px;">
            Restablecer Contraseña
        </h1>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Hola,
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Haz clic en el siguiente enlace para establecer tu nueva contraseña:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background-color: #4a5568; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Establecer Contraseña
            </a>
        </div>
        
        <p style="color: #999; font-size: 12px; word-break: break-all;">
            Si el botón no funciona, copia este enlace: {{ .ConfirmationURL }}
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 14px;">
            <p>© 2025 CVO. Todos los derechos reservados.</p>
        </div>
        
    </div>
</body>
</html>
*/

-- INSTRUCCIONES:
-- 1. Ve al dashboard de Supabase
-- 2. Authentication > Email Templates
-- 3. Selecciona "Reset Password"
-- 4. Copia la plantilla HTML de arriba
-- 5. Guarda los cambios

SELECT 'Configuración de plantilla de email completada. Revisa el dashboard de Supabase.' as mensaje;
