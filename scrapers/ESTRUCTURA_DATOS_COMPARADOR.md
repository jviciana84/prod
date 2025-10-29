# 📋 Estructura de Datos para Comparador de Precios

## 🎯 Objetivo

El scraper debe insertar/actualizar datos en la tabla `comparador_scraper` de Supabase con la siguiente estructura.

---

## 📊 Tabla: `comparador_scraper`

### Campos Obligatorios

| Campo | Tipo | Ejemplo | Descripción |
|-------|------|---------|-------------|
| `source` | TEXT | `'BPS'` o `'MN'` | BMW Premium Selection o MINI Next |
| `id_anuncio` | TEXT | `'12345'` | ID único del anuncio en la web |
| `modelo` | TEXT | `'BMW Serie 3 320d'` | Modelo completo del vehículo |
| `precio` | TEXT | `'32.900€'` | Precio actual (con formato) |
| `url` | TEXT | `'https://...'` | URL completa del anuncio |

### Campos Recomendados

| Campo | Tipo | Ejemplo | Descripción |
|-------|------|---------|-------------|
| `matricula` | TEXT | `'1234ABC'` | Matrícula (si está visible) |
| `año` | TEXT | `'2021'` | Año del vehículo |
| `km` | TEXT | `'45000'` o `'45.000'` | Kilómetros (formato texto) |
| `combustible` | TEXT | `'Diesel'` | Tipo de combustible |
| `transmision` | TEXT | `'Automática'` | Tipo de transmisión |
| `potencia_cv` | TEXT | `'190'` | Potencia en CV |
| `color` | TEXT | `'Negro Zafiro'` | Color del vehículo |
| `concesionario` | TEXT | `'Bernesga Motor'` | Nombre del concesionario |
| `provincia` | TEXT | `'León'` | Provincia del concesionario |

### Campos de Precio (Críticos para Análisis)

| Campo | Tipo | Ejemplo | Descripción |
|-------|------|---------|-------------|
| `precio_original` | TEXT | `'35.900€'` | Precio tachado (si existe) |
| `precio_nuevo_original` | NUMERIC | `52000` | **IMPORTANTE**: Precio cuando era nuevo |
| `descuento_calculado` | NUMERIC | `3000` | Auto-calculado por trigger |
| `porcentaje_descuento` | NUMERIC | `8.35` | Auto-calculado por trigger |

### Campos Temporales

| Campo | Tipo | Ejemplo | Descripción |
|-------|------|---------|-------------|
| `dias_publicado` | INTEGER | `15` | Días desde publicación |
| `fecha_publicacion` | TIMESTAMPTZ | `'2024-10-13T00:00:00Z'` | Fecha de publicación |
| `fecha_primera_matriculacion` | DATE | `'2021-06-15'` | Primera matriculación |

### Campos de Estado (Auto-gestionados)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `estado_anuncio` | TEXT | Auto-actualizado por triggers |
| `precio_anterior` | TEXT | Se guarda al cambiar precio |
| `fecha_cambio_precio` | TIMESTAMPTZ | Se guarda al cambiar precio |

### Campos Extra (Opcionales)

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| `equipamiento` | TEXT | Lista de equipamiento |
| `descripcion` | TEXT | Descripción del anuncio |

---

## 🔧 Ejemplo de Inserción (Python)

```python
from supabase import create_client
import os

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# Datos scrapeados de BMW Premium Selection
vehiculo = {
    # OBLIGATORIOS
    'source': 'BPS',
    'id_anuncio': 'bmw-12345',
    'modelo': 'BMW Serie 3 320d',
    'precio': '32.900€',
    'url': 'https://www.bmw-premiumselection.es/vehiculo/bmw-12345',
    
    # RECOMENDADOS
    'matricula': '1234ABC',
    'año': '2021',
    'km': '45000',
    'combustible': 'Diesel',
    'transmision': 'Automática',
    'potencia_cv': '190',
    'color': 'Negro Zafiro Metalizado',
    'concesionario': 'Bernesga Motor',
    'provincia': 'León',
    
    # CRÍTICO PARA ANÁLISIS
    'precio_nuevo_original': 52000,  # Precio cuando era nuevo (importante!)
    
    # TEMPORALES
    'dias_publicado': 15,
    'fecha_publicacion': '2024-10-13T00:00:00Z',
    'fecha_primera_matriculacion': '2021-06-15',
    
    # EXTRAS
    'equipamiento': 'Navegador profesional, Sensores aparcamiento, Cámara trasera',
    'descripcion': 'BMW Serie 3 en perfecto estado...'
}

# Insertar o actualizar (upsert)
result = supabase.table('comparador_scraper').upsert(
    vehiculo,
    on_conflict='source,id_anuncio'  # Unique constraint
).execute()

print(f"✅ Vehículo guardado: {vehiculo['modelo']}")
```

