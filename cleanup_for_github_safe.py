#!/usr/bin/env python3
"""
Script para limpiar el proyecto y prepararlo para GitHub (Versión Segura)
Mueve archivos pesados fuera del repositorio
"""

import os
import shutil
import glob
from pathlib import Path
import time

def create_backup_folder():
    """Crear carpeta de backup para archivos pesados"""
    backup_dir = Path("../cursor_backup_files")
    backup_dir.mkdir(exist_ok=True)
    
    # Crear subcarpetas
    (backup_dir / "executables").mkdir(exist_ok=True)
    (backup_dir / "csv_files").mkdir(exist_ok=True)
    (backup_dir / "build_files").mkdir(exist_ok=True)
    (backup_dir / "node_modules_backup").mkdir(exist_ok=True)
    
    return backup_dir

def safe_move_file(src, dest, max_retries=3):
    """Mover archivo de forma segura con reintentos"""
    for attempt in range(max_retries):
        try:
            if os.path.exists(src):
                if os.path.isdir(src):
                    shutil.copytree(src, dest, dirs_exist_ok=True)
                    shutil.rmtree(src)
                else:
                    shutil.copy2(src, dest)
                    os.remove(src)
                return True
        except (PermissionError, OSError) as e:
            if attempt < max_retries - 1:
                print(f"   ⚠️  Intento {attempt + 1} falló: {e}")
                time.sleep(1)  # Esperar un poco antes de reintentar
            else:
                print(f"   ❌ No se pudo mover: {src} -> {e}")
                return False
    return False

def move_executables(backup_dir):
    """Mover ejecutables pesados"""
    print("📦 Moviendo ejecutables...")
    
    executables = [
        "scripts/CVO_Scraper.exe",
        "scripts/BMW_Scraper.exe",
        "scripts/chromedriver.exe",
        "scripts/*.spec"
    ]
    
    for pattern in executables:
        for file_path in glob.glob(pattern):
            if os.path.exists(file_path):
                dest = backup_dir / "executables" / os.path.basename(file_path)
                if safe_move_file(file_path, dest):
                    print(f"   ✅ Movido: {file_path} -> {dest}")
    
    # Manejar carpetas de build por separado
    build_dirs = ["scripts/dist", "scripts/build"]
    for dir_path in build_dirs:
        if os.path.exists(dir_path):
            try:
                # Intentar eliminar directamente
                shutil.rmtree(dir_path)
                print(f"   🗑️ Eliminado: {dir_path}")
            except PermissionError:
                print(f"   ⚠️  No se pudo eliminar: {dir_path} (en uso)")

def move_csv_files(backup_dir):
    """Mover archivos CSV pesados"""
    print("📊 Moviendo archivos CSV...")
    
    csv_patterns = [
        "scripts/descargas/*.csv",
        "*.csv"
    ]
    
    for pattern in csv_patterns:
        for file_path in glob.glob(pattern):
            if os.path.exists(file_path):
                dest = backup_dir / "csv_files" / os.path.basename(file_path)
                if safe_move_file(file_path, dest):
                    print(f"   ✅ Movido: {file_path} -> {dest}")

def backup_node_modules():
    """Hacer backup de node_modules si es necesario"""
    print("📦 Backup de node_modules...")
    
    if os.path.exists("node_modules"):
        print("   ⚠️  node_modules encontrado (muy pesado)")
        print("   💡 Considera eliminarlo manualmente: rmdir /s node_modules")
        print("   💡 Puedes reinstalarlo con: npm install")

def clean_build_files():
    """Limpiar archivos de build"""
    print("🧹 Limpiando archivos de build...")
    
    build_patterns = [
        ".next",
        "out",
        "dist",
        "build",
        "*.log",
        "*.tmp"
    ]
    
    for pattern in build_patterns:
        for file_path in glob.glob(pattern):
            if os.path.exists(file_path):
                try:
                    if os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                        print(f"   🗑️ Eliminado: {file_path}")
                    else:
                        os.remove(file_path)
                        print(f"   🗑️ Eliminado: {file_path}")
                except PermissionError:
                    print(f"   ⚠️  No se pudo eliminar: {file_path} (en uso)")

