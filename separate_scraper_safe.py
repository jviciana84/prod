#!/usr/bin/env python3
"""
Script para separar completamente el scraper del proyecto web (Versión Segura)
"""

import os
import shutil
import glob
from pathlib import Path
import time

def create_scraper_folder():
    """Crear carpeta separada para el scraper"""
    scraper_dir = Path("../cvo_scraper_project")
    scraper_dir.mkdir(exist_ok=True)
    
    # Crear subcarpetas
    (scraper_dir / "scripts").mkdir(exist_ok=True)
    (scraper_dir / "executables").mkdir(exist_ok=True)
    (scraper_dir / "csv_files").mkdir(exist_ok=True)
    (scraper_dir / "build_files").mkdir(exist_ok=True)
    (scraper_dir / "docs").mkdir(exist_ok=True)
    
    return scraper_dir

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
                time.sleep(1)
            else:
                print(f"   ❌ No se pudo mover: {src} -> {e}")
                return False
    return False

def move_scraper_files(scraper_dir):
    """Mover todos los archivos relacionados con scraper"""
    print("📦 Moviendo archivos del scraper...")
    
    # Archivos Python del scraper
    scraper_python_files = [
        "scripts/cvo_scraper_gui.py",
        "scripts/cvo_scraper_gui_updated.py",
        "scripts/build_cvo_scraper_exe.py",
        "scripts/build_scraper_exe.py",
        "scripts/build_updated_scraper.py",
        "scripts/build_exe.py",
        "scripts/convert_icon.py",
        "scripts/excel_analyzer_gui.py",
        "scripts/descarga_excel_bmw.py",
        "scripts/explorar_contenido_bmw.py",
        "scripts/explorar_filtros_bmw.py",
        "scripts/explorar_visual_bmw.py",
        "scripts/extraer_stock_bmw.py",
        "scripts/test_bmw_simple.py",
        "scripts/import_csv_simple.py",
        "scripts/import_csv_to_duc_scraper.py",
        "scripts/analyze_excel_columns.py"
    ]
    
    for file_path in scraper_python_files:
        if os.path.exists(file_path):
            dest = scraper_dir / "scripts" / os.path.basename(file_path)
            if safe_move_file(file_path, dest):
                print(f"   ✅ Movido: {file_path} -> {dest}")
    
    # Archivos de configuración del scraper
    scraper_config_files = [
        "scripts/requirements.txt",
        "scripts/requirements_gui.txt",
        "scripts/cvo-logo.ico",
        "scripts/INSTRUCCIONES_EJECUTABLE.md",
        "scripts/README_ExcelAnalyzer.md"
    ]
    
    for file_path in scraper_config_files:
        if os.path.exists(file_path):
            dest = scraper_dir / "scripts" / os.path.basename(file_path)
            if safe_move_file(file_path, dest):
                print(f"   ✅ Movido: {file_path} -> {dest}")
    
    # Archivos .spec de PyInstaller
    spec_files = glob.glob("scripts/*.spec")
    for file_path in spec_files:
        dest = scraper_dir / "build_files" / os.path.basename(file_path)
        if safe_move_file(file_path, dest):
            print(f"   ✅ Movido: {file_path} -> {dest}")
    
    # Ejecutables
    executable_files = [
        "scripts/CVO_Scraper.exe",
        "scripts/BMW_Scraper.exe",
        "scripts/chromedriver.exe"
    ]
    
    for file_path in executable_files:
        if os.path.exists(file_path):
            dest = scraper_dir / "executables" / os.path.basename(file_path)
            if safe_move_file(file_path, dest):
                print(f"   ✅ Movido: {file_path} -> {dest}")

def move_csv_files(scraper_dir):
    """Mover archivos CSV"""
    print("📊 Moviendo archivos CSV...")
    
    # Mover archivos CSV individuales primero
    if os.path.exists("scripts/descargas"):
        csv_files = glob.glob("scripts/descargas/*.csv")
        for file_path in csv_files:
            dest = scraper_dir / "csv_files" / os.path.basename(file_path)
            if safe_move_file(file_path, dest):
                print(f"   ✅ Movido: {file_path} -> {dest}")
        
        # Intentar eliminar la carpeta vacía
        try:
            if os.path.exists("scripts/descargas"):
                os.rmdir("scripts/descargas")
                print("   🗑️ Carpeta descargas eliminada")
        except OSError:
            print("   ⚠️  No se pudo eliminar carpeta descargas (puede tener archivos)")
    
    # Mover archivos CSV sueltos
    csv_files = glob.glob("*.csv")
    for file_path in csv_files:
        dest = scraper_dir / "csv_files" / os.path.basename(file_path)
        if safe_move_file(file_path, dest):
            print(f"   ✅ Movido: {file_path} -> {dest}")

def move_documentation(scraper_dir):
    """Mover documentación del scraper"""
    print("📚 Moviendo documentación...")
    
    docs_files = [
        "GITHUB_CLEANUP_INSTRUCTIONS.md",
        "api_env_config.txt",
        "vercel_env_setup.md",
        "cleanup_for_github.py",
        "cleanup_for_github_safe.py",
        "final_cleanup.py",
        "separate_scraper.py"
    ]
    
    for file_path in docs_files:
        if os.path.exists(file_path):
            dest = scraper_dir / "docs" / os.path.basename(file_path)
            if safe_move_file(file_path, dest):
                print(f"   ✅ Movido: {file_path} -> {dest}")

