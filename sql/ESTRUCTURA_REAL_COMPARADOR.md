# 📋 Estructura Real de la Tabla comparador_scraper

## ✅ Estructura Actual Confirmada

Tu tabla `comparador_scraper` tiene esta estructura real:

```sql
CREATE TABLE comparador_scraper (
    id                    BIGINT PRIMARY KEY,
    source                TEXT,                     -- 'BPS' o 'MN'
    modelo                TEXT,
    url                   TEXT,
    id_anuncio            TEXT,
    precio                TEXT,                     -- Precio actual
    km                    TEXT,
    año                   TEXT,
    concesionario         TEXT,
    precio_nuevo          TEXT,                     -- Precio tachado/original del anuncio
    ahorro                TEXT,                     -- Ahorro calculado del anuncio
    created_at            TIMESTAMPTZ,
    updated_at            TIMESTAMPTZ,
    primera_deteccion     TIMESTAMPTZ,
    ultima_actualizacion  TIMESTAMPTZ,
    dias_publicado        INTEGER,
    precio_anterior       TEXT,
    fecha_cambio_precio   TIMESTAMPTZ,
    descuento_calculado   NUMERIC,
    porcentaje_descuento  NUMERIC,
    estado_anuncio        TEXT,
    precio_nuevo_original NUMERIC                   -- ✅ AÑADIDO
);
```

## 🔍 Campos Clave para el Comparador

### Para Análisis de Precios

| Campo | Tipo | Uso en el Sistema |
|-------|------|-------------------|
| `precio` | TEXT | Precio actual del anuncio |
| `precio_nuevo` | TEXT | Precio tachado en el anuncio (si existe) |
| `precio_nuevo_original` | NUMERIC | **CRÍTICO**: Precio cuando el coche era 0km |
| `descuento_calculado` | NUMERIC | Diferencia en euros |
| `porcentaje_descuento` | NUMERIC | % de descuento |

### Para Identificación y Filtrado

| Campo | Uso |
|-------|-----|
| `source` | Filtrar por BMW PS ('BPS') o MINI Next ('MN') |
| `modelo` | Buscar competidores similares |
| `id_anuncio` | Identificador único por source |
| `concesionario` | Agrupar por vendedor |

### Para Tracking Temporal

| Campo | Uso |
|-------|-----|
| `dias_publicado` | Cuántos días lleva publicado |
| `estado_anuncio` | activo, nuevo, precio_bajado, precio_subido, desaparecido |
| `precio_anterior` | Precio antes del cambio |
| `fecha_cambio_precio` | Cuándo cambió el precio |

## 🎯 Campo Crítico: precio_nuevo_original

Este campo es **FUNDAMENTAL** para el análisis competitivo porque:

```
Ejemplo: Dos BMW Serie 3 320d a 45.000€

Anuncio A:
- precio: "45.000€"
- precio_nuevo_original: 60000  ← Era 60.000€ cuando era 0km
- Descuento real: 25% ✅ MEJOR POSICIONADO

Anuncio B:
- precio: "45.000€"
- precio_nuevo_original: 50000  ← Era 50.000€ cuando era 0km
- Descuento real: 10% ❌ PEOR POSICIONADO
```

### ¿Cómo Poblarlo?

**Opción 1: Base de datos manual**
```sql
-- Actualizar por modelo y año
UPDATE comparador_scraper
SET precio_nuevo_original = 52000
WHERE modelo LIKE '%Serie 3 320d%' AND año = '2021';

UPDATE comparador_scraper
SET precio_nuevo_original = 65000
WHERE modelo LIKE '%X3 xDrive20d%' AND año = '2020';
```

**Opción 2: Desde el scraper (Python)**
```python
# Diccionario de precios nuevos
PRECIOS_NUEVOS_BASE = {
    'Serie 3': {
        '320d': 52000,
        '330i': 55000,
        '320i': 48000,
    },
    'X3': {
        'xDrive20d': 65000,
        'xDrive30d': 72000,
    },
    'Serie 5': {
        '520d': 62000,
        '530d': 70000,
    },
    # ... más modelos
}

def obtener_precio_nuevo(modelo, año):
    """Estimar precio nuevo considerando depreciación"""
    # Buscar en diccionario
    for serie, motores in PRECIOS_NUEVOS_BASE.items():
        if serie in modelo:
            for motor, precio_base in motores.items():
                if motor in modelo:
                    # Ajustar por año (cada año pierde ~15% valor)
                    años_antiguedad = 2025 - int(año)
                    # Pero el precio NUEVO no cambia, solo el valor actual
                    # Así que devolvemos el precio base del año de fabricación
                    
                    # Ajuste aproximado por inflación
                    factor_inflacion = 1.03 ** (2025 - int(año))
                    return int(precio_base / factor_inflacion)
    
    return None

# Al scrapear
vehiculo = {
    'source': 'BPS',
    'modelo': 'BMW Serie 3 320d',
    'año': '2021',
    'precio': '32.900€',
    'precio_nuevo_original': obtener_precio_nuevo('BMW Serie 3 320d', '2021'),
    # ... más campos
}
```