---

## 🔄 Estrategia de Actualización

### Primera Ejecución (Scraping Inicial)
```python
# Borrar todos los anuncios antiguos de este source
supabase.table('comparador_scraper')\
    .delete()\
    .eq('source', 'BPS')\
    .execute()

# Insertar todos los anuncios nuevos
for vehiculo in vehiculos_scrapeados:
    supabase.table('comparador_scraper').insert(vehiculo).execute()
```

### Ejecuciones Posteriores (Detección de Cambios)
```python
# Para cada anuncio scrapeado
for vehiculo_nuevo in vehiculos_scrapeados:
    # Buscar si existe
    existing = supabase.table('comparador_scraper')\
        .select('*')\
        .eq('source', vehiculo_nuevo['source'])\
        .eq('id_anuncio', vehiculo_nuevo['id_anuncio'])\
        .execute()
    
    if not existing.data:
        # Anuncio nuevo → insertar con estado 'nuevo'
        vehiculo_nuevo['estado_anuncio'] = 'nuevo'
        supabase.table('comparador_scraper').insert(vehiculo_nuevo).execute()
    else:
        # Anuncio existente → actualizar (el trigger detectará cambios de precio)
        supabase.table('comparador_scraper')\
            .update(vehiculo_nuevo)\
            .eq('source', vehiculo_nuevo['source'])\
            .eq('id_anuncio', vehiculo_nuevo['id_anuncio'])\
            .execute()

# Marcar anuncios que ya no existen como 'desaparecido'
ids_actuales = [v['id_anuncio'] for v in vehiculos_scrapeados]
supabase.table('comparador_scraper')\
    .update({'estado_anuncio': 'desaparecido'})\
    .eq('source', 'BPS')\
    .not_.in_('id_anuncio', ids_actuales)\
    .execute()
```

---

## 🎯 Campo Crítico: `precio_nuevo_original`

### ¿Por qué es importante?

El sistema compara **descuentos**, no solo precios absolutos.

**Ejemplo:**
```
Vehículo A: Precio nuevo 60.000€ → Ahora 45.000€ = 25% descuento ✅
Vehículo B: Precio nuevo 50.000€ → Ahora 45.000€ = 10% descuento ❌
```

Aunque ambos cuestan 45.000€, el Vehículo A está mejor posicionado.

### ¿Cómo obtenerlo?

**Opción 1: Scrapear del anuncio** (si está visible)
```python
# Buscar "Precio nuevo: 52.000€" en la página
precio_nuevo = extraer_precio_nuevo_de_html(html)
```

**Opción 2: Calcular desde precio tachado**
```python
# Si hay precio tachado: "35.900€ → 32.900€"
# El precio_nuevo_original sería ~52.000€ (estimado)
if precio_tachado:
    precio_nuevo_original = estimar_precio_nuevo(modelo, año, precio_tachado)
```

**Opción 3: Base de datos de precios**
```python
# Mantener un diccionario de precios nuevos por modelo
PRECIOS_NUEVOS = {
    'BMW Serie 3 320d': 52000,
    'BMW X3 xDrive20d': 65000,
    'MINI Cooper S': 35000,
    # ...
}

precio_nuevo_original = PRECIOS_NUEVOS.get(modelo)
```

**Opción 4: API externa**
```python
# Usar API de precios de coches (si existe)
precio_nuevo_original = api_precios.obtener_precio_nuevo(marca, modelo, año)
```

---

## 📝 Validación de Datos

Antes de insertar, validar:

