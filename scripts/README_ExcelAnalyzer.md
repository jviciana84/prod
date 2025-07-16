# 🔍 Scraper - CVO

## Descripción

Esta aplicación permite analizar archivos Excel de CVO y generar mapeos de columnas para la base de datos. Es especialmente útil para procesar archivos de stock de vehículos.

## Características

- 📁 **Selección de archivos**: Soporta archivos Excel (.xlsx, .xls) y CSV
- 📊 **Análisis completo**: Muestra estadísticas, tipos de datos y valores nulos
- 📋 **Lista de columnas**: Visualiza todas las columnas con su información
- 🎯 **Mapeo automático**: Sugiere mapeos entre columnas Excel y campos de BD
- 📄 **Datos de ejemplo**: Muestra las primeras filas para verificar datos
- 💾 **Exportación**: Guarda el análisis en formato JSON

## Instalación

### Opción 1: Ejecutable (Recomendado)

1. Descarga el archivo `Scraper.exe`
2. Haz doble clic para ejecutar
3. No requiere instalación adicional

### Opción 2: Código fuente

1. Instalar Python 3.8 o superior
2. Instalar dependencias:
   ```bash
   pip install -r requirements_gui.txt
   ```
3. Ejecutar:
   ```bash
   python excel_analyzer_gui.py
   ```

## Uso

### Paso 1: Seleccionar archivo
- Haz clic en "📁 Seleccionar Archivo Excel"
- Busca tu archivo Excel o CSV
- El archivo aparecerá en la interfaz

### Paso 2: Analizar
- Haz clic en "🔍 Analizar Columnas"
- La aplicación procesará el archivo
- Verás los resultados en las pestañas

### Paso 3: Revisar resultados

#### Pestaña "📊 Resumen"
- Estadísticas generales del archivo
- Tipos de datos encontrados
- Columnas con valores nulos

#### Pestaña "📋 Columnas"
- Lista completa de columnas
- Tipo de dato de cada columna
- Número de valores no nulos

#### Pestaña "🎯 Mapeo"
- Sugerencias de mapeo automático
- Campos de BD sugeridos
- Estado de coincidencias

#### Pestaña "📄 Datos de Ejemplo"
- Primeras 5 filas del archivo
- Para verificar el formato de datos

### Paso 4: Exportar
- Haz clic en "💾 Exportar Mapeo"
- Guarda el análisis en formato JSON
- Útil para usar en la página de gestión de columnas

## Campos de BD Soportados

La aplicación reconoce automáticamente estos campos:

### Información del Vehículo
- `license_plate` - Matrícula
- `model` - Modelo
- `brand` - Marca
- `chassis` - Chasis
- `color` - Color
- `fuel_type` - Combustible
- `transmission` - Cambio
- `body_type` - Carrocería
- `engine_power` - Potencia
- `mileage` - Kilometraje

### Precios y Fechas
- `purchase_price` - Precio de compra
- `sale_price` - Precio de venta
- `purchase_date` - Fecha de compra
- `manufacturing_date` - Fecha de fabricación

### Ubicación y Estado
- `origin_location` - Concesionario
- `state` - Estado
- `availability` - Disponibilidad
- `origin` - Origen

### Otros
- `equipment` - Equipamiento
- `warranty` - Garantía
- `currency` - Moneda
- `observations` - Observaciones
- `url` - URL
- `version` - Versión

## Formato de Salida JSON

El archivo exportado contiene:

```json
{
  "archivo_origen": "stock_bmw.xlsx",
  "fecha_analisis": "2024-01-15T10:30:00",
  "total_columnas": 45,
  "total_filas": 1250,
  "columnas": ["Matrícula", "Modelo", "Precio", ...],
  "mapeo_sugerido": {
    "license_plate": "Matrícula",
    "model": "Modelo",
    ...
  }
}
```

## Solución de Problemas

### Error: "No se puede abrir el archivo"
- Verifica que el archivo no esté abierto en Excel
- Asegúrate de que el formato sea .xlsx, .xls o .csv
- Para archivos CSV, verifica que use punto y coma (;) como separador

### Error: "Caracteres extraños"
- El archivo debe estar en codificación UTF-8
- Si es CSV, abre en Notepad++ y cambia la codificación

### La aplicación no se abre
- Verifica que tienes permisos de administrador
- Intenta ejecutar como administrador
- Reinstala el ejecutable

## Integración con la Página Web

1. Usa esta aplicación para analizar tu archivo Excel
2. Exporta el mapeo en formato JSON
3. Ve a la página "Gestión de Columnas" en el dashboard
4. Sube el archivo Excel original
5. Usa la información del mapeo para configurar las columnas

## Soporte

Si tienes problemas:
1. Verifica que el archivo Excel tenga la primera fila como encabezados
2. Asegúrate de que no haya filas vacías al principio
3. Para archivos muy grandes (>100MB), considera dividirlos

## Versión

v1.0 - Enero 2024 