**Opción 3: API externa (si existe)**
```python
import requests

def obtener_precio_nuevo_api(marca, modelo, año):
    """Consultar API de precios de coches"""
    response = requests.get(
        f'https://api-precios-coches.com/precio-nuevo',
        params={'marca': marca, 'modelo': modelo, 'año': año}
    )
    if response.ok:
        return response.json()['precio_nuevo']
    return None
```

## 🔄 APIs Actualizadas

He actualizado las APIs para que funcionen con tu estructura:

### GET /api/comparador/analisis
- Lee `comparador_scraper` (competencia)
- Lee `stock` (nuestros vehículos)
- Busca competidores similares por modelo
- Calcula métricas usando `precio_nuevo_original` **o** `precio_nuevo`
- Retorna stats + lista de vehículos analizados

### GET /api/comparador/vehicle/[id]
- Análisis detallado de 1 vehículo
- Incluye TODOS los competidores
- Incluye historial de cambios
- Datos para el gráfico de dispersión

## 📊 Queries Útiles

### Ver anuncios sin precio_nuevo_original
```sql
SELECT 
    source, 
    modelo, 
    año, 
    COUNT(*) as total
FROM comparador_scraper
WHERE precio_nuevo_original IS NULL
AND estado_anuncio = 'activo'
GROUP BY source, modelo, año
ORDER BY total DESC;
```

### Actualizar precio_nuevo_original por lotes
```sql
-- BMW Serie 3
UPDATE comparador_scraper
SET precio_nuevo_original = CASE
    WHEN año >= '2023' THEN 55000
    WHEN año >= '2021' THEN 52000
    WHEN año >= '2019' THEN 48000
    ELSE 45000
END
WHERE modelo LIKE '%Serie 3%' 
AND modelo LIKE '%320d%'
AND precio_nuevo_original IS NULL;

-- BMW X3
UPDATE comparador_scraper
SET precio_nuevo_original = CASE
    WHEN año >= '2023' THEN 72000
    WHEN año >= '2021' THEN 65000
    WHEN año >= '2019' THEN 58000
    ELSE 55000
END
WHERE modelo LIKE '%X3%'
AND precio_nuevo_original IS NULL;

-- MINI Cooper
UPDATE comparador_scraper
SET precio_nuevo_original = CASE
    WHEN año >= '2023' THEN 38000
    WHEN año >= '2021' THEN 35000
    WHEN año >= '2019' THEN 32000
    ELSE 30000
END
WHERE modelo LIKE '%MINI Cooper%'
AND source = 'MN'
AND precio_nuevo_original IS NULL;
```

### Verificar cobertura de precio_nuevo_original
```sql
SELECT 
    source,
    COUNT(*) as total_anuncios,
    COUNT(precio_nuevo_original) as con_precio_nuevo,
    ROUND(COUNT(precio_nuevo_original)::NUMERIC / COUNT(*) * 100, 1) as porcentaje_cobertura
FROM comparador_scraper
WHERE estado_anuncio = 'activo'
GROUP BY source;
```

### Ver distribución de descuentos
```sql
SELECT 
    source,
    modelo,
    COUNT(*) as anuncios,
    ROUND(AVG(
        (precio_nuevo_original - 
         NULLIF(REPLACE(REPLACE(REPLACE(precio, '€', ''), '.', ''), ',', '.'), '')::NUMERIC
        ) / precio_nuevo_original * 100
    ), 1) as descuento_promedio
FROM comparador_scraper
WHERE precio_nuevo_original IS NOT NULL
AND estado_anuncio = 'activo'
GROUP BY source, modelo
ORDER BY descuento_promedio DESC
LIMIT 20;
```

## ✅ Estado Actual

- ✅ Tabla `comparador_scraper` existe
- ✅ Columna `precio_nuevo_original` añadida
- ✅ APIs actualizadas para usar la estructura real
- ✅ Frontend listo para consumir las APIs
- ⚠️ Pendiente: Poblar `precio_nuevo_original` con datos

## 🚀 Próximo Paso

Actualizar `precio_nuevo_original` ejecutando uno de los queries anteriores según tus modelos disponibles.

**Verificación rápida:**
```sql
-- Ver cuántos anuncios activos tienes
SELECT source, COUNT(*) 
FROM comparador_scraper 
WHERE estado_anuncio = 'activo'
GROUP BY source;

-- Ver modelos más frecuentes
SELECT modelo, COUNT(*) as total
FROM comparador_scraper
WHERE estado_anuncio = 'activo'
GROUP BY modelo
ORDER BY total DESC
LIMIT 10;
```

Una vez populado `precio_nuevo_original`, el comparador funcionará completamente.

---

**Fecha:** 28 de Octubre 2025  
**Estado:** ✅ APIs actualizadas y compatibles

