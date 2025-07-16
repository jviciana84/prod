# 🚀 Instrucciones para Generar el Ejecutable "Scraper - CVO"

## Requisitos Previos

1. **Python 3.8 o superior** instalado en tu sistema
2. **Acceso a internet** para descargar dependencias
3. **Permisos de administrador** (recomendado)

## Pasos para Generar el Ejecutable

### 1. Abrir Terminal/PowerShell

```powershell
cd C:\Users\Usuario\Downloads\cursor\scripts
```

### 2. Ejecutar el Script de Construcción

```powershell
python build_exe.py
```

### 3. Proceso Automático

El script realizará automáticamente:

1. ✅ **Instalación de dependencias**:
   - pandas (análisis de datos)
   - openpyxl (lectura de Excel)
   - pyinstaller (generación de ejecutable)
   - pillow (conversión de iconos)

2. 🔄 **Conversión del icono**:
   - Convierte `../public/images/cvo-logo.png` a `cvo-logo.ico`
   - Crea múltiples tamaños para mejor compatibilidad

3. 🔨 **Generación del ejecutable**:
   - Crea `dist/Scraper.exe`
   - Incluye el icono de CVO
   - Aplicación sin consola (modo ventana)

### 4. Resultado

Al finalizar, tendrás:
- 📁 `dist/Scraper.exe` - El ejecutable final
- 🎯 Con el icono de CVO
- 📝 Título "Scraper - CVO"

## Distribución

### Para Usar en Otras Máquinas

1. **Copia** `dist/Scraper.exe` a cualquier máquina Windows
2. **No requiere instalación** de Python ni dependencias
3. **Ejecuta** con doble clic
4. **Funciona** en Windows 10/11 (32 y 64 bits)

### Características del Ejecutable

- 🖼️ **Icono**: Logo de CVO
- 📱 **Título**: "Scraper - CVO"
- 🎨 **Interfaz**: Moderna y fácil de usar
- 📊 **Funcionalidad**: Análisis completo de Excel
- 💾 **Exportación**: Mapeos en formato JSON

## Solución de Problemas

### Error: "No se encuentra el archivo PNG"
- Verifica que `../public/images/cvo-logo.png` existe
- Asegúrate de estar en el directorio `scripts/`

### Error: "PyInstaller no encontrado"
- Ejecuta: `pip install pyinstaller`
- O ejecuta el script completo que instala todo automáticamente

### Error: "Permisos denegados"
- Ejecuta PowerShell como administrador
- O ejecuta: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### El ejecutable es muy grande
- Es normal (~50-100MB)
- Incluye Python y todas las dependencias
- No requiere instalación adicional

## Uso del Ejecutable

1. **Abrir**: Doble clic en `Scraper.exe`
2. **Seleccionar**: Archivo Excel o CSV
3. **Analizar**: Ver resultados en pestañas
4. **Exportar**: Guardar mapeo en JSON
5. **Usar**: En la página de gestión de columnas

## Integración con el Proyecto

El ejecutable genera archivos JSON que se pueden usar directamente en:
- 📊 Página "Gestión de Columnas"
- 🔗 Mapeo automático de columnas
- 📋 Importación de datos Excel

## Versión

v2.0 - Enero 2024
- ✨ Nuevo branding CVO
- 🎯 Nombre "Scraper"
- 🖼️ Icono personalizado
- 📱 Interfaz mejorada 