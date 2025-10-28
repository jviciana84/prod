# 📝 Instrucciones para Aplicar SQL del Comparador

## 🎯 Objetivo
Actualizar la base de datos de Supabase con el sistema completo de tracking y analytics del comparador.

---

## 📋 Pasos a Seguir

### **1. Acceder a Supabase SQL Editor**
1. Ve a: https://supabase.com/dashboard/project/wpjmimbscfsdzcwuwctk/sql/new
2. Asegúrate de estar en el proyecto correcto (wpjmimbscfsdzcwuwctk)

---

### **2. Ejecutar SQL de Tracking (PRIMERO)**

**Archivo:** `sql/update_comparador_tracking.sql`

**Qué hace:**
- Agrega columnas de tracking (días publicado, precio anterior, descuentos, etc.)
- Crea tabla de historial de precios
- Implementa triggers automáticos para detectar cambios

**Cómo aplicar:**
1. Abre el archivo `sql/update_comparador_tracking.sql`
2. Copia TODO el contenido
3. Pega en el SQL Editor de Supabase
4. Haz clic en **RUN** (o presiona Ctrl+Enter)
5. Espera a que termine (debería decir "Success")

**Tiempo estimado:** 10-15 segundos

---

### **3. Ejecutar SQL de Analytics (SEGUNDO)**

**Archivo:** `sql/analytics_comparador.sql`

**Qué hace:**
- Crea vistas analíticas (por modelo, concesionario, etc.)
- Implementa funciones de análisis
- Crea tabla de snapshots para análisis temporal

**Cómo aplicar:**
1. Abre el archivo `sql/analytics_comparador.sql`
2. Copia TODO el contenido
3. Pega en el SQL Editor de Supabase
4. Haz clic en **RUN** (o presiona Ctrl+Enter)
5. Espera a que termine (debería decir "Success")

**Tiempo estimado:** 15-20 segundos

---

### **4. Verificar que Todo Funciona**

Ejecuta esta query para verificar:

```sql
-- Verificar tablas creadas
SELECT 
    'comparador_scraper' as tabla,
    COUNT(*) as registros
FROM comparador_scraper

UNION ALL

SELECT 
    'comparador_historial_precios',
    COUNT(*)
FROM comparador_historial_precios

UNION ALL

SELECT 
    'comparador_precio_snapshots',
    COUNT(*)
FROM comparador_precio_snapshots;

-- Verificar vistas creadas
SELECT 
    viewname 
FROM pg_views 
WHERE viewname LIKE 'comparador_%'
ORDER BY viewname;

-- Verificar funciones creadas
SELECT 
    proname as funcion
FROM pg_proc 
WHERE proname IN (
    'calcular_descuento_comparador',
    'detectar_cambio_precio',
    'crear_snapshot_diario',
    'obtener_reporte_concesionario'
);
```

**Resultado esperado:**
- ✅ 3 tablas con sus respectivos registros
- ✅ 9 vistas creadas
- ✅ 4 funciones creadas

---

### **5. Probar una Consulta Analítica**

Ejecuta esta query de prueba:

```sql
-- Ver estadísticas por modelo
SELECT 
    source,
    modelo,
    total_anuncios,
    promedio_dias_publicado,
    descuento_promedio_porcentaje,
    precio_promedio
FROM comparador_stats_por_modelo
ORDER BY total_anuncios DESC
LIMIT 10;
```

**Deberías ver:** Top 10 modelos con sus estadísticas

---

### **6. Ejecutar Scraper Actualizado**

Una vez aplicado el SQL, el scraper automáticamente:
- ✅ Detectará cambios de precio
- ✅ Calculará descuentos
- ✅ Registrará días publicado
- ✅ Marcará anuncios desaparecidos
- ✅ Guardará historial de cambios

**No necesitas hacer nada más, todo es automático!**

---

## 🚨 Si Hay Errores

### Error: "relation already exists"
**Solución:** Algunas tablas/vistas ya existen. Puedes:
1. Ignorarlo (el SQL tiene `IF NOT EXISTS`)
2. O ejecutar este comando primero para limpiar:
```sql
-- CUIDADO: Esto borra datos existentes
DROP TABLE IF EXISTS comparador_historial_precios CASCADE;
DROP TABLE IF EXISTS comparador_precio_snapshots CASCADE;
DROP VIEW IF EXISTS comparador_stats_por_modelo CASCADE;
DROP VIEW IF EXISTS comparador_stats_por_concesionario CASCADE;
DROP VIEW IF EXISTS comparador_frecuencia_cambios CASCADE;
DROP VIEW IF EXISTS comparador_modelos_mas_competitivos CASCADE;
DROP VIEW IF EXISTS comparador_stock_estancado CASCADE;
DROP VIEW IF EXISTS comparador_velocidad_venta CASCADE;
DROP VIEW IF EXISTS comparador_estrategias_concesionarios CASCADE;
```

### Error: "permission denied"
**Solución:** Asegúrate de estar usando el SQL Editor de Supabase con permisos de administrador.

### Error en triggers
**Solución:** Ejecuta primero la parte de columnas, luego la de triggers por separado.

---

## ✅ Confirmación Final

Cuando todo esté aplicado correctamente, verás:
- ✅ Nuevas columnas en `comparador_scraper`
- ✅ Tabla `comparador_historial_precios` creada
- ✅ Tabla `comparador_precio_snapshots` creada
- ✅ 9 vistas analíticas disponibles
- ✅ 4 funciones SQL creadas
- ✅ Triggers activos y funcionando

**Ya puedes probar el scraper actualizado!**

---

## 📊 Próximo Paso

Una vez aplicado el SQL y probado el scraper:
1. Ver que detecta cambios de precio
2. Verificar que calcula descuentos automáticamente
3. Comprobar que registra días publicado
4. Probar las APIs de analytics

**¿Necesitas ayuda?** Avísame si hay algún error al aplicar los SQLs.

