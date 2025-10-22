# 🌊 ANÁLISIS EN CASCADA - FLUJO DE DATOS CVO
**Análisis detallado tabla por tabla - Flujo vertical y horizontal**

---

## 📌 CONCEPTO: CASCADA DE DATOS

```
VERTICAL (↓)   = Flujo secuencial tabla → tabla (padre → hijo)
HORIZONTAL (→) = Relaciones entre tablas del mismo nivel
TRIGGER (⚡)   = Automatización que alimenta otras tablas
MANUAL (✋)    = Usuario introduce/actualiza datos
```

---

## 🎯 NIVEL 0: ORIGEN DE DATOS (FUENTES EXTERNAS)

### 🤖 SCRAPER DUC
**Fuente Externa:** https://gestionbmw.motorflash.com  
**Frecuencia:** Cada 8 horas (09:00-18:00)  
**Método:** Automatizado (Python + Selenium)

```
┌────────────────────────────────────────┐
│   WEB DUC (Sistema Externo)            │
│   140 vehículos publicados             │
└────────────────────────────────────────┘
              ↓ Scraper Python
┌────────────────────────────────────────┐
│   CSV Descargado                       │
│   dist/data/duc/stock_551_*.csv        │
└────────────────────────────────────────┘
              ↓ process_duc_csv()
┌────────────────────────────────────────┐
│   📊 TABLA: duc_scraper                │
│   Tipo: BRUTA (Staging)                │
│   Registros: ~140                      │
└────────────────────────────────────────┘
```

**Datos que almacena:**
```sql
duc_scraper {
  "ID Anuncio": "12345" (PK)
  "Matrícula": "1234ABC"
  "Modelo": "BMW 320d"
  "Disponibilidad": "DISPONIBLE" | "RESERVADO" | "VENDIDO"
  "Precio": 25000.00
  "Kilómetros": 50000
  "Combustible": "Diesel"
  -- + 85 columnas más
  import_date: "2025-10-21 17:47:54"
  last_seen_date: "2025-10-21 17:47:54"
}
```

**¿Cómo se alimenta?**
1. Scraper descarga CSV
2. Pandas procesa CSV
3. Se ELIMINAN todos los registros anteriores
4. Se INSERTAN los 140 nuevos registros

**⚠️ PROBLEMA CRÍTICO:**
Esta tabla **NO alimenta automáticamente a stock**. Es una tabla aislada.

---

### 🤖 SCRAPER CMS (MM y MMC)
**Fuente Externa:** https://cmsweb.cmsseguros.es  
**Frecuencia:** Cada 8 horas  
**Método:** Automatizado (Python + Selenium)

```
┌────────────────────────────────────────┐
│   WEB CMS (Sistema Externo)            │
│   Garantías de vehículos vendidos      │
└────────────────────────────────────────┘
              ↓ Scraper Python
┌────────────────────────────────────────┐
│   Excel Descargado                     │
│   dist/data/cms/garantias_mm.xlsx      │
└────────────────────────────────────────┘
              ↓ process_cms_excel()
┌────────────────────────────────────────┐
│   📊 TABLA: garantias_brutas_mm        │
│   📊 TABLA: garantias_brutas_mmc       │
│   Tipo: BRUTA (Staging)                │
└────────────────────────────────────────┘
              ↓ ⚡ TRIGGER
┌────────────────────────────────────────┐
│   📊 TABLA: incentivos                 │
│   Campo auto-actualizado: garantia     │
└────────────────────────────────────────┘
```

**Datos que almacena:**
```sql
garantias_brutas_mm {
  id: 1
  "Nº Póliza": "POL-12345"
  "Matrícula": "1234ABC"
  "Marca": "BMW"
  "Modelo": "320d"
  "Años G.F.": 2
  "Prima Total": 850.00  ← ESTE VALOR ALIMENTA INCENTIVOS
  "Login": "bmw100195"
  "Concesionario": "MUNICH MOTOR"
  created_at: "2025-10-21 17:30:00"
}
```

**Flujo HORIZONTAL → incentivos:**
```
garantias_brutas_mm INSERT
  ↓ ⚡ TRIGGER: update_garantia_incentivos()
  ↓ Busca: incentivos WHERE matricula = "1234ABC"
  ↓ Si encuentra Y garantia IS NULL
  ↓ UPDATE incentivos SET garantia = 850.00
```

---

## 🎯 NIVEL 1: ENTRADA MANUAL (USUARIO CREA VEHÍCULO)

### ✋ NUEVAS ENTRADAS
**Alimentación:** MANUAL (usuario en interfaz)  
**Página:** `/dashboard/nuevas-entradas`

```
┌────────────────────────────────────────┐
│   👤 USUARIO crea nueva entrada        │
│   Formulario: license_plate, model,   │
│              purchase_date, etc.       │
└────────────────────────────────────────┘
              ↓ API: /api/transport/create
┌────────────────────────────────────────┐
│   📊 TABLA: nuevas_entradas            │
│   Estado inicial: is_received = FALSE │
│   Tipo: OPERACIONAL                    │
└────────────────────────────────────────┘
```

