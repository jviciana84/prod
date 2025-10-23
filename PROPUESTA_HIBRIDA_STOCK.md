# PROPUESTA HÍBRIDA: STOCK AUTOMÁTICO + CONFIRMACIÓN MANUAL

## 🎯 REALIDAD DEL PROBLEMA

❌ **No podemos confiar en los datos de ubicación de duc_scraper**
✅ **SÍ podemos confiar en que si está en DUC = está comprado**

---

## 💡 NUEVA PROPUESTA (Híbrida)

### Principio:
> "Lo automático que sea automático, lo manual que sea manual pero SIMPLE"

---

## 🔄 FLUJO HÍBRIDO PROPUESTO

### 1. AUTOMÁTICO (Sin intervención):
```
Coche aparece en DUC
    ↓
TRIGGER: Crea en stock automáticamente
    - license_plate, model
    - is_sold = false
    - location_status = 'pendiente_confirmar'  ← Estado inicial
    - source = 'duc_scraper'
```

### 2. MANUAL SIMPLE (Un solo click):
```
Usuario ve en dashboard:
    📋 "3 vehículos nuevos pendientes de confirmar"
    
Usuario abre lista:
    ✅ Click en "Está en Terrassa" → Crea fotos automáticamente
    ⏸️ Click en "Aún no llegó" → Se queda en stock sin fotos
    ❌ Click en "Error/No es nuestro" → Marca como ignorado
```

---

## 📊 NUEVA ESTRUCTURA

### Estados de `location_status`:
```
'pendiente_confirmar'  → Recién llegado de DUC, esperando confirmación
'en_terrassa'          → Confirmado en instalaciones (tiene fotos)
'en_transito'          → Confirmado que aún no llegó (sin fotos)
'ignorado'             → Error de DUC, no es nuestro
```

---

## 🖥️ INTERFAZ PROPUESTA

### Dashboard - Nueva tarjeta:
```
┌─────────────────────────────────────────┐
│ 🔔 Vehículos Pendientes de Confirmar   │
│                                          │
│ 3 vehículos necesitan confirmación      │
│                                          │
│ [Ver y Confirmar]                        │
└─────────────────────────────────────────┘
```

### Modal de Confirmación:
```
┌──────────────────────────────────────────────────┐
│ Confirmar Ubicación de Vehículos                │
├──────────────────────────────────────────────────┤
│                                                   │
│ 1. 1105JKB - Dokker                             │
│    Desde: 23/10/2025 (hace 3 horas)             │
│                                                   │
│    ✅ Está en Terrassa (crear fotos)             │
│    ⏸️ Aún en tránsito                            │
│    ❌ Ignorar (error DUC)                        │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│ 2. 9937KFV - Dokker                             │
│    Desde: 23/10/2025 (hace 3 horas)             │
│                                                   │
│    ✅ Está en Terrassa (crear fotos)             │
│    ⏸️ Aún en tránsito                            │
│    ❌ Ignorar (error DUC)                        │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## ⚡ VENTAJAS DE ESTE ENFOQUE

### Automático:
✅ Coche en DUC → Aparece en stock automáticamente
✅ No se pierde ningún vehículo
✅ No depende de "acordarse" de crear en nuevas_entradas

### Manual (pero simple):
✅ Usuario decide cuándo está realmente en Terrassa
✅ Un solo click por vehículo
✅ Proceso claro y rápido
✅ Se pueden procesar varios a la vez

### Sin riesgos:
✅ No confiamos en datos poco fiables de DUC
✅ Usuario tiene el control final
✅ Historial de decisiones (quién confirmó y cuándo)

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### Nuevas columnas en `stock`:
```sql
ALTER TABLE stock ADD COLUMN IF NOT EXISTS location_status VARCHAR(50) DEFAULT 'pendiente_confirmar';
ALTER TABLE stock ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE stock ADD COLUMN IF NOT EXISTS sync_date TIMESTAMP;
ALTER TABLE stock ADD COLUMN IF NOT EXISTS confirmed_by UUID;  -- quién confirmó
ALTER TABLE stock ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
ALTER TABLE stock ADD COLUMN IF NOT EXISTS duc_id VARCHAR(50);

