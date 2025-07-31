# Configuración del Sistema Automático de Marcado de Fotos

## Descripción
Este sistema marca automáticamente los vehículos como fotografiados basándose en la columna "URL foto 9" del CSV descargado por el scraper. Se ejecuta cada 15 minutos via GitHub Actions.

## Archivos Creados

### 1. Scripts SQL
- `scripts/marcar_fotos_automatico.sql` - Script manual para ejecutar una vez
- `scripts/create_mark_photos_function.sql` - Función SQL para automatización
- `scripts/create_exec_sql_function.sql` - Función auxiliar (opcional)

### 2. GitHub Actions
- `.github/workflows/auto-mark-photos.yml` - Workflow que se ejecuta cada 15 minutos

## Pasos de Configuración

### Paso 1: Crear la función SQL en Supabase
```sql
-- Ejecutar este script en Supabase SQL Editor
-- Contenido de: scripts/create_mark_photos_function.sql
```

### Paso 2: Configurar Secrets en GitHub
En tu repositorio de GitHub, ve a:
1. **Settings** → **Secrets and variables** → **Actions**
2. Agregar estos secrets:
   - `SUPABASE_URL`: URL de tu proyecto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key de Supabase

### Paso 3: Activar el Workflow
El workflow se activará automáticamente una vez que:
1. Se suba el código a GitHub
2. Los secrets estén configurados
3. La función SQL esté creada en Supabase

## Cómo Funciona

### Lógica del Script
1. **Busca en `duc_scraper`** registros donde "URL foto 9" tenga contenido
2. **Actualiza la tabla `fotos`** para esos vehículos:
   - `photos_completed = true`
   - `photos_completed_date = NOW()`
   - `updated_at = NOW()`

### Programación
- **Frecuencia**: Cada 15 minutos
- **Ejecución**: Via GitHub Actions (gratuito)
- **Logs**: Disponibles en la pestaña "Actions" de GitHub

## Monitoreo

### Verificar Ejecución
1. Ve a tu repositorio en GitHub
2. Pestaña **Actions**
3. Busca el workflow "Auto Mark Photos as Completed"
4. Revisa los logs de la última ejecución

### Verificar Resultados en Supabase
```sql
-- Verificar vehículos marcados en la última hora
SELECT 
    f.license_plate,
    f.model,
    f.photos_completed_date,
    ds."URL foto 9"
FROM fotos f
LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
WHERE f.photos_completed = true
AND f.photos_completed_date >= NOW() - INTERVAL '1 hour'
ORDER BY f.photos_completed_date DESC;
```

## Ejecución Manual

### Via GitHub Actions
1. Ve a **Actions** en GitHub
2. Selecciona "Auto Mark Photos as Completed"
3. Click en **Run workflow**

### Via Supabase
```sql
-- Ejecutar manualmente la función
SELECT * FROM mark_photos_as_completed();
```

## Troubleshooting

### Error: "Function not found"
- Verificar que la función `mark_photos_as_completed()` esté creada en Supabase
- Ejecutar el script `create_mark_photos_function.sql`

### Error: "Secrets not found"
- Verificar que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén configurados en GitHub Secrets

### No se marcan vehículos
- Verificar que existan registros en `duc_scraper` con "URL foto 9" con contenido
- Verificar que existan matrículas coincidentes en la tabla `fotos`
- Verificar que los vehículos no estén ya marcados como `photos_completed = true`

## Personalización

### Cambiar Frecuencia
En `.github/workflows/auto-mark-photos.yml`, modificar:
```yaml
schedule:
  - cron: '*/15 * * * *'  # Cada 15 minutos
  # Opciones:
  # '*/5 * * * *'   # Cada 5 minutos
  # '*/30 * * * *'  # Cada 30 minutos
  # '0 */1 * * *'   # Cada hora
```

### Cambiar Columna de Referencia
En `scripts/create_mark_photos_function.sql`, modificar:
```sql
WHERE ds."URL foto 9" IS NOT NULL  -- Cambiar por otra columna
```

## Seguridad
- La función usa `SECURITY DEFINER` para ejecutar con permisos de superusuario
- Solo se ejecuta desde GitHub Actions con credenciales específicas
- No expone datos sensibles en los logs 