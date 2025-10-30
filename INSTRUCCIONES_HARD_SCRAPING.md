# 🔥 INSTRUCCIONES: HARD SCRAPING - Sistema Dual

## 📋 ¿Qué es el Hard Scraping?

El **Hard Scraping** es un proceso complementario al **Light Scraping** que extrae datos adicionales entrando en las fichas individuales de cada vehículo.

---

## 🎯 Diferencias: Light vs Hard

| Característica | LIGHT (Normal) | HARD (Profundo) |
|---------------|----------------|-----------------|
| **Velocidad** | ⚡ Rápido (5-10 seg/página) | 🐌 Lento (2-3 seg/vehículo) |
| **Frecuencia** | 🔄 Cada 30 minutos | 📅 Semanal o bajo demanda |
| **Datos extraídos** | Básicos (7 campos) | Completos (16+ campos) |
| **Objetivo** | Detectar nuevos/cambios | Enriquecer con detalles |
| **Navegación** | Solo listado | Entra en cada ficha |
| **Carga** | Baja | Media |

---

## 📊 Datos adicionales que extrae el HARD

### 🔥 Dato MÁS IMPORTANTE:
**Fecha de primera matriculación EXACTA (DD/MM/YYYY)**
- Permite calcular antigüedad precisa en meses
- Mejora significativamente el cálculo de precios ajustados
- Diferencia entre "2024" y "05/09/2024"

### Otros datos extraídos:
1. Color de carrocería
2. Tipo de combustible exacto
3. Potencia (KW y CV separados)
4. Transmisión (Automático/Manual)
5. Cilindrada (cc)
6. Etiqueta ambiental (ECO, CERO, C, B)
7. Tapizado/Interior
8. Equipamiento completo (array)

---

## 🚀 Cómo usar el Hard Scraping

### 1️⃣ Ejecutar SQL (SOLO PRIMERA VEZ)

```bash
1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Abre: sql/add_hard_scraping_columns.sql
4. Ejecuta el script completo
5. Verifica que no hay errores
```

### 2️⃣ Abrir Scraper

```bash
Ejecuta: CVO_Scraper_v1.2.0.exe
```

### 3️⃣ Navegar a las nuevas pestañas

- **🔥 BPS Hard**: Para BMW Premium Selection
- **🔥 MN Hard**: Para MINI Next

### 4️⃣ Ejecutar Hard Scraping

**Opción A: Manual (recomendado para probar)**
1. Clic en "📊 Ver Pendientes" para ver cuántos vehículos necesitan Hard
2. Ajusta "Vehículos por ejecución" (50-100 recomendado)
3. Clic en "🔥 Ejecutar BPS Hard" o "🔥 Ejecutar MN Hard"
4. Los logs aparecen en la consola de BMW PS o MINI Next

**Opción B: Programado (para producción)**
- Por ahora es solo manual
- En futuras versiones se puede programar semanal

---

## 📈 Estrategia recomendada

### Flujo óptimo:

```
┌─────────────────────────────────────┐
│  PASO 1: LIGHT SCRAPING             │
│  Frecuencia: Cada 30 minutos        │
│  Acción: Detecta nuevos vehículos   │
│          Detecta cambios de precio  │
│          Marca desaparecidos        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  PASO 2: HARD SCRAPING              │
│  Frecuencia: Semanal (lunes 8:00)   │
│  Acción: Enriquece con fecha exacta │
│          Añade color, potencia, etc │
│          NO recalcula precios       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  RESULTADO: Datos completos         │
│  • Antigüedad precisa (meses)       │
│  • Precio ajustado mejorado         │
│  • Comparativa más rica             │
└─────────────────────────────────────┘
```

### Configuración recomendada:

**Light Scraping (pestañas BMW PS y MINI Next)**
- ✅ Activo
- Días: Todos (L-D)
- Inicio: 08:00
- Fin: 22:00
- Intervalo: 0.5 horas (30 min)

**Hard Scraping (pestañas BPS Hard y MN Hard)**
- Manual inicial: Ejecutar una vez para procesar stock existente
- Mantenimiento: 1 vez por semana (50-100 vehículos)

