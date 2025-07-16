#!/usr/bin/env python3
"""
Script para generar el ejecutable del scraper de BMW
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Instalar dependencias necesarias"""
    print("📦 Instalando dependencias...")
    
    requirements = [
        "selenium>=4.0.0",
        "pyinstaller>=5.0.0",
        "pillow>=9.0.0"  # Para convertir iconos
    ]
    
    for req in requirements:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", req])
            print(f"✅ {req} instalado")
        except subprocess.CalledProcessError:
            print(f"❌ Error instalando {req}")
            return False
    
    return True

def convert_icon():
    """Convertir el icono PNG a ICO"""
    print("🔄 Convirtiendo icono...")
    
    try:
        from PIL import Image
        
        png_path = "../public/images/cvo-logo.png"
        ico_path = "cvo-logo.ico"
        
        # Verificar que existe el archivo PNG
        if not os.path.exists(png_path):
            print(f"❌ No se encuentra el archivo: {png_path}")
            return False
        
        # Abrir imagen PNG
        img = Image.open(png_path)
        
        # Convertir a RGBA si no lo está
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Crear diferentes tamaños para el icono
        sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        img.save(ico_path, format='ICO', sizes=sizes)
        
        print(f"✅ Icono convertido: {ico_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error convirtiendo icono: {e}")
        return False

def build_executable():
    """Generar el ejecutable"""
    print("🔨 Generando ejecutable del scraper...")
    
    # Comando PyInstaller
    cmd = [
        "pyinstaller",
        "--onefile",  # Un solo archivo
        "--console",  # Con consola para ver logs
        "--name=BMW_Scraper",  # Nombre del ejecutable
        "--icon=cvo-logo.ico",  # Icono de CVO
        "--add-data=chromedriver.exe;.",  # Incluir chromedriver
        "--add-data=descargas;descargas",  # Incluir carpeta de descargas
        "descarga_excel_bmw.py"
    ]
    
    try:
        subprocess.check_call(cmd)
        print("✅ Ejecutable del scraper generado correctamente")
        print("📁 El archivo está en: dist/BMW_Scraper.exe")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error generando ejecutable: {e}")
        return False

def main():
    print("🚀 Iniciando generación del ejecutable del scraper...")
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists("descarga_excel_bmw.py"):
        print("❌ Error: No se encuentra descarga_excel_bmw.py")
        print("💡 Asegúrate de estar en el directorio scripts/")
        return
    
    if not os.path.exists("chromedriver.exe"):
        print("❌ Error: No se encuentra chromedriver.exe")
        print("💡 Asegúrate de que chromedriver.exe esté en el directorio scripts/")
        return
    
    # Instalar dependencias
    if not install_requirements():
        print("❌ Error instalando dependencias")
        return
    
    # Convertir icono
    if not convert_icon():
        print("❌ Error convirtiendo icono")
        return
    
    # Generar ejecutable
    if not build_executable():
        print("❌ Error generando ejecutable")
        return
    
    print("\n🎉 ¡Ejecutable del scraper generado con éxito!")
    print("📋 Instrucciones:")
    print("1. El archivo está en: dist/BMW_Scraper.exe")
    print("2. Copia el archivo a cualquier máquina Windows")
    print("3. Haz doble clic para ejecutar")
    print("4. El scraper abrirá Chrome y descargará automáticamente el Excel")
    print("5. Los archivos se guardarán en la carpeta 'descargas'")

if __name__ == "__main__":
    main() 