# PLAN DE IMPLEMENTACIÓN: STOCK CON RECEPCIÓN FÍSICA Y DISPONIBILIDAD

## ✅ REQUISITOS CONFIRMADOS

1. **2 días fijos**: Siempre backdating de -2 días
2. **Prevalece automático**: Fecha de fotos > fecha manual
3. **Solo nuevos**: Aplicar a vehículos que lleguen de ahora en adelante
4. **Toggle disponible**: Cualquiera puede marcar/desmarcar, automático en ciertos casos
5. **Lógica**: Fotos completadas = llegó hace 2 días

---

## 🎯 ARQUITECTURA NUEVA

### Estados de un vehículo:

```
FASE 1: COMPRADO (aparece en DUC)
  ↓
  - Crear en: stock + fotos + nuevas_entradas
  - Estado: "Comprado, pendiente de llegar"
  - is_available: FALSE (por defecto)
  - physical_reception_date: NULL
  - Contador días: ❌ NO CUENTA

FASE 2: LLEGADA FÍSICA (trigger automático o manual)
  ↓
  Opción A: Fotos completadas (automático)
    → physical_reception_date = hace 2 días
    → is_available = TRUE
    → Contador días: ✅ EMPIEZA
  
  Opción B: Usuario marca "recibido" (manual)
    → physical_reception_date = hoy
    → is_available = TRUE
    → Contador días: ✅ EMPIEZA
    
  Opción C: Tiene fotos en DUC (columnas URL foto)
    → photos_completed = TRUE
    → physical_reception_date = hace 2 días
    → is_available = TRUE

FASE 3: NO DISPONIBLE TEMPORAL (manual)
  ↓
  - Usuario clickea botón "No disponible"
  - is_available = FALSE
  - NO aparece en pendientes
  - Contador días: ⏸️ SIGUE pero no se muestra

FASE 4: DISPONIBLE DE NUEVO
  ↓
  - Usuario clickea botón "Disponible" O
  - Sistema marca "recibido" en nuevas_entradas
  - is_available = TRUE
  - Contador días: ✅ VISIBLE
```

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### 1. Migración: Agregar columnas

```sql
-- =====================================================
-- MIGRACIÓN: Agregar campos de recepción física
-- =====================================================

-- En tabla STOCK
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS physical_reception_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_marked_received BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN stock.physical_reception_date IS 
  'Fecha real de llegada física a Terrassa (NULL = aún no llegó)';

COMMENT ON COLUMN stock.is_available IS 
  'TRUE = Físicamente disponible para trabajar. FALSE = En tránsito o no disponible temporalmente';

COMMENT ON COLUMN stock.auto_marked_received IS 
  'TRUE si se marcó automáticamente por fotos completadas';

-- En tabla FOTOS
ALTER TABLE fotos 
ADD COLUMN IF NOT EXISTS physical_reception_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN fotos.physical_reception_date IS 
  'Fecha real de llegada física a Terrassa';

COMMENT ON COLUMN fotos.is_available IS 
  'TRUE = Disponible para fotografiar. FALSE = No está físicamente';

COMMENT ON COLUMN fotos.auto_completed IS 
  'TRUE si se marcó completado automáticamente al detectar fotos';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stock_physical_reception 
  ON stock(physical_reception_date) WHERE physical_reception_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_is_available 
  ON stock(is_available) WHERE is_available = TRUE;

CREATE INDEX IF NOT EXISTS idx_fotos_is_available 
  ON fotos(is_available) WHERE is_available = TRUE;
```

---

## ⚡ TRIGGERS Y FUNCIONES

### 1. Trigger: duc_scraper → stock + fotos + nuevas_entradas

