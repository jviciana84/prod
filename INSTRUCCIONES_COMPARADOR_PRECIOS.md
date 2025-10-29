# 📊 Comparador de Precios - Sistema Completo

## ✅ Archivos Creados

### 📁 SQL
- `sql/create_comparador_tables.sql` - Tablas base del sistema
- `sql/analytics_comparador.sql` - Vistas analíticas (ya existía)

### 📁 APIs
- `app/api/comparador/analisis/route.ts` - API principal para análisis de todos los vehículos
- `app/api/comparador/vehicle/[id]/route.ts` - API para análisis detallado de un vehículo
- `app/api/comparador/get-all/route.ts` - API simple (ya existía)

### 📁 Frontend
- `app/dashboard/comparador-precios/page.tsx` - Página principal del comparador

---

## 🚀 Pasos para Activar el Sistema

### 1️⃣ Ejecutar Script SQL en Supabase

```bash
# Opción A: Desde el editor SQL de Supabase
1. Ir a: https://wpjmimbscfsdzcwuwctk.supabase.co
2. SQL Editor → New Query
3. Copiar todo el contenido de sql/create_comparador_tables.sql
4. Ejecutar

# Opción B: Desde terminal con psql (si tienes acceso)
psql [tu-connection-string] < sql/create_comparador_tables.sql
```

### 2️⃣ Ejecutar Vistas Analíticas (Opcional pero Recomendado)

```sql
# En el mismo editor SQL de Supabase
-- Copiar y ejecutar sql/analytics_comparador.sql
```

### 3️⃣ Poblar las Tablas con Datos del Scraper

El scraper v1.1.0 debe estar configurado para insertar en las tablas:
- `comparador_scraper` (tabla principal)
- Automáticamente se populará `comparador_historial_precios` con los cambios

**Estructura de datos esperada por el scraper:**

```python
# Ejemplo de inserción
data = {
    'source': 'BPS',  # o 'MN'
    'id_anuncio': '12345',
    'modelo': 'BMW Serie 3 320d',
    'matricula': '1234ABC',
    'año': '2021',
    'km': '45000',
    'precio': '32.900€',
    'precio_nuevo_original': 52000,  # Precio cuando era nuevo
    'concesionario': 'Bernesga Motor',
    'provincia': 'León',
    'url': 'https://...',
    'dias_publicado': 15,
    'combustible': 'Diesel',
    # ... más campos
}
```

### 4️⃣ Verificar Datos en Stock

La API conecta con la tabla `stock` para obtener nuestros vehículos. Asegúrate de que:

```sql
-- Verificar que tenemos vehículos en stock
SELECT COUNT(*) FROM stock WHERE is_sold = false;

-- Verificar que tienen precios
SELECT COUNT(*) FROM stock WHERE is_sold = false AND price IS NOT NULL;

-- (OPCIONAL) Añadir precio nuevo original si no existe
ALTER TABLE stock ADD COLUMN IF NOT EXISTS original_new_price NUMERIC;

-- Ejemplo: actualizar precio nuevo original
UPDATE stock 
SET original_new_price = 52000 
WHERE model LIKE '%Serie 3 320d%' AND year = 2021;
```

---

## 🎯 Cómo Funciona el Sistema

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    SCRAPER v1.1.0                          │
│  ┌─────────┐  ┌─────────┐                                 │
│  │   BPS   │  │    MN   │                                 │
│  │(24 hrs) │  │(24 hrs) │                                 │
│  └────┬────┘  └────┬────┘                                 │
└───────┼────────────┼─────────────────────────────────────┘
        │            │
        ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│           SUPABASE: comparador_scraper                     │
│  Guarda todos los anuncios de BMW PS y MINI Next          │
│  + Detecta cambios de precio automáticamente              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│     TRIGGER: log_precio_change                             │
│  Cuando cambia un precio → guarda en historial            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│      comparador_historial_precios                          │
│  Registro completo de cambios de precio                    │
└─────────────────────────────────────────────────────────────┘
```

### Lógica de Comparación

1. **Obtener nuestros vehículos**: Lee tabla `stock` (is_sold = false)
2. **Buscar competidores similares**: Compara por modelo (palabras clave)
3. **Calcular métricas**:
   - Precio medio competencia
   - Descuento nuestro vs descuento competencia
   - Diferencia en euros
   - Porcentaje de diferencia
4. **Clasificar posición**:
   - 🟢 **Competitivo**: ≤ -3% (más baratos que mercado)
   - 🟡 **Justo**: -3% a +3% (en línea con mercado)
   - 🔴 **Alto**: ≥ +3% (más caros que mercado)

### Diferenciador Clave: Descuento vs Precio Nuevo

**Ejemplo:**
```
Vehículo A:
- Precio nuevo: 60.000€
- Precio actual: 45.000€
- Descuento: 25% (15.000€ de descuento)