```python
def validar_vehiculo(vehiculo):
    # Obligatorios
    assert vehiculo.get('source') in ['BPS', 'MN'], "Source inválido"
    assert vehiculo.get('id_anuncio'), "Falta id_anuncio"
    assert vehiculo.get('modelo'), "Falta modelo"
    assert vehiculo.get('precio'), "Falta precio"
    assert vehiculo.get('url'), "Falta URL"
    
    # Conversión de tipos
    if 'dias_publicado' in vehiculo:
        vehiculo['dias_publicado'] = int(vehiculo['dias_publicado'])
    
    if 'precio_nuevo_original' in vehiculo:
        vehiculo['precio_nuevo_original'] = float(vehiculo['precio_nuevo_original'])
    
    # Limpiar precios
    if 'precio' in vehiculo:
        # Asegurar formato: "32.900€"
        precio_num = extraer_numero(vehiculo['precio'])
        vehiculo['precio'] = f"{precio_num:,.0f}€".replace(',', '.')
    
    return vehiculo
```

---

## 🔍 Ejemplo Completo de Scraper

```python
import requests
from bs4 import BeautifulSoup
from supabase import create_client
import os

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

def scrapear_bmw_premium_selection():
    url = "https://www.bmw-premiumselection.es/ocasion"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    vehiculos = []
    
    for card in soup.select('.vehicle-card'):
        vehiculo = {
            'source': 'BPS',
            'id_anuncio': card.get('data-id'),
            'modelo': card.select_one('.vehicle-model').text.strip(),
            'precio': card.select_one('.vehicle-price').text.strip(),
            'url': 'https://www.bmw-premiumselection.es' + card.select_one('a')['href'],
            'km': card.select_one('.vehicle-km').text.strip(),
            'año': card.select_one('.vehicle-year').text.strip(),
            'concesionario': card.select_one('.dealer-name').text.strip(),
            # ... más campos
        }
        
        # IMPORTANTE: Estimar precio nuevo
        vehiculo['precio_nuevo_original'] = estimar_precio_nuevo(
            vehiculo['modelo'], 
            vehiculo['año']
        )
        
        vehiculos.append(vehiculo)
    
    # Guardar en Supabase
    for v in vehiculos:
        try:
            supabase.table('comparador_scraper').upsert(
                v,
                on_conflict='source,id_anuncio'
            ).execute()
            print(f"✅ {v['modelo']}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n🎉 Total scrapeados: {len(vehiculos)}")

def estimar_precio_nuevo(modelo, año):
    """Estimar precio nuevo del vehículo"""
    # Implementar lógica de estimación
    # Puede ser un diccionario, API, o cálculo basado en depreciación
    precios_base = {
        'BMW Serie 3': 52000,
        'BMW X3': 65000,
        'MINI Cooper': 35000,
        # ...
    }
    
    for key, precio in precios_base.items():
        if key in modelo:
            # Ajustar por año (depreciación aproximada 15% anual)
            años_antiguedad = 2025 - int(año)
            factor_depreciacion = (1 - 0.15) ** años_antiguedad
            return int(precio * factor_depreciacion)
    
    return None

if __name__ == '__main__':
    scrapear_bmw_premium_selection()
```

---

## 📊 Verificación Post-Scraping

```sql
-- Ver total de anuncios insertados
SELECT source, COUNT(*) as total
FROM comparador_scraper
GROUP BY source;

-- Ver anuncios sin precio_nuevo_original
SELECT COUNT(*) 
FROM comparador_scraper 
WHERE precio_nuevo_original IS NULL;

-- Ver distribución por estado
SELECT estado_anuncio, COUNT(*)
FROM comparador_scraper
GROUP BY estado_anuncio;

-- Ver últimos cambios de precio
SELECT *
FROM comparador_historial_precios
ORDER BY fecha_cambio DESC
LIMIT 10;
```

---

## 🚨 Errores Comunes

### Error: "duplicate key value violates unique constraint"
**Causa**: Ya existe un registro con ese `source` + `id_anuncio`  
**Solución**: Usar `upsert` en lugar de `insert`

### Error: "null value in column violates not-null constraint"
**Causa**: Falta un campo obligatorio  
**Solución**: Verificar que `source`, `id_anuncio`, `modelo`, `precio`, `url` existan

### Precio_nuevo_original siempre NULL
**Causa**: No se está calculando/asignando  
**Solución**: Implementar función de estimación de precio nuevo

---

## 📞 Soporte

Para más información, ver:
- `INSTRUCCIONES_COMPARADOR_PRECIOS.md`
- `sql/create_comparador_tables.sql` (estructura completa)
- `RESUMEN_COMPARADOR_IMPLEMENTADO.md`

**Fecha:** 28 de Octubre 2025

