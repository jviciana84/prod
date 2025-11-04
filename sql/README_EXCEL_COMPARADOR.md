# 📊 Sistema de Carga de Excel para Comparador de Precios

## 🎯 Objetivo

Cargar vehículos desde Excel (subastas) y comparar automáticamente sus precios con la red BMW/MINI para determinar rentabilidad antes de comprar.

---

## 📋 Paso 1: Ejecutar Script SQL

### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido de `create_vehiculos_excel_comparador.sql`
4. Click en **Run** (o `Ctrl+Enter`)

### Opción B: Desde línea de comandos

```bash
# Requiere psql instalado y credenciales de Supabase
psql -U postgres -d tu_base_datos -f sql/create_vehiculos_excel_comparador.sql
```

---

## 🚀 Funcionalidades Implementadas

### 1. **Botón de Carga de Excel**
- **Ubicación**: Página Comparador de Precios, al lado del botón de Configuración
- **Icono**: Upload ⬆️
- **Acción**: Abre diálogo para seleccionar archivo Excel (.xlsx, .xls)

### 2. **Procesamiento Automático**
Al cargar el Excel, el sistema:
- ✅ Parsea todas las filas del Excel
- ✅ Convierte fechas de formato Excel serial a Date
- ✅ Normaliza modelos para búsqueda (ej: "116d (F40)" → "Serie 1 116d")
- ✅ Guarda en `vehiculos_excel_comparador`
- ✅ Busca automáticamente en `comparador_scraper` precios similares
- ✅ Calcula **Precio Medio Red** y **Precio Competitivo** (5% menos)
- ✅ Muestra resultados en tabla dinámica

### 3. **Tabla de Resultados**
Muestra para cada vehículo:
- Lote, Marca, Modelo, Matrícula
- KM, Fecha Matriculación
- Precio Salida, Daños, Break Even
- **Precio Medio Red** (de la competencia)
- **Precio Competitivo** (recomendado para ser competitivo)
- Número de competidores encontrados
- **Estado de Rentabilidad**:
  - ✅ **Rentable**: Precio Competitivo > Break Even
  - ❌ **No Rentable**: Precio Competitivo < Break Even

### 4. **Resumen de Rentabilidad**
3 cards con métricas:
- 🟢 **Rentables**: Cuántos vehículos vale la pena comprar
- 🔴 **No rentables**: Cuántos NO conviene comprar
- ⚪ **Sin datos**: Cuántos no tienen información de la red

---

## 📂 Estructura del Excel Esperado

El sistema espera un Excel con estas columnas (como el ejemplo `S45 SUBASTA CERRADA RED BMW 4_11_2025.xlsx`):

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| LOTE | Identificador del lote | "LOTE 1" |
| CHASIS | VIN del vehículo | "WBA7M710307L98786" |
| MATRÍCULA | Matrícula | "9598MDF" |
| COMPAÑÍA | Empresa propietaria | "Alphabet" |
| MARCA | BMW/MINI | "BMW" |
| SERIE | Serie del vehículo | "Serie 1" |
| MODELO | Modelo completo | "116d (F40)" |
| FECHA MATRICULACIÓN | Fecha serial Excel | 44930 |
| KM | Kilometraje | 71263 |
| DAÑO NETO | Coste de reparación | 2709.89 |
| BREAK EVEN / VR NETO | Precio base/coste | 14482.95 |
| PRECIO SALIDA NETO | Precio actual subasta | 12000 |
| ... | Otras columnas opcionales | ... |

**Nota**: El sistema es flexible con columnas adicionales. Las columnas no listadas se guardan pero no se usan en el análisis.

---

## 🔍 Lógica de Búsqueda en la Red

### Matching de Modelos
1. Normaliza modelo (quita paréntesis, código chasis)
2. Combina SERIE + MODELO (ej: "Serie 1" + "116d" → "Serie 1 116d")
3. Busca en `comparador_scraper` modelos similares
4. Aplica tolerancia de ±1 año

### Cálculo de Precios
- **Precio Medio Red**: Promedio de precios de competidores encontrados
- **Precio Competitivo**: Precio Medio × 0.95 (5% menos para ser competitivo)

### Determinación de Rentabilidad
```
Margen = Precio Competitivo - Break Even

Si Margen > 0 → ✅ Rentable (vale la pena comprar)
Si Margen ≤ 0 → ❌ No Rentable (perderías dinero)
```

---

## 🛠️ Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `sql/create_vehiculos_excel_comparador.sql` | Script SQL para crear tabla |
| `app/api/comparador/excel/upload/route.ts` | API para subir y procesar Excel |
| `app/api/comparador/excel/get-all/route.ts` | API para obtener vehículos cargados |
| `app/dashboard/comparador-precios/page.tsx` | Página con botón y tabla (modificada) |
| `sql/README_EXCEL_COMPARADOR.md` | Esta guía |

---

## 📝 Próximas Implementaciones (Para después)

### Fase 2: Cálculo de Rentabilidad Avanzado
```
Resultado = (Coste + Daños + Margen + Gastos + Transportes) - Precio Venta

Donde:
- Coste = Break Even
- Daños = Daño Neto
- Margen = Configurable por usuario (%)
- Gastos = Configurable
- Transportes = Configurable
- Precio Venta = Precio Competitivo (o manual)
```

Incluirá:
- Inputs configurables para margen, gastos, transportes
- Cálculo automático de resultado
- Exportación a Excel/PDF de análisis completo

---

## ✅ Testing

### Flujo de prueba:
1. Ejecutar script SQL
2. Cargar Excel de ejemplo: `public/S45 SUBASTA CERRADA RED BMW 4_11_2025.xlsx`
3. Verificar que aparezca tabla con vehículos
4. Verificar que columnas "Precio Medio Red" y "Precio Competitivo" tengan valores
5. Verificar badges de rentabilidad (verde/rojo)

---

## 🐛 Troubleshooting

### "No autenticado"
- Verificar que estés logueado en la aplicación
- Las políticas RLS requieren autenticación

### "Sin datos" en Precio Medio Red
- No se encontraron competidores similares en `comparador_scraper`
- Verifica que el scraper de BMW/MINI esté corriendo
- Revisa que los modelos coincidan

### Error al parsear Excel
- Verifica que el Excel tenga las columnas esperadas
- La columna "MODELO " (con espacio) es obligatoria
- Fecha debe ser formato serial de Excel (número)

---

## 📞 Soporte

Si tienes problemas, revisa:
1. Logs del navegador (F12 → Console)
2. Logs de Supabase (Dashboard → Logs)
3. Verifica que la tabla `comparador_scraper` tenga datos

---

**¡Listo para usar! 🚀**


