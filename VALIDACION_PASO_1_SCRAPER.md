# ✅ VALIDACIÓN PASO 1: SCRAPER DUC → duc_scraper

**Fecha validación:** 21 de octubre de 2025  
**Estado:** En proceso de validación

---

## 📋 QUÉ ESTAMOS VALIDANDO

El PASO 1 consiste en:
```
Scraper Python (automático cada 8h)
  ↓
Login DUC → Descargar CSV
  ↓
CSV guardado en: cvo-scraper-v1/dist/data/duc/
  ↓
Procesar CSV con pandas
  ↓
BORRAR tabla duc_scraper (DELETE ALL)
  ↓
INSERTAR datos nuevos en duc_scraper
```

---

## ✅ LO QUE YA SABEMOS (CONFIRMADO)

### 1. CSV Descargados Hoy
**Ubicación:** `cvo-scraper-v1/dist/data/duc/`

```
✅ stock_551_0_2025_10_21_16_51_49.csv (16:51)
✅ stock_551_0_2025_10_21_17_07_26.csv (17:07)
✅ stock_551_0_2025_10_21_17_22_31.csv (17:22)
✅ stock_551_0_2025_10_21_17_28_22.csv (17:28)
✅ stock_551_0_2025_10_21_17_47_54.csv (17:47) ← ÚLTIMO
```

**Conclusión:** El scraper SÍ está ejecutándose múltiples veces al día ✅

---

### 2. CSV Más Reciente
**Archivo:** `stock_551_0_2025_10_21_17_47_54.csv`  
**Hora descarga:** 17:47:54  
**Líneas totales:** 1081 líneas (incluyendo cabecera)

**⚠️ NOTA:** El usuario confirma que tiene **79 vehículos** (no 140)

---

### 3. Estructura del Scraper
**Archivo:** `cvo-scraper-v1/main.py`

```python
✅ Credenciales DUC: Jordivi01 / Jordivi02
✅ URL: https://gestionbmw.motorflash.com
✅ Método: Selenium (Chrome headless)
✅ Programación: Cada 8 horas (09:00-18:00)
✅ Proceso:
   1. Login
   2. Click "Crear Excel"
   3. Click "Generar fichero"
   4. Click "Descargar fichero"
   5. CSV → dist/data/duc/
```

---

### 4. Proceso de Subida a Supabase
**Función:** `process_duc_csv(csv_path)`

```python
✅ Lee CSV con pandas
✅ Limpia columnas (espacios, tabuladores)
✅ Mapea "Régimen fiscal" → "Regimen fiscal"
✅ Convierte a diccionarios (cleaned_records)
✅ DELETE ALL en duc_scraper
✅ INSERT nuevos registros
```

---

## ❓ LO QUE NECESITAMOS VALIDAR

### VALIDACIÓN 1: ¿Cuántos registros hay AHORA en duc_scraper?

**Opciones para validar:**

**A) Desde la interfaz web:**
- Ir a: `/dashboard/duc-scraper`
- Ver el contador de registros totales

**B) Desde Supabase directo:**
- Abrir: https://wpjmimbscfsdzcwuwctk.supabase.co
- Tabla Editor → duc_scraper
- Ver count

**C) Script (si quieres):**
```bash
node scripts/verificar_duc_scraper.js
```

**PREGUNTA:** ¿Cuántos registros ves en total en duc_scraper?
- [ ] 79 registros
- [ ] 140 registros
- [ ] Otro número: _____

---

### VALIDACIÓN 2: ¿Cuántos vehículos están RESERVADOS?

**Campos a buscar:**
- Columna: `Disponibilidad`
- Valores posibles:
  - "DISPONIBLE"
  - "RESERVADO"
  - "VENDIDO"

**PREGUNTA:** ¿Cuántos tienen `Disponibilidad = "RESERVADO"`?
- [ ] ~10 reservados
- [ ] 17 reservados (dato antiguo)
- [ ] Otro número: _____

---

