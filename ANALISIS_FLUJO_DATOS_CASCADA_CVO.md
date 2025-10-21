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

## 🎯 CONCLUSIONES

**Flujos VERTICALES fuertes:**
- ✅ nuevas_entradas → stock + fotos (perfecto)
- ✅ sales_vehicles → stock.is_sold (perfecto)
- ✅ incentivos ← garantias_brutas (perfecto)

**Flujos HORIZONTALES funcionales:**
- ✅ stock ↔ fotos (sincronización body_status)
- ✅ sales_vehicles ↔ stock (FK + trigger)

**Problemas críticos:**
- ❌ duc_scraper aislado (no alimenta stock)
- ⚠️ Sincronización fotos ↔ stock inconsistente
- ⚠️ No soporta múltiples ventas del mismo vehículo

---

**Documento creado:** 21 de octubre de 2025  
**Tipo:** Análisis en cascada - Flujo de datos tabla por tabla