```sql
CREATE OR REPLACE FUNCTION sync_duc_to_all_tables()
RETURNS TRIGGER AS $$
DECLARE
  v_has_photos BOOLEAN;
  v_reception_date TIMESTAMP;
BEGIN
  -- Solo si tiene matrícula y modelo
  IF NEW."Matrícula" IS NULL OR NEW."Modelo" IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Detectar si tiene fotos en DUC
  v_has_photos := (
    NEW."URL foto 1" IS NOT NULL OR
    NEW."URL foto 2" IS NOT NULL OR
    NEW."URL foto 3" IS NOT NULL
  );
  
  -- Si tiene fotos, asumimos que llegó hace 2 días
  IF v_has_photos THEN
    v_reception_date := NOW() - INTERVAL '2 days';
  ELSE
    v_reception_date := NULL;
  END IF;
  
  -- 1. NUEVAS_ENTRADAS (si no existe)
  INSERT INTO nuevas_entradas (
    license_plate,
    model,
    vehicle_type,
    is_received,
    purchase_date,
    created_at
  ) VALUES (
    NEW."Matrícula",
    NEW."Modelo",
    CASE 
      WHEN NEW."Modelo" ILIKE '%moto%' THEN 'Moto'
      ELSE 'Turismo'
    END,
    v_has_photos,  -- Si tiene fotos = ya recibido
    CURRENT_DATE,
    NOW()
  )
  ON CONFLICT (license_plate) 
  DO UPDATE SET
    is_received = CASE 
      WHEN v_has_photos THEN TRUE
      ELSE nuevas_entradas.is_received
    END;
  
  -- 2. STOCK (si no existe)
  INSERT INTO stock (
    license_plate,
    model,
    physical_reception_date,
    is_available,
    is_sold,
    auto_marked_received,
    created_at
  ) VALUES (
    NEW."Matrícula",
    NEW."Modelo",
    v_reception_date,
    v_has_photos,  -- Si tiene fotos = disponible
    CASE WHEN NEW."Disponibilidad" = 'VENDIDO' THEN TRUE ELSE FALSE END,
    v_has_photos,  -- Marca automática si tiene fotos
    NOW()
  )
  ON CONFLICT (license_plate) 
  DO UPDATE SET
    model = EXCLUDED.model,
    physical_reception_date = COALESCE(stock.physical_reception_date, EXCLUDED.physical_reception_date),
    is_available = CASE 
      WHEN EXCLUDED.is_available THEN TRUE
      ELSE stock.is_available
    END,
    updated_at = NOW();
  
  -- 3. FOTOS (si no existe)
  INSERT INTO fotos (
    license_plate,
    model,
    estado_pintura,
    photos_completed,
    physical_reception_date,
    is_available,
    auto_completed,
    paint_status_date
  ) VALUES (
    NEW."Matrícula",
    NEW."Modelo",
    CASE WHEN v_has_photos THEN 'completado' ELSE 'pendiente' END,
    v_has_photos,
    v_reception_date,
    v_has_photos,
    v_has_photos,
    NOW()
  )
  ON CONFLICT (license_plate) 
  DO UPDATE SET
    photos_completed = CASE 
      WHEN EXCLUDED.photos_completed THEN TRUE
      ELSE fotos.photos_completed
    END,
    physical_reception_date = COALESCE(fotos.physical_reception_date, EXCLUDED.physical_reception_date),
    is_available = CASE 
      WHEN EXCLUDED.is_available THEN TRUE
      ELSE fotos.is_available
    END;
  
  RAISE NOTICE 'Vehículo sincronizado: % (has_photos: %)', NEW."Matrícula", v_has_photos;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_sync_duc_to_all_tables ON duc_scraper;
CREATE TRIGGER trigger_sync_duc_to_all_tables
  AFTER INSERT OR UPDATE ON duc_scraper
  FOR EACH ROW
  EXECUTE FUNCTION sync_duc_to_all_tables();
```

---

### 2. Trigger: Fotos completadas → Marcar recibido

```sql
CREATE OR REPLACE FUNCTION auto_mark_received_on_photos_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_reception_date TIMESTAMP;
BEGIN
  -- Solo si se acaba de completar (cambio de false/null a true)
  IF NEW.photos_completed = TRUE 
     AND (OLD.photos_completed IS NULL OR OLD.photos_completed = FALSE) THEN
    
    -- Fecha de recepción: hace 2 días
    v_reception_date := NOW() - INTERVAL '2 days';
    
    -- Actualizar en fotos
    UPDATE fotos
    SET 
      physical_reception_date = v_reception_date,
      is_available = TRUE,
      auto_completed = TRUE,
      estado_pintura = 'completado'
    WHERE license_plate = NEW.license_plate;
    
    -- Actualizar en stock
    UPDATE stock
    SET 
      physical_reception_date = v_reception_date,
      is_available = TRUE,
      auto_marked_received = TRUE
    WHERE license_plate = NEW.license_plate;
    
    -- Marcar como recibido en nuevas_entradas (prevalece automático)
    UPDATE nuevas_entradas
    SET 
      is_received = TRUE,
      reception_date = v_reception_date
    WHERE license_plate = NEW.license_plate;
    
    RAISE NOTICE 'Vehículo marcado automáticamente como recibido (fotos): %', NEW.license_plate;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_mark_received ON fotos;
CREATE TRIGGER trigger_auto_mark_received
  AFTER UPDATE ON fotos
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_received_on_photos_complete();
```

---

### 3. Trigger: nuevas_entradas.is_received → Actualizar stock/fotos

```sql
CREATE OR REPLACE FUNCTION sync_received_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si cambia a recibido
  IF NEW.is_received = TRUE AND (OLD.is_received = FALSE OR OLD.is_received IS NULL) THEN
    
    -- Actualizar stock (solo si no fue automático)
    UPDATE stock
    SET 
      physical_reception_date = COALESCE(
        stock.physical_reception_date,  -- Prevalece si ya existe (automático)
        NEW.reception_date,
        NOW()
      ),
      is_available = TRUE
    WHERE license_plate = NEW.license_plate
      AND (stock.auto_marked_received = FALSE OR stock.auto_marked_received IS NULL);
    
    -- Actualizar fotos (solo si no fue automático)
    UPDATE fotos
    SET 
      physical_reception_date = COALESCE(
        fotos.physical_reception_date,  -- Prevalece si ya existe (automático)
        NEW.reception_date,
        NOW()
      ),
      is_available = TRUE
    WHERE license_plate = NEW.license_plate
      AND (fotos.auto_completed = FALSE OR fotos.auto_completed IS NULL);
    
    RAISE NOTICE 'Vehículo marcado como recibido manualmente: %', NEW.license_plate;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_received_status ON nuevas_entradas;
CREATE TRIGGER trigger_sync_received_status
  AFTER UPDATE ON nuevas_entradas
  FOR EACH ROW
  EXECUTE FUNCTION sync_received_status();
```

