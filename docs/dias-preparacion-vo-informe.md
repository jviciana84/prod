# Informe de Días Preparación VO

## Descripción

El informe de "Días Preparación VO" es una herramienta de análisis que permite medir y visualizar los tiempos de preparación de vehículos desde la venta hasta su certificación o completado, separado por asesor comercial.

## Funcionalidades

### 📊 Estadísticas Globales
- **Total Vehículos**: Número total de vehículos procesados en el período seleccionado
- **Media Días**: Promedio de días de preparación de todos los asesores
- **Completados**: Vehículos que han completado todo el proceso (CyP + Foto360)
- **Pendientes**: Vehículos que están en proceso de preparación

### 📈 Gráficos Visuales
1. **Gráfico de Barras - Media de Días por Asesor**: Compara el promedio de días de preparación entre asesores
2. **Gráfico Circular - Estado de Vehículos**: Muestra la distribución de vehículos completados vs pendientes
3. **Gráfico de Barras - Vehículos por Asesor**: Visualiza el total de vehículos procesados por cada asesor
4. **Gráfico de Líneas - Evolución de Días**: Muestra las tendencias en los tiempos de preparación

### 👥 Estadísticas por Asesor
Para cada asesor comercial se muestra:
- **Media días**: Promedio de días de preparación
- **Rango**: Días mínimo y máximo de preparación
- **Completados**: Número de vehículos finalizados
- **Pendientes**: Número de vehículos en proceso

### 📋 Tabla Detallada
Lista completa de vehículos con:
- Matrícula
- Asesor responsable
- Fecha de venta
- Fecha de validación
- Fecha de completado
- Días de preparación
- Estado actual

## Filtros Disponibles

### 📅 Filtro de Fechas
- **Fecha desde**: Permite seleccionar la fecha inicial del período a analizar
- **Fecha hasta**: Permite seleccionar la fecha final del período a analizar
- Por defecto muestra los últimos 30 días

### 👤 Filtro por Asesor
- **Todos los asesores**: Muestra datos de todos los asesores comerciales
- **Asesor específico**: Permite filtrar por un asesor en particular

## Cálculo de Días de Preparación

### Estados de Preparación
1. **Pendiente**: Vehículo validado pero sin completar CyP y Foto360
2. **Validado**: Vehículo con validación pero sin completar proceso
3. **Completado**: Vehículo con CyP y Foto360 finalizados

### Fórmula de Cálculo
- **Para vehículos completados**: Días = Fecha Completado - Fecha Venta
- **Para vehículos validados**: Días = Fecha Validación - Fecha Venta
- **Para vehículos pendientes**: 0 días (no se puede calcular aún)

## Exportación de Datos

### 📄 Exportar a CSV
El botón "Exportar CSV" permite descargar todos los datos filtrados en formato CSV con las siguientes columnas:
- Matrícula
- Asesor
- Fecha Venta
- Fecha Validación
- Fecha CyP
- Fecha Foto360
- Fecha Completado
- Días Preparación
- Estado

### 🖨️ Imprimir PDF
El botón "Imprimir PDF" genera un informe completo en formato PDF que incluye:
- **Encabezado**: Logo de CVO, título del informe, fecha y período
- **Filtros aplicados**: Asesor seleccionado y rango de fechas
- **Estadísticas globales**: Total vehículos, media días, completados y pendientes
- **Estadísticas por asesor**: Desglose detallado por cada asesor comercial
- **Tabla detallada**: Lista completa de vehículos con todos los datos
- **Formato optimizado**: Diseño profesional con colores para estados y saltos de página automáticos

El informe PDF es ideal para presentaciones, reuniones o archivo físico.

## Datos Fuente

El informe utiliza la tabla `sales_vehicles` que contiene:
- `sale_date`: Fecha de venta del vehículo
- `validation_date`: Fecha de validación
- `cyp_date`: Fecha de completado del CyP
- `photo_360_date`: Fecha de completado de la foto 360
- `advisor`: Asesor comercial responsable
- `license_plate`: Matrícula del vehículo
- `model`: Modelo del vehículo

## Uso Recomendado

### Para Supervisores
1. Revisar las estadísticas globales para entender el rendimiento general
2. Analizar los gráficos para identificar tendencias
3. Comparar el rendimiento entre asesores
4. Identificar cuellos de botella en el proceso

### Para Asesores Comerciales
1. Revisar su propio rendimiento en la sección de estadísticas por asesor
2. Analizar sus tiempos de preparación vs el promedio
3. Identificar oportunidades de mejora

### Para Gestión
1. Exportar datos para análisis externos
2. Revisar tendencias temporales
3. Tomar decisiones basadas en datos objetivos

## Acceso

El informe está disponible en: `/dashboard/reports/dias-preparacion-vo`

Solo usuarios con roles de admin, Director o Supervisor pueden acceder a esta funcionalidad.

## Scripts de Verificación

Se incluye el script `scripts/verify_sales_vehicles_calculation.sql` para:
- Verificar que la tabla existe
- Verificar que todos los campos necesarios están presentes
- Mostrar estadísticas básicas de los datos
- Comprobar que los cálculos de días son correctos

## Notas Técnicas

- Los datos se actualizan en tiempo real
- Los cálculos se realizan en el frontend para mayor flexibilidad
- Los gráficos son responsivos y se adaptan al tamaño de pantalla
- El informe es compatible con dispositivos móviles y tablets 