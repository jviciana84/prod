# PROPUESTA: NUEVO FLUJO DE STOCK AUTOMATIZADO

## 🎯 OBJETIVO

Eliminar dependencia del factor humano y reflejar la realidad del inventario:
- **Stock = Vehículos comprados** (estén donde estén)
- **Ubicación = Dónde están físicamente**
- **Fotos pendientes = Solo si están en Terrassa**

---

## 📊 PROBLEMA ACTUAL

### Flujo Actual (Incorrecto):
```
1. Coche aparece en DUC
   ↓
2. Usuario debe crear en nuevas_entradas MANUALMENTE
   ↓
3. Usuario debe marcar "Recibido" MANUALMENTE
   ↓
4. ENTONCES aparece en stock + fotos

❌ PROBLEMA: Si un coche llega directamente a Terrassa (DEMOS), nadie lo marca
❌ RESULTADO: Nunca aparece en fotos pendientes
```

### Casos problemáticos:
1. **DEMOS matriculados en Terrassa** → Nunca se marcan como recibidos
2. **Vehículos en tránsito** → No aparecen en stock aunque ya son nuestros
3. **Factor humano** → Depende de que alguien recuerde marcarlos

---

## ✅ SOLUCIÓN PROPUESTA

### Nuevo Flujo Automático:
```
1. Coche aparece en DUC (scraper cada 8h)
   ↓
2. TRIGGER AUTOMÁTICO:
   - Crea en stock con location_status = 'en_transito'
   - Usa datos de DUC (ubicación, modelo, etc.)
   ↓
3. DETECCIÓN AUTOMÁTICA de ubicación:
   - Si "Ubicación tienda" contiene "Terrassa" o "San Fruitós"
     → location_status = 'en_terrassa'
     → Crear en fotos (pendiente)
   - Si no → location_status = 'en_transito'
     → NO crear en fotos aún
   ↓
4. ACTUALIZACIÓN AUTOMÁTICA:
   - Cada 8h el scraper actualiza
   - Si cambió ubicación → actualizar location_status
   - Si pasa a 'en_terrassa' → crear en fotos
```

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### 1. Nueva columna en `stock`:

```sql
ALTER TABLE stock ADD COLUMN IF NOT EXISTS location_status VARCHAR(50) DEFAULT 'en_transito';
ALTER TABLE stock ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE stock ADD COLUMN IF NOT EXISTS sync_date TIMESTAMP;
ALTER TABLE stock ADD COLUMN IF NOT EXISTS duc_id VARCHAR(50);

COMMENT ON COLUMN stock.location_status IS 'en_transito | en_terrassa | en_taller_externo | entregado';
COMMENT ON COLUMN stock.source IS 'duc_scraper | manual | demo';
COMMENT ON COLUMN stock.sync_date IS 'Última sincronización con DUC';
COMMENT ON COLUMN stock.duc_id IS 'ID Anuncio de duc_scraper';
```

### 2. Nuevo trigger: `duc_scraper` → `stock`