def create_scraper_readme(scraper_dir):
    """Crear README para el proyecto del scraper"""
    readme_content = """# CVO Scraper Project

## 📋 Descripción
Proyecto separado para el scraper de BMW que descarga datos CSV y los envía a la API de CVO.

## 🏗️ Estructura del Proyecto
```
cvo_scraper_project/
├── scripts/           # Código Python del scraper
├── executables/       # Ejecutables compilados
├── csv_files/         # Archivos CSV descargados
├── build_files/       # Archivos de compilación
└── docs/             # Documentación
```

## 🚀 Configuración

### Variables de Entorno
```env
# API Configuration
API_URL=https://controlvo.ovh/api/import-csv
API_KEY=cvo-scraper-2024
```

### Instalación
```bash
pip install -r scripts/requirements.txt
```

## 🔨 Compilación

### Compilar Ejecutable
```bash
cd scripts
python build_updated_scraper.py
```

### Ejecutar Scraper
```bash
python scripts/cvo_scraper_gui_updated.py
```

## 📊 Funcionalidades

- 🌐 **Scraping automático** de BMW
- 📥 **Descarga de CSV** automática
- 📤 **Envío a API** de CVO
- 🖥️ **Interfaz gráfica** moderna
- 📝 **Logs en tiempo real**
- 🔄 **Ejecución automática**

## 🔗 Conexión con API

El scraper se conecta automáticamente con:
- **URL**: https://controlvo.ovh/api/import-csv
- **Método**: POST
- **Autenticación**: API Key

## 📁 Archivos Importantes

- `scripts/cvo_scraper_gui_updated.py` - Scraper principal
- `scripts/build_updated_scraper.py` - Script de compilación
- `executables/` - Ejecutables compilados
- `csv_files/` - Datos descargados

## 🎯 Uso

1. **Configurar variables** de entorno
2. **Ejecutar scraper** (Python o ejecutable)
3. **Verificar logs** en la interfaz
4. **Datos enviados** automáticamente a la API

## 📞 Soporte

Para problemas o consultas sobre el scraper, revisar la documentación en `docs/`.
"""
    
    with open(scraper_dir / "README.md", "w", encoding="utf-8") as f:
        f.write(readme_content)
    
    print("   ✅ README.md creado")

def update_gitignore():
    """Actualizar .gitignore para excluir archivos del scraper"""
    print("📝 Actualizando .gitignore...")
    
    gitignore_content = """
# Scraper files (moved to separate project)
scripts/cvo_scraper_gui*
scripts/build_*_scraper*
scripts/build_exe.py
scripts/convert_icon.py
scripts/excel_analyzer_gui.py
scripts/descarga_excel_bmw.py
scripts/explorar_*
scripts/extraer_stock_bmw.py
scripts/test_bmw_simple.py
scripts/import_csv_*
scripts/analyze_excel_columns.py
scripts/*.spec
scripts/CVO_Scraper*
scripts/BMW_Scraper*
scripts/chromedriver*
scripts/cvo-logo.ico
scripts/requirements*
scripts/INSTRUCCIONES_EJECUTABLE.md
scripts/README_ExcelAnalyzer.md
scripts/descargas/
scripts/dist/
scripts/build/

# Build files
.next/
out/
dist/
build/

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

# CSV files
*.csv

# Backup files
backup_*
*.backup
"""
    
    with open(".gitignore", "w", encoding="utf-8") as f:
        f.write(gitignore_content.strip())
    
    print("   ✅ .gitignore actualizado")

def main():
    print("🔀 Separando scraper del proyecto web (Versión Segura)...")
    print("=" * 50)
    
    # Crear carpeta del scraper
    scraper_dir = create_scraper_folder()
    print(f"📁 Carpeta del scraper creada: {scraper_dir}")
    
    # Mover archivos del scraper
    move_scraper_files(scraper_dir)
    move_csv_files(scraper_dir)
    move_documentation(scraper_dir)
    
    # Crear README para el scraper
    create_scraper_readme(scraper_dir)
    
    # Actualizar .gitignore
    update_gitignore()
    
    print("\n" + "=" * 50)
    print("✅ ¡Scraper separado exitosamente!")
    print(f"📁 Proyecto del scraper: {scraper_dir}")
    print("\n📋 Próximos pasos:")
    print("   1. git add .")
    print("   2. git commit -m 'Remove scraper files - moved to separate project'")
    print("   3. git push")
    print("\n🎯 El proyecto web ahora está limpio y solo contiene:")
    print("   - Aplicación Next.js")
    print("   - API de importación CSV")
    print("   - Base de datos Supabase")
    print("   - Documentación web")
    print("\n📦 El scraper está en su propio proyecto:")
    print(f"   - {scraper_dir}")
    print("   - Completamente independiente")
    print("   - Con su propia documentación")

if __name__ == "__main__":
    main()
    input("\nPresiona Enter para salir...") 