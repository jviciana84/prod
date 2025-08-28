# 🗺️ Mapa GeoJSON de España - Documentación

## 📋 Descripción

Este documento explica cómo funciona el mapa interactivo de España que usa datos GeoJSON reales para mostrar la distribución geográfica de ventas.

## 🏗️ Arquitectura

### Componentes Principales

1. **`MapaEspanaGeoJSON`** - Componente principal del mapa
2. **`spain-provinces.geojson`** - Archivo con datos geográficos reales
3. **Scripts de descarga** - Para obtener y mantener actualizados los datos

### Estructura de Archivos

```
components/reports/
├── mapa-espana-geojson.tsx     # Componente principal del mapa
└── mapa-ventas-espana.tsx      # Mapa simplificado (legacy)

public/data/
└── spain-provinces.geojson     # Datos GeoJSON de España

scripts/
├── download-spain-geojson.js   # Script para descargar GeoJSON
└── test-geojson-map.js         # Script de prueba

app/dashboard/test-map/
└── page.tsx                    # Página de prueba del mapa
```

## 🚀 Instalación y Configuración

### 1. Descargar el GeoJSON

```bash
node scripts/download-spain-geojson.js
```

Este script:
- Descarga el archivo GeoJSON desde GitHub
- Lo guarda en `public/data/spain-provinces.geojson`
- Verifica que el archivo sea válido

### 2. Verificar la Instalación

```bash
node scripts/test-geojson-map.js
```

Este script muestra:
- Número de provincias disponibles
- Lista de provincias
- Estructura de datos de ejemplo

## 📊 Uso del Componente

### Importación

```tsx
import { MapaEspanaGeoJSON } from "@/components/reports/mapa-espana-geojson"
```

### Datos Requeridos

```tsx
interface VentaGeografica {
  provincia: string
  cantidad: number
  ingresos: number
  codigosPostales: Array<{
    codigo: string
    cantidad: number
    ingresos: number
  }>
}
```

### Ejemplo de Uso

```tsx
const datosVentas = [
  {
    provincia: "Barcelona",
    cantidad: 15,
    ingresos: 450000,
    codigosPostales: [
      { codigo: "08001", cantidad: 5, ingresos: 150000 },
      { codigo: "08002", cantidad: 3, ingresos: 90000 }
    ]
  }
]

<MapaEspanaGeoJSON datos={datosVentas} />
```

## 🎨 Características del Mapa

### Visualización

- **Colores dinámicos**: Intensidad basada en cantidad de ventas
- **Hover effects**: Cambio de color al pasar el mouse
- **Click interactivo**: Selección de provincias
- **Etiquetas**: Número de ventas en el centro de cada provincia

### Funcionalidades

1. **Mapa Interactivo**
   - Click en provincias para ver detalles
   - Hover para resaltar
   - Leyenda explicativa

2. **Detalles de Provincia**
   - Estadísticas de ventas
   - Ingresos totales
   - Top códigos postales

3. **Resumen Geográfico**
   - Total de provincias
   - Total de ventas
   - Total de ingresos
   - Total de códigos postales

## 🔧 Personalización

### Colores

```tsx
const getIntensidadColor = (cantidad: number) => {
  const intensidad = Math.min((cantidad / maxVentas) * 100, 100)
  return `rgba(59, 130, 246, ${intensidad / 100})` // Azul
}
```

### Tamaño del Mapa

```tsx
<svg
  className="w-full h-96 border rounded-lg"
  viewBox="0 0 800 600"
  preserveAspectRatio="xMidYMid meet"
>
```

### Mapeo de Nombres

El componente incluye un mapeo de nombres de provincias para mejorar la coincidencia entre los datos de ventas y los nombres del GeoJSON.

## 🧪 Testing

### Página de Prueba

Visita `/dashboard/test-map` para ver el mapa funcionando con datos de prueba.

### Datos de Prueba

```tsx
const datosPrueba = [
  {
    provincia: "Barcelona",
    cantidad: 15,
    ingresos: 450000,
    codigosPostales: [...]
  },
  // ... más provincias
]
```

## 🔍 Troubleshooting

### Problemas Comunes

1. **Mapa no se carga**
   - Verificar que `spain-provinces.geojson` existe en `public/data/`
   - Ejecutar `node scripts/download-spain-geojson.js`

2. **Provincias no coinciden**
   - Revisar el mapeo de nombres en el componente
   - Verificar que los nombres de provincias coincidan exactamente

3. **Errores de coordenadas**
   - El mapa usa coordenadas geográficas reales
   - Las coordenadas se convierten automáticamente a SVG

### Logs de Debug

El componente incluye logs detallados en la consola para ayudar con el debugging:

```tsx
console.log("🔍 Obteniendo ventas del mes:", mesString)
console.log("📊 Ventas encontradas:", ventasData?.length || 0)
```

## 📈 Rendimiento

### Optimizaciones

- **Lazy loading**: El GeoJSON se carga solo cuando es necesario
- **Memoización**: Los cálculos se cachean para evitar recálculos
- **SVG optimizado**: Uso de paths vectoriales eficientes

### Tamaño del Archivo

- **GeoJSON**: ~1.3MB (incluye todas las provincias de España)
- **Componente**: ~15KB (código TypeScript/React)

## 🔄 Mantenimiento

### Actualizar el GeoJSON

```bash
# Ejecutar el script de descarga
node scripts/download-spain-geojson.js

# Verificar la integridad
node scripts/test-geojson-map.js
```

### Fuentes de Datos

El GeoJSON se obtiene de:
- **GitHub**: https://github.com/codeforgermany/click_that_hood
- **Formato**: GeoJSON estándar
- **Licencia**: Open Source

## 📚 Referencias

- [GeoJSON Specification](https://geojson.org/)
- [SVG Path Documentation](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)
- [React SVG Best Practices](https://reactjs.org/docs/dom-elements.html#svg)

## 🤝 Contribución

Para mejorar el mapa:

1. Actualizar el mapeo de nombres de provincias
2. Mejorar la conversión de coordenadas
3. Añadir más funcionalidades interactivas
4. Optimizar el rendimiento

---

**Nota**: Este mapa usa datos geográficos reales de España y proporciona una visualización precisa de la distribución de ventas por provincia.
