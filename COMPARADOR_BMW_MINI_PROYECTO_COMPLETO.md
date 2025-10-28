# 🚗 COMPARADOR DE PRECIOS BMW/MINI - PROYECTO COMPLETO

## 📋 Resumen Ejecutivo

Proyecto para comparar precios de vehículos BMW y MINI publicados en:
- **BMW Premium Selection** (red nacional)
- **MINI Next** (red nacional)

Con nuestro stock interno para generar **precios recomendados agresivos** basados en:
- ✅ Comparación de extras y equipamiento
- ✅ Diferencias de kilometraje y año
- ✅ Análisis de posicionamiento de precio
- ✅ Algoritmo de pricing dinámico

---

## 🎯 FASE ACTUAL: Scraping de Datos

### ✅ COMPLETADO

1. **Análisis Técnico**
   - [x] Investigación de webs objetivo
   - [x] Identificación de URLs
   - [x] Documentación completa

2. **Estructura de Base de Datos**
   - [x] SQL para tablas BPS y MN
   - [x] Tabla de comparaciones
   - [x] Historial de precios
   - [x] Índices y vistas

3. **Scrapers de Prueba**
   - [x] Script BMW Premium Selection
   - [x] Script MINI Next
   - [x] Guardado de HTML para inspección

4. **Integración CVO Scraper v1.1.0**
   - [x] 2 Nuevas pestañas (BPS y MN)
   - [x] Sistema de logs individual
   - [x] Programación automática
   - [x] Guardado automático de datos

### 🔄 EN PROGRESO

- [ ] Aplicar parche v1.1.0 a CVO Scraper
- [ ] Ejecutar scrapers de prueba
- [ ] Identificar selectores CSS reales

### ⏳ PENDIENTE

- [ ] Scraping completo con datos reales
- [ ] Crear tablas en Supabase
- [ ] Implementar motor de comparación
- [ ] Desarrollar algoritmo de pricing
- [ ] Crear dashboard comparador
- [ ] APIs para análisis

---

## 📦 Archivos Creados

### 📄 Documentación

| Archivo | Descripción |
|---------|-------------|
| `ANALISIS_SCRAPER_BMW_MINI_PUBLICO.md` | Análisis técnico completo de las webs |
| `scrapers/README_COMPARADOR_PRECIOS.md` | Guía de uso de scrapers |
| `cvo-scraper-v1/UPGRADE_TO_V1.1.0.md` | Instrucciones de actualización |
| `COMPARADOR_BMW_MINI_PROYECTO_COMPLETO.md` | Este archivo |

### 🗄️ Base de Datos

| Archivo | Descripción |
|---------|-------------|
| `sql/create_bmw_mini_public_scrapers.sql` | Script completo para Supabase |

**Tablas creadas:**
- `bmw_premium_selection_public` - Vehículos BMW scrapeados
- `mini_next_public` - Vehículos MINI scrapeados
- `price_comparisons` - Análisis comparativos
- `competitor_price_history` - Historial de precios

### 🤖 Scrapers

| Archivo | Descripción |
|---------|-------------|
| `scrapers/bmw_premium_selection_test.py` | Scraper prueba BMW PS |
| `scrapers/mini_next_test.py` | Scraper prueba MINI Next |
| `cvo-scraper-v1/main_v1.1.0_PATCH.py` | Parche para CVO Scraper |
| `cvo-scraper-v1/apply_v1.1.0_patch.py` | Aplicador automático |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CVO SCRAPER v1.1.0                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │   DUC   │  │   CMS   │  │   BPS   │  │    MN   │       │
│  │ (8 hrs) │  │ (8 hrs) │  │(24 hrs) │  │(24 hrs) │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
└───────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ duc_scraper  │  │   garantias  │  │  bmw_ps_pub  │     │
│  │   (Stock     │  │   (CMS MM/   │  │  (Competencia│     │
│  │   interno)   │  │    MMC)      │  │    BMW)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    stock     │  │  mini_next   │  │    price     │     │
│  │  (Inventario)│  │ (Competencia │  │ comparisons  │     │
│  │              │  │    MINI)     │  │  (Análisis)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                MOTOR DE COMPARACIÓN                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Matching de vehículos similares                  │  │
│  │     (modelo + año ±2 + km ±10000)                    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  2. Comparación de extras                            │  │
│  │     - Extras en común                                │  │
│  │     - Extras que nos faltan                          │  │
│  │     - Extras que tenemos de más                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  3. Cálculo de precio recomendado                    │  │
│  │     Base: Precio competencia                         │  │
│  │     + Ajuste por extras (valor estimado)             │  │
│  │     + Ajuste por km/año                              │  │
│  │     - Factor agresivo (-3% a -7%)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│           DASHBOARD: /dashboard/comparador-precios          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tabla Comparativa                                  │   │
│  │  ┌──────────────┬──────────────┬──────────────┐    │   │
│  │  │ Nuestro Coche│  Competencia │  Recomendación    │   │
│  │  ├──────────────┼──────────────┼──────────────┤    │   │
│  │  │ BMW 320d     │  5 similares │  Reducir      │   │
│  │  │ 34,990€      │  Avg: 32,500€│  a 30,900€    │   │
│  │  │ 3 extras     │  5 extras    │  (⚠️ Menos)   │   │
│  │  │              │  [Ver]       │  [Aplicar]    │   │
│  │  └──────────────┴──────────────┴──────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Filtros                                            │   │
│  │  [BMW ▼] [Modelo: Todos ▼] [Precio: Todos ▼]      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Flujo de Datos

