from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def explorar_contenido_bmw():
    print("🔍 Explorando contenido de BMW Motorflash...")
    
    driver = webdriver.Chrome()
    
    try:
        # Login
        print("🌐 Haciendo login...")
        driver.get('https://gestionbmw.motorflash.com/login.php')
        
        # Campos de login
        usuario_input = driver.find_element(By.NAME, "usuario")
        password_input = driver.find_element(By.NAME, "password")
        
        usuario_input.send_keys("Jordivi01")
        password_input.send_keys("Jordivi02")
        
        # Botón de login
        login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        login_button.click()
        
        print("✅ Login exitoso!")
        time.sleep(3)
        
        # Explorar contenido
        print("🔍 Explorando contenido...")
        
        # 1. Buscar tablas y analizar su contenido
        tables = driver.find_elements(By.TAG_NAME, "table")
        print(f"📊 Encontradas {len(tables)} tablas")
        
        for i, table in enumerate(tables[:10]):  # Solo primeras 10 tablas
            print(f"\n📋 Tabla {i+1}:")
            try:
                # Buscar filas de encabezado
                headers = table.find_elements(By.TAG_NAME, "th")
                if headers:
                    print(f"  📝 Encabezados: {[h.text.strip() for h in headers if h.text.strip()]}")
                
                # Buscar filas de datos
                rows = table.find_elements(By.TAG_NAME, "tr")
                print(f"  📊 Filas encontradas: {len(rows)}")
                
                # Mostrar primeras 3 filas de datos
                for j, row in enumerate(rows[1:4]):  # Saltar encabezado
                    cells = row.find_elements(By.TAG_NAME, "td")
                    if cells:
                        row_data = [cell.text.strip() for cell in cells if cell.text.strip()]
                        if row_data:
                            print(f"    Fila {j+1}: {row_data[:5]}...")  # Solo primeros 5 campos
                
            except Exception as e:
                print(f"    ❌ Error analizando tabla {i+1}: {e}")
        
        # 2. Buscar enlaces que puedan ser de stock/inventario
        print(f"\n🔗 Analizando enlaces...")
        links = driver.find_elements(By.TAG_NAME, "a")
        
        # Filtrar enlaces que puedan ser relevantes
        relevant_links = []
        for link in links:
            href = link.get_attribute('href') or ''
            text = link.text.strip().lower()
            
            if any(keyword in text for keyword in ['stock', 'inventario', 'vehiculo', 'anuncio', 'listado']):
                relevant_links.append((text, href))
            elif any(keyword in href for keyword in ['stock', 'inventario', 'vehiculo', 'anuncio']):
                relevant_links.append((text, href))
        
        print(f"🔍 Enlaces relevantes encontrados: {len(relevant_links)}")
        for text, href in relevant_links[:10]:  # Solo primeros 10
            print(f"  📌 '{text}' -> {href}")
        
        # 3. Buscar elementos con clases específicas
        print(f"\n🎯 Buscando elementos específicos...")
        
        # Buscar por diferentes patrones de clase
        class_patterns = [
            "*[class*='anuncio']",
            "*[class*='vehiculo']", 
            "*[class*='stock']",
            "*[class*='inventario']",
            "*[class*='listado']",
            "*[class*='item']",
            "*[class*='row']",
            "*[class*='data']"
        ]
        
        for pattern in class_patterns:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, pattern)
                if elements:
                    print(f"  📦 {pattern}: {len(elements)} elementos")
                    # Mostrar texto de primeros 3 elementos
                    for j, elem in enumerate(elements[:3]):
                        text = elem.text.strip()[:100]  # Primeros 100 caracteres
                        if text:
                            print(f"    {j+1}. {text}...")
            except:
                pass
        
        # 4. Buscar formularios o filtros
        print(f"\n🔍 Buscando formularios y filtros...")
        forms = driver.find_elements(By.TAG_NAME, "form")
        print(f"📝 Formularios encontrados: {len(forms)}")
        
        selects = driver.find_elements(By.TAG_NAME, "select")
        print(f"📋 Selects encontrados: {len(selects)}")
        
        # 5. Pausa para inspección manual
        print(f"\n⏸️ Pausa de 30 segundos para inspección manual...")
        print("💡 Puedes inspeccionar la página manualmente para identificar:")
        print("   - Dónde están los datos de vehículos")
        print("   - Qué tablas contienen la información")
        print("   - Qué enlaces llevan al stock")
        time.sleep(30)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    explorar_contenido_bmw() 