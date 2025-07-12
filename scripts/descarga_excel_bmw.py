from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.options import Options
import time
import os
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Configuración de la carpeta de descargas
DOWNLOAD_DIR = os.path.abspath("descargas")

chrome_options = Options()
chrome_options.add_experimental_option("prefs", {
    "download.default_directory": DOWNLOAD_DIR,
    "download.prompt_for_download": False,
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True
})


def descargar_excel_bmw():
    print(f"🚗 Descargando Excel de stock BMW en: {DOWNLOAD_DIR}")
    driver = webdriver.Chrome(options=chrome_options)
    actions = ActionChains(driver)
    try:
        # 1. Login
        driver.get('https://gestionbmw.motorflash.com/login.php')
        driver.find_element(By.NAME, "usuario").send_keys("Jordivi01")
        driver.find_element(By.NAME, "password").send_keys("Jordivi02")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        print("✅ Login exitoso!")
        time.sleep(3)

        # DEPURACIÓN: Mostrar todos los botones
        print("🔍 Buscando todos los botones visibles en la página...")
        buttons = driver.find_elements(By.TAG_NAME, "input") + driver.find_elements(By.TAG_NAME, "button")
        for i, btn in enumerate(buttons):
            print(f"{i+1}. tag: {btn.tag_name}, type: {btn.get_attribute('type')}, value: {btn.get_attribute('value')}, text: '{btn.text}'")

        # 2. Scroll hasta el botón "Crear Excel"
        print("🔽 Haciendo scroll hasta 'Crear Excel'...")
        crear_excel_btn = driver.find_element(By.XPATH, "//input[@type='button' and @value='Crear excel']")
        driver.execute_script("arguments[0].scrollIntoView();", crear_excel_btn)
        time.sleep(2)
        actions = ActionChains(driver)
        actions.move_to_element(crear_excel_btn).click().perform()
        print("✅ Click en 'Crear Excel'")
        time.sleep(2)

        # 3. (Opcional) Marcar todas las opciones si no están marcadas
        # Aquí puedes añadir lógica para marcar checkboxes si es necesario

        # 4. Click en "Generar fichero"
        print("🔽 Buscando y haciendo click en 'Generar fichero'...")
        wait = WebDriverWait(driver, 30)  # Espera hasta 30 segundos
        generar_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@type='button' and @value='Generar fichero']")))
        driver.execute_script("arguments[0].scrollIntoView();", generar_btn)
        time.sleep(1)
        actions = ActionChains(driver)
        actions.move_to_element(generar_btn).click().perform()
        print("✅ Click en 'Generar fichero'")
        time.sleep(3)

        # 5. Scroll hasta el enlace "Descargar fichero"
        print("🔽 Buscando enlace 'Descargar fichero'...")
        wait = WebDriverWait(driver, 60)  # Espera hasta 60 segundos
        descargar_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Descargar fichero')]")))
        driver.execute_script("arguments[0].scrollIntoView();", descargar_link)
        time.sleep(1)
        descargar_link.click()
        print("✅ Click en 'Descargar fichero' (descarga iniciada)")

        # 6. Esperar a que el archivo se descargue
        print("⏳ Esperando a que se descargue el archivo...")
        time.sleep(10)  # Puedes aumentar si el archivo es grande
        print("✅ Descarga completada (revisa la carpeta 'descargas')")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    descargar_excel_bmw() 