### 1. Scraping (Diario 02:00 AM)

```
BMW Premium Selection Web
    ↓ (Selenium + BeautifulSoup)
    ↓
[ HTML guardado para inspección ]
    ↓
[ Extracción de datos ]
    ↓
┌─────────────────────────────────┐
│ Datos extraídos:                │
│ - ID anuncio                    │
│ - Modelo y versión              │
│ - Precio                        │
│ - Año, kilometraje              │
│ - EXTRAS (lista completa)       │  ← CRÍTICO
│ - Equipamiento serie            │
│ - Colores                       │
│ - Ubicación concesionario       │
│ - Fotos                         │
└─────────────────────────────────┘
    ↓
INSERT INTO bmw_premium_selection_public

[Mismo proceso para MINI Next]
    ↓
INSERT INTO mini_next_public
```

### 2. Comparación (Bajo demanda o programado)

```
Para cada vehículo en STOCK:
    ↓
┌─────────────────────────────────┐
│ 1. Buscar similares:            │
│    - Mismo modelo               │
│    - Año ±2 años                │
│    - Km ±10,000                 │
└─────────────────────────────────┘
    ↓
    ¿Encontrados similares?
    │
    ├─ NO → Marcar "Sin competencia"
    │
    └─ SÍ → Comparar extras
            ↓
       ┌──────────────────────────┐
       │ Análisis de extras:      │
       │ - Comunes: 5             │
       │ - Nos faltan: 2 (€3000)  │
       │ - Tenemos más: 0         │
       │ Score: -0.40             │
       └──────────────────────────┘
            ↓
       Calcular precio recomendado
            ↓
       ┌──────────────────────────┐
       │ Precio competencia: 32k  │
       │ - Extras faltantes: -3k  │
       │ + Km mejor: +200         │
       │ - Factor agresivo: -1.5k │
       │ = RECOMENDADO: 27.7k     │
       └──────────────────────────┘
            ↓
       INSERT INTO price_comparisons
            ↓
       Notificar si diferencia > 15%
```

### 3. Dashboard (Tiempo real)

```
Usuario abre /dashboard/comparador-precios
    ↓
API: GET /api/comparador/analyze
    ↓
SELECT FROM price_comparisons
    WHERE status = 'pending'
    ORDER BY price_difference DESC
    ↓
Renderizar tabla con:
    - Nuestro vehículo
    - Competencia encontrada
    - Precio recomendado
    - Botones: [Ver detalles] [Aplicar] [Ignorar]
    ↓
Usuario click "Ver detalles"
    ↓
Modal con comparativa completa:
    - Lista extras lado a lado
    - Fotos competencia
    - Razonamiento del precio
    - Histórico de precios competencia
```

---

## 🛠️ Instrucciones de Uso

### Paso 1: Actualizar CVO Scraper a v1.1.0

```bash
cd cvo-scraper-v1
# Leer instrucciones
cat UPGRADE_TO_V1.1.0.md

# Opción 1: Manual (recomendado)
# Seguir pasos en UPGRADE_TO_V1.1.0.md

# Opción 2: Semi-automático
python apply_v1.1.0_patch.py
# Luego completar manualmente
```

### Paso 2: Ejecutar Scrapers de Prueba

```bash
# Scraper independiente BMW PS
cd scrapers
python bmw_premium_selection_test.py

# Scraper independiente MINI Next
python mini_next_test.py

# O desde CVO Scraper v1.1.0
# → Pestaña "BMW PS" → Click "Ejecutar BPS"
# → Pestaña "MINI Next" → Click "Ejecutar MINI Next"
```

**Resultado:** Archivos HTML guardados en:
- `cvo-scraper-v1/dist/data/bps/bps_page_YYYYMMDD_HHMMSS.html`
- `cvo-scraper-v1/dist/data/mn/mn_page_YYYYMMDD_HHMMSS.html`

### Paso 3: Identificar Selectores

