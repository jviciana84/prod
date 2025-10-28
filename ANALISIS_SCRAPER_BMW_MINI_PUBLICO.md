# 🔍 ANÁLISIS TÉCNICO: SCRAPERS BMW PREMIUM SELECTION Y MINI NEXT

## 📋 OBJETIVO
Scrapear las webs públicas de BMW Premium Selection y MINI Next para comparar precios y extras con nuestro stock.

---

## 🌐 URLs OBJETIVO

### 1. BMW Premium Selection España
```
URL Principal: https://www.bmw.es/es/topics/offers-and-services/bmw-premium-selection/search.html
Descripción: Buscador de vehículos ocasión certificados BMW en toda España
Vehículos: ~500-800 unidades (estimado)
```

### 2. MINI Next España
```
URL Principal: https://www.mininext.es/buscador-avanzado
Descripción: Buscador avanzado de vehículos ocasión certificados MINI en toda España
Vehículos: ~200-400 unidades (estimado)
```

---

## 🔬 ANÁLISIS TÉCNICO

### Características Comunes
- ✅ **Contenido dinámico**: Ambas webs cargan datos con JavaScript
- ✅ **Paginación**: Resultados distribuidos en múltiples páginas
- ✅ **Filtros avanzados**: Modelo, año, precio, km, ubicación
- ✅ **Fichas detalladas**: Cada vehículo tiene página individual con extras
- ⚠️ **Anti-scraping**: Posibles medidas de protección (captcha, rate limiting)

### Tecnología Requerida
```python
Herramientas necesarias:
├── Selenium → Renderizar JavaScript y navegación dinámica
├── BeautifulSoup → Parsear HTML extraído
├── Pandas → Estructurar datos extraídos
├── Supabase Python Client → Upload a base de datos
└── Chrome WebDriver → Navegador headless
```

---

## 🏗️ ARQUITECTURA DEL SCRAPER

### Fase 1: Navegación y Listado
```python
1. Iniciar Chrome con Selenium (headless mode)
2. Acceder a buscador
3. Aplicar filtros (opcional: solo BMW/MINI específicos)
4. Extraer número total de resultados
5. Calcular número de páginas
6. Iterar por cada página
```

### Fase 2: Extracción de Listado
```python
Para cada página:
  1. Esperar carga completa (wait for elements)
  2. Extraer elementos de vehículos
  3. Para cada vehículo en listado:
     - ID del anuncio
     - Modelo básico
     - Precio
     - Km
     - Año
     - URL ficha detallada
     - Imagen principal
     - Ubicación (concesionario)
```

### Fase 3: Extracción Detallada
```python
Para cada URL de ficha:
  1. Acceder a ficha individual
  2. Extraer datos completos:
     ├── Versión completa
     ├── Precio detallado
     ├── Lista completa de extras
     ├── Equipamiento de serie
     ├── Color exterior
     ├── Color interior
     ├── Tipo combustible
     ├── Transmisión
     ├── Potencia (CV)
     ├── Matrícula (si visible)
     ├── VIN (si visible)
     ├── Todas las fotos
     ├── Nombre concesionario
     └── Ubicación completa
```

### Fase 4: Almacenamiento
```python
1. Limpiar y normalizar datos
2. Convertir a formato estándar
3. Upload a Supabase (tablas correspondientes)
4. Actualizar timestamp de scraping
5. Log de resultados
```

---

## 📊 ESTRUCTURA DE DATOS A EXTRAER

### Datos Mínimos (del Listado)
```python
{
  "listing_id": "BMW_12345",           # ID único del anuncio
  "model": "BMW Serie 3 320d",
  "price": 32990,
  "mileage": 45000,
  "year": 2022,
  "url": "https://...",
  "main_image": "https://...",
  "dealership_location": "Madrid"
}
```

### Datos Completos (de la Ficha)
```python
{
  "listing_id": "BMW_12345",
  "license_plate": "1234ABC",          # Si visible
  "model": "BMW Serie 3",
  "version": "320d M Sport",
  "year": 2022,
  "mileage": 45000,
  "price": 32990,
  
  # Técnicos
  "fuel_type": "Diésel",
  "transmission": "Automático",
  "power_hp": 190,
  "doors": 4,
  "seats": 5,
  "body_type": "Berlina",
  
  # Estética
  "exterior_color": "Gris Mineral Metalizado",
  "interior_color": "Cuero Vernasca Negro",
  
  # Equipamiento
  "extras": [
    "Navegación Professional",
    "Techo solar panorámico",
    "Asientos calefactables",
    "Sistema HiFi Harman Kardon",
    "Park Assist",
    "Cámara trasera"
  ],
  "standard_equipment": [
    "Control crucero adaptativo",
    "Faros LED",
    "Climatizador automático"
  ],
  
  # Ubicación
  "dealership_name": "BMW Madrid Norte",
  "dealership_location": "Madrid",
  "dealership_address": "Calle ...",
  
  # Media
  "images": [
    "https://image1.jpg",
    "https://image2.jpg",
    ...
  ],
  
  # Metadatos
  "url": "https://ficha-completa",
  "scraped_at": "2025-10-27T10:00:00Z",
  "last_seen_at": "2025-10-27T10:00:00Z"
}
```

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### Scraper BMW Premium Selection

