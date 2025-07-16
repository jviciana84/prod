#!/usr/bin/env python3
"""
Script para restaurar archivos desde backup
Ejecutar desde la raíz del proyecto
"""

import os
import shutil
from pathlib import Path

def restore_files():
    backup_dir = Path("..\cursor_backup_files")
    
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
                print(f"   ✅ Restaurado: {file_path.name}")
    
    # Restaurar CSV si es necesario
    csv_dir = backup_dir / "csv_files"
    if csv_dir.exists():
        for file_path in csv_dir.iterdir():
            if file_path.is_file():
                dest = Path("scripts/descargas") / file_path.name
                dest.parent.mkdir(exist_ok=True)
                shutil.copy2(file_path, dest)
                print(f"   ✅ Restaurado: {file_path.name}")
    
    print("✅ Restauración completada")

if __name__ == "__main__":
    restore_files()
