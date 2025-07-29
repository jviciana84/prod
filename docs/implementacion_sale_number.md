# Implementación de `sale_number` para Múltiples Ventas

## 📋 Resumen del Problema

**Situación Actual:**
- Un vehículo puede venderse múltiples veces (misma matrícula)
- Las tablas tienen restricciones UNIQUE por matrícula
- No se puede tener múltiples ventas del mismo coche
- Se pierde historial al eliminar ventas anteriores

**Solución Propuesta:**
- Añadir campo `sale_number` a todas las tablas relevantes
- Permitir múltiples ventas del mismo vehículo
- Mantener historial completo de todas las ventas

## 🗂️ Estructura Actual de Tablas

### 1. NUEVAS_ENTRADAS
```sql
- id (uuid, PK)
- license_plate (varchar, UNIQUE) ← PROBLEMA
- model (varchar)
- vehicle_type (varchar)
- purchase_date (date)
- reception_date (timestamp)
- expense_charge (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

### 2. STOCK
```sql
- id (uuid, PK)
- license_plate (varchar, UNIQUE) ← PROBLEMA
- model (varchar)
- reception_date (timestamp)
- paint_status (varchar)
- mechanical_status (varchar)
- body_status (varchar)
- work_center (varchar)
- expense_charge (varchar)
- vehicle_type (text)
- nuevas_entradas_id (uuid, FK)
- created_at (timestamp)
- updated_at (timestamp)
```

### 3. SALES_VEHICLES
```sql
- id (uuid, PK)
- license_plate (varchar) ← PROBLEMA
- model (varchar)
- stock_id (uuid, FK)
- sale_date (timestamp)
- advisor (varchar)
- price (numeric)
- payment_method (varchar)
- payment_status (varchar)
- client_name (varchar)
- client_dni (varchar)
- client_email (varchar)
- client_phone (varchar)
- client_address (text)
- vin (varchar)
- brand (varchar)
- color (varchar)
- bank (varchar)
- pdf_extraction_id (uuid)
- created_at (timestamp)
- updated_at (timestamp)
```

### 4. PEDIDOS_VALIDADOS
```sql
- id (uuid, PK)
- vehicle_id (uuid)
- license_plate (varchar) ← PROBLEMA
- model (varchar)
- stock_id (uuid, FK)
- sale_date (timestamp)
- advisor (varchar)
- price (numeric)
- payment_method (varchar)
- client_name (varchar)
- client_dni (varchar)
- client_email (varchar)
- client_phone (varchar)
- client_address (text)
- vin (varchar)
- brand (varchar)
- color (varchar)
- bank (varchar)
- pdf_extraction_id (uuid)
- is_failed_sale (boolean)
- failed_reason (text)
- failed_date (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

### 5. ENTREGAS
```sql
- id (text, PK)
- matricula (text) ← PROBLEMA
- modelo (text)
- fecha_venta (timestamp)
- fecha_entrega (timestamp)
- asesor (text)
- or (text)
- incidencia (boolean)
- observaciones (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### 6. VEHICLE_SALE_STATUS
```sql
- id (uuid, PK)
- vehicle_id (uuid)
- source_table (text)
- license_plate (text) ← PROBLEMA
- sale_status (text)
- created_at (timestamp)
- created_by (uuid)
- notes (text)
```

## 🔧 Plan de Implementación

### Fase 1: Preparación de Base de Datos

#### 1.1 Añadir `sale_number` a todas las tablas
```sql
-- NUEVAS_ENTRADAS
ALTER TABLE nuevas_entradas ADD COLUMN sale_number INTEGER DEFAULT 1;

-- STOCK
ALTER TABLE stock ADD COLUMN sale_number INTEGER DEFAULT 1;

-- SALES_VEHICLES
ALTER TABLE sales_vehicles ADD COLUMN sale_number INTEGER DEFAULT 1;

-- PEDIDOS_VALIDADOS
ALTER TABLE pedidos_validados ADD COLUMN sale_number INTEGER DEFAULT 1;

-- ENTREGAS
ALTER TABLE entregas ADD COLUMN sale_number INTEGER DEFAULT 1;

-- VEHICLE_SALE_STATUS
ALTER TABLE vehicle_sale_status ADD COLUMN sale_number INTEGER DEFAULT 1;
```

#### 1.2 Crear índices compuestos
```sql
-- NUEVAS_ENTRADAS
CREATE UNIQUE INDEX idx_nuevas_entradas_license_sale 
ON nuevas_entradas(license_plate, sale_number);

-- STOCK
CREATE UNIQUE INDEX idx_stock_license_sale 
ON stock(license_plate, sale_number);

-- SALES_VEHICLES
CREATE UNIQUE INDEX idx_sales_vehicles_license_sale 
ON sales_vehicles(license_plate, sale_number);

-- PEDIDOS_VALIDADOS
CREATE UNIQUE INDEX idx_pedidos_validados_license_sale 
ON pedidos_validados(license_plate, sale_number);

-- ENTREGAS
CREATE UNIQUE INDEX idx_entregas_matricula_sale 
ON entregas(matricula, sale_number);

-- VEHICLE_SALE_STATUS
CREATE UNIQUE INDEX idx_vehicle_sale_status_license_sale 
ON vehicle_sale_status(license_plate, sale_number);
```

#### 1.3 Eliminar índices únicos antiguos
```sql
-- Eliminar índices únicos por matrícula
DROP INDEX IF EXISTS nuevas_entradas_license_plate_key;
DROP INDEX IF EXISTS stock_license_plate_key;
DROP INDEX IF EXISTS fotos_license_plate_key;
DROP INDEX IF EXISTS entregas_matricula_unique;
```

### Fase 2: Migración de Datos Existentes

#### 2.1 Actualizar registros existentes
```sql
-- Asignar sale_number = 1 a todos los registros existentes
UPDATE nuevas_entradas SET sale_number = 1 WHERE sale_number IS NULL;
UPDATE stock SET sale_number = 1 WHERE sale_number IS NULL;
UPDATE sales_vehicles SET sale_number = 1 WHERE sale_number IS NULL;
UPDATE pedidos_validados SET sale_number = 1 WHERE sale_number IS NULL;
UPDATE entregas SET sale_number = 1 WHERE sale_number IS NULL;
UPDATE vehicle_sale_status SET sale_number = 1 WHERE sale_number IS NULL;
```

### Fase 3: Lógica de Negocio

#### 3.1 Función para obtener próximo `sale_number`
```sql
CREATE OR REPLACE FUNCTION get_next_sale_number(license_plate TEXT)
RETURNS INTEGER AS $$
DECLARE
    max_sale_number INTEGER;
BEGIN
    -- Buscar en todas las tablas relevantes
    SELECT COALESCE(MAX(sale_number), 0) INTO max_sale_number
    FROM (
        SELECT sale_number FROM nuevas_entradas WHERE license_plate = $1
        UNION ALL
        SELECT sale_number FROM stock WHERE license_plate = $1
        UNION ALL
        SELECT sale_number FROM sales_vehicles WHERE license_plate = $1
        UNION ALL
        SELECT sale_number FROM pedidos_validados WHERE license_plate = $1
        UNION ALL
        SELECT sale_number FROM entregas WHERE matricula = $1
        UNION ALL
        SELECT sale_number FROM vehicle_sale_status WHERE license_plate = $1
    ) AS all_sales;
    
    RETURN max_sale_number + 1;
END;
$$ LANGUAGE plpgsql;
```

#### 3.2 Función para procesar nueva venta
```sql
CREATE OR REPLACE FUNCTION process_new_sale(
    p_license_plate TEXT,
    p_model TEXT,
    p_vehicle_type TEXT,
    p_advisor TEXT,
    p_price NUMERIC,
    p_payment_method TEXT,
    p_client_name TEXT,
    p_client_dni TEXT,
    p_client_email TEXT,
    p_client_phone TEXT,
    p_client_address TEXT,
    p_vin TEXT,
    p_brand TEXT,
    p_color TEXT,
    p_bank TEXT
)
RETURNS INTEGER AS $$
DECLARE
    next_sale_number INTEGER;
    new_stock_id UUID;
    new_sale_id UUID;
BEGIN
    -- Obtener próximo sale_number
    next_sale_number := get_next_sale_number(p_license_plate);
    
    -- Crear entrada en stock
    INSERT INTO stock (
        license_plate, model, vehicle_type, sale_number,
        created_at, updated_at
    ) VALUES (
        p_license_plate, p_model, p_vehicle_type, next_sale_number,
        NOW(), NOW()
    ) RETURNING id INTO new_stock_id;
    
    -- Crear entrada en sales_vehicles
    INSERT INTO sales_vehicles (
        license_plate, model, vehicle_type, stock_id, sale_number,
        sale_date, advisor, price, payment_method,
        client_name, client_dni, client_email, client_phone, client_address,
        vin, brand, color, bank,
        created_at, updated_at
    ) VALUES (
        p_license_plate, p_model, p_vehicle_type, new_stock_id, next_sale_number,
        NOW(), p_advisor, p_price, p_payment_method,
        p_client_name, p_client_dni, p_client_email, p_client_phone, p_client_address,
        p_vin, p_brand, p_color, p_bank,
        NOW(), NOW()
    ) RETURNING id INTO new_sale_id;
    
    -- Crear entrada en vehicle_sale_status
    INSERT INTO vehicle_sale_status (
        vehicle_id, source_table, license_plate, sale_number,
        sale_status, created_at
    ) VALUES (
        new_sale_id, 'sales_vehicles', p_license_plate, next_sale_number,
        'vendido', NOW()
    );
    
    RETURN next_sale_number;
END;
$$ LANGUAGE plpgsql;
```

### Fase 4: Actualización de Frontend

#### 4.1 Modificar componentes para manejar `sale_number`
- **Stock Table**: Mostrar `sale_number` en la interfaz
- **Sales Table**: Filtrar por `sale_number` activo
- **Validados Table**: Mostrar historial de ventas por `sale_number`
- **Entregas**: Asociar entrega con `sale_number` específico

#### 4.2 Nuevas funcionalidades
- **Botón "Ver Historial"**: Mostrar todas las ventas de un vehículo
- **Selector de Venta**: Elegir qué venta activar/reactivar
- **Filtros por `sale_number`**: En todas las tablas

## 🎯 Beneficios de la Implementación

### ✅ Ventajas
1. **Historial Completo**: Todas las ventas quedan registradas
2. **Múltiples Ventas**: Un vehículo puede venderse múltiples veces
3. **Datos Preservados**: No se pierde información al reactivar
4. **Trazabilidad**: Rastreo completo de cada venta
5. **Flexibilidad**: Permite reactivar o crear nuevas ventas

### ⚠️ Consideraciones
1. **Complejidad**: Sistema más complejo de manejar
2. **Migración**: Requiere migración de datos existentes
3. **Frontend**: Interfaz más compleja
4. **Rendimiento**: Más índices y consultas complejas

## 📝 Próximos Pasos

1. **Revisar y aprobar** este documento
2. **Planificar migración** de datos existentes
3. **Desarrollar funciones** de base de datos
4. **Actualizar frontend** para manejar `sale_number`
5. **Probar exhaustivamente** antes de implementar en producción

## 🔗 Relaciones Clave

```
NUEVAS_ENTRADAS (license_plate, sale_number) 
    ↓
STOCK (license_plate, sale_number)
    ↓
SALES_VEHICLES (license_plate, sale_number)
    ↓
PEDIDOS_VALIDADOS (license_plate, sale_number)
    ↓
ENTREGAS (matricula, sale_number)
    ↓
VEHICLE_SALE_STATUS (license_plate, sale_number)
```

**Todas las tablas se relacionan por `(license_plate, sale_number)`** 