**Ejemplo de registro:**
```sql
INSERT INTO nuevas_entradas {
  id: "uuid-123"
  license_plate: "1234ABC"
  model: "BMW 320d"
  vehicle_type: "Turismo"
  purchase_date: "2025-10-15"
  purchase_price: 20000.00
  is_received: FALSE  ← CLAVE
  expense_type_id: 3  ← FK a expense_types
  expense_charge: "Gasto Directo"
  status: "pendiente"
  created_at: "2025-10-21 10:00:00"
}
```

**Estado del sistema:**
```
nuevas_entradas: 1 registro
stock: 0 registros (aún no)
fotos: 0 registros (aún no)
```

---

## 🎯 NIVEL 2: RECEPCIÓN (TRIGGER CASCADE VERTICAL)

### ⚡ TRIGGER: Recepción del Vehículo
**Disparador:** Usuario marca `is_received = TRUE`  
**API:** `/api/transport/update`

```
┌────────────────────────────────────────┐
│   👤 USUARIO marca "Recibido"          │
│   Botón en interfaz                    │
└────────────────────────────────────────┘
              ↓ API: /api/transport/update
┌────────────────────────────────────────┐
│   📊 nuevas_entradas                   │
│   UPDATE is_received = TRUE            │
└────────────────────────────────────────┘
              ↓ ⚡ TRIGGER 1: nuevas_entradas_to_stock()
┌────────────────────────────────────────┐
│   📊 TABLA: stock                      │
│   INSERT nuevo registro                │
│   Estado: todos pendiente              │
└────────────────────────────────────────┘
              ↓ ⚡ TRIGGER 2: handle_vehicle_received()
┌────────────────────────────────────────┐
│   📊 TABLA: fotos                      │
│   INSERT nuevo registro                │
│   estado_pintura: pendiente            │
└────────────────────────────────────────┘
```

**Ejemplo paso a paso:**

**ANTES:**
```sql
-- nuevas_entradas
{ id: "uuid-123", license_plate: "1234ABC", is_received: FALSE }

-- stock: (vacío)
-- fotos: (vacío)
```

**ACCIÓN:**
```sql
UPDATE nuevas_entradas 
SET is_received = TRUE 
WHERE id = "uuid-123"
```

**TRIGGER 1 ejecuta:**
```sql
INSERT INTO stock (
  license_plate,
  model,
  reception_date,
  expense_charge,
  expense_type_id,
  paint_status,
  body_status,
  mechanical_status,
  nuevas_entradas_id
) VALUES (
  "1234ABC",
  "BMW 320d",
  NOW(),  -- 2025-10-21 10:30:00
  "Gasto Directo",
  3,
  "pendiente",  ← Estados por defecto
  "pendiente",
  "pendiente",
  "uuid-123"  ← FK a nuevas_entradas
)
```

**TRIGGER 2 ejecuta:**
```sql
INSERT INTO fotos (
  license_plate,
  model,
  disponible,
  estado_pintura,
  paint_status_date,
  nuevas_entradas_id
) VALUES (
  "1234ABC",
  "BMW 320d",
  NOW(),  -- 2025-10-21 10:30:00
  "pendiente",  ← Estado por defecto
  NOW(),
  "uuid-123"  ← FK a nuevas_entradas
)
```

**DESPUÉS:**
```sql
-- nuevas_entradas
{ id: "uuid-123", license_plate: "1234ABC", is_received: TRUE }

-- stock (NUEVO)
{ id: "uuid-456", license_plate: "1234ABC", paint_status: "pendiente" }

-- fotos (NUEVO)
{ id: 789, license_plate: "1234ABC", estado_pintura: "pendiente" }
```

**Estado del sistema:**
```
nuevas_entradas: 1 registro (is_received=TRUE)
stock: 1 registro (3 estados pendientes)
fotos: 1 registro (estado_pintura pendiente)
```

---

## 🎯 NIVEL 3: INSPECCIÓN (CASCADE VERTICAL + HORIZONTAL)

### ✋ Usuario Inspecciona Vehículo
**Página:** `/dashboard/vehicles`  
**Componente:** `stock-table.tsx`

```
┌────────────────────────────────────────┐
│   👤 MECÁNICO inspecciona vehículo     │
│   Actualiza estados en tabla           │
└────────────────────────────────────────┘
              ↓ API: /api/stock/update-body-status
┌────────────────────────────────────────┐
│   📊 TABLA: stock                      │
│   UPDATE body_status = "apto"          │
│   UPDATE body_status_date = NOW()      │
└────────────────────────────────────────┘
              ↓ ⚡ TRIGGER: sync_body_status_to_paint_status()
┌────────────────────────────────────────┐
│   📊 TABLA: fotos (HORIZONTAL)         │
│   UPDATE estado_pintura = "apto"       │
│   UPDATE paint_status_date = NOW()     │
└────────────────────────────────────────┘
```