```sql
CREATE OR REPLACE FUNCTION sync_duc_to_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_location_status VARCHAR(50);
BEGIN
  -- Detectar ubicación automáticamente
  IF NEW."Ubicación tienda" ILIKE '%terrassa%' 
     OR NEW."Ubicación tienda" ILIKE '%san fruitós%'
     OR NEW."Tienda" ILIKE '%san fruitós%' THEN
    v_location_status := 'en_terrassa';
  ELSE
    v_location_status := 'en_transito';
  END IF;

  -- Insertar o actualizar en stock
  INSERT INTO stock (
    license_plate,
    model,
    location_status,
    source,
    sync_date,
    duc_id,
    is_sold,
    created_at
  ) VALUES (
    NEW."Matrícula",
    NEW."Modelo",
    v_location_status,
    'duc_scraper',
    NOW(),
    NEW."ID Anuncio",
    CASE 
      WHEN NEW."Disponibilidad" = 'VENDIDO' THEN TRUE
      ELSE FALSE
    END,
    NOW()
  )
  ON CONFLICT (license_plate) 
  DO UPDATE SET 
    model = EXCLUDED.model,
    location_status = EXCLUDED.location_status,
    sync_date = NOW(),
    duc_id = EXCLUDED.duc_id,
    updated_at = NOW();

  -- Si está en Terrassa, crear en fotos
  IF v_location_status = 'en_terrassa' THEN
    INSERT INTO fotos (
      license_plate,
      model,
      estado_pintura,
      paint_status_date
    ) VALUES (
      NEW."Matrícula",
      NEW."Modelo",
      'pendiente',
      NOW()
    )
    ON CONFLICT (license_plate) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📋 ESTADOS DE UBICACIÓN

| Estado | Significado | ¿En stock? | ¿En fotos? |
|--------|-------------|-----------|-----------|
| `en_transito` | Comprado pero no llegó a Terrassa | ✅ SÍ | ❌ NO |
| `en_terrassa` | Físicamente en instalaciones | ✅ SÍ | ✅ SÍ |
| `en_taller_externo` | En taller de terceros | ✅ SÍ | ❌ NO |
| `entregado` | Entregado a cliente (vendido) | ✅ SÍ | ✅ SÍ |

---

## 🎯 BENEFICIOS

### Automático:
✅ Vehículos en DUC → automáticamente en stock
✅ Detección de ubicación por nombre de tienda
✅ Fotos pendientes solo si están en Terrassa
✅ DEMOS se detectan automáticamente
✅ Sin intervención humana requerida

### Visibilidad mejorada:
✅ Ver todo el inventario (no solo lo recibido)
✅ Saber dónde está cada vehículo
✅ Filtrar por ubicación en el dashboard
✅ Alertas automáticas de fotos pendientes

### Trazabilidad:
✅ Saber cuándo llegó cada vehículo
✅ Histórico de movimientos
✅ Sincronización con DUC cada 8h

---

## 🔄 MIGRACIÓN DE DATOS EXISTENTES

### Paso 1: Agregar columnas
```sql
ALTER TABLE stock ADD COLUMN location_status VARCHAR(50) DEFAULT 'en_terrassa';
ALTER TABLE stock ADD COLUMN source VARCHAR(50) DEFAULT 'manual';
```

### Paso 2: Marcar datos existentes
```sql
-- Los que ya están en stock, asumimos que están en Terrassa
UPDATE stock 
SET location_status = 'en_terrassa',
    source = 'manual'
WHERE location_status IS NULL;
```

### Paso 3: Sincronizar con DUC
```sql
-- Actualizar con datos de DUC
UPDATE stock s
SET duc_id = d."ID Anuncio",
    source = 'duc_scraper',
    sync_date = NOW()
FROM duc_scraper d
WHERE UPPER(TRIM(s.license_plate)) = UPPER(TRIM(d."Matrícula"));
```

---

## 🖥️ CAMBIOS EN UI

### Dashboard - Stock:
Mostrar columna de "Ubicación":
- 🚚 En tránsito (X vehículos)
- 🏢 En Terrassa (X vehículos)
- 🔧 En taller externo (X vehículos)

### Filtros:
- Ver solo "En Terrassa"
- Ver solo "En tránsito"
- Ver todo el inventario

### Fotos pendientes:
- Solo mostrar los que tienen location_status = 'en_terrassa'
- Excluir automáticamente los que están en tránsito

---

## ⚠️ CONSIDERACIONES

### ¿Qué pasa con `nuevas_entradas`?
**Opción A (Recomendada):** Deprecar la tabla, ya no es necesaria
**Opción B:** Mantenerla solo para registros manuales especiales

### ¿Y el campo `is_received`?
Se reemplaza por `location_status`:
- `is_received = false` → `location_status = 'en_transito'`
- `is_received = true` → `location_status = 'en_terrassa'`

---

## 📝 IMPLEMENTACIÓN PASO A PASO

1. ✅ Agregar columnas nuevas a `stock`
2. ✅ Migrar datos existentes
3. ✅ Crear trigger `duc_scraper` → `stock`
4. ✅ Modificar lógica de `fotos` (solo si `en_terrassa`)
5. ✅ Actualizar UI para mostrar ubicaciones
6. ✅ Ajustar filtros del dashboard
7. ✅ Deprecar o adaptar `nuevas_entradas`

---

## 🚀 RESULTADO FINAL

```
Scraper ejecuta cada 8h
    ↓
Detecta vehículos en DUC
    ↓
Por cada vehículo:
  1. Crea/actualiza en STOCK
  2. Detecta ubicación por nombre de tienda
  3. Si está en Terrassa → crea en FOTOS (pendiente)
  4. Si no → solo en STOCK (en tránsito)
    ↓
Usuario ve:
  - Stock completo (inventario real)
  - Ubicación de cada vehículo
  - Fotos pendientes (solo Terrassa)
  
❌ SIN intervención manual
✅ TODO automático
```

---

## 🎯 PRÓXIMO PASO

¿Quieres que implemente esta nueva arquitectura?

Opciones:
1. **Implementar completo** - Crear migraciones + triggers + cambios UI
2. **Solo backend** - Migraciones + triggers, UI después
3. **Probar primero** - Hacer prueba con 1 vehículo antes de todo
4. **Ajustar propuesta** - Modificar algo de lo propuesto

¿Qué prefieres? 🤔