### VALIDACIÓN 3: ¿El CSV tiene realmente 79 vehículos?

**Para verificar:**

**A) Contar líneas en el CSV:**
```powershell
# Total de líneas
Get-Content "cvo-scraper-v1/dist/data/duc/stock_551_0_2025_10_21_17_47_54.csv" | Measure-Object -Line

# Primera línea (cabecera)
Get-Content "cvo-scraper-v1/dist/data/duc/stock_551_0_2025_10_21_17_47_54.csv" | Select-Object -First 1

# Líneas de datos (total - cabecera)
# Si da 80 líneas = 1 cabecera + 79 vehículos ✅
```

**B) Ver manualmente:**
- Abrir CSV con Excel o Notepad
- Contar filas (excluyendo cabecera)

**PREGUNTA:** ¿Cuántas líneas de DATOS tiene el CSV (sin contar cabecera)?
- [ ] 79 líneas
- [ ] 140 líneas
- [ ] Otro número: _____

---

### VALIDACIÓN 4: ¿Cuándo fue la última importación?

**Campo en duc_scraper:**
- `import_date` - Cuándo se importó
- `created_at` - Cuándo se creó el registro

**PREGUNTA:** ¿Cuál es la fecha/hora del registro más reciente?
- [ ] 2025-10-21 17:47:54 (del último CSV)
- [ ] 2025-10-14 11:34:36 (dato antiguo)
- [ ] Otra fecha: _____

---

### VALIDACIÓN 5: ¿Las columnas del CSV coinciden con la tabla?

**Verificar:**
- CSV tiene ~100 columnas
- duc_scraper debe tener las mismas columnas
- Algunas columnas están vacías

**Columnas clave a verificar:**
```
✅ "ID Anuncio" (PK)
✅ "Matrícula"
✅ "Modelo"
✅ "Disponibilidad" ← CRÍTICO
✅ "Precio"
✅ "Kilómetros"
✅ "Marca"
✅ "Regimen fiscal" (sin acento)
```

**PREGUNTA:** ¿La tabla tiene todas estas columnas?
- [ ] Sí, todas presentes
- [ ] Faltan algunas
- [ ] Hay errores en nombres

---

### VALIDACIÓN 6: ¿El scraper BORRA todo antes de insertar?

**Proceso esperado:**
```sql
-- Paso 1: BORRAR TODO
DELETE FROM duc_scraper WHERE created_at > '1900-01-01'

-- Paso 2: INSERTAR TODO
INSERT INTO duc_scraper VALUES (...)  -- x79 veces
```

**Resultado esperado:**
- duc_scraper siempre tiene SOLO los vehículos del último CSV
- NO hay vehículos de CSVs antiguos
- NO hay duplicados

**PREGUNTA:** ¿Los registros son todos del mismo `import_date`?
- [ ] Sí, todos tienen la misma fecha de importación
- [ ] No, hay registros de diferentes fechas
- [ ] No sé cómo verificarlo

---

## 🔍 CÓMO VALIDAR CADA PUNTO

### Opción 1: Interfaz Web CVO
```
1. Ir a: http://localhost:3000/dashboard/duc-scraper
2. Ver estadísticas mostradas
3. Verificar contadores
```

### Opción 2: Supabase Web
```
1. Ir a: https://wpjmimbscfsdzcwuwctk.supabase.co
2. Login con tus credenciales
3. Table Editor → duc_scraper
4. Ver datos y hacer queries
```

### Opción 3: Scripts Node.js
```bash
# Ver estadísticas completas
node scripts/verificar_duc_scraper.js

# Ver estado del sistema
node scripts/monitor_salud_sistema.js

# Comparar DUC vs STOCK
node scripts/comparativa_duc_vs_stock.js
```

### Opción 4: SQL Directo
```sql
-- Total de registros
SELECT COUNT(*) FROM duc_scraper;

-- Por disponibilidad
SELECT "Disponibilidad", COUNT(*) 
FROM duc_scraper 
GROUP BY "Disponibilidad";

-- Última importación
SELECT MAX(import_date) FROM duc_scraper;

-- Vehículos reservados
SELECT "Matrícula", "Modelo", "Disponibilidad"
FROM duc_scraper
WHERE "Disponibilidad" ILIKE '%reservado%';
```