**Ejemplo paso a paso:**

**ANTES:**
```sql
-- stock
{
  id: "uuid-456",
  license_plate: "1234ABC",
  paint_status: "pendiente",
  body_status: "pendiente",  ← Vamos a cambiar esto
  mechanical_status: "pendiente",
  inspection_date: NULL
}

-- fotos
{
  id: 789,
  license_plate: "1234ABC",
  estado_pintura: "pendiente"
}
```

**ACCIÓN 1: Usuario actualiza body_status**
```sql
POST /api/stock/update-body-status
Body: { id: "uuid-456", newStatus: "apto" }

-- API ejecuta:
UPDATE stock 
SET 
  body_status = "apto",
  body_status_date = NOW(),
  inspection_date = NOW()  -- Primera inspección
WHERE id = "uuid-456"
```

**TRIGGER ejecuta automáticamente:**
```sql
-- TRIGGER: sync_body_status_to_paint_status()
UPDATE fotos 
SET 
  estado_pintura = "apto",
  paint_status_date = NOW(),  -- 2025-10-21 11:00:00
  paint_apto_date = NOW()
WHERE license_plate = "1234ABC"
```

**DESPUÉS:**
```sql
-- stock
{
  id: "uuid-456",
  license_plate: "1234ABC",
  paint_status: "pendiente",
  body_status: "apto",  ✅ ACTUALIZADO
  body_status_date: "2025-10-21 11:00:00",
  mechanical_status: "pendiente",
  inspection_date: "2025-10-21 11:00:00"  ✅ PRIMERA VEZ
}

-- fotos (ACTUALIZADO AUTOMÁTICAMENTE)
{
  id: 789,
  license_plate: "1234ABC",
  estado_pintura: "apto",  ✅ SINCRONIZADO
  paint_status_date: "2025-10-21 11:00:00",
  paint_apto_date: "2025-10-21 11:00:00"
}
```

**Flujo HORIZONTAL (stock ↔ fotos):**
```
stock.body_status cambia → fotos.estado_pintura se sincroniza
(mismo nivel, pero conectados por matrícula)
```

---

## 🎯 NIVEL 4: REPARACIONES (SI NECESARIAS)

### ✋ Usuario Asigna Taller
**Página:** `/dashboard/vehicles`

```
┌────────────────────────────────────────┐
│   👤 USUARIO asigna centro de trabajo  │
└────────────────────────────────────────┘
              ↓ API: /api/stock/update-work-center
┌────────────────────────────────────────┐
│   📊 TABLA: stock                      │
│   UPDATE work_center = "terrassa"      │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│   👤 USUARIO asigna OR (taller)        │
└────────────────────────────────────────┘
              ↓ API: /api/stock/update-or
┌────────────────────────────────────────┐
│   📊 TABLA: stock                      │
│   UPDATE work_order = "OR-2025-001"    │
└────────────────────────────────────────┘
```

**Ejemplo:**
```sql
-- ANTES
{
  license_plate: "1234ABC",
  work_center: NULL,
  work_order: NULL
}

-- ACCIÓN 1
UPDATE stock SET work_center = "terrassa" WHERE id = "uuid-456"

-- ACCIÓN 2
UPDATE stock SET work_order = "OR-2025-001" WHERE id = "uuid-456"

-- DESPUÉS
{
  license_plate: "1234ABC",
  work_center: "terrassa",  ✅
  work_order: "OR-2025-001"  ✅
}
```

**No hay cascade aquí, solo actualización directa en stock**

---

## 🎯 NIVEL 5: FOTOGRAFÍA (HORIZONTAL)

### ✋ Asignación de Fotógrafo
**Página:** `/dashboard/photos`

```
┌────────────────────────────────────────┐
│   👤 COORDINADOR asigna fotógrafo      │
└────────────────────────────────────────┘
              ↓ API: /api/photos/assign-photographer
┌────────────────────────────────────────┐
│   📊 TABLA: fotos                      │
│   UPDATE photographer_id = "user-789"  │
└────────────────────────────────────────┘
              ↓ (opcional, a veces se actualiza)
┌────────────────────────────────────────┐
│   📊 TABLA: stock (HORIZONTAL)         │
│   UPDATE photographer_id = "user-789"  │
└────────────────────────────────────────┘
```

### ✋ Completar Fotografías
```
┌────────────────────────────────────────┐
│   👤 FOTÓGRAFO completa sesión         │
└────────────────────────────────────────┘
              ↓ API: /api/photos/update-status
┌────────────────────────────────────────┐
│   📊 TABLA: fotos                      │
│   UPDATE photos_completed = TRUE       │
│   UPDATE photos_completed_date = NOW() │
└────────────────────────────────────────┘
              ↓ (a veces se sincroniza)
┌────────────────────────────────────────┐
│   📊 TABLA: stock (HORIZONTAL)         │
│   UPDATE photos_completed = TRUE       │
└────────────────────────────────────────┘
```