---

## 🎨 CAMBIOS EN UI

### 1. Stock Table - Nueva columna "Disponibilidad"

```typescript
// Agregar columna
{
  header: "Disponibilidad",
  cell: (item) => (
    <div className="flex items-center gap-2">
      {item.physical_reception_date ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm">
            Hace {calculateDays(item.physical_reception_date)} días
          </span>
        </>
      ) : (
        <>
          <Clock className="h-4 w-4 text-orange-500" />
          <span className="text-sm text-muted-foreground">
            En tránsito
          </span>
        </>
      )}
      
      {/* Botón toggle disponible */}
      <Button
        size="sm"
        variant={item.is_available ? "default" : "outline"}
        onClick={() => toggleAvailability(item.id)}
      >
        {item.is_available ? "Disponible" : "No disponible"}
      </Button>
    </div>
  )
}
```

---

### 2. Fotos Table - Botón disponibilidad

```typescript
// En cada fila de fotos pendientes
<Button
  size="sm"
  variant={foto.is_available ? "default" : "outline"}
  onClick={() => toggleFotoAvailability(foto.id)}
>
  {foto.is_available ? "Disponible" : "No disponible"}
</Button>
```

---

### 3. Filtros actualizados

```typescript
// Solo mostrar pendientes DISPONIBLES
const fotosPendientes = fotos.filter(f => 
  f.estado_pintura === 'pendiente' &&
  f.is_available === true &&  // ← NUEVO
  f.physical_reception_date !== null  // ← NUEVO
)

// Calcular días correctamente
const diasPendiente = f.physical_reception_date
  ? daysSince(f.physical_reception_date)
  : 0
```

---

## 📋 API ROUTES NUEVAS

### `/api/stock/toggle-availability`

```typescript
export async function POST(request: NextRequest) {
  const { id } = await request.json()
  
  const { data, error } = await supabase
    .from('stock')
    .update({ 
      is_available: supabase.raw('NOT is_available')
    })
    .eq('id', id)
    .select()
    .single()
  
  return NextResponse.json({ success: true, data })
}
```

### `/api/fotos/toggle-availability`

```typescript
export async function POST(request: NextRequest) {
  const { id } = await request.json()
  
  const { data, error } = await supabase
    .from('fotos')
    .update({ 
      is_available: supabase.raw('NOT is_available')
    })
    .eq('id', id)
    .select()
    .single()
  
  return NextResponse.json({ success: true, data })
}
```

---

## 🔄 ORDEN DE IMPLEMENTACIÓN

### Fase 1: Base de datos (30 min)
1. ✅ Ejecutar migración de columnas
2. ✅ Crear los 3 triggers nuevos
3. ✅ Probar con 1 vehículo de prueba

### Fase 2: Backend API (30 min)
1. ✅ API toggle availability (stock)
2. ✅ API toggle availability (fotos)
3. ✅ Actualizar queries existentes

### Fase 3: Frontend (1-2 horas)
1. ✅ Columna disponibilidad en stock
2. ✅ Botón toggle en stock
3. ✅ Botón toggle en fotos
4. ✅ Filtros actualizados (solo disponibles)
5. ✅ Cálculo de días desde physical_reception_date

### Fase 4: Testing (30 min)
1. ✅ Probar flujo automático (fotos)
2. ✅ Probar flujo manual (nuevas_entradas)
3. ✅ Probar toggle disponibilidad
4. ✅ Verificar contadores de días

---

## 🎯 RESULTADO FINAL

### Escenario A: Vehículo con fotos en DUC
```
1. Aparece en DUC con fotos
2. Trigger detecta fotos
3. Crea en stock + fotos + nuevas_entradas
4. physical_reception_date = hace 2 días
5. is_available = TRUE
6. photos_completed = TRUE
7. Contador días: ✅ Muestra "2 días"
```

### Escenario B: Vehículo sin fotos, se fotografía después
```
1. Aparece en DUC sin fotos
2. Crea en stock + fotos (pendiente)
3. physical_reception_date = NULL
4. is_available = FALSE
5. Contador días: ❌ No muestra
   ↓
6. Fotógrafo completa fotos
7. Trigger detecta photos_completed
8. physical_reception_date = hace 2 días
9. is_available = TRUE
10. Marca is_received en nuevas_entradas
11. Contador días: ✅ Muestra desde hace 2 días
```

### Escenario C: DEMO directo en Terrassa
```
1. Aparece en DUC (con fotos generalmente)
2. Trigger detecta fotos
3. Marca todo automáticamente
4. ✅ Aparece en fotos completadas
5. ✅ Días contando desde -2 días
```

---

¿Apruebas este plan? Si SÍ → Empiezo por Fase 1 (base de datos) 🚀

