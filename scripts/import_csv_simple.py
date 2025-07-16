#!/usr/bin/env python3
"""
Script simple para importar CSV a duc_scraper
"""

import pandas as pd
import os
from supabase import create_client
from datetime import datetime

# Configuración - CAMBIAR ESTOS VALORES
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-anon-key"

def import_csv():
    # Conectar a Supabase
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Leer CSV
    csv_file = "stock_551_0_2025_07_16_21_02_02.csv"
    df = pd.read_csv(csv_file, delimiter=';', encoding='utf-8')
    
    print(f"📊 CSV leído: {len(df)} filas")
    
    # Limpiar datos
    df = df.fillna('')
    
    # Agregar metadatos
    df['file_name'] = csv_file
    df['import_date'] = datetime.now().isoformat()
    
    # Convertir a diccionarios
    records = df.to_dict('records')
    
    # Insertar en lotes de 50
    batch_size = 50
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        print(f"📦 Insertando lote {i//batch_size + 1}...")
        
        result = supabase.table('duc_scraper').insert(batch).execute()
        print(f"✅ Insertados {len(batch)} registros")
    
    print("🎉 Importación completada")

if __name__ == "__main__":
    import_csv() 