import cairosvg
from PIL import Image
import io
import os

# Ruta al SVG original
svg_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'cursor', 'public', 'favicon-round.svg'))
# Ruta de salida del ICO
ico_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'favicon.ico'))

# Convertir SVG a PNG en memoria
png_data = cairosvg.svg2png(url=svg_path, output_width=64, output_height=64)
img = Image.open(io.BytesIO(png_data))
img.save(ico_path, format='ICO')
print(f"Icono convertido y guardado en: {ico_path}") 