Vehículo B:
- Precio nuevo: 50.000€  
- Precio actual: 45.000€
- Descuento: 10% (5.000€ de descuento)

Conclusión: Aunque ambos cuestan 45.000€, el Vehículo A está
MUCHO MEJOR posicionado porque ofrece más descuento real.
```

---

## 🖥️ Uso del Frontend

### Acceso
```
http://localhost:3000/dashboard/comparador-precios
```

### Características

**1. KPIs Superiores:**
- Posición general en el mercado (%)
- Precio medio nuestro vs competencia
- Oportunidades de ajuste detectadas
- Total de vehículos analizados

**2. Filtros Avanzados:**
- 🔍 Buscador por matrícula/modelo
- 📋 Filtro por modelo específico
- ⚙️ Tolerancias ajustables (Km, Antigüedad, Potencia)
- 🔄 Botón recalcular
- 🎯 Filtros rápidos: Todos, Competitivos, Justos, Altos

**3. Grid de Vehículos (2 columnas):**
- Info compacta de cada vehículo
- Termómetro visual de precio
- Badge de estado (Competitivo/Justo/Alto)
- Botones: Ver Gráfico, Editar, Ver Anuncio, Eliminar

**4. Modal de Análisis Detallado:**
- 5 KPIs del vehículo específico
- **Gráfico de dispersión** (Precio vs Km)
  - 🔴 Punto rojo = Nuestro coche
  - 🔵 Puntos azules = Competencia (clickables)
- Recomendación estratégica basada en descuentos
- Lista completa de competidores (2 columnas)
- Enlaces directos a anuncios de competencia

---

## 🔧 Mantenimiento

### Actualizar Precios Nuevos Originales

Si necesitas actualizar el precio nuevo original de un modelo:

```sql
-- Ejemplo: BMW X3 2020
UPDATE stock 
SET original_new_price = 65000 
WHERE model LIKE '%X3%' AND year = 2020;

-- Por rangos de años
UPDATE stock 
SET original_new_price = CASE
    WHEN year >= 2023 THEN 55000
    WHEN year >= 2021 THEN 52000
    ELSE 48000
END
WHERE model LIKE '%Serie 3 320d%';
```

### Ver Estadísticas de Comparador

```sql
-- Total de anuncios activos
SELECT source, COUNT(*) as total
FROM comparador_scraper
WHERE estado_anuncio = 'activo'
GROUP BY source;

-- Cambios de precio recientes (últimos 7 días)
SELECT *
FROM comparador_historial_precios
WHERE fecha_cambio >= NOW() - INTERVAL '7 days'
ORDER BY fecha_cambio DESC;

-- Modelos más competidos
SELECT modelo, COUNT(*) as competidores, AVG(dias_publicado) as dias_promedio
FROM comparador_scraper
WHERE estado_anuncio = 'activo'
GROUP BY modelo
ORDER BY competidores DESC
LIMIT 10;
```

### Usar Vistas Analíticas

```sql
-- Ver estadísticas por modelo
SELECT * FROM comparador_stats_por_modelo;

-- Ver estrategias de concesionarios
SELECT * FROM comparador_estrategias_concesionarios;

-- Ver velocidad de venta
SELECT * FROM comparador_velocidad_venta;

-- Ver stock estancado
SELECT * FROM comparador_stock_estancado;
```

---

## 📝 TODOs Futuros

- [ ] Implementar tolerancias reales en filtros (Km, Antigüedad, CV)
- [ ] Añadir botón de editar precio directo desde la página
- [ ] Añadir notificaciones cuando un competidor baja precio
- [ ] Exportar análisis a PDF/Excel
- [ ] Historial de nuestros propios cambios de precio
- [ ] Dashboard de métricas históricas
- [ ] Alertas automáticas de oportunidades

---

## 🐛 Troubleshooting

### Error: "No hay vehículos que coincidan con los filtros"

**Causa:** No hay datos en `comparador_scraper` o `stock`

**Solución:**
```sql
-- Verificar datos
SELECT COUNT(*) FROM comparador_scraper;
SELECT COUNT(*) FROM stock WHERE is_sold = false;

-- Si no hay datos, esperar a que el scraper corra
-- o insertar datos de prueba manualmente
```

### Error: "Error consultando stock"

**Causa:** La API no puede acceder a Supabase

**Solución:**
1. Verificar variables de entorno (`.env.local`)
2. Verificar RLS policies en Supabase
3. Ver logs en consola del navegador

### Los precios no tienen sentido

**Causa:** El campo `precio_nuevo_original` está vacío o incorrecto

**Solución:**
```sql
-- Actualizar precios nuevos originales
UPDATE stock SET original_new_price = [precio_correcto]
WHERE model LIKE '%modelo%';
```

---

## 📞 Soporte

Para cualquier duda o problema, revisar:
- Logs de Supabase
- Consola del navegador (F12)
- Logs del scraper
- Este documento

**Versión:** 1.0.0  
**Fecha:** 28 de Octubre 2025

