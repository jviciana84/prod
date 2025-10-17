# Sistema de Noticias BMW

Sistema automático para mostrar noticias de BMW, MINI y BMW Motorrad en la aplicación.

## ✨ Características

- **Toast automático**: Popup discreto desde la derecha que muestra nuevas noticias
- **Página dedicada**: Sección completa para explorar todas las noticias
- **Filtros avanzados**:
  - Por marca (BMW, MINI, Motorrad)
  - Por categoría (Económicas, Competiciones, General)
  - Búsqueda por texto
- **Actualización automática**: Script que busca noticias nuevas cada X horas

## 📋 Configuración Inicial

### 1. Crear tabla en Supabase

Ejecuta el siguiente SQL en el **SQL Editor** de Supabase:

```sql
-- Tabla para noticias de BMW, MINI y BMW Motorrad
CREATE TABLE IF NOT EXISTS bmw_noticias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  resumen TEXT,
  imagen_url TEXT,
  url_original TEXT NOT NULL,
  marca TEXT NOT NULL CHECK (marca IN ('BMW', 'MINI', 'Motorrad')),
  categoria TEXT NOT NULL CHECK (categoria IN ('economica', 'competicion', 'general')),
  fuente TEXT,
  fecha_publicacion TIMESTAMPTZ,
  nueva BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bmw_noticias_marca ON bmw_noticias(marca);
CREATE INDEX idx_bmw_noticias_categoria ON bmw_noticias(categoria);
CREATE INDEX idx_bmw_noticias_nueva ON bmw_noticias(nueva);
CREATE INDEX idx_bmw_noticias_fecha ON bmw_noticias(fecha_publicacion DESC);
CREATE INDEX idx_bmw_noticias_created ON bmw_noticias(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_bmw_noticias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bmw_noticias_updated_at
  BEFORE UPDATE ON bmw_noticias
  FOR EACH ROW
  EXECUTE FUNCTION update_bmw_noticias_updated_at();

-- RLS Policies
ALTER TABLE bmw_noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de noticias a usuarios autenticados"
  ON bmw_noticias FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins pueden modificar noticias"
  ON bmw_noticias FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### 2. Configurar News API

1. Regístrate en [News API](https://newsapi.org/register)
2. Obtén tu API Key (plan gratuito = 100 requests/día)
3. Añade la variable al archivo `.env`:

```bash
NEWS_API_KEY=tu_api_key_aqui
```

## 🚀 Uso

### Buscar noticias manualmente

```bash
# Opción 1: Ejecutar script Node.js
node scripts/fetch-bmw-news.js

# Opción 2: Llamar al endpoint API (en navegador o Postman)
GET https://tu-dominio.com/api/noticias/fetch
```

### Automatizar búsqueda de noticias

**Opción A: Cron job en servidor Linux/Mac**

```bash
# Editar crontab
crontab -e

# Añadir (ejecutar cada 6 horas)
0 */6 * * * cd /ruta/proyecto && node scripts/fetch-bmw-news.js >> logs/noticias.log 2>&1
```

**Opción B: Vercel Cron Jobs**

Crear archivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/noticias/fetch",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Opción C: GitHub Actions**

Crear `.github/workflows/fetch-news.yml`:

```yaml
name: Fetch BMW News
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  fetch-news:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/fetch-bmw-news.js
        env:
          NEWS_API_KEY: ${{ secrets.NEWS_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## 📱 Componentes

### Página de noticias

**Ruta**: `/dashboard/noticias`

Accesible desde el sidebar con el ícono de periódico.

### Toast de notificaciones

- Aparece automáticamente cuando hay noticias nuevas
- Se muestra cada 30 minutos
- Auto-hide después de 5 segundos
- Click para abrir la noticia completa

## 🔧 APIs disponibles

### `GET /api/noticias/fetch`

Busca y guarda nuevas noticias de las últimas 7 días.

**Respuesta**:

```json
{
  "success": true,
  "totalProcessed": 45,
  "totalSaved": 12,
  "alreadyExisting": 33,
  "errors": []
}
```

### `GET /api/noticias/ultimas-nuevas`

Obtiene la noticia más reciente marcada como "nueva" (para el toast).

**Respuesta**:

```json
{
  "id": "uuid",
  "titulo": "BMW anuncia...",
  "resumen": "...",
  "imagen_url": "https://...",
  "url_original": "https://...",
  "marca": "BMW",
  "categoria": "economica",
  "nueva": true
}
```

### `POST /api/noticias/marcar-leidas`

Marca todas las noticias como leídas (nueva = false).

## 🎨 Personalización

### Modificar keywords de búsqueda

Edita `scripts/fetch-bmw-news.js` o `app/api/noticias/fetch/route.ts`:

```javascript
const SEARCH_QUERIES = [
  {
    query: "tu búsqueda personalizada",
    marca: "BMW",
    categoria: "economica",
  },
  // ...más búsquedas
]
```

### Cambiar frecuencia de Toast

En `components/noticias/news-toast.tsx`:

```typescript
// Cambiar de 30 minutos a 1 hora
const interval = setInterval(checkForNewNews, 60 * 60 * 1000) // 1 hora
```

### Ajustar tiempo de auto-hide del Toast

En `components/noticias/news-toast.tsx`:

```typescript
// Cambiar de 5 a 10 segundos
const timer = setTimeout(() => {
  handleClose()
}, 10000) // 10 segundos
```

## 📊 Estadísticas de uso API

Plan gratuito de News API:
- 100 requests/día
- Sistema usa ~9 requests cada ejecución (3 marcas × 3 categorías)
- Puedes ejecutar ~11 veces al día
- Recomendado: cada 2-6 horas

## 🐛 Troubleshooting

### No aparecen noticias

1. Verifica que ejecutaste el SQL en Supabase
2. Ejecuta manualmente: `node scripts/fetch-bmw-news.js`
3. Revisa las variables de entorno (NEWS_API_KEY, SUPABASE_*)

### Error "NEWS_API_KEY no configurada"

Añade la variable al archivo `.env`:

```bash
NEWS_API_KEY=tu_api_key_de_newsapi
```

### Toast no aparece

1. Verifica que hay noticias con `nueva = true` en la tabla
2. Revisa la consola del navegador (F12)
3. El toast solo aparece si hay noticias marcadas como nuevas

### Imágenes no cargan

Es normal que algunas URLs de imágenes de News API fallen. El componente oculta automáticamente las imágenes rotas.

## 📝 Mantenimiento

### Limpiar noticias antiguas

```sql
-- Eliminar noticias de hace más de 30 días
DELETE FROM bmw_noticias 
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Marcar todas como leídas

```sql
UPDATE bmw_noticias SET nueva = false WHERE nueva = true;
```

### Ver estadísticas

```sql
SELECT 
  marca,
  categoria,
  COUNT(*) as total,
  SUM(CASE WHEN nueva THEN 1 ELSE 0 END) as nuevas
FROM bmw_noticias 
GROUP BY marca, categoria
ORDER BY marca, categoria;
```

## 🎯 Mejoras futuras

- [ ] Sistema de notificaciones push
- [ ] Guardado de noticias favoritas por usuario
- [ ] Resumen diario/semanal por email
- [ ] Integración con RSS feeds adicionales
- [ ] Panel de administración para aprobar/rechazar noticias
- [ ] Traducción automática de noticias de otros idiomas

