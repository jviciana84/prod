# 🚀 Guía Rápida: Configurar Supabase para tu proyecto

## Paso 1: Crear cuenta en Supabase
1. Ve a https://supabase.com
2. Haz clic en "Start your project"
3. Crea una cuenta o inicia sesión

## Paso 2: Crear un nuevo proyecto
1. Haz clic en "New Project"
2. Elige tu organización
3. Dale un nombre al proyecto (ej: "cvo-app")
4. Elige una contraseña para la base de datos
5. Elige la región más cercana
6. Haz clic en "Create new project"

## Paso 3: Obtener las credenciales
1. Ve a **Settings** → **API**
2. Copia estos valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## Paso 4: Crear el archivo .env.local
1. En la raíz de tu proyecto, crea un archivo llamado `.env.local`
2. Copia el contenido del archivo `env-minimal.txt`
3. Reemplaza los valores con tus credenciales reales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Paso 5: Ejecutar el proyecto
```bash
npm run dev
```

## ✅ ¡Listo!
Tu aplicación debería funcionar en http://localhost:3000

---

## 🔧 ¿Necesitas ayuda con las tablas de la base de datos?

Si la aplicación te pide crear tablas específicas, puedo ayudarte a configurarlas. Solo dime qué error aparece y te ayudo a solucionarlo. 