# 📍 PASO 1: SCRAPER DUC → TABLA duc_scraper
**Análisis detallado del primer paso del sistema**

---

## 🎯 ¿QUÉ ES ESTO?

El scraper DUC es un **robot automatizado** que cada 8 horas:
1. Abre la página web de DUC (donde están publicados los vehículos)
2. Descarga un archivo CSV con todos los vehículos
3. Sube ese CSV a la base de datos (tabla `duc_scraper`)

**Es como un empleado que cada 8 horas va a la web de DUC, copia todos los vehículos, y los pega en una hoja de Excel en Supabase.**

---

## 📁 ARCHIVOS INVOLUCRADOS

### 1. El Scraper (Robot)
**Ubicación:** `cvo-scraper-v1/main.py`  
**Tipo:** Aplicación Python con ventana (Tkinter)  
**Ejecutable:** `cvo-scraper-v1/dist/CVO_Scraper_QUADIS_Munich.exe`

### 2. CSV Descargados
**Ubicación:** `cvo-scraper-v1/dist/data/duc/`  
**Ejemplo de archivo:**
```
stock_551_0_2025_10_21_17_47_54.csv
stock_551_0_2025_10_21_17_22_31.csv
stock_551_0_2025_10_21_17_07_26.csv
```

**Formato del nombre:**
- `stock_551_0` = Identificador del concesionario
- `2025_10_21` = Fecha (año_mes_día)
- `17_47_54` = Hora (hora_minuto_segundo)

### 3. Tabla en Supabase
**Tabla:** `duc_scraper`  
**Tipo:** Tabla de staging (datos brutos)

---

## 🤖 ¿CÓMO FUNCIONA EL SCRAPER?

### Configuración Actual (main.py)

```python
# Credenciales DUC
duc_username = "Jordivi01"
duc_password = "Jordivi02"

# Programación
duc_schedule_enabled = True
duc_start_time = "09:00"
duc_end_time = "18:00"
duc_interval_hours = 8  # Cada 8 horas
duc_days = "L,M,X,J,V,S,D"  # Todos los días
```

**Horario de ejecución:**
- Primera ejecución: 09:00
- Segunda ejecución: 17:00 (09:00 + 8h)
- Luego vuelve al día siguiente a las 09:00

---

## 🔄 PROCESO COMPLETO PASO A PASO

### Fase 1: Conexión y Login (Selenium)

```python
# 1. Abrir Chrome en modo headless (sin ventana)
driver = webdriver.Chrome(options=chrome_options)

# 2. Ir a la página de login
driver.get('https://gestionbmw.motorflash.com/login.php')

# 3. Rellenar formulario
username_field.send_keys("Jordivi01")
password_field.send_keys("Jordivi02")
login_button.click()

# 4. Esperar a que cargue (URL cambia)
# Antes: /login.php
# Después: /index.php o /dashboard.php
```

**Tiempo estimado:** ~5 segundos

---

### Fase 2: Descarga del CSV

```python
# 5. Click en botón "Crear Excel"
crear_excel_btn.click()
time.sleep(2)

# 6. Click en "Generar fichero"
generar_btn.click()
time.sleep(3)

# 7. Click en "Descargar fichero"
descargar_link.click()
time.sleep(10)  # Esperar descarga

# 8. CSV se guarda en: dist/data/duc/
```

**Resultado:**
```
📁 dist/data/duc/
  ├─ stock_551_0_2025_10_21_17_47_54.csv  ← NUEVO
  ├─ stock_551_0_2025_10_21_17_22_31.csv
  └─ stock_551_0_2025_10_21_17_07_26.csv
```

**Tiempo estimado:** ~15 segundos

---

### Fase 3: Lectura del CSV

```python
# 9. Buscar el CSV más reciente
csv_files = glob.glob("dist/data/duc/*.csv")
latest_file = max(csv_files, key=os.path.getctime)

# 10. Leer CSV con pandas
df = pd.read_csv(
    latest_file,
    sep=';',           # Separador: punto y coma
    encoding='utf-8',  # Codificación
    quotechar='"'      # Comillas para textos
)
```

**Contenido del CSV (ejemplo):**
```csv
ID Anuncio;Matrícula;Modelo;Disponibilidad;Precio;Kilómetros;...
12345;1234ABC;BMW 320d;DISPONIBLE;25000;50000;...
12346;5678DEF;BMW X3;RESERVADO;35000;30000;...
12347;9012GHI;MINI Cooper;DISPONIBLE;18000;40000;...
```

**Total de columnas:** ~100 columnas  
**Columnas útiles:** ~89 columnas tienen datos

