import tkinter as tk
from tkinter import ttk, scrolledtext
import threading
import subprocess
import sys
import os
import requests
import json
from datetime import datetime
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import urllib.request
import zipfile
import tempfile

class CVOScraperGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("CVO Scraper")
        self.root.geometry("800x600")
        self.root.resizable(True, True)
        
        # Configuración de la API (hardcodeada)
        self.api_url = "https://tu-dominio.com/api/import-csv"  # Cambiar por tu URL real
        self.api_key = "tu-api-key"  # Cambiar por tu API key real
        
        # Variables de control
        self.is_running = False
        self.chrome_driver_path = None
        
        self.setup_ui()
        self.check_chromedriver()
        
        # Iniciar scraping automáticamente después de 2 segundos
        self.root.after(2000, self.start_scraping_auto)
    
    def setup_ui(self):
        # Configurar estilo
        style = ttk.Style()
        style.theme_use('clam')
        
        # Frame principal
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configurar grid
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(2, weight=1)
        
        # Header con logo y configuración
        header_frame = ttk.Frame(main_frame)
        header_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        header_frame.columnconfigure(0, weight=1)
        
        # Logo CVO (usar imagen local o URL)
        try:
            # Intentar cargar logo local
            logo_path = "cvo-logo.ico"
            if os.path.exists(logo_path):
                logo_img = tk.PhotoImage(file=logo_path)
                logo_label = ttk.Label(header_frame, image=logo_img)
                logo_label.image = logo_img
                logo_label.grid(row=0, column=0, sticky=tk.W)
            else:
                # Logo de texto como fallback
                logo_label = ttk.Label(header_frame, text="CVO SCRAPER", font=("Arial", 16, "bold"))
                logo_label.grid(row=0, column=0, sticky=tk.W)
        except Exception as e:
            logo_label = ttk.Label(header_frame, text="CVO SCRAPER", font=("Arial", 16, "bold"))
            logo_label.grid(row=0, column=0, sticky=tk.W)
        
        # Botón de configuración (deshabilitado por ahora)
        config_btn = ttk.Button(header_frame, text="⚙️", width=3, command=self.show_config)
        config_btn.grid(row=0, column=1, sticky=tk.E, padx=(10, 0))
        
        # Título
        title_label = ttk.Label(main_frame, text="Scraper Automático BMW", font=("Arial", 14, "bold"))
        title_label.grid(row=1, column=0, columnspan=2, pady=(0, 10))
        
        # Consola de logs
        console_frame = ttk.LabelFrame(main_frame, text="Logs de Ejecución", padding="5")
        console_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        console_frame.columnconfigure(0, weight=1)
        console_frame.rowconfigure(0, weight=1)
        
        self.console = scrolledtext.ScrolledText(console_frame, height=20, width=80, bg='black', fg='white', font=('Consolas', 9))
        self.console.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Frame de botones
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=3, column=0, columnspan=2, pady=(0, 10))
        
        self.start_btn = ttk.Button(button_frame, text="Iniciar Scraping", command=self.start_scraping)
        self.start_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        self.stop_btn = ttk.Button(button_frame, text="Detener", command=self.stop_scraping, state='disabled')
        self.stop_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # Barra de progreso
        self.progress = ttk.Progressbar(main_frame, mode='indeterminate')
        self.progress.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # Status
        self.status_label = ttk.Label(main_frame, text="Listo para iniciar...", font=("Arial", 10))
        self.status_label.grid(row=5, column=0, columnspan=2)
    
    def log(self, message):
        """Añadir mensaje a la consola"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {message}\n"
        self.console.insert(tk.END, log_message)
        self.console.see(tk.END)
        self.root.update_idletasks()
    
    def check_chromedriver(self):
        """Verificar si ChromeDriver está instalado"""
        self.log("Verificando ChromeDriver...")
        
        # Buscar ChromeDriver en PATH
        try:
            result = subprocess.run(['chromedriver', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                self.chrome_driver_path = 'chromedriver'
                self.log("✅ ChromeDriver encontrado en PATH")
                return True
        except FileNotFoundError:
            pass
        
        # Buscar en directorio actual
        if os.path.exists('chromedriver.exe'):
            self.chrome_driver_path = './chromedriver.exe'
            self.log("✅ ChromeDriver encontrado en directorio actual")
            return True
        
        # Descargar ChromeDriver automáticamente
        self.log("❌ ChromeDriver no encontrado. Descargando automáticamente...")
        return self.download_chromedriver()
    
    def download_chromedriver(self):
        """Descargar ChromeDriver automáticamente"""
        try:
            self.log("Descargando ChromeDriver...")
            
            # URL del ChromeDriver (versión estable)
            chromedriver_url = "https://chromedriver.storage.googleapis.com/114.0.5735.90/chromedriver_win32.zip"
            
            # Descargar
            temp_dir = tempfile.gettempdir()
            zip_path = os.path.join(temp_dir, "chromedriver.zip")
            
            urllib.request.urlretrieve(chromedriver_url, zip_path)
            
            # Extraer
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Mover a directorio actual
            chromedriver_path = os.path.join(temp_dir, "chromedriver.exe")
            if os.path.exists(chromedriver_path):
                import shutil
                shutil.copy2(chromedriver_path, "./chromedriver.exe")
                self.chrome_driver_path = './chromedriver.exe'
                
                # Limpiar archivos temporales
                os.remove(zip_path)
                os.remove(chromedriver_path)
                
                self.log("✅ ChromeDriver descargado e instalado correctamente")
                return True
            
        except Exception as e:
            self.log(f"❌ Error descargando ChromeDriver: {str(e)}")
            return False
    
    def start_scraping_auto(self):
        """Iniciar scraping automáticamente"""
        self.log("🚀 Iniciando scraping automáticamente...")
        self.start_scraping()
    
    def start_scraping(self):
        """Iniciar proceso de scraping"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_btn.config(state='disabled')
        self.stop_btn.config(state='normal')
        self.progress.start()
        self.status_label.config(text="Ejecutando scraping...")
        
        # Ejecutar en hilo separado
        thread = threading.Thread(target=self.run_scraping)
        thread.daemon = True
        thread.start()
    
    def stop_scraping(self):
        """Detener scraping"""
        self.is_running = False
        self.start_btn.config(state='normal')
        self.stop_btn.config(state='disabled')
        self.progress.stop()
        self.status_label.config(text="Detenido")
        self.log("⏹️ Scraping detenido por el usuario")
    
    def run_scraping(self):
        """Ejecutar el scraping"""
        try:
            self.log("🔍 Iniciando proceso de scraping...")
            
            # Configurar Chrome
            chrome_options = Options()
            chrome_options.add_argument("--headless")  # Ejecutar sin interfaz
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            # Configurar servicio
            service = Service(self.chrome_driver_path)
            
            self.log("🌐 Iniciando navegador Chrome...")
            driver = webdriver.Chrome(service=service, options=chrome_options)
            
            try:
                # Aquí iría tu lógica de scraping actual
                self.log("📄 Navegando a la página de BMW...")
                driver.get("https://www.bmw.es/es/vehiculos/ocasion.html")
                
                # Simular proceso de scraping
                self.log("🔍 Buscando vehículos...")
                time.sleep(2)
                
                self.log("📥 Descargando datos...")
                time.sleep(3)
                
                # Simular descarga de CSV
                csv_data = self.simulate_csv_download()
                
                self.log("📤 Subiendo datos a la API...")
                success = self.upload_to_api(csv_data)
                
                if success:
                    self.log("✅ Proceso completado exitosamente")
                    self.status_label.config(text="Completado exitosamente")
                else:
                    self.log("❌ Error subiendo datos a la API")
                    self.status_label.config(text="Error en la subida")
                
            finally:
                driver.quit()
                self.log("🔒 Navegador cerrado")
            
        except Exception as e:
            self.log(f"❌ Error durante el scraping: {str(e)}")
            self.status_label.config(text="Error durante la ejecución")
        
        finally:
            self.is_running = False
            self.start_btn.config(state='normal')
            self.stop_btn.config(state='disabled')
            self.progress.stop()
    
    def simulate_csv_download(self):
        """Simular descarga de CSV (reemplazar con tu lógica real)"""
        self.log("📊 Generando datos CSV simulados...")
        time.sleep(2)
        
        # Simular datos CSV
        csv_data = {
            "ID Anuncio": "12345",
            "Anuncio": "BMW X3 2023",
            "Chasis": "WBA12345678901234",
            "Concesionario": "BMW Madrid",
            "Precio": "45000",
            "Marca": "BMW",
            "Modelo": "X3",
            "Disponibilidad": "Disponible"
        }
        
        self.log(f"📄 CSV generado con {len(csv_data)} campos")
        return csv_data
    
    def upload_to_api(self, csv_data):
        """Subir datos a la API"""
        try:
            self.log(f"🌐 Conectando con API: {self.api_url}")
            
            # Preparar datos para la API
            payload = {
                "csv_data": csv_data,
                "file_name": f"scraping_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                "api_key": self.api_key
            }
            
            # Enviar a la API
            response = requests.post(self.api_url, json=payload, timeout=30)
            
            if response.status_code == 200:
                self.log("✅ Datos subidos correctamente a la API")
                return True
            else:
                self.log(f"❌ Error en la API: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error conectando con la API: {str(e)}")
            return False
    
    def show_config(self):
        """Mostrar ventana de configuración (deshabilitada por ahora)"""
        self.log("⚙️ Configuración deshabilitada - API configurada automáticamente")

def main():
    root = tk.Tk()
    app = CVOScraperGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main() 