**Ejemplo:**
```sql
-- ANTES
-- fotos
{
  license_plate: "1234ABC",
  estado_pintura: "apto",
  photographer_id: NULL,
  photos_completed: FALSE
}

-- ACCIÓN 1: Asignar fotógrafo
UPDATE fotos SET photographer_id = "user-789" WHERE license_plate = "1234ABC"

-- ACCIÓN 2: Marcar completado
UPDATE fotos SET 
  photos_completed = TRUE,
  photos_completed_date = NOW()
WHERE license_plate = "1234ABC"

-- DESPUÉS
{
  license_plate: "1234ABC",
  estado_pintura: "apto",
  photographer_id: "user-789",  ✅
  photos_completed: TRUE,  ✅
  photos_completed_date: "2025-10-21 14:00:00"
}
```

---

## 🎯 NIVEL 6: VENTA (CASCADE VERTICAL CRÍTICO)

### ✋ Usuario Crea Venta
**Página:** `/dashboard/ventas`

```
┌────────────────────────────────────────┐
│   👤 ASESOR crea venta                 │
│   Formulario completo con datos        │
│   del cliente y vehículo               │
└────────────────────────────────────────┘
              ↓ API: /api/sales/create-quick
┌────────────────────────────────────────┐
│   📊 TABLA: sales_vehicles             │
│   INSERT nueva venta                   │
└────────────────────────────────────────┘
              ↓ ⚡ TRIGGER: sync_stock_on_sale_insert()
┌────────────────────────────────────────┐
│   📊 TABLA: stock                      │
│   UPDATE is_sold = TRUE                │
│   UPDATE updated_at = NOW()            │
└────────────────────────────────────────┘
```

**Ejemplo detallado:**

**ANTES:**
```sql
-- stock
{
  id: "uuid-456",
  license_plate: "1234ABC",
  model: "BMW 320d",
  is_sold: FALSE,  ← CLAVE
  paint_status: "apto",
  body_status: "apto",
  mechanical_status: "apto",
  photos_completed: TRUE
}

-- sales_vehicles: (vacío)
```

**ACCIÓN:**
```sql
POST /api/sales/create-quick
Body: {
  salesData: {
    license_plate: "1234ABC",
    model: "BMW 320d",
    sale_date: NOW(),
    advisor: "Juan Pérez",
    price: 25000.00,
    payment_method: "financiado",
    client_name: "Cliente Test",
    client_dni: "12345678A",
    client_email: "cliente@test.com",
    client_phone: "600123456"
  }
}

-- API ejecuta:
INSERT INTO sales_vehicles {
  id: "sale-uuid-123",
  license_plate: "1234ABC",
  model: "BMW 320d",
  sale_date: "2025-10-21 15:00:00",
  advisor: "Juan Pérez",
  price: 25000.00,
  payment_method: "financiado",
  payment_status: "pendiente",
  client_name: "Cliente Test",
  client_dni: "12345678A",
  client_email: "cliente@test.com",
  client_phone: "600123456",
  stock_id: "uuid-456",  ← FK a stock
  created_at: NOW()
}
```

**TRIGGER ejecuta automáticamente:**
```sql
-- TRIGGER: sync_stock_on_sale_insert()
UPDATE stock 
SET 
  is_sold = TRUE,  ← MARCA COMO VENDIDO
  updated_at = NOW()
WHERE license_plate = "1234ABC"
```

**DESPUÉS:**
```sql
-- stock
{
  id: "uuid-456",
  license_plate: "1234ABC",
  is_sold: TRUE,  ✅ VENDIDO
  updated_at: "2025-10-21 15:00:00"
}

-- sales_vehicles (NUEVO)
{
  id: "sale-uuid-123",
  license_plate: "1234ABC",
  sale_date: "2025-10-21 15:00:00",
  advisor: "Juan Pérez",
  price: 25000.00,
  stock_id: "uuid-456"  ← Conectado con stock
}
```

**Impacto en el sistema:**
```
✅ Vehículo desaparece de listados "Disponibles"
✅ Aparece en pestaña "Vendidos"
✅ Scraper DUC lo marcará como "RESERVADO" en próxima ejecución
✅ Vehículo NO se puede vender de nuevo (por ahora)
```

---

## 🎯 NIVEL 7: ENTREGA (CASCADE VERTICAL)

### ✋ Usuario Registra Entrega
**Página:** `/dashboard/entregas`