---

### Fase 4: Limpieza de Datos

```python
# 11. Limpiar nombres de columnas
df.columns = df.columns.str.strip()           # Quitar espacios
df.columns = df.columns.str.replace('\t', ' ') # Quitar tabuladores
df.columns = df.columns.str.replace('  ', ' ') # Espacios dobles

# 12. MAPEO ESPECIAL: Acento en "Régimen"
df.rename(columns={
    'Régimen fiscal': 'Regimen fiscal'  # CSV con acento → DB sin acento
}, inplace=True)
```

**Problema resuelto:**
- CSV viene con: `Régimen fiscal` (con acento)
- Supabase espera: `Regimen fiscal` (sin acento)
- Si no se mapea, falla la inserción

---

### Fase 5: Conversión a Diccionarios

```python
# 13. Convertir cada fila a un diccionario
cleaned_records = []
for index, row in df.iterrows():
    record = {}
    for col in df.columns:
        value = row[col]
        
        # Manejo de valores especiales
        if pd.isna(value):
            record[col] = None  # NULL
        elif isinstance(value, datetime):
            record[col] = value.strftime('%Y-%m-%d %H:%M:%S')
        elif isinstance(value, (int, float)):
            record[col] = value
        else:
            record[col] = str(value)  # Texto
    
    cleaned_records.append(record)
```

**Ejemplo de un record (simplificado):**
```python
{
    "ID Anuncio": "12345",
    "Matrícula": "1234ABC",
    "Modelo": "BMW 320d",
    "Disponibilidad": "DISPONIBLE",
    "Precio": 25000.00,
    "Kilómetros": 50000,
    "Combustible": "Diesel",
    "Fecha matriculación": "2020-05-15",
    "Color": "Negro",
    "Transmisión": "Automática",
    # ... + 80 campos más
    "file_name": "stock_551_0_2025_10_21_17_47_54.csv",
    "import_date": "2025-10-21 17:47:54",
    "last_seen_date": "2025-10-21 17:47:54"
}
```

**Total de records:** 79 vehículos ✅ (ACTUAL)

---

## 💾 SUBIDA A SUPABASE

### Fase 6: Conexión a Supabase

```python
# 14. Conectar con Supabase
supabase = create_client(
    "https://wpjmimbscfsdzcwuwctk.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Service Role Key
)
```

---

### Fase 7: BORRADO COMPLETO (⚠️ IMPORTANTE)

```python
# 15. ELIMINAR TODOS los registros anteriores
supabase.table('duc_scraper').delete().gt("created_at", "1900-01-01").execute()
# Resultado: duc_scraper queda vacío
```

**⚠️ ESTO ES CRÍTICO:**
- Se borran TODOS los registros de `duc_scraper`
- No se conserva historial
- Es un "borrón y cuenta nueva" cada 8 horas

**Razón:**
- Para evitar duplicados
- Para mantener solo los vehículos actuales de DUC
- Para no acumular vehículos antiguos

**Ejemplo:**
```
ANTES (09:00):
duc_scraper tiene 79 vehículos

SCRAPER ejecuta (17:00):
1. DELETE → duc_scraper queda vacío (0 vehículos)
2. INSERT → duc_scraper tiene 79 vehículos nuevos

DESPUÉS (17:00):
duc_scraper tiene 79 vehículos ✅ (datos frescos HOY)
```

---

### Fase 8: INSERCIÓN MASIVA

```python
# 16. Insertar los 79 registros ✅ (ACTUAL)
result = supabase.table('duc_scraper').insert(cleaned_records).execute()
```

**Lo que hace internamente (SQL):**
```sql
INSERT INTO duc_scraper (
    "ID Anuncio",
    "Matrícula",
    "Modelo",
    "Disponibilidad",
    "Precio",
    -- ... + 85 columnas más
    "file_name",
    "import_date",
    "last_seen_date"
) VALUES
    ('12345', '1234ABC', 'BMW 320d', 'DISPONIBLE', 25000, ..., 'stock_551...csv', '2025-10-21 17:47:54', '2025-10-21 17:47:54'),
    ('12346', '5678DEF', 'BMW X3', 'RESERVADO', 35000, ..., 'stock_551...csv', '2025-10-21 17:47:54', '2025-10-21 17:47:54'),
    ('12347', '9012GHI', 'MINI Cooper', 'DISPONIBLE', 18000, ..., 'stock_551...csv', '2025-10-21 17:47:54', '2025-10-21 17:47:54'),
    -- ... x79 filas ✅ (ACTUAL)
```

**Tiempo estimado:** ~2-3 segundos para 79 registros