---

## 🔍 Verificación de resultados

### En Supabase:

```sql
-- Ver vehículos con datos HARD
SELECT 
    id_anuncio,
    modelo,
    fecha_primera_matriculacion,
    color_carroceria,
    potencia_kw,
    potencia_cv,
    tipo_scraping,
    ultima_extraccion_hard
FROM comparador_scraper
WHERE fecha_primera_matriculacion IS NOT NULL
LIMIT 10;

-- Ver pendientes de HARD
SELECT 
    source,
    COUNT(*) as pendientes
FROM comparador_scraper
WHERE estado_anuncio = 'activo'
  AND fecha_primera_matriculacion IS NULL
GROUP BY source;

-- Ver antigüedad precisa
SELECT 
    modelo,
    fecha_primera_matriculacion,
    calcular_antiguedad_meses(fecha_primera_matriculacion) as meses_antiguedad,
    precio,
    km
FROM comparador_scraper
WHERE fecha_primera_matriculacion IS NOT NULL
ORDER BY fecha_primera_matriculacion DESC
LIMIT 10;
```

---

## ⚠️ Notas importantes

### ✅ Cosas que el HARD hace:
- Entra en cada ficha individual
- Extrae fecha de matriculación exacta
- Añade color, combustible, potencia, etc.
- Actualiza solo campos nuevos
- Marca `tipo_scraping = 'hard'`
- Actualiza `ultima_extraccion_hard`

### ❌ Cosas que el HARD NO hace:
- ❌ NO recalcula el precio ajustado (lo hace otra herramienta)
- ❌ NO modifica datos existentes del LIGHT
- ❌ NO borra registros
- ❌ NO procesa vehículos que ya tienen fecha de matriculación

---

## 🐛 Solución de problemas

### Problema: "No hay vehículos pendientes"
**Solución**: Primero ejecuta el Light Scraping para detectar vehículos

### Problema: "Supabase no configurado"
**Solución**: Verifica que `.env` tiene las credenciales correctas

### Problema: "Error al extraer fecha"
**Solución**: Normal si la web no tiene la fecha. El HARD procesa lo que puede.

### Problema: "Muy lento"
**Solución**: Reduce el límite de vehículos por ejecución (ej: 20-30)

---

## 📊 Ejemplo de ejecución exitosa

```
🔥 Ejecutando BMW Premium Selection HARD SCRAPING...
📊 Límite: 50 vehículos por ejecución
🔍 Buscando vehículos sin Hard Scraping...
📦 Encontrados 50 vehículos pendientes
🌐 Inicializando navegador...

🔥 [1/50] BMW X1 xDrive25e - ID: 88071395
   📅 Fecha matriculación: 2024-09-05
   ⚡ Potencia: 180KW (245CV)
   🎁 Equipamiento: 15 items
   ✅ Actualizado con datos HARD

🔥 [2/50] BMW Serie 3 320d - ID: 88071234
   📅 Fecha matriculación: 2023-11-20
   ⚡ Potencia: 140KW (190CV)
   🎁 Equipamiento: 12 items
   ✅ Actualizado con datos HARD

...

============================================================
🔥 RESUMEN HARD SCRAPING BPS
============================================================
📊 Procesados: 50
✅ Actualizados: 48
❌ Errores: 2
============================================================
```

---

## 🔄 Actualización del sistema

Para volver a ejecutar el HARD en vehículos ya procesados:

```sql
-- Resetear HARD de todos los vehículos
UPDATE comparador_scraper
SET fecha_primera_matriculacion = NULL,
    ultima_extraccion_hard = NULL,
    tipo_scraping = 'light'
WHERE source = 'BPS';  -- O 'MN'
```

---

## 📞 Soporte

Si tienes dudas:
1. Revisa este documento
2. Consulta `DATOS_DISPONIBLES_HARD_SCRAPING.md` para detalles técnicos
3. Verifica los logs en las consolas de BMW PS o MINI Next

---

**Versión**: 1.2.0  
**Fecha**: 29/10/2025  
**Autor**: CVO Scraper QUADIS Munich