```python
# scrapers/bmw_premium_selection_scraper.py

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import json

class BMWPremiumSelectionScraper:
    def __init__(self):
        self.base_url = "https://www.bmw.es/es/topics/offers-and-services/bmw-premium-selection/search.html"
        self.driver = None
        self.vehicles = []
    
    def init_driver(self):
        """Inicializar Chrome en modo headless"""
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        self.driver = webdriver.Chrome(options=options)
        self.driver.implicitly_wait(10)
    
    def scrape_listings(self):
        """Extraer listado completo de vehículos"""
        self.driver.get(self.base_url)
        
        # Esperar a que carguen los resultados
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, "vehicle-card"))
        )
        
        # TODO: Identificar selectores reales inspeccionando la web
        # Estos son selectores de ejemplo
        
        page = 1
        while True:
            print(f"📄 Scrapeando página {page}...")
            
            # Extraer vehículos de la página actual
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            vehicle_cards = soup.find_all('div', class_='vehicle-card')
            
            for card in vehicle_cards:
                vehicle = self.extract_listing_data(card)
                self.vehicles.append(vehicle)
            
            # Intentar ir a siguiente página
            try:
                next_button = self.driver.find_element(By.CLASS_NAME, 'pagination-next')
                if next_button.is_enabled():
                    next_button.click()
                    time.sleep(2)  # Esperar carga
                    page += 1
                else:
                    break
            except:
                break
        
        print(f"✅ Total vehículos encontrados: {len(self.vehicles)}")
        return self.vehicles
    
    def extract_listing_data(self, card):
        """Extraer datos básicos de una card de vehículo"""
        # TODO: Ajustar selectores según estructura real
        return {
            'listing_id': card.get('data-id') or card.find('a')['href'].split('/')[-1],
            'model': card.find('h3', class_='model-name').text.strip(),
            'price': self.parse_price(card.find('span', class_='price').text),
            'mileage': self.parse_mileage(card.find('span', class_='mileage').text),
            'year': card.find('span', class_='year').text.strip(),
            'url': card.find('a')['href'],
            'main_image': card.find('img')['src'],
            'dealership_location': card.find('span', class_='location').text.strip()
        }
    
    def scrape_vehicle_details(self, url):
        """Extraer datos detallados de una ficha individual"""
        self.driver.get(url)
        
        # Esperar carga completa
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, "vehicle-details"))
        )
        
        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
        
        # TODO: Ajustar selectores según estructura real
        details = {
            'version': soup.find('h2', class_='version').text.strip(),
            'fuel_type': soup.find('span', class_='fuel').text.strip(),
            'transmission': soup.find('span', class_='transmission').text.strip(),
            'power_hp': self.parse_power(soup.find('span', class_='power').text),
            'exterior_color': soup.find('span', class_='color-exterior').text.strip(),
            'interior_color': soup.find('span', class_='color-interior').text.strip(),
            'extras': self.extract_extras(soup),
            'images': [img['src'] for img in soup.find_all('img', class_='gallery-image')],
            'dealership_name': soup.find('span', class_='dealer-name').text.strip(),
        }
        
        return details
    
    def extract_extras(self, soup):
        """Extraer lista de extras del vehículo"""
        extras_section = soup.find('div', class_='extras-list')
        if not extras_section:
            return []
        
        extras = []
        for item in extras_section.find_all('li'):
            extras.append(item.text.strip())
        
        return extras
    
    def parse_price(self, price_str):
        """Convertir string de precio a número"""
        # "32.990 €" → 32990
        return float(price_str.replace('€', '').replace('.', '').replace(',', '.').strip())
    
    def parse_mileage(self, km_str):
        """Convertir string de km a número"""
        # "45.000 km" → 45000
        return int(km_str.replace('km', '').replace('.', '').strip())
    
    def parse_power(self, power_str):
        """Convertir string de potencia a número"""
        # "190 CV" → 190
        return int(power_str.replace('CV', '').replace('cv', '').strip())
    
    def save_to_json(self, filename='bmw_premium_selection.json'):
        """Guardar resultados en JSON"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.vehicles, f, ensure_ascii=False, indent=2)
        print(f"💾 Datos guardados en {filename}")
    
    def close(self):
        """Cerrar navegador"""
        if self.driver:
            self.driver.quit()

# Uso
if __name__ == "__main__":
    scraper = BMWPremiumSelectionScraper()
    scraper.init_driver()
    
    try:
        # Extraer listados
        vehicles = scraper.scrape_listings()
        
        # Extraer detalles de cada vehículo (OPCIONAL, puede ser lento)
        # for i, vehicle in enumerate(vehicles[:10]):  # Solo primeros 10 para prueba
        #     print(f"Extrayendo detalles {i+1}/{len(vehicles)}")
        #     details = scraper.scrape_vehicle_details(vehicle['url'])
        #     vehicle.update(details)
        #     time.sleep(1)  # Rate limiting
        
        # Guardar resultados
        scraper.save_to_json()
        
    finally:
        scraper.close()
```