```
┌────────────────────────────────────────┐
│   👤 USUARIO agenda entrega            │
└────────────────────────────────────────┘
              ↓ API: /api/entregas/create
┌────────────────────────────────────────┐
│   📊 TABLA: entregas                   │
│   INSERT nueva entrega                 │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│   👤 USUARIO confirma entrega          │
└────────────────────────────────────────┘
              ↓ API: /api/entregas/confirm
┌────────────────────────────────────────┐
│   📊 TABLA: entregas                   │
│   UPDATE confirmada = TRUE             │
│   UPDATE fecha_entrega = NOW()         │
└────────────────────────────────────────┘
              ↓ (manual o trigger)
┌────────────────────────────────────────┐
│   📊 TABLA: fotos (HORIZONTAL)         │
│   UPDATE photos_completed = TRUE       │
└────────────────────────────────────────┘
```

**Ejemplo:**
```sql
-- ANTES
-- sales_vehicles
{ id: "sale-uuid-123", license_plate: "1234ABC" }

-- entregas: (vacío)

-- fotos
{ license_plate: "1234ABC", photos_completed: TRUE }

-- ACCIÓN 1: Crear entrega
INSERT INTO entregas {
  id: "entrega-uuid-1",
  license_plate: "1234ABC",
  sale_id: "sale-uuid-123",
  fecha_entrega: NULL,  ← Pendiente
  confirmada: FALSE,
  created_at: NOW()
}

-- ACCIÓN 2: Confirmar entrega
UPDATE entregas 
SET 
  confirmada = TRUE,
  fecha_entrega = NOW()
WHERE id = "entrega-uuid-1"

-- DESPUÉS
-- entregas
{
  id: "entrega-uuid-1",
  license_plate: "1234ABC",
  fecha_entrega: "2025-10-25 10:00:00",  ✅
  confirmada: TRUE  ✅
}
```

---

## 🎯 NIVEL 8: INCENTIVOS (CASCADE HORIZONTAL COMPLEJO)

### ✋ Usuario Crea Incentivo + ⚡ Auto-cálculo
**Página:** `/dashboard/incentivos`

```
┌────────────────────────────────────────┐
│   👤 USUARIO crea incentivo            │
│   Datos de venta y gastos              │
└────────────────────────────────────────┘
              ↓ API: /api/incentivos/create
┌────────────────────────────────────────┐
│   📊 TABLA: incentivos                 │
│   INSERT nuevo incentivo               │
│   Campo garantia = NULL                │
└────────────────────────────────────────┘
              ↓ ⚡ TRIGGER: update_garantia_incentivos()
┌────────────────────────────────────────┐
│   📊 TABLA: garantias_brutas_mm        │
│   SELECT "Prima Total"                 │
│   WHERE "Matrícula" = matricula        │
└────────────────────────────────────────┘
              ↓ (si no encuentra en MM)
┌────────────────────────────────────────┐
│   📊 TABLA: garantias_brutas_mmc       │
│   SELECT "Prima Total"                 │
│   WHERE "Matrícula" = matricula        │
└────────────────────────────────────────┘
              ↓ (si encuentra)
┌────────────────────────────────────────┐
│   📊 TABLA: incentivos                 │
│   UPDATE garantia = "Prima Total"      │
└────────────────────────────────────────┘
```

**Ejemplo paso a paso:**

**ESTADO PREVIO:**
```sql
-- garantias_brutas_mm (ya existe del scraper CMS)
{
  id: 50,
  "Matrícula": "1234ABC",
  "Prima Total": 850.00,  ← Este valor se usará
  created_at: "2025-10-20 17:30:00"
}
```

**ACCIÓN:**
```sql
POST /api/incentivos/create
Body: {
  matricula: "1234ABC",
  modelo: "BMW 320d",
  fecha_entrega: "2025-10-25",
  precio_venta: 25000.00,
  precio_compra: 20000.00,
  dias_stock: 10,
  gastos_estructura: 500.00,
  garantia: NULL  ← Vacío, será auto-calculado
}

-- API ejecuta:
INSERT INTO incentivos {
  id: 1,
  matricula: "1234ABC",
  modelo: "BMW 320d",
  fecha_entrega: "2025-10-25",
  precio_venta: 25000.00,
  precio_compra: 20000.00,
  dias_stock: 10,
  gastos_estructura: 500.00,
  garantia: NULL,  ← VACÍO
  created_at: NOW()
}
```

**TRIGGER ejecuta automáticamente:**
```sql
-- TRIGGER: update_garantia_incentivos()

-- Paso 1: Buscar en garantias_brutas_mm
SELECT "Prima Total" INTO prima_total
FROM garantias_brutas_mm
WHERE TRIM("Matrícula") = "1234ABC"
AND "Prima Total" IS NOT NULL
LIMIT 1

-- Resultado: prima_total = 850.00

-- Paso 2: Actualizar incentivo
UPDATE incentivos 
SET 
  garantia = 850.00,  ← AUTO-CALCULADO
  updated_at = NOW()
WHERE id = 1
```

**DESPUÉS:**
```sql
-- incentivos
{
  id: 1,
  matricula: "1234ABC",
  precio_venta: 25000.00,
  precio_compra: 20000.00,
  garantia: 850.00,  ✅ AUTO-CALCULADO desde CMS
  gastos_estructura: 500.00,
  margen: 3150.00,  ← Calculado: 25000 - 20000 - 850 - 500
  importe_total: XX  ← Calculado según configuración
}
```

