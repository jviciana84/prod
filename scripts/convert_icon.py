#!/usr/bin/env python3
"""
Script para convertir el icono PNG a formato ICO
"""

from PIL import Image
import os

def convert_png_to_ico():
    """Convertir el icono PNG a formato ICO"""
    png_path = "../public/images/cvo-logo.png"
    ico_path = "cvo-logo.ico"
    
    try:
        # Abrir imagen PNG
        img = Image.open(png_path)
        
        # Convertir a RGBA si no lo está
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Crear diferentes tamaños para el icono
        sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        img.save(ico_path, format='ICO', sizes=sizes)
        
        print(f"✅ Icono convertido exitosamente: {ico_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error convirtiendo icono: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Convirtiendo icono PNG a ICO...")
    convert_png_to_ico() 