def update_gitignore():
    """Actualizar .gitignore para evitar archivos pesados"""
    print("📝 Actualizando .gitignore...")
    
    gitignore_content = """
# Archivos pesados y ejecutables
*.exe
*.msi
*.dmg
*.pkg
chromedriver*
CVO_Scraper*
BMW_Scraper*

# Archivos CSV grandes
*.csv
scripts/descargas/

# Build files
dist/
build/
.next/
out/

# Node modules (se reinstalan)
node_modules/

# Logs
*.log
*.tmp

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.spec

# Environment
.env.local
.env.production
.env.development

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Backup files
backup_*
*.backup
"""
    
    with open(".gitignore", "w", encoding="utf-8") as f:
        f.write(gitignore_content.strip())
    
    print("   ✅ .gitignore actualizado")

def create_restore_script(backup_dir):
    """Crear script para restaurar archivos si es necesario"""
    print("📜 Creando script de restauración...")
    
    restore_script = f'''#!/usr/bin/env python3
"""
Script para restaurar archivos desde backup
Ejecutar desde la raíz del proyecto
"""

import os
import shutil
from pathlib import Path

def restore_files():
    backup_dir = Path("{backup_dir}")
    
    if not backup_dir.exists():
        print("❌ Carpeta de backup no encontrada")
        return
    
    print("🔄 Restaurando archivos...")
    
    # Restaurar ejecutables
    executables_dir = backup_dir / "executables"
    if executables_dir.exists():
        for file_path in executables_dir.iterdir():
            if file_path.is_file():
                dest = Path("scripts") / file_path.name
                shutil.copy2(file_path, dest)
                print(f"   ✅ Restaurado: {{file_path.name}}")
    
    # Restaurar CSV si es necesario
    csv_dir = backup_dir / "csv_files"
    if csv_dir.exists():
        for file_path in csv_dir.iterdir():
            if file_path.is_file():
                dest = Path("scripts/descargas") / file_path.name
                dest.parent.mkdir(exist_ok=True)
                shutil.copy2(file_path, dest)
                print(f"   ✅ Restaurado: {{file_path.name}}")
    
    print("✅ Restauración completada")

if __name__ == "__main__":
    restore_files()
'''
    
    with open("restore_files.py", "w", encoding="utf-8") as f:
        f.write(restore_script)
    
    print("   ✅ Script de restauración creado: restore_files.py")

def main():
    print("🧹 Limpiando proyecto para GitHub (Versión Segura)...")
    print("=" * 50)
    
    # Crear carpeta de backup
    backup_dir = create_backup_folder()
    print(f"📁 Carpeta de backup creada: {backup_dir}")
    
    # Mover archivos pesados
    move_executables(backup_dir)
    move_csv_files(backup_dir)
    backup_node_modules()
    
    # Limpiar archivos de build
    clean_build_files()
    
    # Actualizar .gitignore
    update_gitignore()
    
    # Crear script de restauración
    create_restore_script(backup_dir)
    
    print("\n" + "=" * 50)
    print("✅ ¡Proyecto limpiado exitosamente!")
    print(f"📁 Archivos pesados movidos a: {backup_dir}")
    print("\n📋 Próximos pasos:")
    print("   1. git add .")
    print("   2. git commit -m 'Clean project for GitHub'")
    print("   3. git push")
    print("\n🔄 Para restaurar archivos:")
    print("   python restore_files.py")
    print("\n📦 Para reinstalar dependencias:")
    print("   npm install")
    print("\n⚠️  Si hay archivos que no se pudieron mover:")
    print("   - Cierra cualquier programa que los use")
    print("   - Elimínalos manualmente si es necesario")

if __name__ == "__main__":
    main()
    input("\nPresiona Enter para salir...") 