#!/usr/bin/env python3
"""
Script simple para importar CSV directamente a la tabla duc_scraper
"""

import pandas as pd
import os
from supabase import create_client, Client
from datetime import datetime
import sys

# Configuración de Supabase
SUPABASE_URL = "https://your-project.supabase.co"  # Cambiar por tu URL
SUPABASE_KEY = "your-anon-key"  # Cambiar por tu key

def connect_to_supabase():
    """Conectar a Supabase"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return supabase
    except Exception as e:
        print(f"❌ Error conectando a Supabase: {e}")
        return None

def import_csv_to_duc_scraper(csv_file_path):
    """Importar CSV a la tabla duc_scraper"""
    
    print(f"🚀 Iniciando importación de: {csv_file_path}")
    
    # Conectar a Supabase
    supabase = connect_to_supabase()
    if not supabase:
        return False
    
    try:
        # Leer CSV
        print("📖 Leyendo archivo CSV...")
        df = pd.read_csv(csv_file_path, delimiter=';', encoding='utf-8')
        
        print(f"✅ CSV leído: {len(df)} filas, {len(df.columns)} columnas")
        print(f"📋 Columnas encontradas: {list(df.columns)}")
        
        # Limpiar datos
        print("🧹 Limpiando datos...")
        df = df.fillna('')  # Reemplazar NaN con strings vacíos
        
        # Agregar metadatos
        df['file_name'] = os.path.basename(csv_file_path)
        df['import_date'] = datetime.now().isoformat()
        
        # Convertir DataFrame a lista de diccionarios
        records = df.to_dict('records')
        
        print(f"📊 Preparados {len(records)} registros para importar")
        
        # Importar en lotes de 100
        batch_size = 100
        total_imported = 0
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            
            print(f"📦 Importando lote {i//batch_size + 1} ({len(batch)} registros)...")
            
            # Insertar en Supabase
            result = supabase.table('duc_scraper').insert(batch).execute()
            
            if hasattr(result, 'data'):
                total_imported += len(result.data)
                print(f"✅ Lote importado: {len(result.data)} registros")
            else:
                print(f"❌ Error en lote: {result}")
                return False
        
        print(f"🎉 Importación completada: {total_imported} registros importados")
        return True
        
    except Exception as e:
        print(f"❌ Error durante la importación: {e}")
        return False

def main():
    """Función principal"""
    
    # Buscar archivos CSV en la carpeta descargas
    descargas_dir = "descargas"
    
    if not os.path.exists(descargas_dir):
        print(f"❌ No se encuentra la carpeta: {descargas_dir}")
        return
    
    # Listar archivos CSV
    csv_files = [f for f in os.listdir(descargas_dir) if f.endswith('.csv')]
    
    if not csv_files:
        print("❌ No se encontraron archivos CSV en la carpeta descargas")
        return
    
    print("📁 Archivos CSV encontrados:")
    for i, file in enumerate(csv_files, 1):
        print(f"  {i}. {file}")
    
    # Si hay múltiples archivos, preguntar cuál usar
    if len(csv_files) > 1:
        try:
            choice = input(f"\n¿Qué archivo quieres importar? (1-{len(csv_files)}): ")
            choice_idx = int(choice) - 1
            if 0 <= choice_idx < len(csv_files):
                selected_file = csv_files[choice_idx]
            else:
                print("❌ Opción inválida")
                return
        except ValueError:
            print("❌ Opción inválida")
            return
    else:
        selected_file = csv_files[0]
    
    # Ruta completa del archivo
    csv_path = os.path.join(descargas_dir, selected_file)
    
    print(f"\n🎯 Archivo seleccionado: {selected_file}")
    
    # Confirmar importación
    confirm = input("¿Continuar con la importación? (s/n): ")
    if confirm.lower() != 's':
        print("❌ Importación cancelada")
        return
    
    # Importar
    success = import_csv_to_duc_scraper(csv_path)
    
    if success:
        print("\n✅ ¡Importación exitosa!")
        print("📊 Los datos están ahora en la tabla 'duc_scraper'")
    else:
        print("\n❌ Error en la importación")

if __name__ == "__main__":
    main() 