**Flujo HORIZONTAL complejo:**
```
garantias_brutas_mm/mmc (datos del scraper CMS)
  → TRIGGER busca por matrícula
  → incentivos.garantia se actualiza automáticamente
```

---

## 🎯 NIVEL 9: RECOGIDAS (TABLA INDEPENDIENTE)

### ✋ Usuario Solicita Recogida
**Página:** `/dashboard/recogidas`

```
┌────────────────────────────────────────┐
│   👤 USUARIO solicita recogida         │
│   Documentación de vehículo vendido    │
└────────────────────────────────────────┘
              ↓ API: /api/recogidas/create
┌────────────────────────────────────────┐
│   📊 TABLA: recogidas_historial        │
│   INSERT nueva solicitud               │
│   No alimenta otras tablas             │
└────────────────────────────────────────┘
```

**Ejemplo:**
```sql
INSERT INTO recogidas_historial {
  id: 1,
  matricula: "1234ABC",
  mensajeria: "MRW",
  centro_recogida: "Terrassa",
  materiales: ["Permiso Circulación", "Llaves", "Manual"],
  nombre_cliente: "Cliente Test",
  direccion_cliente: "Calle Test 123",
  codigo_postal: "08222",
  ciudad: "Terrassa",
  provincia: "Barcelona",
  telefono: "600123456",
  email: "cliente@test.com",
  usuario_solicitante: "Juan Pérez",
  usuario_solicitante_id: "user-123",
  estado: "solicitada",
  fecha_solicitud: NOW()
}
```

**No hay cascade aquí, es una tabla independiente para gestión logística**

---

## 📊 RESUMEN: MAPA COMPLETO DE CASCADAS

### CASCADE VERTICAL (Flujo Secuencial)

```
NIVEL 0: SCRAPERS (Externos)
├─ duc_scraper ⚠️ NO CONECTADO
└─ garantias_brutas_mm/mmc

NIVEL 1: ENTRADA MANUAL
nuevas_entradas (is_received=FALSE)
    ↓ ⚡ TRIGGER (is_received=TRUE)

NIVEL 2: RECEPCIÓN AUTOMÁTICA
├─ stock (INSERT)
└─ fotos (INSERT)

NIVEL 3: INSPECCIÓN
stock (UPDATE estados)
    ↓ ⚡ TRIGGER (body_status)
fotos (UPDATE estado_pintura)

NIVEL 4: REPARACIONES
stock (UPDATE work_center, work_order)

NIVEL 5: FOTOGRAFÍA
fotos (UPDATE photographer_id, photos_completed)

NIVEL 6: VENTA
sales_vehicles (INSERT)
    ↓ ⚡ TRIGGER
stock (UPDATE is_sold=TRUE)

NIVEL 7: ENTREGA
entregas (INSERT + UPDATE confirmada)

NIVEL 8: INCENTIVOS
incentivos (INSERT)
    ↓ ⚡ TRIGGER busca en
garantias_brutas_mm/mmc
    ↓
incentivos (UPDATE garantia)

NIVEL 9: RECOGIDAS
recogidas_historial (Independiente)
```

### CASCADE HORIZONTAL (Relaciones mismo nivel)

```
stock ←→ fotos
  - Sincronización de estados (body_status ↔ estado_pintura)
  - Sincronización de fotógrafo
  - Sincronización photos_completed

sales_vehicles ←→ stock
  - FK: stock_id
  - Trigger: is_sold

incentivos ←→ garantias_brutas_mm/mmc
  - Match por matrícula
  - Trigger auto-calcula garantia

nuevas_entradas → stock → sales_vehicles
  - FK: nuevas_entradas_id en stock
  - FK: stock_id en sales_vehicles
```

---

## ⚠️ PROBLEMAS EN LA CASCADA

### 1. CASCADA ROTA: duc_scraper → stock
```
❌ duc_scraper NO alimenta automáticamente a stock
❌ Vehículos RESERVADOS en DUC siguen como disponibles en stock
❌ Requiere sincronización MANUAL o script

Solución necesaria:
- Crear trigger o scheduled job
- Sincronizar duc_scraper.Disponibilidad → stock.is_sold
```

### 2. NO HAY REVERSA: Eliminar venta
```
✅ DELETE sales_vehicles → stock.is_sold = FALSE (funciona)
⚠️ Pero si el vehículo se recompra y revende, falla (UNIQUE constraint)
```

### 3. CASCADA OPCIONAL: fotos → stock
```
⚠️ A veces photos_completed se actualiza en fotos
⚠️ A veces se actualiza también en stock
⚠️ No hay consistencia garantizada
```

---

## 🔋 NIVEL 6: CONTROL DE BATERÍAS (BEV/PHEV)

