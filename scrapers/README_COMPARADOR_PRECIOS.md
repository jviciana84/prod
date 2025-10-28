# 🔍 SCRAPERS BMW PREMIUM SELECTION Y MINI NEXT

## 📋 Descripción

Scrapers para extraer datos de vehículos de ocasión de las webs públicas de:
- **BMW Premium Selection** (toda la red BMW España)
- **MINI Next** (toda la red MINI España)

Estos datos se compararán con nuestro stock interno para generar precios recomendados agresivos.

---

## 📦 Instalación

### 1. Instalar dependencias de Python

```bash
pip install selenium beautifulsoup4 python-dotenv supabase pandas
```

### 2. Instalar ChromeDriver

**Opción A - Descarga manual:**
1. Ir a https://chromedriver.chromium.org/downloads
2. Descargar versión compatible con tu Chrome
3. Añadir al PATH o colocar en carpeta del proyecto

**Opción B - Instalación automática (recomendado):**
```bash
pip install webdriver-manager
```

Luego usar en el código:
```python
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)
```

---

## 🗄️ Configurar Base de Datos

### Crear tablas en Supabase

Ejecutar el script SQL:
```bash
# Conectarse a Supabase y ejecutar
psql -U postgres -d tu_base_datos -f sql/create_bmw_mini_public_scrapers.sql
```

O ejecutar directamente en **Supabase SQL Editor**:
1. Ir a Supabase Dashboard
2. SQL Editor
3. Copiar contenido de `sql/create_bmw_mini_public_scrapers.sql`
4. Ejecutar

Esto creará:
- `bmw_premium_selection_public` (vehículos BMW)
- `mini_next_public` (vehículos MINI)
- `price_comparisons` (comparaciones de precios)
- `competitor_price_history` (historial de precios)

---

## 🧪 Fase 1: Scrapers de Prueba

### Objetivo
Identificar los selectores CSS/XPath correctos de las webs.

### Ejecutar scraper de prueba BMW

```bash
cd scrapers
python bmw_premium_selection_test.py
```

**¿Qué hace?**
1. Accede a BMW Premium Selection
2. Intenta encontrar elementos de vehículos
3. Guarda HTML de la página para inspección manual
4. Muestra posibles selectores encontrados

**Salida:**
- `bmw_premium_selection_page.html` → Inspeccionar manualmente
- `bmw_premium_selection_screenshot.png` → Captura visual

### Ejecutar scraper de prueba MINI

```bash
cd scrapers
python mini_next_test.py
```

**Salida:**
- `mini_next_page.html` → Inspeccionar manualmente
- `mini_next_screenshot.png` → Captura visual

---

## 🔍 Fase 2: Identificar Selectores

### Inspeccionar HTML guardado

1. Abrir archivo HTML generado en navegador
2. Abrir DevTools (F12)
3. Buscar elementos de vehículos

### Selectores a identificar

Para cada vehículo en el listado:
```css
/* Contenedor principal del vehículo */
.vehicle-card, .car-item, article.vehicle

/* Datos básicos */
h2.model-name
span.price
span.mileage
span.year

/* Link a ficha detallada */
a.vehicle-link[href]

/* Imagen principal */
img.vehicle-image[src]
```

Para la ficha detallada:
```css
/* Versión completa */
h1.vehicle-title

/* Especificaciones técnicas */
.spec-fuel-type
.spec-transmission
.spec-power

/* Extras y equipamiento */
ul.extras-list li
.equipment-item

/* Colores */
.exterior-color
.interior-color

/* Concesionario */
.dealer-name
.dealer-location

/* Galería de imágenes */
.gallery-image, .vehicle-photo
```

### Actualizar selectores en código

Editar archivos:
- `bmw_premium_selection_test.py` (línea ~80)
- `mini_next_test.py` (línea ~80)

Reemplazar selectores de ejemplo con los reales.

---

## 🚀 Fase 3: Scraper Completo

Una vez identificados los selectores, ejecutar scraper completo:

```bash
# BMW Premium Selection (completo)
python bmw_premium_selection_scraper.py

# MINI Next (completo)
python mini_next_scraper.py
```

**Salida:**
- Datos insertados en Supabase
- Log detallado de ejecución
- JSON con datos extraídos (backup)

---

## ⚙️ Configuración Avanzada

### Variables de Entorno (.env)

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Scraper
HEADLESS_MODE=true
DEBUG_MODE=false
RATE_LIMIT_SECONDS=2
MAX_RETRIES=3

# Notificaciones (opcional)
NOTIFICATION_EMAIL=tu-email@ejemplo.com
```

### Configuración de Rate Limiting

Para no sobrecargar las webs:

```python
# Pausas entre requests
DELAY_BETWEEN_PAGES = 2  # segundos
DELAY_BETWEEN_VEHICLES = 1  # segundos
DELAY_BETWEEN_IMAGES = 0.5  # segundos

# Timeouts
PAGE_LOAD_TIMEOUT = 30  # segundos
ELEMENT_WAIT_TIMEOUT = 20  # segundos
```

---

## 🔄 Integración en CVO Scraper V1

### Añadir a `cvo-scraper-v1/main.py`

```python
# Importar scrapers
from scrapers.bmw_premium_selection_scraper import BMWPremiumSelectionScraper
from scrapers.mini_next_scraper import MiniNextScraper