### Scraper MINI Next

```python
# scrapers/mini_next_scraper.py

# Estructura similar a BMW Premium Selection
# Ajustar URL base y selectores según estructura de MINI Next

class MiniNextScraper:
    def __init__(self):
        self.base_url = "https://www.mininext.es/buscador-avanzado"
        # ... resto similar a BMWPremiumSelectionScraper
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. Aspectos Legales
```
✅ Verificar robots.txt:
   - https://www.bmw.es/robots.txt
   - https://www.mininext.es/robots.txt

✅ Respetar términos de uso

✅ Rate limiting:
   - Máximo 1 request cada 2-3 segundos
   - Pausas entre páginas
   - No sobrecargar servidores

✅ User-Agent:
   - Identificarse correctamente
   - No simular ser navegador humano de forma engañosa
```

### 2. Manejo de Errores
```python
try:
    # Scraping
except selenium.common.exceptions.TimeoutException:
    # Timeout esperando elemento
    log_error("Timeout cargando página")
except selenium.common.exceptions.NoSuchElementException:
    # Elemento no encontrado (estructura cambió)
    log_error("Estructura de página cambió")
except Exception as e:
    # Otros errores
    log_error(f"Error inesperado: {e}")
```

### 3. Cambios en la Web
```
⚠️ Las webs pueden cambiar su estructura
→ Los selectores CSS/XPath dejarán de funcionar
→ Necesario mantenimiento periódico del scraper

Solución:
- Logs detallados de errores
- Alertas cuando scraper falla
- Revisión mensual de selectores
```

### 4. Captchas y Anti-Bot
```
Posibles medidas anti-scraping:
├── Captcha visual
├── reCAPTCHA
├── Rate limiting por IP
└── Detección de headless browser

Soluciones:
├── Usar proxies rotativos (si necesario)
├── Selenium undetected-chromedriver
├── Pausas aleatorias entre requests
└── Respetar rate limits estrictos
```

---

## 📅 FRECUENCIA DE SCRAPING

### Recomendado
```
BMW Premium Selection: 1 vez cada 24 horas
MINI Next: 1 vez cada 24 horas

Horario óptimo: 02:00 - 04:00 AM
├── Menor tráfico en las webs
├── No interfiere con scrapers DUC/CMS (09:00-18:00)
└── Datos listos para análisis por la mañana
```

---

## 🗄️ TABLAS DE BASE DE DATOS

Ver archivo: `sql/create_bmw_mini_public_scrapers.sql`

---

## 📦 PRÓXIMOS PASOS

1. **Investigación manual**: Inspeccionar webs reales para identificar selectores exactos
2. **Prototipo**: Desarrollar scraper básico que extraiga 10 vehículos de prueba
3. **Validación**: Verificar calidad y completitud de datos extraídos
4. **Integración**: Conectar con Supabase y crear tablas
5. **Testing**: Ejecutar scraping completo en entorno de prueba
6. **Producción**: Integrar en CVO Scraper V1
7. **Automatización**: Programar ejecución diaria

---

## 🔗 RECURSOS ÚTILES

- Selenium Python Docs: https://selenium-python.readthedocs.io/
- BeautifulSoup Docs: https://www.crummy.com/software/BeautifulSoup/bs4/doc/
- Undetected ChromeDriver: https://github.com/ultrafunkamsterdam/undetected-chromedriver
- Article Web Scraping Coches: https://www.elladodelmal.com/2024/07/como-buscar-buenos-precios-en-coches-de.html

---

**Versión:** 1.0  
**Fecha:** 27/10/2025  
**Autor:** Análisis para integración en CVO