---

## 📊 TEMPLATE DE VALIDACIÓN

**Por favor, completa estos datos:**

```
VALIDACIÓN PASO 1 - SCRAPER DUC
================================

1. CONTEO TOTAL
   Total registros en duc_scraper: [ ___ ]

2. DISTRIBUCIÓN POR ESTADO
   DISPONIBLE: [ ___ ]
   RESERVADO:  [ ___ ]
   VENDIDO:    [ ___ ]
   OTROS:      [ ___ ]

3. ÚLTIMA IMPORTACIÓN
   Fecha/hora: [ ____-__-__ __:__:__ ]
   Archivo CSV: [ stock_551_0_2025_10_21_17_47_54.csv ]

4. REGISTROS EN CSV
   Líneas totales: [ ___ ]
   Líneas de datos (sin cabecera): [ ___ ]

5. COLUMNAS
   Total columnas en tabla: [ ___ ]
   Columnas con datos: [ ___ ]
   Columnas vacías: [ ___ ]

6. VEHÍCULOS DE EJEMPLO (3 primeros)
   1. Matrícula: [ _____ ] - Modelo: [ _____ ] - Estado: [ _____ ]
   2. Matrícula: [ _____ ] - Modelo: [ _____ ] - Estado: [ _____ ]
   3. Matrícula: [ _____ ] - Modelo: [ _____ ] - Estado: [ _____ ]

7. PROBLEMAS DETECTADOS
   [ ] Ninguno
   [ ] Duplicados
   [ ] Fechas incorrectas
   [ ] Columnas faltantes
   [ ] Otros: _______________
```

---

## ❌ PROBLEMAS CONOCIDOS A VALIDAR

### Problema 1: duc_scraper aislado
```
✅ SABEMOS: duc_scraper NO sincroniza con stock
❓ VALIDAR: ¿Cuántos RESERVADOS hay que deberían estar en stock?
```

### Problema 2: Número inconsistente
```
⚠️ CONFLICTO: 
   - Documentación antigua: 140 vehículos
   - Usuario dice: 79 vehículos
❓ VALIDAR: ¿Cuál es el número REAL en duc_scraper AHORA?
```

### Problema 3: Sin historial
```
✅ SABEMOS: Se borra todo cada 8h
❓ VALIDAR: ¿Todos los registros tienen el mismo import_date?
```

---

## 🎯 SIGUIENTE PASO DESPUÉS DE VALIDAR

Una vez validemos el PASO 1, continuaremos con:

**PASO 2:** ¿Cómo se crea una "nueva entrada" manualmente?
- Usuario crea en `/dashboard/nuevas-entradas`
- Se guarda en tabla `nuevas_entradas`
- ¿Qué datos se necesitan?

**Pero primero:** Necesitamos confirmar que el PASO 1 está correcto.

---

## 💬 PREGUNTAS PARA EL USUARIO

1. **¿Quieres que validemos usando alguna de estas opciones?**
   - [ ] Interfaz web (`/dashboard/duc-scraper`)
   - [ ] Supabase web directo
   - [ ] Scripts de Node.js
   - [ ] SQL queries que te paso
   - [ ] Otro método

2. **¿Qué dato es el más importante validar primero?**
   - [ ] Número total de vehículos
   - [ ] Cuántos RESERVADOS hay
   - [ ] Si el CSV se procesó correctamente
   - [ ] Si hay conexión con stock

3. **¿Tienes acceso a la interfaz de Supabase?**
   - [ ] Sí, puedo ver la tabla directamente
   - [ ] No, prefiero usar scripts
   - [ ] No sé dónde está

---

**Estado actual:** ⏸️ Esperando validación del usuario  
**Siguiente acción:** Completar template de validación o elegir método


