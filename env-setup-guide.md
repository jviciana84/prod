# Guía de Configuración de Variables de Entorno

## Problema Identificado
La página de directorio está fallando porque las variables de entorno de Supabase no están configuradas correctamente.

## Solución

### 1. Crear archivo `.env.local` en la raíz del proyecto

```env
# Variables de Supabase (REQUERIDAS)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Variables de OpenAI (OPCIONAL)
OPENAI_API_KEY=tu-openai-api-key-aqui

# Otras variables
DEBUG_MODE=true
```

### 2. Obtener las credenciales de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a Settings > API
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Reiniciar el servidor

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

### 4. Verificar que funciona

- Abre la página de directorio: `/dashboard/directory`
- Debería cargar sin errores
- Si aún hay problemas, revisa la consola del navegador

## Errores Comunes

- **"Configuración de base de datos no disponible"**: Variables de Supabase no configuradas
- **"No autorizado"**: Problema de autenticación (temporalmente deshabilitado)
- **"Error al cargar usuarios"**: Problema de conexión a Supabase

## Notas Importantes

- El archivo `.env.local` no se sube a Git (está en .gitignore)
- Las variables deben empezar con `NEXT_PUBLIC_` para ser accesibles en el cliente
- Reinicia el servidor después de cambiar las variables de entorno
