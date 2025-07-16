#!/usr/bin/env python3
"""
Script para compilar el CVO Scraper GUI como ejecutable
"""

import os
import sys
import subprocess
import shutil

def build_exe():
    """Compilar el exe con PyInstaller"""
    
    print("🔨 Compilando CVO Scraper GUI...")
    
    # Verificar que PyInstaller esté instalado
    try:
        import PyInstaller
        print("✅ PyInstaller encontrado")
    except ImportError:
        print("❌ PyInstaller no encontrado. Instalando...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"])
    
    # Verificar que las dependencias estén instaladas
    dependencies = [
        "selenium",
        "requests",
        "tkinter"
    ]
    
    for dep in dependencies:
        try:
            __import__(dep)
            print(f"✅ {dep} encontrado")
        except ImportError:
            print(f"❌ {dep} no encontrado. Instalando...")
            subprocess.run([sys.executable, "-m", "pip", "install", dep])
    
    # Configuración de PyInstaller
    pyinstaller_cmd = [
        "pyinstaller",
        "--onefile",  # Un solo archivo exe
        "--windowed",  # Sin consola
        "--name=CVO_Scraper",  # Nombre del exe
        "--icon=cvo-logo.ico",  # Icono
        "--add-data=cvo-logo.ico;.",  # Incluir logo
        "--hidden-import=tkinter",
        "--hidden-import=selenium",
        "--hidden-import=requests",
        "--hidden-import=urllib",
        "--hidden-import=zipfile",
        "--hidden-import=tempfile",
        "--hidden-import=threading",
        "--hidden-import=subprocess",
        "--hidden-import=json",
        "--hidden-import=datetime",
        "--hidden-import=time",
        "--hidden-import=os",
        "--hidden-import=sys",
        "cvo_scraper_gui.py"
    ]
    
    # Ejecutar PyInstaller
    print("🚀 Ejecutando PyInstaller...")
    result = subprocess.run(pyinstaller_cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Compilación exitosa!")
        
        # Mover el exe al directorio actual
        exe_path = "dist/CVO_Scraper.exe"
        if os.path.exists(exe_path):
            shutil.move(exe_path, "./CVO_Scraper.exe")
            print("✅ CVO_Scraper.exe creado en el directorio actual")
            
            # Limpiar archivos temporales
            if os.path.exists("build"):
                shutil.rmtree("build")
            if os.path.exists("dist"):
                shutil.rmtree("dist")
            if os.path.exists("CVO_Scraper.spec"):
                os.remove("CVO_Scraper.spec")
            
            print("🧹 Archivos temporales limpiados")
            print("\n🎉 ¡CVO Scraper compilado exitosamente!")
            print("📁 Archivo: CVO_Scraper.exe")
            print("🚀 Listo para usar")
            
        else:
            print("❌ Error: No se encontró el exe compilado")
    else:
        print("❌ Error durante la compilación:")
        print(result.stderr)

if __name__ == "__main__":
    build_exe() 