### 📊 TABLA: battery_control
**Propósito:** Monitoreo y control de estado de baterías de vehículos eléctricos e híbridos enchufables  
**Tipo:** Operacional + Datos combinados (duc_scraper + manual)  
**Origen:** Automático desde duc_scraper + Edición manual

```
┌────────────────────────────────────────┐
│   📊 TABLA: duc_scraper                │
│   Filtro: Tipo motor BEV/PHEV         │
│   Vehículos eléctricos: ~30-40        │
└────────────────────────────────────────┘
              ↓ Sincronización automática
┌────────────────────────────────────────┐
│   📊 TABLA: battery_control            │
│   Tipo: Operacional                    │
│   Registros: Vehículos BEV/PHEV        │
└────────────────────────────────────────┘
              ↓ Consulta estado
┌────────────────────────────────────────┐
│   📊 TABLA: sales_vehicles             │
│   Marca vehículos como vendidos        │
└────────────────────────────────────────┘
```

**Estructura de la tabla:**
```sql
battery_control {
  -- Identificación del vehículo
  id: UUID (PK)
  vehicle_chassis: TEXT (UNIQUE, NOT NULL) -- Chasis del vehículo
  vehicle_ecode: TEXT                      -- Código e-code
  vehicle_plate: TEXT                      -- Matrícula
  vehicle_brand: TEXT                      -- Marca (BMW/MINI)
  vehicle_model: TEXT                      -- Modelo
  vehicle_color: TEXT                      -- Color carrocería
  vehicle_body: TEXT                       -- Tipo carrocería
  vehicle_type: TEXT                       -- Tipo: BEV | PHEV | ICE
  
  -- Estado de la batería
  battery_level: NUMERIC                   -- Nivel batería (kWh)
  battery_voltage: NUMERIC                 -- Voltaje (V)
  battery_current: NUMERIC                 -- Corriente (A)
  charge_percentage: INTEGER DEFAULT 0     -- % de carga (0-100)
  
  -- Control y seguimiento
  status: TEXT DEFAULT 'pendiente'         -- 'pendiente' | 'revisado'
  status_date: TIMESTAMPTZ                 -- Fecha último cambio estado
  is_charging: BOOLEAN DEFAULT FALSE       -- ¿Está cargando?
  is_sold: BOOLEAN DEFAULT FALSE           -- ¿Está vendido?
  observations: TEXT                       -- Observaciones libres
  
  -- Auditoría
  created_at: TIMESTAMPTZ DEFAULT NOW()
  updated_at: TIMESTAMPTZ DEFAULT NOW()
  updated_by: UUID (FK → auth.users)
}
```

**Flujo de datos:**

### 1. CARGA AUTOMÁTICA (duc_scraper → battery_control)
```javascript
// Al cargar la página, se ejecuta loadData()

// PASO 1: Consultar vehículos BEV/PHEV desde duc_scraper
const { data: ducVehicles } = await supabase
  .from("duc_scraper")
  .select(`"Chasis", "e-code", "Matrícula", "Marca", "Modelo", 
           "Color Carrocería", "Carrocería", "Tipo motor", "Combustible"`)
  .or('"Tipo motor".ilike.%BEV%,"Tipo motor".ilike.%PHEV%,
       "Combustible".ilike.%eléctric%')

// PASO 2: Verificar y actualizar tipos existentes (OPTIMIZADO)
// Se obtienen TODOS los datos en UNA consulta con .in()
const { data: ducVehiclesData } = await supabase
  .from("duc_scraper")
  .select(`"Chasis", "Tipo motor", "Combustible", "Modelo", "Marca"`)
  .in("Chasis", chassisToCheck)

// Detección de tipo PRIORIZADA:
// 1º "Tipo motor" (más confiable)
// 2º "Combustible" 
// 3º Por defecto: ICE

// Actualizaciones en BATCH (paralelo con Promise.all)
await Promise.all(
  updatesToProcess.map(update =>
    supabase
      .from("battery_control")
      .update({ vehicle_type: update.newType })
      .eq("id", update.id)
  )
)

// PASO 3: Insertar nuevos vehículos
// Solo vehículos que NO existen en battery_control
```

**⚡ Optimización de rendimiento:**
- Antes: 50 consultas secuenciales → ~10-15 segundos
- Ahora: 1 consulta + batch updates → ~2-3 segundos
- **Mejora: 70-80% más rápido**

### 2. SINCRONIZACIÓN CON VENTAS
```javascript
// Al cargar, se consultan vehículos vendidos
const { data: soldVehicles } = await supabase
  .from("sales_vehicles")
  .select("license_plate")

// Se marca is_sold = TRUE si coincide matrícula
```

