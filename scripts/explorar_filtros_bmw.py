from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def explorar_filtros_bmw():
    print("🔍 Explorando página de filtros de BMW...")
    
    driver = webdriver.Chrome()
    
    try:
        # 1. Login
        print("🌐 Haciendo login...")
        driver.get('https://gestionbmw.motorflash.com/login.php')
        
        usuario_input = driver.find_element(By.NAME, "usuario")
        password_input = driver.find_element(By.NAME, "password")
        
        usuario_input.send_keys("Jordivi01")
        password_input.send_keys("Jordivi02")
        
        login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        login_button.click()
        
        print("✅ Login exitoso!")
        time.sleep(3)
        
        print(f"📄 URL actual: {driver.current_url}")
        
        # 2. Analizar formularios de filtros
        print("\n🔍 Analizando formularios de filtros...")
        
        # Buscar todos los formularios
        forms = driver.find_elements(By.TAG_NAME, "form")
        print(f"📝 Formularios encontrados: {len(forms)}")
        
        for i, form in enumerate(forms):
            print(f"\n📋 Formulario {i+1}:")
            print(f"  Action: {form.get_attribute('action')}")
            print(f"  Method: {form.get_attribute('method')}")
            
            # Buscar campos de input en el formulario
            inputs = form.find_elements(By.TAG_NAME, "input")
            print(f"  📝 Inputs: {len(inputs)}")
            for j, inp in enumerate(inputs):
                input_type = inp.get_attribute('type')
                input_name = inp.get_attribute('name')
                input_id = inp.get_attribute('id')
                input_placeholder = inp.get_attribute('placeholder')
                print(f"    {j+1}. Type: {input_type}, Name: {input_name}, ID: {input_id}, Placeholder: {input_placeholder}")
            
            # Buscar selects en el formulario
            selects = form.find_elements(By.TAG_NAME, "select")
            print(f"  📋 Selects: {len(selects)}")
            for j, select in enumerate(selects):
                select_name = select.get_attribute('name')
                select_id = select.get_attribute('id')
                print(f"    {j+1}. Name: {select_name}, ID: {select_id}")
                
                # Mostrar opciones del select
                options = select.find_elements(By.TAG_NAME, "option")
                print(f"      Opciones: {len(options)}")
                for k, option in enumerate(options[:5]):  # Solo primeras 5 opciones
                    option_text = option.text.strip()
                    option_value = option.get_attribute('value')
                    if option_text:
                        print(f"        {k+1}. '{option_text}' (value: {option_value})")
        
        # 3. Buscar botones de búsqueda
        print("\n🔍 Buscando botones de búsqueda...")
        search_buttons = driver.find_elements(By.CSS_SELECTOR, "input[type='submit'], button[type='submit'], input[value*='buscar'], button:contains('Buscar')")
        print(f"🔍 Botones de búsqueda: {len(search_buttons)}")
        
        for i, button in enumerate(search_buttons):
            button_text = button.text.strip()
            button_value = button.get_attribute('value')
            button_type = button.get_attribute('type')
            print(f"  {i+1}. Text: '{button_text}', Value: '{button_value}', Type: {button_type}")
        
        # 4. Buscar tablas de resultados (si las hay)
        print("\n📊 Buscando tablas de resultados...")
        tables = driver.find_elements(By.TAG_NAME, "table")
        print(f"📊 Tablas encontradas: {len(tables)}")
        
        for i, table in enumerate(tables):
            rows = table.find_elements(By.TAG_NAME, "tr")
            print(f"  Tabla {i+1}: {len(rows)} filas")
            
            if rows:
                # Mostrar encabezados
                headers = rows[0].find_elements(By.TAG_NAME, "th")
                if headers:
                    header_texts = [h.text.strip() for h in headers if h.text.strip()]
                    print(f"    Encabezados: {header_texts}")
                
                # Mostrar primeras filas de datos
                for j, row in enumerate(rows[1:4]):  # Solo primeras 3 filas de datos
                    cells = row.find_elements(By.TAG_NAME, "td")
                    if cells:
                        cell_texts = [cell.text.strip() for cell in cells if cell.text.strip()]
                        if cell_texts:
                            print(f"    Fila {j+1}: {cell_texts[:5]}...")  # Solo primeros 5 campos
        
        # 5. Intentar hacer una búsqueda básica
        print("\n🔍 Intentando hacer una búsqueda básica...")
        
        # Buscar botón de búsqueda y hacer click
        try:
            search_button = driver.find_element(By.CSS_SELECTOR, "input[type='submit'], button[type='submit']")
            print(f"🔄 Haciendo click en botón de búsqueda: '{search_button.get_attribute('value')}'")
            search_button.click()
            time.sleep(3)
            
            print(f"📄 Nueva URL después de búsqueda: {driver.current_url}")
            
            # Verificar si aparecieron resultados
            new_tables = driver.find_elements(By.TAG_NAME, "table")
            print(f"📊 Tablas después de búsqueda: {len(new_tables)}")
            
            if new_tables:
                print("✅ ¡Encontramos resultados! Analizando...")
                for i, table in enumerate(new_tables[:3]):
                    rows = table.find_elements(By.TAG_NAME, "tr")
                    print(f"  Tabla {i+1}: {len(rows)} filas")
                    
                    if rows:
                        headers = rows[0].find_elements(By.TAG_NAME, "th")
                        if headers:
                            header_texts = [h.text.strip() for h in headers if h.text.strip()]
                            print(f"    Encabezados: {header_texts}")
                        
                        # Mostrar algunas filas de datos
                        for j, row in enumerate(rows[1:6]):  # Primeras 5 filas de datos
                            cells = row.find_elements(By.TAG_NAME, "td")
                            if cells:
                                cell_texts = [cell.text.strip() for cell in cells if cell.text.strip()]
                                if cell_texts:
                                    print(f"    Fila {j+1}: {cell_texts}")
            
        except Exception as e:
            print(f"❌ Error al hacer búsqueda: {e}")
        
        # 6. Pausa para exploración manual
        print("\n⏸️ PAUSA: Exploración manual (60 segundos)")
        print("💡 Instrucciones:")
        print("   1. Observa los filtros disponibles")
        print("   2. Identifica qué campos puedes usar para buscar")
        print("   3. Haz una búsqueda manual para ver los resultados")
        print("   4. Anota qué columnas aparecen en los resultados")
        print("   5. Identifica qué datos necesitas extraer")
        
        time.sleep(60)
        
        print("\n✅ Exploración de filtros completada!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        
    finally:
        print("\n🔚 Cerrando navegador...")
        driver.quit()

if __name__ == "__main__":
    explorar_filtros_bmw() 