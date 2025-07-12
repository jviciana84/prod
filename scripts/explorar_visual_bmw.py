from selenium import webdriver
from selenium.webdriver.common.by import By
import time

def explorar_visual_bmw():
    print("🔍 Exploración visual de BMW Motorflash...")
    print("💡 Te guiaré paso a paso para encontrar los datos de stock")
    
    driver = webdriver.Chrome()
    
    try:
        # 1. Login
        print("\n1️⃣ Haciendo login...")
        driver.get('https://gestionbmw.motorflash.com/login.php')
        
        usuario_input = driver.find_element(By.NAME, "usuario")
        password_input = driver.find_element(By.NAME, "password")
        
        usuario_input.send_keys("Jordivi01")
        password_input.send_keys("Jordivi02")
        
        login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        login_button.click()
        
        print("✅ Login exitoso!")
        time.sleep(3)
        
        # 2. Explorar la página principal
        print("\n2️⃣ Explorando la página principal...")
        print("📋 URL actual:", driver.current_url)
        
        # Buscar elementos principales
        print("\n🔍 Buscando elementos principales:")
        
        # Menús de navegación
        nav_elements = driver.find_elements(By.CSS_SELECTOR, "nav, .menu, .navigation, .navbar")
        print(f"📋 Menús de navegación: {len(nav_elements)}")
        
        # Enlaces principales
        main_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='anuncio'], a[href*='stock'], a[href*='vehiculo']")
        print(f"🔗 Enlaces principales: {len(main_links)}")
        
        for i, link in enumerate(main_links[:5]):
            text = link.text.strip()
            href = link.get_attribute('href')
            print(f"  {i+1}. '{text}' -> {href}")
        
        # 3. Pausa para exploración manual
        print("\n⏸️ PAUSA 1: Exploración manual (60 segundos)")
        print("💡 Instrucciones:")
        print("   1. Presiona F12 para abrir las herramientas de desarrollador")
        print("   2. Ve a la pestaña 'Elements' (Elementos)")
        print("   3. Busca enlaces que digan 'Stock', 'Inventario', 'Vehículos', 'Anuncios'")
        print("   4. Busca tablas que contengan datos de vehículos")
        print("   5. Anota las URLs o elementos que encuentres")
        
        time.sleep(60)
        
        # 4. Intentar navegar a secciones comunes
        print("\n3️⃣ Intentando navegar a secciones comunes...")
        
        # Buscar enlaces que puedan ser de stock
        stock_keywords = ['stock', 'inventario', 'vehiculo', 'anuncio', 'listado', 'catalogo']
        
        for keyword in stock_keywords:
            try:
                links = driver.find_elements(By.CSS_SELECTOR, f"a[href*='{keyword}'], a[text*='{keyword}']")
                if links:
                    print(f"🔍 Encontrados {len(links)} enlaces con '{keyword}':")
                    for link in links[:3]:
                        text = link.text.strip()
                        href = link.get_attribute('href')
                        print(f"  📌 '{text}' -> {href}")
                        
                        # Intentar hacer click en el primer enlace
                        if text and href:
                            print(f"🔄 Intentando navegar a: {text}")
                            link.click()
                            time.sleep(3)
                            print(f"📄 Nueva URL: {driver.current_url}")
                            
                            # Verificar si hay tablas en la nueva página
                            tables = driver.find_elements(By.TAG_NAME, "table")
                            print(f"📊 Tablas en nueva página: {len(tables)}")
                            
                            if tables:
                                print("✅ ¡Encontramos tablas! Analizando...")
                                for i, table in enumerate(tables[:3]):
                                    rows = table.find_elements(By.TAG_NAME, "tr")
                                    print(f"  Tabla {i+1}: {len(rows)} filas")
                                    
                                    # Mostrar encabezados si existen
                                    if rows:
                                        headers = rows[0].find_elements(By.TAG_NAME, "th")
                                        if headers:
                                            header_texts = [h.text.strip() for h in headers if h.text.strip()]
                                            print(f"    Encabezados: {header_texts}")
                            
                            # Volver a la página principal
                            driver.back()
                            time.sleep(2)
                            break
                            
            except Exception as e:
                print(f"❌ Error con '{keyword}': {e}")
        
        # 5. Pausa final para exploración
        print("\n⏸️ PAUSA 2: Exploración final (90 segundos)")
        print("💡 Ahora que has visto la estructura:")
        print("   1. ¿Encontraste alguna tabla con datos de vehículos?")
        print("   2. ¿Hay algún enlace específico que lleve al stock?")
        print("   3. ¿Qué columnas/encabezados viste en las tablas?")
        print("   4. ¿Hay algún menú o botón que diga 'Stock' o 'Inventario'?")
        
        time.sleep(90)
        
        print("\n✅ Exploración completada!")
        print("📝 Anota lo que encontraste para el siguiente paso")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        
    finally:
        print("\n🔚 Cerrando navegador...")
        driver.quit()

if __name__ == "__main__":
    explorar_visual_bmw() 