```bash
# Abrir HTML guardados en navegador
# Usar DevTools (F12) para inspeccionar

# Buscar:
# - Contenedor de vehículos
# - Modelo, precio, km, año
# - Link a ficha detallada
# - En ficha: lista de extras

# Actualizar selectores en:
# - scrapers/bmw_premium_selection_test.py
# - scrapers/mini_next_test.py
# - cvo-scraper-v1/main.py (funciones run_bps_manual y run_mn_manual)
```

### Paso 4: Crear Tablas en Supabase

```sql
-- Ejecutar en Supabase SQL Editor
-- Copiar contenido de:
sql/create_bmw_mini_public_scrapers.sql

-- Verificar tablas creadas:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'bmw_premium_selection_public',
  'mini_next_public',
  'price_comparisons',
  'competitor_price_history'
);
```

### Paso 5: Implementar Scraping Real

Una vez identificados selectores, actualizar:

```python
# En cvo-scraper-v1/main.py

def run_bps_manual(self):
    # ... código existente ...
    
    # ACTUALIZAR con selectores reales:
    vehicles = self.driver.find_elements(By.CSS_SELECTOR, ".clase-real-del-vehiculo")
    
    for vehicle in vehicles:
        data = {
            'model': vehicle.find_element(By.CSS_SELECTOR, ".modelo-real").text,
            'price': vehicle.find_element(By.CSS_SELECTOR, ".precio-real").text,
            # ... más campos
        }
        
        # Guardar en Supabase
        self.supabase.table('bmw_premium_selection_public').insert(data).execute()
```

### Paso 6: Programar Ejecución Automática

```python
# Ya incluido en v1.1.0
# Configuración en pestañas BPS y MN:
# - Horario: 02:00 - 06:00
# - Intervalo: 24 horas
# - Días: L,M,X,J,V,S,D
# - Arranque automático: ✓
```

---

## 📈 Roadmap

### ✅ Fase 1: Scraping (ACTUAL)
- [x] Análisis técnico
- [x] Estructura BD
- [x] Scrapers prueba
- [ ] Scrapers producción
- [ ] Carga en Supabase

### ⏳ Fase 2: Motor de Comparación
- [ ] Algoritmo matching vehículos
- [ ] Comparador de extras
- [ ] Calculadora de precios
- [ ] API Routes

### ⏳ Fase 3: Dashboard
- [ ] Página comparador
- [ ] Tabla comparativa
- [ ] Modal detalle
- [ ] Aplicar precios

### ⏳ Fase 4: Automatización
- [ ] Análisis automático post-scraping
- [ ] Alertas precios no competitivos
- [ ] Historial comparaciones
- [ ] Reportes semanales

---

## 🎯 KPIs del Proyecto

### Scraping
- **Vehículos scrapeados:** BMW PS + MINI Next
- **Frecuencia:** Diaria (02:00 AM)
- **Tasa de éxito:** >95%
- **Datos capturados:** 100% (incluyendo extras)

### Comparaciones
- **Cobertura:** % vehículos stock con competencia similar
- **Precisión matching:** >90%
- **Tiempo análisis:** <5 min por vehículo
- **Calidad datos:** 100% extras identificados

### Precios
- **Vehículos ajustados:** X vehículos/mes
- **Ahorro promedio:** % reducción vs precio original
- **Competitividad:** % vehículos en rango competitivo
- **Conversión:** Incremento ventas por ajuste precios

---

## 📞 Soporte y Documentación

### Documentación Completa
- `ANALISIS_SCRAPER_BMW_MINI_PUBLICO.md` - Análisis técnico
- `scrapers/README_COMPARADOR_PRECIOS.md` - Guía scrapers
- `cvo-scraper-v1/UPGRADE_TO_V1.1.0.md` - Actualización
- `COMPARADOR_BMW_MINI_PROYECTO_COMPLETO.md` - Este archivo

### URLs de Referencia
- BMW Premium Selection: https://www.bmwpremiumselection.es/
- MINI Next: https://www.mininext.es/
- Selenium Docs: https://selenium-python.readthedocs.io/
- Supabase Docs: https://supabase.com/docs

---

## 🔒 Consideraciones Legales

### Rate Limiting
- ✅ Máximo 1 request cada 2-3 segundos
- ✅ Scraping nocturno (02:00-06:00)
- ✅ No más de 1000 requests/día por web

### Uso de Datos
- ✅ Solo comparación interna
- ❌ No redistribuir datos
- ❌ No spam o publicidad engañosa

### Robots.txt
- Verificar antes de scrapear:
  - https://www.bmwpremiumselection.es/robots.txt
  - https://www.mininext.es/robots.txt

---

**Proyecto:** Comparador BMW/MINI  
**Versión CVO Scraper:** 1.1.0  
**Fecha:** 27/10/2025  
**Estado:** Fase 1 - Scraping en desarrollo


