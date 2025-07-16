#!/usr/bin/env python3
"""
Script para compilar el CVO Scraper actualizado con la API configurada
"""

import os
import sys
import subprocess
import shutil

def check_pyinstaller():
    """Verificar si PyInstaller está instalado"""
    try:
        subprocess.run([sys.executable, '-m', 'PyInstaller', '--version'], 
                      capture_output=True, check=True)
        print("✅ PyInstaller encontrado")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ PyInstaller no encontrado")
        return False

def install_pyinstaller():
    """Instalar PyInstaller si no está disponible"""
    print("📦 Instalando PyInstaller...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'pyinstaller'], 
                      check=True)
        print("✅ PyInstaller instalado correctamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando PyInstaller: {e}")
        return False

def build_executable():
    """Compilar el ejecutable"""
    print("🔨 Compilando CVO Scraper actualizado...")
    
    # Configuración de PyInstaller
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        '--onefile',  # Un solo archivo ejecutable
        '--windowed',  # Sin consola (GUI)
        '--icon=cvo-logo.ico',  # Icono personalizado
        '--name=CVO_Scraper_Updated',  # Nombre del ejecutable
        '--add-data=cvo-logo.ico;.',  # Incluir icono
        '--hidden-import=tkinter',
        '--hidden-import=selenium',
        '--hidden-import=requests',
        '--hidden-import=urllib',
        '--hidden-import=zipfile',
        '--hidden-import=tempfile',
        '--hidden-import=threading',
        '--hidden-import=json',
        '--hidden-import=datetime',
        '--hidden-import=time',
        '--hidden-import=subprocess',
        '--hidden-import=os',
        '--hidden-import=sys',
        'cvo_scraper_gui_updated.py'  # Archivo principal
    ]
    
    try:
        # Ejecutar PyInstaller
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("✅ Compilación completada exitosamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error durante la compilación: {e}")
        print(f"Error output: {e.stderr}")
        return False

def cleanup():
    """Limpiar archivos temporales"""
    print("🧹 Limpiando archivos temporales...")
    
    # Archivos y carpetas a eliminar
    cleanup_items = [
        'build',
        'CVO_Scraper_Updated.spec'
    ]
    
    for item in cleanup_items:
        if os.path.exists(item):
            if os.path.isdir(item):
                shutil.rmtree(item)
            else:
                os.remove(item)
            print(f"🗑️ Eliminado: {item}")

def main():
    print("🚀 Iniciando compilación del CVO Scraper actualizado...")
    print("=" * 50)
    
    # Verificar PyInstaller
    if not check_pyinstaller():
        if not install_pyinstaller():
            print("❌ No se pudo instalar PyInstaller. Abortando.")
            return False
    
    # Verificar archivos necesarios
    required_files = ['cvo_scraper_gui_updated.py', 'cvo-logo.ico']
    for file in required_files:
        if not os.path.exists(file):
            print(f"❌ Archivo requerido no encontrado: {file}")
            return False
        print(f"✅ Archivo encontrado: {file}")
    
    print("\n📋 Configuración del ejecutable:")
    print("   - API URL: https://controlvo.ovh/api/import-csv")
    print("   - API Key: cvo-scraper-2024")
    print("   - ChromeDriver: Descarga automática")
    print("   - Interfaz: GUI moderna con logo CVO")
    
    # Compilar
    if build_executable():
        print("\n✅ ¡Compilación exitosa!")
        print("📁 Ejecutable creado: dist/CVO_Scraper_Updated.exe")
        print("\n🎯 Características del ejecutable:")
        print("   - Conecta automáticamente con la API de producción")
        print("   - Descarga ChromeDriver automáticamente")
        print("   - Interfaz gráfica moderna")
        print("   - Logs en tiempo real")
        print("   - Ejecución automática al iniciar")
        
        # Limpiar archivos temporales
        cleanup()
        
        return True
    else:
        print("\n❌ Error durante la compilación")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 ¡Proceso completado exitosamente!")
    else:
        print("\n💥 Proceso falló")
    
    input("\nPresiona Enter para salir...") 