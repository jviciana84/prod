#!/usr/bin/env python3
"""
Script para limpiar el proyecto y prepararlo para GitHub
Mueve archivos pesados fuera del repositorio
"""

import os
import shutil
import glob
from pathlib import Path

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

def move_executables(backup_dir):
    """Mover ejecutables pesados"""
    print("📦 Moviendo ejecutables...")
    
    executables = [
        "scripts/CVO_Scraper.exe",
        "scripts/BMW_Scraper.exe",
        "scripts/chromedriver.exe",
        "scripts/dist/",
        "scripts/build/",
        "scripts/*.spec"
    ]
    
    for pattern in executables:
        for file_path in glob.glob(pattern):
            if os.path.exists(file_path):
                if os.path.isdir(file_path):
                    dest = backup_dir / "executables" / os.path.basename(file_path)
                    shutil.move(file_path, dest)
                    print(f"   📁 Movido: {file_path} -> {dest}")
                else:
                    dest = backup_dir / "executables" / os.path.basename(file_path)
                    shutil.move(file_path, dest)
                    print(f"   📄 Movido: {file_path} -> {dest}")

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
                shutil.move(file_path, dest)
                print(f"   📄 Movido: {file_path} -> {dest}")

def backup_node_modules():
    """Hacer backup de node_modules si es necesario"""
    print("📦 Backup de node_modules...")
    
    if os.path.exists("node_modules"):
        backup_dir = Path("../cursor_backup_files/node_modules_backup")
        backup_dir.mkdir(exist_ok=True)
        
        # Solo hacer backup si no existe ya
        if not (backup_dir / "node_modules").exists():
            print("   ⚠️  node_modules es muy pesado, considerando eliminarlo...")
            print("   💡 Puedes reinstalarlo con: npm install")
        else:
            print("   ✅ Backup de node_modules ya existe")

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
                if os.path.isdir(file_path):
                    shutil.rmtree(file_path)
                    print(f"   🗑️ Eliminado: {file_path}")
                else:
                    os.remove(file_path)
                    print(f"   🗑️ Eliminado: {file_path}")

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
    print("🧹 Limpiando proyecto para GitHub...")
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

if __name__ == "__main__":
    main()
    input("\nPresiona Enter para salir...") 