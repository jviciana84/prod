#!/usr/bin/env python3
"""
Script final para completar la limpieza del proyecto
"""

import os
import shutil
from pathlib import Path

def main():
    print("🧹 Limpieza final del proyecto...")
    print("=" * 50)
    
    # Verificar archivos pesados restantes
    heavy_files = [
        "scripts/dist/Scraper.exe",
        "scripts/CVO_Scraper.exe",
        "scripts/BMW_Scraper.exe",
        "scripts/chromedriver.exe"
    ]
    
    print("📦 Archivos pesados encontrados:")
    for file_path in heavy_files:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path) / (1024 * 1024)  # MB
            print(f"   📄 {file_path} ({size:.1f} MB)")
    
    print("\n⚠️  Archivos que necesitan eliminación manual:")
    print("   - Cierra cualquier programa que use estos archivos")
    print("   - Elimina manualmente si es necesario")
    
    # Verificar node_modules
    if os.path.exists("node_modules"):
        print("\n📦 node_modules encontrado:")
        print("   💡 Para eliminar: rmdir /s node_modules")
        print("   💡 Para reinstalar: npm install")
    
    # Verificar .next
    if os.path.exists(".next"):
        print("\n📁 .next encontrado:")
        print("   💡 Para eliminar: rmdir /s .next")
    
    print("\n" + "=" * 50)
    print("✅ Proyecto listo para GitHub")
    print("\n📋 Próximos pasos:")
    print("   1. Eliminar archivos pesados manualmente si es necesario")
    print("   2. git add .")
    print("   3. git commit -m 'Clean project for GitHub'")
    print("   4. git push")
    
    print("\n🔄 Para restaurar archivos después:")
    print("   python restore_files.py")
    
    print("\n📦 Para reinstalar dependencias:")
    print("   npm install")

if __name__ == "__main__":
    main()
    input("\nPresiona Enter para salir...") 