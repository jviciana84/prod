# ESTRUCTURA SCRAPER

## 📋 PROBLEMA ACTUAL

**Situación**: Vehículos marcados como "RESERVADO" en el CSV aparecen como "disponible" en la tabla stock.

**Objetivo**: Crear un flujo que sincronice automáticamente los vehículos reservados del CSV con la tabla stock.

---

## 🔄 FLUJO ACTUAL

### 1. SCRAPER → CSV
- Scraper descarga datos de DUC
- Genera archivo CSV con vehículos

### 2. CSV → DUC_SCRAPER
- API `/api/import-csv` procesa el CSV
- Inserta/actualiza registros en tabla `duc_scraper`

### 3. DUC_SCRAPER → STOCK
- **PROBLEMA**: No hay sincronización automática
- Vehículos reservados no se marcan como vendidos en stock

---

## 🎯 FLUJO DESEADO

### 1. SCRAPER → CSV
- Scraper descarga datos de DUC
- Genera archivo CSV con vehículos

### 2. CSV → DUC_SCRAPER
- API `/api/import-csv` procesa el CSV
- Inserta/actualiza registros en tabla `duc_scraper`

### 3. DUC_SCRAPER → STOCK (SINCRONIZACIÓN)
- **Trigger automático** detecta vehículos reservados
- Marca `is_sold = true` en tabla stock
- Marca `estado_pintura = 'vendido'` en tabla fotos

### 4. STOCK → INTERFAZ
- Vehículos con `is_sold = true` aparecen en pestaña "Vendido"
- Vehículos con `is_sold = false/null` aparecen en otras pestañas

---

## 📊 TABLAS INVOLUCRADAS

### duc_scraper
- `"Matrícula"` - Matrícula del vehículo
- `"Disponibilidad"` - "RESERVADO", "Disponible", etc.
- `"Modelo"` - Modelo del vehículo

### stock
- `license_plate` - Matrícula del vehículo
- `is_sold` - true = vendido, false/null = disponible

### fotos
- `license_plate` - Matrícula del vehículo
- `estado_pintura` - "vendido", "apto", "no_apto", etc.

---

## 🔧 TRIGGER NECESARIO

### Función: handle_availability_change()
```sql
-- Se activa: INSERT OR UPDATE en duc_scraper
-- Condición: NEW."Disponibilidad" ILIKE '%reservado%'

-- Acciones:
1. UPDATE stock SET is_sold = true WHERE license_plate = NEW."Matrícula"
2. UPDATE fotos SET estado_pintura = 'vendido' WHERE license_plate = NEW."Matrícula"
```

---

## 🎯 RESULTADO FINAL

**Entrada**: Vehículo marcado como "RESERVADO" en CSV
**Proceso**: Trigger automático detecta y sincroniza
**Salida**: Vehículo aparece en pestaña "Vendido" de la interfaz

---

## 📝 PRÓXIMOS PASOS

1. **Crear trigger** que funcione en INSERT y UPDATE
2. **Probar sincronización** con vehículos existentes
3. **Verificar interfaz** muestra correctamente los vendidos 