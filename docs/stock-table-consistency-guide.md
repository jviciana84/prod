# Guía de Consistencia - Stock Table

## 🎨 Estilos y Colores Estándar

### Botones de Estado
```typescript
// Estados de carrocería y mecánica
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "apto":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "no apto":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "pendiente":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}
```

### Botones de Peritado
```typescript
// Estado de peritado
className={cn(
  "h-8 px-2 text-xs font-medium",
  item.inspection_date 
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
)}
```

### Campos Editables
```typescript
// OR Field
<div className="h-8 flex items-center px-2 border border-gray-300 rounded-md cursor-pointer font-mono overflow-hidden"
     style={{ minWidth: "14ch", width: "auto", maxWidth: "14ch" }}>

// Select Fields
<SelectTrigger className="h-8 text-xs">
  <SelectValue placeholder="Cargo" />
</SelectTrigger>
```

## 📊 Estructura de Columnas Estándar

### Todas las pestañas deben tener:
1. **MATRÍCULA** - Con indicadores de prioridad
2. **MODELO** - Texto simple
3. **TIPO** - Texto simple con fallback "-"
4. **VENTA** - Con icono de calendario y tooltip
5. **DÍAS** - Cálculo de días transcurridos
6. **OR** - Campo editable con estilo mono
7. **CARGO GASTOS** - Select con expenseTypes
8. **ESTADO CARROCERIA** - Botón con getStatusColor
9. **ESTADO MECÁNICA** - Botón con getStatusColor
10. **PERITADO** - Botón con estado de inspection_date
11. **CENTRO TRABAJO** - Select con talleres 1-10

## 🔄 Patrones de Datos

### Fecha de Recepción
```typescript
// Siempre usar reception_date, NO sale_date
formatDate(item.reception_date)

// Cálculo de días
item.reception_date
  ? Math.ceil((new Date().getTime() - new Date(item.reception_date).getTime()) / (1000 * 60 * 60 * 24))
  : "-"
```

### Estados por Defecto
```typescript
// Estados por defecto
item.vehicle_type || "-"
item.body_status || "Pendiente"
item.mechanical_status || "Pendiente"
item.work_center || ""
```

## 🎯 Reglas de Consistencia

### 1. Tamaños de Texto
- **Botones**: `text-xs font-medium`
- **Selects**: `text-xs`
- **Inputs**: `text-sm font-mono`

### 2. Altura de Elementos
- **Todos los elementos**: `h-8`
- **Botones**: `h-8 px-2`
- **Selects**: `h-8`

### 3. Colores de Estado
- **Apto/Completado**: Verde
- **No Apto/Error**: Rojo
- **Pendiente**: Amarillo
- **Neutral**: Gris

### 4. Indicadores de Prioridad
```typescript
// Siempre incluir en la columna MATRÍCULA
{(item as StockItemWithPriority).calculatedPriority === Priority.HIGH && (
  <div className={priorityStyles.container}>
    <div className={priorityStyles.high.dot} title="Prioridad alta" />
    <div className={priorityStyles.high.wave} />
  </div>
)}
```

## 🚫 Errores Comunes a Evitar

1. **NO usar `sale_date`** - Usar `reception_date`
2. **NO usar `formatTimeElapsed`** - Usar cálculo de días
3. **NO usar `item.inspected`** - Usar `item.inspection_date`
4. **NO usar diferentes tamaños de texto** - Mantener consistencia
5. **NO usar diferentes colores** - Seguir la paleta estándar

## 📝 Checklist para Nuevas Pestañas

- [ ] Usar estructura de columnas estándar
- [ ] Implementar indicadores de prioridad
- [ ] Usar colores de estado estándar
- [ ] Mantener tamaños de texto consistentes
- [ ] Incluir tooltips donde sea necesario
- [ ] Usar campos editables estándar
- [ ] Implementar paginación consistente

## 🔧 Funciones Estándar

### Handlers que deben estar disponibles:
- `handleBodyStatusToggle`
- `handleMechanicalStatusToggle`
- `handleInspectionToggle`
- `handleOREdit/Save/Change`
- `handleExpenseChargeChange`
- `handleWorkCenterChange`

### Estados que deben estar disponibles:
- `pendingUpdates`
- `editingId`
- `editingOR`
- `orValues`
- `expenseTypes` 