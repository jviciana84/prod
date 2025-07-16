# Configuración de Variables de Entorno para CVO Scraper API

## 🏠 Variables para Desarrollo Local (.env.local)

Añade estas líneas a tu archivo `.env.local`:

```env
# Supabase Service Role Key (para operaciones del servidor/API)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0"

# API Key para el scraper (puedes cambiarla por seguridad)
CVO_SCRAPER_API_KEY="cvo-scraper-2024"
```

## ☁️ Variables para Vercel (Producción)

### Opción 1: Dashboard de Vercel
1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Ve a **Settings** → **Environment Variables**
3. Añade estas variables:

| Variable | Valor |
|----------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0` |
| `CVO_SCRAPER_API_KEY` | `cvo-scraper-2024` |

### Opción 2: CLI de Vercel
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CVO_SCRAPER_API_KEY
```

## 🧪 Probar la API

### Local:
```bash
npm run dev
# Luego visita: http://localhost:3000/api/import-csv
```

### Producción:
```
https://tu-dominio.vercel.app/api/import-csv
```

## 📝 Notas Importantes

- **SUPABASE_SERVICE_ROLE_KEY**: Necesaria para que la API pueda escribir en la base de datos
- **CVO_SCRAPER_API_KEY**: Clave de autenticación para el scraper (cámbiala por seguridad)
- Después de añadir variables en Vercel, necesitas hacer un nuevo deploy
- Las variables de entorno en Vercel son secretas y no se muestran en el código 