### 3. CONFIGURACIÓN DE NIVELES (battery_control_config)
**Tabla de configuración global:**
```sql
battery_control_config {
  id: UUID (PK)
  days_alert_1: INTEGER DEFAULT 10         -- Días para alerta ámbar
  
  -- Niveles BEV (eléctricos puros)
  xev_charge_ok: INTEGER DEFAULT 80        -- % Nivel "Correcto"
  xev_charge_sufficient: INTEGER DEFAULT 50 -- % Nivel "Suficiente"
  xev_charge_insufficient: INTEGER DEFAULT 30 -- % Nivel "Insuficiente"
  
  -- Niveles PHEV (híbridos enchufables)
  phev_charge_ok: INTEGER DEFAULT 70       -- % Nivel "Correcto"
  phev_charge_sufficient: INTEGER DEFAULT 40 -- % Nivel "Suficiente"
  phev_charge_insufficient: INTEGER DEFAULT 20 -- % Nivel "Insuficiente"
  
  created_at: TIMESTAMPTZ DEFAULT NOW()
  updated_at: TIMESTAMPTZ DEFAULT NOW()
}
```

**Valores reales actuales:**
```
days_alert_1: 10 días
BEV:  Correcto ≥80% | Suficiente ≥50% | Insuficiente <30%
PHEV: Correcto ≥70% | Suficiente ≥40% | Insuficiente <20%
```

**Lógica de alertas:**
```javascript
// PRIORIDAD 1: Carga insuficiente → ping ROJO
if (chargeLevel === "insuficiente") return "bg-red-500"

// PRIORIDAD 2: Estado pendiente → ping ROJO
if (vehicle.status === "pendiente") return "bg-red-500"

// PRIORIDAD 3: Días sin revisar ≥10 → ping ÁMBAR
const daysSinceReview = differenceInDays(new Date(), vehicle.status_date)
if (daysSinceReview >= config.days_alert_1) return "bg-amber-500"
```

### 4. FUNCIONALIDADES DE LA INTERFAZ

**Pestañas de filtrado:**
- **Disponibles:** Vehículos no vendidos
- **Vendidos:** Vehículos marcados como vendidos
- **Insuficiente:** Carga insuficiente (crítico)
- **Suficiente:** Carga suficiente (aceptable)
- **Correcto:** Carga correcta (óptimo)

**Filtro adicional por tipo de motor:**
- Todos | Térmico | PHEV | BEV | ICE

**Indicadores visuales:**
- 🔴 **Ping rojo:** Carga insuficiente o estado pendiente
- 🟠 **Ping ámbar:** Más de 10 días sin revisar
- 🔋 **Badges:** BEV (eléctrico) | PHEV (híbrido)
- 📊 **Niveles:** Insuficiente | Suficiente | Correcto

**Botón de "No disponible":**
- ⚠️ **Triángulo de alerta** a la derecha del botón Estado
- Al hacer clic: botón Estado cambia a ámbar "NO DISPONIBLE"
- Útil para vehículos sin datos de batería

**Edición inline:**
- **% Carga:** Click para editar porcentaje (0-100)
- **Estado:** Toggle entre Pendiente/Revisado (con fecha)
- **Cargando:** Select Sí/No
- **Observaciones:** Campo de texto libre

**Exportación:**
- Impresión y exportación Excel con filtros aplicados

### 5. COMPACTACIÓN DE TABLA
**Optimización visual:**
- Padding reducido: `px-2` (antes `px-4`)
- Mismos tamaños de texto, iconos y botones
- **Objetivo:** Reducir espacio horizontal sin perder legibilidad

---

## 🎯 CONCLUSIONES

**Flujos VERTICALES fuertes:**
- ✅ nuevas_entradas → stock + fotos (perfecto)
- ✅ sales_vehicles → stock.is_sold (perfecto)
- ✅ incentivos ← garantias_brutas (perfecto)
- ✅ duc_scraper → battery_control (sincronización automática optimizada)

**Flujos HORIZONTALES funcionales:**
- ✅ stock ↔ fotos (sincronización body_status)
- ✅ sales_vehicles ↔ stock (FK + trigger)
- ✅ battery_control ↔ sales_vehicles (consulta de vendidos)
- ✅ battery_control ↔ battery_control_config (configuración global)

**Problemas críticos:**
- ❌ duc_scraper aislado (no alimenta stock directamente)
- ⚠️ Sincronización fotos ↔ stock inconsistente
- ⚠️ No soporta múltiples ventas del mismo vehículo

**Nuevas funcionalidades optimizadas:**
- ✅ Control de baterías BEV/PHEV con sincronización automática
- ✅ Configuración de niveles personalizables
- ✅ Sistema de alertas por prioridad (carga, estado, tiempo)
- ✅ Detección de tipo de vehículo priorizada (Tipo motor > Combustible)
- ✅ Rendimiento optimizado (70-80% más rápido)
- ✅ Indicador visual de vehículos "No disponibles"

---

**Documento creado:** 21 de octubre de 2025  
**Última actualización:** 22 de octubre de 2025  
**Tipo:** Análisis en cascada - Flujo de datos tabla por tabla


