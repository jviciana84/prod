# 🔍 ANÁLISIS COMPLETO DEL SISTEMA CVO
**Fecha:** 21 de octubre de 2025  
**Análisis profundo del flujo de datos, tablas, triggers y páginas**

---

## 📋 ÍNDICE

1. [Arquitectura General](#arquitectura-general)
2. [Flujo de Datos Principal](#flujo-de-datos-principal)
3. [Tablas de la Base de Datos](#tablas-de-la-base-de-datos)
4. [Triggers Automáticos](#triggers-automáticos)
5. [Páginas y Componentes](#páginas-y-componentes)
6. [API Routes](#api-routes)
7. [Scraper System](#scraper-system)
8. [Flujo Completo de un Vehículo](#flujo-completo-de-un-vehículo)

---

## 🏗️ ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────┐
│                    SCRAPER DUC/CMS                          │
│              (cvo-scraper-v1/main.py)                       │
│   • Scraper DUC (cada 8 horas)                             │
│   • Scraper CMS (MM y MMC)                                 │
│   • Descarga CSV/Excel → Supabase                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              TABLAS BRUTAS (Staging)                        │
│   • duc_scraper (140 vehículos del CSV)                    │
│   • garantias_brutas_mm                                     │
│   • garantias_brutas_mmc                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              NUEVAS ENTRADAS                                │
│   • nuevas_entradas (vehículos recibidos)                  │
│   Trigger: is_received = true → STOCK + FOTOS              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 STOCK (Tabla Central)                       │
│   • 168 vehículos en sistema                               │
│   • Estados: paint/body/mechanical                          │
│   • Conecta con FOTOS, SALES, INCENTIVOS                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          TABLAS OPERACIONALES                               │
│   • fotos (fotografías y estados)                          │
│   • sales_vehicles (ventas)                                │
│   • entregas (entregas confirmadas)                         │
│   • incentivos (incentivos comerciales)                     │
│   • pedidos_validados                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUJO DE DATOS PRINCIPAL

### Fase 1: Scraping y Carga Bruta
```
DUC Web → Scraper Python → CSV → /api/import-csv → duc_scraper
CMS Web → Scraper Python → Excel → process_cms_excel() → garantias_brutas_mm/mmc
```

### Fase 2: Ingreso al Sistema
```
Usuario crea entrada → nuevas_entradas (is_received = false)
↓
Usuario marca "Recibido" (is_received = true)
↓
TRIGGER: handle_vehicle_received()
  ├─→ INSERT INTO stock (license_plate, model, expense_charge)
  └─→ INSERT INTO fotos (license_plate, estado_pintura = 'pendiente')
```

### Fase 3: Gestión en Stock
```
stock table:
├─ reception_date (fecha de recepción)
├─ inspection_date (primera inspección)
├─ paint_status (pendiente/apto/no_apto)
├─ body_status (pendiente/apto/no_apto)
├─ mechanical_status (pendiente/apto/no_apto)
├─ work_center (centro de trabajo)
├─ work_order (OR del taller)
└─ is_sold (marcado cuando se vende)
```

**Triggers activos:**
- `body_status = 'apto'` → UPDATE fotos SET estado_pintura = 'apto'

### Fase 4: Fotografías
```
fotos table:
├─ license_plate (matrícula)
├─ estado_pintura (pendiente/apto/vendido)
├─ photos_completed (true cuando está fotografiado)
├─ photographer_id (fotógrafo asignado)
└─ paint_status_date (fecha del estado)
```

### Fase 5: Venta
```
Venta creada → sales_vehicles
↓
TRIGGER: sync_stock_on_sale_insert()
  └─→ UPDATE stock SET is_sold = true
↓
Si hay entrega → entregas table
  └─→ UPDATE fotos SET photos_completed = true
```

---

## 🗄️ TABLAS DE LA BASE DE DATOS

### TABLAS PRINCIPALES

#### 1. `duc_scraper` (Tabla Bruta - Scraper DUC)
**Propósito:** Datos brutos del scraper de DUC  
**Actualización:** Cada 8 horas (09:00-18:00)  
**Registros:** ~140 vehículos

```
Columnas principales:
├─ ID Anuncio (PK)
├─ Matrícula
├─ Modelo
├─ Disponibilidad (DISPONIBLE/RESERVADO/VENDIDO)
├─ Precio
├─ Kilómetros
├─ import_date
└─ last_seen_date
```

**Flujo:** NO se sincroniza automáticamente con stock ⚠️

---

#### 2. `nuevas_entradas` (Nuevas Adquisiciones)
**Propósito:** Vehículos recién adquiridos antes de ser recibidos  
**Actualización:** Manual por usuarios

```
Columnas:
├─ id (uuid, PK)
├─ license_plate (varchar, UNIQUE)
├─ model (varchar)
├─ vehicle_type (varchar)
├─ purchase_date (date)
├─ is_received (boolean) ← CLAVE
├─ expense_charge (varchar)
├─ expense_type_id (FK → expense_types)
├─ created_at
└─ updated_at
```

**Triggers:**
- `is_received = true` → Crea registro en `stock` y `fotos`

**Página:** `/dashboard/nuevas-entradas`

---

#### 3. `stock` (Tabla Central del Sistema)
**Propósito:** Inventario principal de vehículos  
**Actualización:** Múltiples fuentes (triggers + API)  
**Registros:** ~168 vehículos (93 vendidos, 75 disponibles)

```
Columnas:
├─ id (uuid, PK)
├─ license_plate (varchar, UNIQUE)
├─ model (varchar)
├─ reception_date (timestamp)
├─ inspection_date (timestamp)
├─ paint_status (pendiente/apto/no_apto)
├─ body_status (pendiente/apto/no_apto)
├─ mechanical_status (pendiente/apto/no_apto)
├─ paint_status_date
├─ body_status_date
├─ mechanical_status_date
├─ work_center (terrassa/sabadell/castellar/etc)
├─ work_order (OR del taller)
├─ expense_charge (varchar)
├─ expense_type_id (FK → expense_types)
├─ vehicle_type (text)
├─ nuevas_entradas_id (FK → nuevas_entradas)
├─ is_sold (boolean) ← Se marca en ventas
├─ estado_venta (text)
├─ photos_completed (boolean)
├─ photos_completed_date
├─ photographer_id (FK → profiles)
├─ created_at
└─ updated_at
```

**Triggers:**
1. `nuevas_entradas_to_stock()` - Crea registro cuando vehículo es recibido
2. `sync_stock_on_sale_insert()` - Marca `is_sold = true` cuando se vende
3. `sync_stock_on_sale_delete()` - Marca `is_sold = false` cuando se elimina venta
4. `sync_body_status_to_paint_status()` - Sincroniza con tabla `fotos`

**Página:** `/dashboard/vehicles`

---

#### 4. `fotos` (Gestión de Fotografías)
**Propósito:** Estado de fotografías y pintura de vehículos  
**Actualización:** Triggers + API

```
Columnas:
├─ id (serial, PK)
├─ license_plate (varchar, UNIQUE)
├─ model (varchar)
├─ disponible (timestamp)
├─ estado_pintura (pendiente/apto/no_apto/vendido)
├─ paint_status_date
├─ paint_apto_date
├─ photos_completed (boolean)
├─ photos_completed_date
├─ photographer_id (FK → profiles)
├─ nuevas_entradas_id (FK → nuevas_entradas)
├─ created_at
└─ updated_at
```

**Triggers:**
1. `handle_vehicle_received()` - Crea registro cuando vehículo es recibido
2. Actualiza desde `body_status` de stock
3. Se actualiza al completar fotografías

**Página:** `/dashboard/photos`

---

#### 5. `sales_vehicles` (Ventas)
**Propósito:** Registro de ventas de vehículos  
**Actualización:** API + formularios

```
Columnas:
├─ id (uuid, PK)
├─ license_plate (varchar)
├─ model (varchar)
├─ stock_id (FK → stock)
├─ sale_date (timestamp)
├─ advisor (varchar)
├─ price (numeric)
├─ payment_method (varchar)
├─ payment_status (varchar)
├─ client_name (varchar)
├─ client_dni (varchar)
├─ client_email (varchar)
├─ client_phone (varchar)
├─ vin (varchar)
├─ brand (varchar)
├─ color (varchar)
├─ or (orden de reparación)
├─ cyp_status (estado CYP)
├─ pre_delivery_center_id
├─ pdf_extraction_id (FK → pdf_extracted_data)
├─ created_at
└─ updated_at
```

**Triggers:**
1. `sync_stock_on_sale_insert()` - Marca stock.is_sold = true
2. `sync_stock_on_sale_delete()` - Marca stock.is_sold = false
3. `sync_stock_on_sale_update()` - Sincroniza cambios

**Página:** `/dashboard/ventas`

---

#### 6. `entregas` (Entregas Confirmadas)
**Propósito:** Registro de entregas de vehículos vendidos  
**Actualización:** Manual + notificaciones

```
Columnas:
├─ id (uuid, PK)
├─ license_plate (varchar)
├─ sale_id (FK → sales_vehicles)
├─ fecha_entrega (timestamp)
├─ confirmada (boolean)
├─ created_at
└─ updated_at
```

**Página:** `/dashboard/entregas`

---

#### 7. `incentivos` (Incentivos Comerciales)
**Propósito:** Cálculo de incentivos de ventas  
**Actualización:** Manual + triggers de garantías

```
Columnas:
├─ id (serial, PK)
├─ fecha_entrega
├─ matricula
├─ modelo
├─ asesor
├─ forma_pago
├─ precio_venta
├─ precio_compra
├─ dias_stock
├─ gastos_estructura
├─ garantia ← Auto-calculado desde garantias_brutas
├─ gastos_360
├─ antiguedad (boolean)
├─ financiado (boolean)
├─ otros
├─ importe_minimo
├─ margen
├─ importe_total
├─ tramitado (boolean)
├─ or (orden de reparación)
├─ created_at
└─ updated_at
```

**Triggers:**
- `update_garantia_incentivos()` - Auto-calcula garantía desde CMS

**Página:** `/dashboard/incentivos`

---

#### 8. `garantias_brutas_mm` / `garantias_brutas_mmc`
**Propósito:** Datos brutos del scraper CMS  
**Actualización:** Scraper CMS (cada 8 horas)

```
Columnas:
├─ id (serial, PK)
├─ Nº Póliza
├─ Matrícula
├─ Marca
├─ Modelo
├─ Años G.F.
├─ Prima Total ← Usado en trigger de incentivos
├─ Login
├─ Concesionario
└─ created_at
```

**Triggers:**
- Alimenta automáticamente `incentivos.garantia`

---

#### 9. `recogidas_historial` (Recogida de Documentos)
**Propósito:** Solicitudes de recogida de documentación  
**Actualización:** Manual por usuarios

```
Columnas:
├─ id (serial, PK)
├─ matricula
├─ mensajeria (MRW por defecto)
├─ centro_recogida
├─ materiales (array)
├─ nombre_cliente
├─ direccion_cliente
├─ codigo_postal
├─ ciudad
├─ provincia
├─ telefono
├─ email
├─ observaciones_envio
├─ usuario_solicitante
├─ seguimiento
├─ estado (solicitada/en_transito/entregada/cancelada)
├─ fecha_solicitud
├─ fecha_envio
└─ fecha_entrega
```

**Página:** `/dashboard/recogidas`

---

#### 10. `profiles` (Perfiles de Usuario)
**Propósito:** Datos de usuarios del sistema  
**Relaciones:** FK en múltiples tablas

```
Columnas:
├─ id (uuid, PK, FK → auth.users)
├─ email (unique)
├─ full_name
├─ alias
├─ avatar_url
├─ phone
├─ position
├─ role (admin/user/photographer/viewer)
├─ photo_assignment_percentage
├─ motivational_quote
├─ welcome_email_sent
├─ created_at
└─ updated_at
```

---

### TABLAS AUXILIARES

#### `expense_types` (Tipos de Gasto)
```
├─ id (serial, PK)
├─ name (varchar)
├─ description
├─ is_active
└─ display_order
```

#### `pdf_extracted_data` (Datos Extraídos de PDFs)
**Propósito:** OCR de documentos de venta
```
├─ id (uuid, PK)
├─ file_url
├─ extracted_data (jsonb)
├─ extraction_status
└─ created_at
```

#### `noticias` (Noticias del Sistema)
**Propósito:** Noticias internas para usuarios

#### `conversations` (Chat Interno)
**Propósito:** Sistema de chat con IA

---

## ⚡ TRIGGERS AUTOMÁTICOS

### 1. `nuevas_entradas` → `stock` + `fotos`
**Archivo:** `triggers/fix_expense_charge_sync.sql`

```sql
CREATE FUNCTION nuevas_entradas_to_stock()
WHEN nuevas_entradas.is_received = true
THEN:
  INSERT INTO stock (
    license_plate, model, reception_date, 
    expense_charge, expense_type_id
  )
  INSERT INTO fotos (
    license_plate, model, estado_pintura = 'pendiente'
  )
```

**Flujo:**
1. Usuario marca vehículo como recibido
2. Trigger crea registro en `stock`
3. Trigger crea registro en `fotos` con estado pendiente

---

### 2. `sales_vehicles` → `stock.is_sold`
**Archivo:** `sql/triggers-sync-is-sold.sql`

```sql
CREATE FUNCTION sync_stock_on_sale_insert()
WHEN INSERT en sales_vehicles
THEN:
  UPDATE stock SET is_sold = true
  WHERE license_plate = NEW.license_plate

CREATE FUNCTION sync_stock_on_sale_delete()
WHEN DELETE en sales_vehicles
THEN:
  UPDATE stock SET is_sold = false
  WHERE license_plate = OLD.license_plate

CREATE FUNCTION sync_stock_on_sale_update()
WHEN UPDATE en sales_vehicles (cambio de matrícula)
THEN:
  UPDATE stock SET is_sold = false (matrícula antigua)
  UPDATE stock SET is_sold = true (matrícula nueva)
```

**Flujo:**
1. Se crea venta → `stock.is_sold = true`
2. Se elimina venta → `stock.is_sold = false`
3. Se cambia matrícula → actualiza ambas

---

### 3. `stock.body_status` → `fotos.estado_pintura`
**Archivo:** `triggers/sync_body_status_to_paint_status.sql`

```sql
CREATE FUNCTION sync_body_status_to_paint_status()
WHEN UPDATE en stock.body_status = 'apto'
THEN:
  UPDATE fotos 
  SET estado_pintura = 'apto',
      paint_status_date = NEW.body_status_date,
      paint_apto_date = NEW.body_status_date
  WHERE license_plate = NEW.license_plate
```

**Flujo:**
1. Usuario marca `body_status = 'apto'` en stock
2. Trigger actualiza automáticamente `fotos.estado_pintura = 'apto'`

---

### 4. `garantias_brutas_mm/mmc` → `incentivos.garantia`
**Archivo:** `triggers/auto_update_garantia_incentivos.sql`

```sql
CREATE FUNCTION update_garantia_incentivos()
WHEN INSERT en garantias_brutas_mm/mmc
THEN:
  UPDATE incentivos 
  SET garantia = NEW."Prima Total"
  WHERE matricula = NEW."Matrícula"
  AND garantia IS NULL

ALSO:
WHEN INSERT en incentivos
THEN:
  Buscar garantía en garantias_brutas_mm/mmc
  UPDATE incentivos.garantia si encuentra datos
```

**Flujo:**
1. Scraper CMS inserta datos de garantías
2. Trigger busca incentivos pendientes con esa matrícula
3. Actualiza automáticamente el campo `garantia`

---

## 📄 PÁGINAS Y COMPONENTES

### DASHBOARD PRINCIPAL: `/dashboard`
**Componente:** `app/dashboard/page.tsx`

Muestra resumen general del sistema:
- Total de vehículos en stock
- Ventas del mes
- Fotos pendientes
- Notificaciones

---

### NUEVAS ENTRADAS: `/dashboard/nuevas-entradas`
**Componente:** `app/dashboard/nuevas-entradas/page.tsx`  
**Componente clave:** `components/transport/transport-dashboard.tsx`

**Funcionalidad:**
- Crear nuevas entradas de vehículos
- Marcar como recibido (trigger → stock + fotos)
- Estados: pendiente/en_transito/recibido
- Gestión de tipo de gasto

**Datos consumidos:**
- Tabla: `nuevas_entradas`
- API: `/api/transport/list`
- API: `/api/transport/update`

**Flujo:**
```
Usuario crea entrada → nuevas_entradas (is_received = false)
↓
Usuario marca "Recibido"
↓
TRIGGER activa → stock + fotos creados
↓
Vehículo aparece en /dashboard/vehicles
```

---

### VEHÍCULOS (STOCK): `/dashboard/vehicles`
**Componente:** `app/dashboard/vehicles/page.tsx`  
**Componente clave:** `components/vehicles/stock-table.tsx`

**Funcionalidad:**
- Tabla completa del inventario
- Pestañas: Todos / Pendientes / En proceso / Completados / Ventas Prematuras
- Edición inline de campos
- Estados de pintura/carrocería/mecánica
- Asignación de centro de trabajo
- Gestión de OR (orden de reparación)
- Búsqueda y filtros

**Datos consumidos:**
- Tabla: `stock` (SELECT directo)
- API updates:
  - `/api/stock/update-cell`
  - `/api/stock/update-status`
  - `/api/stock/update-body-status`
  - `/api/stock/update-mechanical-status`
  - `/api/stock/update-or`
  - `/api/stock/update-work-center`

**Estados de pestañas:**
- **Todos:** Todos los vehículos
- **Pendientes:** paint/body/mechanical = pendiente
- **En proceso:** Al menos uno no pendiente
- **Completados:** Todos los estados aptos
- **Ventas Prematuras:** is_sold = true pero sin completar

---

### FOTOGRAFÍAS: `/dashboard/photos`
**Componente:** `app/dashboard/photos/page.tsx`  
**Componente clave:** `components/photos/photos-table.tsx`

**Funcionalidad:**
- Gestión de fotografías pendientes
- Estado: pendiente/apto/no_apto/vendido
- Asignación de fotógrafos
- Marcar como completado
- Ver vehículos por fotógrafo

**Datos consumidos:**
- Tabla: `fotos` (SELECT directo)
- Tabla: `stock` (para datos adicionales)
- API updates:
  - `/api/photos/update-status`
  - `/api/photos/assign-photographer`

**Flujo:**
```
Vehículo recibido → fotos (estado_pintura = 'pendiente')
↓
Asignar fotógrafo
↓
Fotógrafo completa → photos_completed = true
↓
Ya no aparece en pendientes
```

---

### VENTAS: `/dashboard/ventas`
**Componente:** `app/dashboard/ventas/page.tsx`

**Funcionalidad:**
- Registro de ventas
- Datos del cliente
- Método de pago
- Estado CYP
- Centro de pre-entrega
- OR de venta
- Extracción de datos de PDF

**Datos consumidos:**
- Tabla: `sales_vehicles`
- Tabla: `stock` (FK)
- API:
  - `/api/sales/create-quick`
  - `/api/sales/update-cell`
  - `/api/sales/update-cyp-status`
  - `/api/sales/update-pre-delivery`
  - `/api/sales/update-or`

**Flujo:**
```
Usuario crea venta → sales_vehicles
↓
TRIGGER → stock.is_sold = true
↓
Vehículo desaparece de listados disponibles
↓
Aparece en pestaña "Vendidos"
```

---

### ENTREGAS: `/dashboard/entregas`
**Componente:** `app/dashboard/entregas/page.tsx`

**Funcionalidad:**
- Ver entregas programadas
- Confirmar entregas
- Notificar a clientes
- Actualizar estado de fotos

**Datos consumidos:**
- Tabla: `entregas`
- Tabla: `sales_vehicles` (JOIN)
- API: `/api/entregas/*`

---

### INCENTIVOS: `/dashboard/incentivos`
**Componente:** `app/dashboard/incentivos/page.tsx`

**Funcionalidad:**
- Cálculo de incentivos por venta
- Auto-carga de garantías (trigger)
- Cálculo de margen
- Gestión de gastos

**Datos consumidos:**
- Tabla: `incentivos`
- Tabla: `garantias_brutas_mm/mmc` (via trigger)
- API: `/api/incentivos/*`

---

### RECOGIDAS: `/dashboard/recogidas`
**Componente:** `app/dashboard/recogidas/page.tsx`

**Funcionalidad:**
- Solicitar recogida de documentos
- Selección de materiales
- Datos del cliente
- Seguimiento de mensajería
- Estados: solicitada/en_transito/entregada

**Datos consumidos:**
- Tabla: `recogidas_historial`
- API: `/api/recogidas/*`

---

## 🔌 API ROUTES

### Patrón de Arquitectura

✅ **MUTACIONES (INSERT/UPDATE/DELETE):**
```typescript
// SIEMPRE usar API Route con Service Role Key
const response = await fetch("/api/stock/update", {
  method: "POST",
  body: JSON.stringify(data)
})
```

✅ **CONSULTAS (SELECT):**
```typescript
// Directo desde cliente (más rápido)
const supabase = createClientComponentClient()
const { data } = await supabase
  .from("stock")
  .select("*")
```

**Razón:** Evitar "zombie client" con tokens expirados en mutaciones

---

### API Routes de Stock

#### `/api/stock/update-cell` (POST)
**Propósito:** Actualizar cualquier celda de stock
```typescript
Body: { id, field, value }
→ UPDATE stock SET [field] = value WHERE id = id
```

#### `/api/stock/update-status` (POST)
**Propósito:** Actualizar estado de venta
```typescript
Body: { id, status }
→ UPDATE stock SET estado_venta = status
```

#### `/api/stock/update-body-status` (POST)
**Propósito:** Actualizar estado de carrocería
```typescript
Body: { id, newStatus, hasInspectionDate }
→ UPDATE stock SET body_status = newStatus
→ Si !hasInspectionDate: inspection_date = NOW()
→ TRIGGER: sync_body_status_to_paint_status()
```

#### `/api/stock/update-or` (POST)
**Propósito:** Actualizar OR (orden de reparación)
```typescript
Body: { id, orValue }
→ UPDATE stock SET work_order = orValue
```

#### `/api/stock/update-work-center` (POST)
**Propósito:** Actualizar centro de trabajo
```typescript
Body: { id, workCenter }
→ UPDATE stock SET work_center = workCenter
```

---

### API Routes de Sales

#### `/api/sales/create-quick` (POST)
**Propósito:** Crear venta rápida
```typescript
Body: { salesData }
→ INSERT INTO sales_vehicles (salesData)
→ TRIGGER: sync_stock_on_sale_insert()
```

#### `/api/sales/update-cyp-status` (POST)
**Propósito:** Actualizar estado CYP
```typescript
Body: { id, status }
→ UPDATE sales_vehicles SET cyp_status = status
```

---

### API Routes de Transport (Nuevas Entradas)

#### `/api/transport/list` (GET)
**Propósito:** Listar nuevas entradas
```typescript
→ SELECT * FROM nuevas_entradas
→ JOIN expense_types
→ JOIN locations
```

#### `/api/transport/update` (POST)
**Propósito:** Actualizar entrada
```typescript
Body: { id, updates }
→ UPDATE nuevas_entradas SET ... WHERE id = id
→ Si is_received = true: TRIGGER activa
```

---

## 🤖 SCRAPER SYSTEM

### Scraper Principal: `cvo-scraper-v1/main.py`

**Arquitectura:**
- Aplicación Tkinter (GUI de escritorio)
- 4 scrapers: DUC, CMS MM, CMS MMC, DUC Quadis
- Selenium WebDriver (Chrome headless)
- Programación automática (schedule)

---

### Scraper DUC

**URL:** https://gestionbmw.motorflash.com  
**Frecuencia:** Cada 8 horas (09:00-18:00)  
**Método:** Selenium → Descarga CSV

**Proceso:**
```python
1. Login con credenciales (Jordivi01/Jordivi02)
2. Click "Crear Excel"
3. Click "Generar fichero"
4. Click "Descargar fichero"
5. CSV guardado en: dist/data/duc/
6. Procesar CSV → Supabase
```

**Tabla destino:** `duc_scraper`

**Columnas procesadas:** 89/100 columnas del CSV

**Datos clave:**
- ID Anuncio (PK)
- Matrícula
- Modelo
- Disponibilidad (DISPONIBLE/RESERVADO/VENDIDO)
- Precio
- Kilómetros
- Fecha matriculación
- etc.

**Función procesamiento:**
```python
def process_duc_csv(csv_path):
  1. Leer CSV con pandas
  2. Limpiar columnas
  3. Mapear "Régimen fiscal" → "Regimen fiscal"
  4. Convertir a dict
  5. Eliminar registros existentes en duc_scraper
  6. INSERT nuevos registros
```

**⚠️ IMPORTANTE:** 
- Los datos de `duc_scraper` **NO** se sincronizan automáticamente con `stock`
- Existe un problema conocido: vehículos RESERVADOS en DUC aparecen como disponibles en stock

---

### Scraper CMS (MM y MMC)

**URL:** https://cmsweb.cmsseguros.es  
**Frecuencia:** Cada 8 horas  
**Método:** Selenium → Descarga Excel

**Credenciales:**
- MM: bmw100195 / Terrass4$
- MMC: bmw100829 / S1s1s1s1s1s1s1s1s1+

**Proceso:**
```python
1. Login CMS
2. Navegar a Consultas → Informes
3. Seleccionar Tipo: "Producción"
4. Seleccionar Estado: "Vigente"
5. Generar informe → Descargar Excel
6. Excel guardado en: dist/data/cms/
7. Procesar Excel → Supabase
```

**Tablas destino:** 
- `garantias_brutas_mm`
- `garantias_brutas_mmc`

**Mapeo de columnas:**
```python
column_mapping = {
  'Año' → 'Años G.F.',
  'Importe' → 'Prima Total',
  'Nº Póliza' → 'Nº Póliza',
  'Matrícula' → 'Matrícula',
  'Marca' → 'Marca',
  'Modelo' → 'Modelo'
}
```

**Función procesamiento:**
```python
def process_cms_excel(excel_path, dealer):
  1. Leer Excel (header=1)
  2. Limpiar columnas
  3. Mapear columnas
  4. Eliminar registros existentes
  5. INSERT nuevos registros
  6. TRIGGER: update_garantia_incentivos()
```

---

### Scraper Quadis (Pendiente)

**Estado:** No implementado  
**Preparado para:** DUC Quadis y CMS Quadis

---

## 🚗 FLUJO COMPLETO DE UN VEHÍCULO

### Etapa 1: Adquisición
```
1. Vehículo disponible en mercado
2. Usuario crea entrada en: /dashboard/nuevas-entradas
   → nuevas_entradas (is_received = false)
3. Datos mínimos:
   - license_plate
   - model
   - purchase_date
   - expense_type_id
```

---

### Etapa 2: Recepción
```
4. Vehículo llega físicamente
5. Usuario marca "Recibido" (is_received = true)
6. TRIGGER: nuevas_entradas_to_stock()
   ├─→ INSERT INTO stock (
   │     license_plate,
   │     model,
   │     reception_date = NOW(),
   │     expense_charge,
   │     paint_status = 'pendiente',
   │     body_status = 'pendiente',
   │     mechanical_status = 'pendiente'
   │   )
   └─→ INSERT INTO fotos (
         license_plate,
         model,
         disponible = NOW(),
         estado_pintura = 'pendiente'
       )
```

---

### Etapa 3: Inspección
```
7. Vehículo aparece en: /dashboard/vehicles (pestaña "Pendientes")
8. Mecánico inspecciona vehículo
9. Usuario actualiza estados:
   - paint_status → apto/no_apto
   - body_status → apto/no_apto
   - mechanical_status → apto/no_apto
10. Se registra inspection_date (primera vez)
11. Si body_status = 'apto':
    → TRIGGER: sync_body_status_to_paint_status()
    → UPDATE fotos SET estado_pintura = 'apto'
```

---

### Etapa 4: Reparaciones (si necesarias)
```
12. Si no_apto → asignar work_center
13. Crear work_order (OR del taller)
14. Vehículo en reparación
15. Una vez reparado → actualizar estados a 'apto'
```

---

### Etapa 5: Fotografía
```
16. Vehículo apto → aparece en /dashboard/photos
17. Asignar photographer_id
18. Fotógrafo completa sesión
19. Marcar photos_completed = true
20. Vehículo listo para venta
```

---

### Etapa 6: Publicación
```
21. Vehículo visible en DUC (web pública)
22. Scraper DUC actualiza duc_scraper cada 8h
23. Estado en DUC: "DISPONIBLE"
```

---

### Etapa 7: Venta
```
24. Cliente interesado
25. Asesor crea venta en: /dashboard/ventas
26. INSERT INTO sales_vehicles (
      license_plate,
      model,
      sale_date = NOW(),
      advisor,
      price,
      payment_method,
      client_name,
      client_dni,
      client_email,
      etc.
    )
27. TRIGGER: sync_stock_on_sale_insert()
    → UPDATE stock SET is_sold = true
28. Vehículo desaparece de listados disponibles
29. Estado en DUC cambia a: "RESERVADO"
```

---

### Etapa 8: Documentación
```
30. Preparar documentación
31. Si falta documentos → /dashboard/recogidas
32. Solicitar recogida de documentos
33. INSERT INTO recogidas_historial (
      matricula,
      materiales,
      direccion_cliente,
      estado = 'solicitada'
    )
34. Seguimiento de mensajería
```

---

### Etapa 9: Entrega
```
35. Vehículo listo para entrega
36. Agendar entrega en: /dashboard/entregas
37. INSERT INTO entregas (
      license_plate,
      sale_id,
      fecha_entrega
    )
38. Confirmar entrega (confirmada = true)
39. UPDATE fotos SET photos_completed = true
40. Notificación al cliente
```

---

### Etapa 10: Incentivos
```
41. Calcular incentivos en: /dashboard/incentivos
42. INSERT INTO incentivos (
      matricula,
      fecha_entrega,
      precio_venta,
      precio_compra,
      dias_stock,
      etc.
    )
43. TRIGGER: update_garantia_incentivos()
    → Buscar garantía en garantias_brutas_mm/mmc
    → UPDATE incentivos.garantia automáticamente
44. Calcular margen final
45. Marcar tramitado = true
```

---

## 🔗 RELACIONES ENTRE TABLAS

```
nuevas_entradas (1)
  ↓ (nuevas_entradas_id)
stock (1) ←──────────────────────────────┐
  ↓ (license_plate)                      │
  ├─→ fotos (1)                           │
  ├─→ sales_vehicles (0..n)               │
  ├─→ entregas (0..n)                     │
  └─→ incentivos (0..n)                   │
                                          │
sales_vehicles (n)                        │
  ├─→ stock (FK: stock_id) ──────────────┘
  ├─→ pdf_extracted_data (FK: pdf_extraction_id)
  └─→ entregas (1..n)

incentivos (n)
  ├─→ garantias_brutas_mm (match: matricula)
  └─→ garantias_brutas_mmc (match: matricula)

profiles (1)
  ├─→ stock.photographer_id
  ├─→ fotos.photographer_id
  └─→ recogidas_historial.usuario_solicitante_id
```

---

## ⚠️ PROBLEMAS CONOCIDOS Y PENDIENTES

### 1. DUC Scraper no sincroniza con Stock
**Problema:**  
Los vehículos marcados como "RESERVADO" en `duc_scraper` no actualizan automáticamente `stock.is_sold`

**Impacto:**  
Vehículos reservados aparecen como disponibles en la interfaz

**Solución propuesta:**  
Crear trigger para sincronizar `duc_scraper` → `stock`

---

### 2. Múltiples Ventas del Mismo Vehículo
**Problema:**  
Un vehículo puede venderse múltiples veces (recompra) pero las tablas tienen restricción UNIQUE en matrícula

**Impacto:**  
No se puede registrar segunda venta del mismo vehículo

**Solución propuesta:**  
Implementar campo `sale_number` en todas las tablas relevantes

---

### 3. Scraper Quadis no Implementado
**Problema:**  
El sistema tiene preparación para Quadis pero no está implementado

**Impacto:**  
No se pueden gestionar vehículos de Quadis

---

## 📊 ESTADÍSTICAS DEL SISTEMA

### Datos Actuales (14 Oct 2025)

**DUC Scraper:**
- Total: 140 vehículos
- Disponibles: 122 (87%)
- Reservados: 17 (12%)
- Vendidos: 1 (1%)

**Stock:**
- Total: 168 vehículos
- Vendidos: 93 (55%)
- Disponibles: 75 (45%)

**Fotos:**
- Pendientes: ~10 vehículos reales
- Vendidos con fotos completas: 123

---

## 🎯 CONCLUSIONES

### Sistema Bien Estructurado
✅ Separación clara entre tablas brutas (scrapers) y operacionales  
✅ Triggers automáticos funcionando correctamente  
✅ Patrón API Routes consistente  
✅ Flujo de datos lógico y trazable

### Áreas de Mejora
⚠️ Sincronización DUC → Stock pendiente  
⚠️ Sistema de múltiples ventas no implementado  
⚠️ Scraper Quadis pendiente

### Puntos Fuertes
💪 Auto-cálculo de garantías en incentivos  
💪 Sincronización automática stock ↔ fotos ↔ ventas  
💪 Trazabilidad completa del ciclo de vida del vehículo  
💪 Sistema de notificaciones y entregas robusto

---

**Documento creado:** 21 de octubre de 2025  
**Autor:** Análisis completo del sistema CVO  
**Versión:** 1.0