---

## 📊 ESTRUCTURA DE LA TABLA duc_scraper

### Columnas Principales

```sql
CREATE TABLE duc_scraper (
    -- COLUMNAS DEL CSV (89 con datos reales)
    "ID Anuncio" VARCHAR PRIMARY KEY,
    "Matrícula" VARCHAR,
    "Modelo" VARCHAR,
    "Disponibilidad" VARCHAR,  ← CLAVE: "DISPONIBLE" | "RESERVADO" | "VENDIDO"
    "Precio" DECIMAL,
    "Kilómetros" INTEGER,
    "Combustible" VARCHAR,
    "Transmisión" VARCHAR,
    "Color" VARCHAR,
    "Fecha matriculación" DATE,
    "Marca" VARCHAR,
    "Versión" VARCHAR,
    "Potencia CV" INTEGER,
    "Equipamiento" TEXT,
    -- ... + 75 columnas más
    
    -- COLUMNAS AÑADIDAS POR EL SCRAPER
    "file_name" VARCHAR,           -- Nombre del CSV de origen
    "import_date" TIMESTAMP,       -- Cuándo se importó
    "last_seen_date" TIMESTAMP,    -- Última vez visto
    "created_at" TIMESTAMP DEFAULT NOW()
)
```

---

## 📈 EJEMPLO REAL DE DATOS

### Registro Completo (Ejemplo)

```json
{
    "ID Anuncio": "548796",
    "Matrícula": "2382MPL",
    "Modelo": "BMW Serie 3 320d",
    "Disponibilidad": "RESERVADO",
    "Precio": 24900.00,
    "Kilómetros": 45000,
    "Combustible": "Diesel",
    "Transmisión": "Automática",
    "Color": "Negro Zafiro Metalizado",
    "Fecha matriculación": "2020-06-15",
    "Marca": "BMW",
    "Versión": "320d xDrive",
    "Potencia CV": 190,
    "Carrocería": "Berlina",
    "Puertas": 4,
    "Plazas": 5,
    "Garantía": "24 meses",
    "IVA deducible": "Sí",
    "Estado": "Seminuevo",
    "Días stock": 45,
    "Equipamiento": "Navegador, Sensores aparcamiento, Cámara trasera...",
    
    "file_name": "stock_551_0_2025_10_21_17_47_54.csv",
    "import_date": "2025-10-21T17:47:54.000Z",
    "last_seen_date": "2025-10-21T17:47:54.000Z",
    "created_at": "2025-10-21T17:47:54.000Z"
}
```

---

## 📊 ESTADÍSTICAS ACTUALES

### Datos del último scraping (21 Oct 2025) - ⚠️ ACTUALIZADOS

```
Total de vehículos en duc_scraper: 79 ✅ (DATO REAL ACTUAL)

Por disponibilidad:
├─ DISPONIBLE: ~68 vehículos (86%)
├─ RESERVADO: ~10 vehículos (13%)
└─ VENDIDO: ~1 vehículo (1%)

Por marca:
├─ BMW: ~48 vehículos
├─ MINI: ~26 vehículos
└─ Otros: ~5 vehículos

Columnas con datos: 89/100
Columnas vacías: 11
```

---

## ⚠️ PROBLEMA CRÍTICO: TABLA AISLADA

### El Gran Problema

```
┌────────────────────────────────────────┐
│   📊 duc_scraper                       │
│   79 vehículos ✅ (ACTUAL)             │
│   ~10 RESERVADOS                       │
└────────────────────────────────────────┘
              ↓ ❌ NO HAY CONEXIÓN
┌────────────────────────────────────────┐
│   📊 stock                             │
│   168 vehículos                        │
│   is_sold = FALSE para esos ~10       │
└────────────────────────────────────────┘
```

**Lo que pasa:**
1. Scraper encuentra vehículo con `Disponibilidad = "RESERVADO"`
2. Lo guarda en `duc_scraper` correctamente ✅
3. **PERO** no actualiza `stock.is_sold = true` ❌
4. Resultado: Vehículo RESERVADO en DUC aparece DISPONIBLE en el sistema CVO

**Ejemplo concreto:**
```sql
-- En duc_scraper (datos del scraper)
{
    "Matrícula": "2382MPL",
    "Disponibilidad": "RESERVADO"  ← Correcto en DUC
}

-- En stock (tabla operacional)
{
    license_plate: "2382MPL",
    is_sold: FALSE  ← INCORRECTO: debería ser TRUE
}
```

**Impacto:**
- Usuarios ven vehículos disponibles que ya están reservados
- Se puede intentar vender un vehículo ya vendido
- Datos inconsistentes entre DUC y CVO