# Añadir botones en GUI
self.btn_bmw_ps = tk.Button(
    self.frame,
    text="BMW Premium Selection",
    command=self.run_bmw_ps_manual
)

self.btn_mini_next = tk.Button(
    self.frame,
    text="MINI Next",
    command=self.run_mini_next_manual
)

# Método para ejecutar BMW PS
def run_bmw_ps_manual(self):
    if self.bmw_ps_running:
        return
    
    self.bmw_ps_running = True
    self.log("🚗 Ejecutando BMW Premium Selection...")
    
    try:
        scraper = BMWPremiumSelectionScraper()
        scraper.init_driver()
        vehicles = scraper.scrape_all()
        scraper.save_to_supabase()
        self.log(f"✅ BMW PS completado: {len(vehicles)} vehículos")
    except Exception as e:
        self.log(f"❌ Error en BMW PS: {e}")
    finally:
        self.bmw_ps_running = False
        scraper.close()
```

### Programación Automática

```python
# Ejecutar diariamente a las 02:00 AM
schedule.every().day.at("02:00").do(self.run_bmw_ps_auto)
schedule.every().day.at("02:30").do(self.run_mini_next_auto)
```

---

## 📊 Uso de Datos

### Consultar vehículos scrapeados

```sql
-- Ver últimos vehículos BMW scrapeados
SELECT 
  model, 
  version, 
  price, 
  mileage, 
  dealership_location,
  scraped_at
FROM bmw_premium_selection_public
WHERE is_active = TRUE
ORDER BY scraped_at DESC
LIMIT 20;

-- Ver vehículos MINI scrapeados
SELECT 
  model, 
  version, 
  price, 
  mileage, 
  dealership_location,
  scraped_at
FROM mini_next_public
WHERE is_active = TRUE
ORDER BY scraped_at DESC
LIMIT 20;

-- Ver resumen por modelo
SELECT 
  model,
  COUNT(*) as total,
  AVG(price) as precio_promedio,
  MIN(price) as precio_min,
  MAX(price) as precio_max
FROM bmw_premium_selection_public
WHERE is_active = TRUE
GROUP BY model
ORDER BY total DESC;
```

---

## 🐛 Troubleshooting

### Error: ChromeDriver no encontrado

```bash
# Instalar webdriver-manager
pip install webdriver-manager

# O descargar manualmente de
https://chromedriver.chromium.org/downloads
```

### Error: Timeout esperando elementos

**Causa:** Selectores incorrectos o página tarda en cargar

**Solución:**
1. Aumentar `ELEMENT_WAIT_TIMEOUT`
2. Verificar selectores con inspector
3. Ejecutar sin headless para ver qué pasa

### Error: Captcha detectado

**Causa:** Medida anti-bot de la web

**Soluciones:**
1. Usar `undetected-chromedriver`:
   ```bash
   pip install undetected-chromedriver
   ```
2. Aumentar delays entre requests
3. Usar proxies rotativos (avanzado)

### Selectores dejan de funcionar

**Causa:** La web cambió su estructura HTML

**Solución:**
1. Ejecutar scraper de prueba
2. Inspeccionar nuevo HTML
3. Actualizar selectores
4. Probar de nuevo

---

## 📅 Mantenimiento

### Verificación Mensual

- [ ] Ejecutar scrapers de prueba
- [ ] Verificar que selectores siguen funcionando
- [ ] Revisar logs de errores
- [ ] Verificar datos en Supabase
- [ ] Actualizar documentación si hay cambios

### Monitoreo

```sql
-- Ver últimos scraping exitosos
SELECT 
  'BMW_PS' as source,
  MAX(scraped_at) as ultimo_scraping,
  COUNT(*) as total_vehiculos
FROM bmw_premium_selection_public
WHERE scraped_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'MINI_NEXT' as source,
  MAX(scraped_at) as ultimo_scraping,
  COUNT(*) as total_vehiculos
FROM mini_next_public
WHERE scraped_at > NOW() - INTERVAL '7 days';
```

---

## ⚠️ Consideraciones Legales

### Respetar robots.txt

Verificar qué permite cada web:
- https://www.bmw.es/robots.txt
- https://www.mininext.es/robots.txt

### Rate Limiting

**Obligatorio:**
- Mínimo 2 segundos entre requests
- No más de 1000 requests por día
- Horario nocturno preferible (02:00-04:00)

### Uso de Datos

- ✅ Comparación interna de precios
- ✅ Análisis de mercado
- ❌ No redistribuir datos públicamente
- ❌ No usar para spam o publicidad engañosa

---

## 📞 Soporte

Si tienes problemas:

1. Revisar esta documentación
2. Ejecutar scrapers de prueba
3. Revisar logs de error
4. Verificar que ChromeDriver está actualizado
5. Consultar documentación de Selenium

---

## 🔗 Enlaces Útiles

- [Selenium Python Docs](https://selenium-python.readthedocs.io/)
- [BeautifulSoup Docs](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [Web Scraping Best Practices](https://www.scrapehero.com/web-scraping-best-practices/)

---

**Versión:** 1.0  
**Última actualización:** 27/10/2025  
**Autor:** Equipo CVO


