#!/usr/bin/env python3
"""
Script para analizar las columnas del Excel de BMW y crear la estructura de mapeo
"""

import csv
import sys
from pathlib import Path

def analyze_excel_columns(csv_file_path):
    """Analiza las columnas del archivo CSV de BMW"""
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            # Leer la primera línea para obtener los headers
            reader = csv.reader(file, delimiter=';')
            headers = next(reader)
            
            print("🔍 === ANÁLISIS DE COLUMNAS DEL EXCEL BMW ===\n")
            print(f"📊 Total de columnas encontradas: {len(headers)}\n")
            
            # Mostrar todas las columnas con su índice
            print("📋 COLUMNAS DISPONIBLES:")
            print("-" * 80)
            for i, header in enumerate(headers):
                print(f"{i:2d}. {header}")
            
            print("\n" + "=" * 80)
            
            # Categorizar columnas por tipo
            categorias = {
                "Identificación": [],
                "Información del Vehículo": [],
                "Precios": [],
                "Fechas": [],
                "Características Técnicas": [],
                "Ubicación/Origen": [],
                "Estado/Disponibilidad": [],
                "Fotos/URLs": [],
                "Otros": []
            }
            
            for i, header in enumerate(headers):
                header_lower = header.lower()
                
                if any(keyword in header_lower for keyword in ['id', 'anuncio', 'matrícula', 'chasis', 'referencia']):
                    categorias["Identificación"].append((i, header))
                elif any(keyword in header_lower for keyword in ['modelo', 'marca', 'color', 'carrocería', 'combustible', 'motor', 'versión']):
                    categorias["Información del Vehículo"].append((i, header))
                elif any(keyword in header_lower for keyword in ['precio', 'valor', 'cuota']):
                    categorias["Precios"].append((i, header))
                elif any(keyword in header_lower for keyword in ['fecha', 'días']):
                    categorias["Fechas"].append((i, header))
                elif any(keyword in header_lower for keyword in ['km', 'potencia', 'cilindrada', 'cambio', 'equipamiento']):
                    categorias["Características Técnicas"].append((i, header))
                elif any(keyword in header_lower for keyword in ['ubicación', 'origen', 'concesionario', 'tienda', 'país']):
                    categorias["Ubicación/Origen"].append((i, header))
                elif any(keyword in header_lower for keyword in ['estado', 'disponibilidad', 'destino']):
                    categorias["Estado/Disponibilidad"].append((i, header))
                elif any(keyword in header_lower for keyword in ['url', 'foto', 'imagen']):
                    categorias["Fotos/URLs"].append((i, header))
                else:
                    categorias["Otros"].append((i, header))
            
            # Mostrar categorías
            for categoria, columnas in categorias.items():
                if columnas:
                    print(f"\n📂 {categoria.upper()}:")
                    for idx, header in columnas:
                        print(f"   {idx:2d}. {header}")
            
            print("\n" + "=" * 80)
            
            # Generar sugerencias de mapeo para nuestra BD
            print("\n🎯 SUGERENCIAS DE MAPEO PARA NUESTRA BD:")
            print("-" * 80)
            
            mapeo_sugerido = {
                "license_plate": "Matrícula",
                "model": "Modelo", 
                "brand": "Marca",
                "chassis": "Chasis",
                "color": "Color Carrocería",
                "fuel_type": "Combustible",
                "transmission": "Cambio",
                "body_type": "Carrocería",
                "engine_power": "Potencia Cv",
                "mileage": "KM",
                "purchase_price": "Precio compra",
                "sale_price": "Precio",
                "purchase_date": "Fecha compra DMS",
                "manufacturing_date": "Fecha fabricación",
                "first_registration_date": "Fecha primera matriculación",
                "origin_location": "Concesionario",
                "equipment": "Equipamiento de serie",
                "extras": "Extras",
                "state": "Estado",
                "availability": "Disponibilidad",
                "certificate": "Certificado",
                "warranty": "Garantía",
                "accident_free": "Libre de siniestros",
                "currency": "Moneda",
                "internal_note": "Nota interna",
                "observations": "Observaciones",
                "origin": "Origen",
                "unified_origins": "Origenes unificados",
                "origin_country": "País origen",
                "supplier": "Proveedor",
                "internal_reference": "Referencia interna",
                "fiscal_regime": "Regimen fiscal",
                "store": "Tienda",
                "distribution_type": "Tipo de distribución",
                "engine_type": "Tipo motor",
                "store_location": "Ubicación tienda",
                "url": "URL",
                "photo_urls": ["URL foto 1", "URL foto 2", "URL foto 3", "URL foto 4", "URL foto 5"],
                "valid_for_certificate": "Válido para certificado",
                "existence_value": "Valor existencia",
                "imported_vehicle": "Vehículo importado",
                "version": "Versión"
            }
            
            for campo_bd, columna_excel in mapeo_sugerido.items():
                if isinstance(columna_excel, list):
                    # Para campos múltiples como fotos
                    indices = []
                    for col in columna_excel:
                        try:
                            idx = headers.index(col)
                            indices.append(f"{idx}:{col}")
                        except ValueError:
                            pass
                    if indices:
                        print(f"   {campo_bd:25} → {', '.join(indices)}")
                else:
                    try:
                        idx = headers.index(columna_excel)
                        print(f"   {campo_bd:25} → {idx:2d}:{columna_excel}")
                    except ValueError:
                        print(f"   {campo_bd:25} → ❌ No encontrada: {columna_excel}")
            
            return headers
            
    except FileNotFoundError:
        print(f"❌ Error: No se encontró el archivo {csv_file_path}")
        return None
    except Exception as e:
        print(f"❌ Error al analizar el archivo: {e}")
        return None

if __name__ == "__main__":
    # Buscar archivos CSV en la carpeta de descargas
    descargas_path = Path("scripts/descargas")
    csv_files = list(descargas_path.glob("*.csv"))
    
    if not csv_files:
        print("❌ No se encontraron archivos CSV en scripts/descargas/")
        sys.exit(1)
    
    # Usar el archivo más reciente
    latest_file = max(csv_files, key=lambda x: x.stat().st_mtime)
    print(f"📁 Analizando archivo: {latest_file.name}")
    
    headers = analyze_excel_columns(latest_file)
    
    if headers:
        print(f"\n✅ Análisis completado. Se encontraron {len(headers)} columnas.")
        print(f"💡 Usa esta información para crear la estructura de mapeo en la BD.") 