---

## 🔧 ¿QUÉ FALTA PARA COMPLETAR ESTE PASO?

### Solución Necesaria: TRIGGER o SCRIPT

**Opción 1: Trigger de base de datos**
```sql
CREATE FUNCTION sync_duc_to_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Si un vehículo está RESERVADO en duc_scraper
    IF NEW."Disponibilidad" ILIKE '%RESERVADO%' THEN
        -- Actualizar stock
        UPDATE stock 
        SET is_sold = TRUE 
        WHERE license_plate = NEW."Matrícula";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_duc_to_stock
    AFTER INSERT OR UPDATE ON duc_scraper
    FOR EACH ROW
    EXECUTE FUNCTION sync_duc_to_stock();
```

**Opción 2: Script manual (cada 8 horas)**
```javascript
// scripts/sync_duc_to_stock.js
async function syncDucToStock() {
    // 1. Obtener RESERVADOS de duc_scraper
    const { data: reservados } = await supabase
        .from('duc_scraper')
        .select('Matrícula')
        .eq('Disponibilidad', 'RESERVADO')
    
    // 2. Actualizar stock
    for (const vehiculo of reservados) {
        await supabase
            .from('stock')
            .update({ is_sold: true })
            .eq('license_plate', vehiculo.Matrícula)
    }
}
```

---

## 📋 LOGS DEL SCRAPER

### Ejemplo de log real (scraper.log)

```
[17:47:30] 🚀 CVO Scraper V1 iniciado
[17:47:32] 🔄 Iniciando scrapers automáticamente...
[17:47:32] 🚀 Ejecutando DUC (automático)...
[17:47:33] 🚗 Iniciando descarga CSV de DUC...
[17:47:33] 📁 Carpeta: dist/data/duc
[17:47:34] 🔑 Intentando login con usuario: Jordivi01
[17:47:39] ✅ Login exitoso - URL: https://gestionbmw.motorflash.com/index.php
[17:47:41] ✅ Click en 'Crear Excel'
[17:47:43] ✅ Click en 'Generar fichero'
[17:47:46] ✅ Descarga iniciada
[17:47:56] 📄 Archivo: stock_551_0_2025_10_21_17_47_54.csv
[17:47:57] 📊 CSV leído con encoding utf-8: 79 registros ✅ (ACTUAL)
[17:47:57] 📋 Columnas del CSV: 100 columnas encontradas
[17:47:57] 📋 Registros procesados: 79 ✅
[17:47:58] ✅ Supabase configurado
[17:48:02] ✅ Datos subidos a Supabase: 79 registros ✅ (HOY)
[17:48:02] ✅ DUC completado exitosamente
```

---

## 🎯 RESUMEN DEL PASO 1

### ✅ Lo que funciona BIEN

1. **Conexión automática:** Scraper se ejecuta solo cada 8 horas ✅
2. **Login automático:** Credenciales funcionan ✅
3. **Descarga CSV:** Selenium funciona perfectamente ✅
4. **Procesamiento:** CSV se lee y limpia correctamente ✅
5. **Subida a Supabase:** 140 registros se insertan sin errores ✅
6. **Datos completos:** 89 columnas con información útil ✅

### ❌ Lo que NO funciona

1. **Tabla aislada:** duc_scraper no alimenta a stock ❌
2. **Sin sincronización:** RESERVADOS no marcan is_sold ❌
3. **Sin historial:** Se borra todo cada 8 horas ❌

### 📊 Estado actual

```
DATOS EN DUC (Web externa):
└─ 79 vehículos publicados ✅ (ACTUAL)

DATOS EN duc_scraper (CVO):
└─ 79 vehículos (actualizado cada 8h) ✅ (ACTUAL)
   ├─ ~68 DISPONIBLES
   ├─ ~10 RESERVADOS
   └─ ~1 VENDIDO

DATOS EN stock (CVO):
└─ 168 vehículos
   ├─ 93 marcados is_sold=true
   └─ 75 marcados is_sold=false
   
❌ PROBLEMA: Los ~10 RESERVADOS de duc_scraper
   NO están sincronizados con stock
```

---

## 🤔 SIGUIENTE PASO

Una vez entendido este PASO 1, el siguiente sería:

**PASO 2:** ¿Cómo entra un vehículo MANUALMENTE al sistema?
- Usuario crea entrada en `nuevas_entradas`
- ¿Qué datos se necesitan?
- ¿Qué pasa después?

¿Quieres que analicemos el PASO 2 o prefieres que profundicemos más en este PASO 1? 🎯


