#!/usr/bin/env python3
"""
Script para generar el ejecutable del analizador de Excel
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Instalar dependencias necesarias"""
    print("📦 Instalando dependencias...")
    
    requirements = [
        "pandas>=1.5.0",
        "openpyxl>=3.0.0",
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
    print("🔨 Generando ejecutable...")
    
    # Comando PyInstaller
    cmd = [
        "pyinstaller",
        "--onefile",  # Un solo archivo
        "--windowed",  # Sin consola
        "--name=Scraper",  # Nombre del ejecutable
        "--icon=cvo-logo.ico",  # Icono de CVO
        "--add-data=README_ExcelAnalyzer.md;.",  # Archivos adicionales
        "excel_analyzer_gui.py"
    ]
    
    try:
        subprocess.check_call(cmd)
        print("✅ Ejecutable generado correctamente")
        print("📁 El archivo está en: dist/Scraper.exe")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error generando ejecutable: {e}")
        return False

def main():
    print("🚀 Iniciando generación del ejecutable...")
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists("excel_analyzer_gui.py"):
        print("❌ Error: No se encuentra excel_analyzer_gui.py")
        print("💡 Asegúrate de estar en el directorio scripts/")
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
    
    print("\n🎉 ¡Ejecutable generado con éxito!")
    print("📋 Instrucciones:")
    print("1. El archivo está en: dist/Scraper.exe")
    print("2. Copia el archivo a cualquier máquina Windows")
    print("3. Haz doble clic para ejecutar")
    print("4. Selecciona tu archivo Excel y analiza las columnas")

if __name__ == "__main__":
    main() 