COMMENT ON COLUMN stock.location_status IS 'pendiente_confirmar | en_terrassa | en_transito | ignorado';
```

---

## 🔧 TRIGGERS NECESARIOS

### 1. duc_scraper → stock (Automático):
```sql
CREATE OR REPLACE FUNCTION sync_duc_to_stock_simple()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."Matrícula" IS NOT NULL AND NEW."Modelo" IS NOT NULL THEN
    
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
      'pendiente_confirmar',  -- ← Siempre este estado inicial
      'duc_scraper',
      NOW(),
      NEW."ID Anuncio",
      FALSE,
      NOW()
    )
    ON CONFLICT (license_plate) 
    DO UPDATE SET 
      model = EXCLUDED.model,
      sync_date = NOW(),
      duc_id = EXCLUDED.duc_id,
      updated_at = NOW();
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 FLUJO DE USUARIO

### Escenario 1: Vehículo llega a Terrassa
```
1. Usuario abre dashboard
2. Ve: "3 vehículos pendientes"
3. Abre modal de confirmación
4. Ve: "1105JKB - Dokker"
5. Click en "✅ Está en Terrassa"
6. Sistema:
   - Actualiza: location_status = 'en_terrassa'
   - Guarda: confirmed_by = usuario_id, confirmed_at = NOW()
   - Crea automáticamente en fotos con estado 'pendiente'
7. Notificación: "✅ Vehículo confirmado y añadido a fotos pendientes"
```

### Escenario 2: Vehículo aún en tránsito
```
1-4. Igual que arriba
5. Click en "⏸️ Aún en tránsito"
6. Sistema:
   - Actualiza: location_status = 'en_transito'
   - Guarda: confirmed_by = usuario_id, confirmed_at = NOW()
   - NO crea en fotos
7. Notificación: "✅ Marcado como en tránsito. Se puede confirmar más tarde."
```

### Escenario 3: DEMO en Terrassa (caso problemático actual)
```
1. DEMO se matricula directamente en Terrassa
2. Aparece en DUC al día siguiente
3. Scraper lo detecta → Crea en stock con 'pendiente_confirmar'
4. Usuario ve la alerta de pendiente
5. Usuario confirma "✅ Está en Terrassa"
6. Sistema crea automáticamente en fotos
7. ✅ RESUELTO: Ya no se pierde
```

---

## 📋 API ROUTES NECESARIAS

### `/api/stock/confirm-location`
```typescript
POST /api/stock/confirm-location
{
  vehicle_id: "uuid",
  location_status: "en_terrassa" | "en_transito" | "ignorado"
}

Acciones:
- Actualizar stock.location_status
- Guardar confirmed_by y confirmed_at
- Si "en_terrassa": crear en fotos automáticamente
```

---

## 🎯 COMPARACIÓN

### ❌ Antes (Actual):
```
Coche en DUC
  → Usuario debe recordar crear en nuevas_entradas
  → Usuario debe recordar marcar "recibido"
  → ENTONCES aparece en stock
  → ENTONCES aparece en fotos

Problemas:
- Se olvidan vehículos (DEMOS)
- Doble proceso manual
- Sin visibilidad de inventario completo
```

### ✅ Después (Propuesta):
```
Coche en DUC
  → Aparece automáticamente en stock
  → Usuario recibe notificación
  → Un click para confirmar ubicación
  → Si en Terrassa: fotos automáticas

Ventajas:
- Cero vehículos perdidos
- Un solo paso manual (simple)
- Inventario completo visible
- Historial de quién confirmó
```

---

## 🚀 IMPLEMENTACIÓN

### Fase 1: Backend (1-2 horas)
1. ✅ Agregar columnas a `stock`
2. ✅ Crear trigger `duc_scraper → stock`
3. ✅ API route para confirmar ubicación
4. ✅ Lógica para crear fotos al confirmar

### Fase 2: Frontend (1-2 horas)
1. ✅ Tarjeta en dashboard con contador
2. ✅ Modal de confirmación
3. ✅ Botones de acción (3 opciones)
4. ✅ Notificaciones de éxito

### Fase 3: Migración (30 min)
1. ✅ Ejecutar migraciones
2. ✅ Marcar datos existentes como 'en_terrassa'
3. ✅ Sincronizar con DUC actual

---

## 🤔 DECISIÓN FINAL

Esta propuesta híbrida:
- ✅ NO confía en datos poco fiables de DUC
- ✅ Automatiza lo que SÍ es confiable (que está comprado)
- ✅ Deja decisión de ubicación al usuario
- ✅ Hace el proceso manual LO MÁS SIMPLE POSIBLE
- ✅ Resuelve el caso de DEMOS
- ✅ Evita pérdida de vehículos

---

## ❓ SIGUIENTE PASO

¿Te convence este enfoque híbrido?

Si SÍ → Empiezo a implementar (backend primero)
Si NO → Dime qué ajustar o qué otra idea tienes

🤔

