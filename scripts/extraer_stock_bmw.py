from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import pandas as pd
from datetime import datetime

def probar_login():
    print("🚀 Iniciando prueba de extracción BMW...")
    
    # SIN headless para ver qué pasa
    driver = webdriver.Chrome()
    
    try:
        print("🌐 Abriendo página...")
        driver.get('https://gestionbmw.motorflash.com/login.php')
        
        # Esperar y mostrar elementos
        wait = WebDriverWait(driver, 10)
        
        print("🔍 Buscando campos de login...")
        
        # Buscar todos los campos de input
        inputs = driver.find_elements(By.TAG_NAME, "input")
        print(f"📝 Encontrados {len(inputs)} campos de input:")
        
        for i, input_field in enumerate(inputs):
            print(f"  {i+1}. Tipo: {input_field.get_attribute('type')}, Name: {input_field.get_attribute('name')}, ID: {input_field.get_attribute('id')}")
        
        # Intentar login
        print("🔑 Intentando login...")
        
        # Buscar campo usuario
        usuario_input = None
        try:
            usuario_input = driver.find_element(By.NAME, "usuario")
            print("✅ Campo usuario encontrado por NAME")
        except:
            try:
                usuario_input = driver.find_element(By.ID, "usuario")
                print("✅ Campo usuario encontrado por ID")
            except:
                try:
                    usuario_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder*='usuario']")
                    print("✅ Campo usuario encontrado por placeholder")
                except:
                    print("❌ No se encontró campo usuario")
                    return
        
        # Buscar campo password
        password_input = None
        try:
            password_input = driver.find_element(By.NAME, "password")
            print("✅ Campo password encontrado por NAME")
        except:
            try:
                password_input = driver.find_element(By.ID, "password")
                print("✅ Campo password encontrado por ID")
            except:
                print("❌ No se encontró campo password")
                return
        
        # Ingresar credenciales
        usuario_input.clear()
        usuario_input.send_keys("Jordivi01")
        print("✅ Usuario ingresado")
        
        password_input.clear()
        password_input.send_keys("Jordivi02")
        print("✅ Password ingresado")
        
        # Buscar botón de login
        print("🔍 Buscando botón de login...")
        
        # Buscar en inputs
        login_buttons = driver.find_elements(By.TAG_NAME, "input")
        login_button = None
        
        for button in login_buttons:
            print(f"  Input encontrado: type={button.get_attribute('type')}, value={button.get_attribute('value')}")
            if button.get_attribute('type') == 'submit' or button.get_attribute('value') == 'Acceder':
                login_button = button
                print(f"✅ Botón de login encontrado en input: {button.get_attribute('value')}")
                break
        
        # Si no se encontró en inputs, buscar en buttons
        if not login_button:
            print("🔍 Buscando en elementos button...")
            button_elements = driver.find_elements(By.TAG_NAME, "button")
            print(f"📝 Encontrados {len(button_elements)} elementos button:")
            
            for i, button in enumerate(button_elements):
                text = button.text.strip()
                print(f"  {i+1}. Texto: '{text}', Type: {button.get_attribute('type')}")
                if text.lower() == 'acceder' or text.lower() == 'login' or text.lower() == 'entrar':
                    login_button = button
                    print(f"✅ Botón de login encontrado en button: '{text}'")
                    break
        
        # Si aún no se encontró, buscar por CSS selector
        if not login_button:
            print("🔍 Buscando por CSS selectors...")
            try:
                login_button = driver.find_element(By.CSS_SELECTOR, "input[value='Acceder']")
                print("✅ Botón encontrado por CSS selector")
            except:
                try:
                    login_button = driver.find_element(By.CSS_SELECTOR, "button:contains('Acceder')")
                    print("✅ Botón encontrado por CSS selector button")
                except:
                    try:
                        login_button = driver.find_element(By.CSS_SELECTOR, "[onclick*='login']")
                        print("✅ Botón encontrado por onclick")
                    except:
                        print("❌ No se encontró botón de login")
                        # Mostrar todos los elementos clickeables
                        print("🔍 Mostrando todos los elementos clickeables:")
                        clickable_elements = driver.find_elements(By.CSS_SELECTOR, "input[type='submit'], button, input[type='button']")
                        for i, elem in enumerate(clickable_elements):
                            print(f"  {i+1}. Tag: {elem.tag_name}, Text: '{elem.text}', Value: '{elem.get_attribute('value')}', Type: '{elem.get_attribute('type')}'")
                        return
        
        if login_button:
            print("✅ Botón de login encontrado")
            login_button.click()
            print("🔄 Haciendo click en login...")
        else:
            print("❌ No se encontró botón de login")
            return
        
        # Esperar y verificar si el login fue exitoso
        time.sleep(3)
        
        print(f"📄 URL actual: {driver.current_url}")
        
        # Verificar si hay mensaje de error
        error_messages = driver.find_elements(By.CLASS_NAME, "error")
        if error_messages:
            print(f"❌ Error de login: {error_messages[0].text}")
        else:
            print("✅ Login exitoso!")
            
            # Explorar la página después del login
            print("🔍 Explorando página después del login...")
            
            # Buscar enlaces y menús
            links = driver.find_elements(By.TAG_NAME, "a")
            print(f"🔗 Encontrados {len(links)} enlaces:")
            
            for i, link in enumerate(links[:10]):  # Solo primeros 10
                href = link.get_attribute('href')
                text = link.text.strip()
                if text:
                    print(f"  {i+1}. {text} -> {href}")
            
            # Buscar tablas
            tables = driver.find_elements(By.TAG_NAME, "table")
            print(f"📊 Encontradas {len(tables)} tablas")
            
            # Buscar elementos con clase que contenga 'stock'
            stock_elements = driver.find_elements(By.CSS_SELECTOR, "*[class*='stock']")
            print(f"📦 Encontrados {len(stock_elements)} elementos con 'stock' en la clase")
            
            # Buscar elementos con clase que contenga 'vehiculo'
            vehiculo_elements = driver.find_elements(By.CSS_SELECTOR, "*[class*='vehiculo']")
            print(f"🚗 Encontrados {len(vehiculo_elements)} elementos con 'vehiculo' en la clase")
            
            # Buscar elementos con clase que contenga 'inventario'
            inventario_elements = driver.find_elements(By.CSS_SELECTOR, "*[class*='inventario']")
            print(f"📋 Encontrados {len(inventario_elements)} elementos con 'inventario' en la clase")
            
            # Pausa para que puedas ver la página
            print("⏸️ Pausa de 15 segundos para que veas la página...")
            time.sleep(15)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        
    finally:
        print("🔚 Cerrando navegador...")
        driver.quit()

if __name__ == "__main__":
    probar_login() 