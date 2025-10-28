# 📊 Sistema de Analytics del Comparador de Precios

## 🎯 Objetivo
Analizar en profundidad cómo trabaja la competencia con sus precios, detectar patrones, estrategias y oportunidades de mercado.

---

## 📈 Métricas y Análisis Disponibles

### 1. **Análisis por Modelo** (`comparador_stats_por_modelo`)
**Qué responde:**
- ¿Cuántos anuncios hay de cada modelo?
- ¿Cuántos días promedio están publicados los Serie 3, X3, etc?
- ¿Cuál es el rango de precios por modelo?
- ¿Qué descuento promedio ofrece cada modelo?

**Ejemplo de uso:**
```sql
SELECT * FROM comparador_stats_por_modelo 
WHERE serie = 'Serie 3' 
ORDER BY promedio_dias_publicado DESC;
```

**API:**
```
GET /api/comparador/analytics?type=modelos&source=BPS
```

**Campos clave:**
- `promedio_dias_publicado` - Días promedio que está publicado
- `anuncios_activos` - Cuántos están activos ahora
- `descuento_promedio_porcentaje` - % descuento medio
- `precio_promedio` - Precio medio del modelo

---

### 2. **Análisis por Concesionario** (`comparador_stats_por_concesionario`)
**Qué responde:**
- ¿Qué concesionarios tienen más stock?
- ¿Cuánto tarda cada concesionario en vender (rotación)?
- ¿Qué estrategia de descuento usa cada uno?
- ¿Con qué frecuencia cambian precios?

**Ejemplo de uso:**
```sql
SELECT * FROM comparador_stats_por_concesionario 
WHERE source = 'BPS'
ORDER BY promedio_dias_publicado ASC;
```

**API:**
```
GET /api/comparador/analytics?type=concesionarios&source=BPS
```

**Campos clave:**
- `promedio_dias_publicado` - Velocidad de rotación
- `promedio_dias_antes_venta` - Cuánto tardó en vender los que ya se vendieron
- `bajadas_precio_totales` / `subidas_precio_totales` - Dinámica de precios
- `porcentaje_anuncios_con_cambios` - Agresividad en ajustes

---

### 3. **Frecuencia de Reposicionamiento** (`comparador_frecuencia_cambios`)
**Qué responde:**
- ¿Cada cuánto tiempo reposicionan precios?
- ¿Son agresivos bajando o subiendo?
- ¿Cuánto cambian en promedio (€ y %)?

**Ejemplo de uso:**
```sql
SELECT * FROM comparador_frecuencia_cambios 
WHERE concesionario = 'Amiocar';
```

**API:**
```
GET /api/comparador/analytics?type=frecuencia_cambios
```

**Campos clave:**
- `promedio_cambios_por_anuncio` - Cuántas veces cambian precio por coche
- `promedio_dias_entre_cambios` - Cada cuántos días ajustan
- `porcentaje_cambios_son_bajadas` - Si bajan más que suben (agresividad)
- `cambio_promedio_euros` - Magnitud típica del ajuste

---

### 4. **Estrategias de Concesionarios** (`comparador_estrategias_concesionarios`)
**Qué responde:**
- ¿Qué estrategia sigue cada concesionario?
- ¿Es Premium, Competitivo o Agresivo en precios?
- ¿Rota rápido o lento?
- ¿Ajusta precios frecuentemente o no?

**Clasificaciones automáticas:**

**Estrategia de Precio:**
- **Precios Premium**: Descuento < 10%
- **Precios Competitivos**: Descuento 10-20%
- **Precios Agresivos**: Descuento > 20%

**Velocidad de Rotación:**
- **Rotación Rápida**: < 15 días
- **Rotación Media**: 15-45 días
- **Rotación Lenta**: > 45 días

**Dinámica de Precios:**
- **Sin ajustes**: 0 cambios
- **Ajustes Ocasionales**: < 2 cambios por anuncio
- **Ajustes Frecuentes**: ≥ 2 cambios por anuncio

**Tendencia de Ajustes:**
- **Principalmente baja precios**: > 70% bajadas
- **Mix**: 30-70% bajadas
- **Principalmente sube precios**: < 30% bajadas

**Ejemplo de uso:**
```sql
SELECT concesionario, estrategia_precio, velocidad_rotacion, dinamica_precios
FROM comparador_estrategias_concesionarios
WHERE source = 'BPS'
ORDER BY anuncios_activos DESC;
```

**API:**
```
GET /api/comparador/analytics?type=estrategias
```

---

### 5. **Stock Estancado** (`comparador_stock_estancado`)
**Qué responde:**
- ¿Qué coches llevan mucho tiempo sin venderse?
- ¿Han intentado bajar precio o no?
- ¿Hace cuánto fue el último ajuste?

**Ejemplo de uso:**
```sql
SELECT * FROM comparador_stock_estancado 
WHERE dias_publicado > 60
ORDER BY dias_publicado DESC;
```

**API:**
```
GET /api/comparador/analytics?type=stock_estancado&source=BPS
```

---

### 6. **Velocidad de Venta** (`comparador_velocidad_venta`)
**Qué responde:**
- ¿Qué modelos se venden más rápido?
- ¿Cuántos días tarda un Serie 3 en venderse?
- ¿Cuál es la mediana de días hasta venta?

**Ejemplo de uso:**
```sql
SELECT * FROM comparador_velocidad_venta 
WHERE serie = 'X3'
ORDER BY dias_promedio_hasta_venta ASC;
```

**API:**
```
GET /api/comparador/analytics?type=velocidad_venta
```

---

### 7. **Modelos Más Competitivos** (`comparador_modelos_mas_competitivos`)
**Qué responde:**
- ¿Qué modelos tienen mayor descuento?
- ¿Dónde hay más oportunidades?

**API:**
```
GET /api/comparador/analytics?type=mas_competitivos
```

---

### 8. **Reporte Completo de Concesionario**
**Qué responde:**
- Informe completo de un concesionario específico
- Todas sus métricas en un solo lugar

**Ejemplo de uso:**
```sql
SELECT * FROM obtener_reporte_concesionario('Amiocar', 'BPS');
```

**API:**
```
GET /api/comparador/analytics?type=reporte_concesionario&concesionario=Amiocar&source=BPS
```

---

### 9. **Historial de Precio de un Anuncio**
**Qué responde:**
- ¿Cómo ha evolucionado el precio de un coche específico?
- ¿Cuántas veces ha cambiado?
- ¿Cuándo fue cada cambio?

**API:**
```
GET /api/comparador/analytics?type=historial_precio&id_anuncio=12345&source=BPS
```

---

## 🔄 Sistema de Snapshots

### ¿Qué es?
Guarda una "foto" diaria de todos los precios activos para análisis temporal.

### ¿Para qué sirve?
- Ver evolución de precios a lo largo del tiempo
- Detectar tendencias de mercado
- Comparar precios de hace semanas/meses

### Crear snapshot manual:
```sql
SELECT crear_snapshot_diario();
```

**API:**
```
POST /api/comparador/analytics
```

---

## 📊 Casos de Uso Reales

### **Caso 1: Analizar competencia en Serie 3**
```sql
-- Ver todos los Serie 3 y su estrategia
SELECT 
    c.concesionario,
    COUNT(*) as stock,
    ROUND(AVG(c.dias_publicado), 1) as dias_promedio,
    ROUND(AVG(c.porcentaje_descuento), 2) as descuento_promedio,
    e.estrategia_precio,
    e.dinamica_precios
FROM comparador_scraper c
LEFT JOIN comparador_estrategias_concesionarios e 
    ON c.concesionario = e.concesionario AND c.source = e.source
WHERE c.modelo LIKE '%Serie 3%'
AND c.estado_anuncio = 'activo'
GROUP BY c.concesionario, e.estrategia_precio, e.dinamica_precios
ORDER BY stock DESC;
```

### **Caso 2: Detectar oportunidades (stock estancado con poco descuento)**
```sql
-- Coches que llevan mucho tiempo SIN bajar precio
SELECT 
    modelo,
    concesionario,
    dias_publicado,
    precio,
    porcentaje_descuento,
    url
FROM comparador_stock_estancado
WHERE dias_publicado > 45
AND porcentaje_descuento < 15
ORDER BY dias_publicado DESC
LIMIT 20;
```

### **Caso 3: Ver quién es más agresivo en X3**
```sql
-- Concesionarios más agresivos en X3
SELECT 
    c.concesionario,
    COUNT(*) as stock_x3,
    ROUND(AVG(c.porcentaje_descuento), 2) as descuento_promedio,
    ROUND(AVG(f.promedio_cambios_por_anuncio), 1) as cambios_promedio,
    f.porcentaje_cambios_son_bajadas
FROM comparador_scraper c
LEFT JOIN comparador_frecuencia_cambios f
    ON c.concesionario = f.concesionario AND c.source = f.source
WHERE c.modelo LIKE '%X3%'
AND c.estado_anuncio = 'activo'
GROUP BY c.concesionario, f.porcentaje_cambios_son_bajadas
ORDER BY descuento_promedio DESC;
```

### **Caso 4: Benchmark de nuestra estrategia**
```sql
-- Comparar estrategias de todos
SELECT 
    concesionario,
    anuncios_activos,
    estrategia_precio,
    velocidad_rotacion,
    dinamica_precios,
    tendencia_ajustes,
    descuento_promedio,
    dias_promedio_stock
FROM comparador_estrategias_concesionarios
WHERE source = 'BPS'
ORDER BY anuncios_activos DESC;
```

---

## 🚀 Automatización

### Snapshot Diario Automático
Programar en Supabase (Dashboard > Database > Functions > Cron):

```sql
-- Ejecutar cada día a las 3:00 AM
SELECT cron.schedule(
    'snapshot-diario-comparador',
    '0 3 * * *',
    $$SELECT crear_snapshot_diario()$$
);
```

---

## 🎨 Dashboard Recomendado

### Vista Principal:
1. **KPIs Generales**
   - Total anuncios activos
   - Descuento promedio mercado
   - Total cambios de precio (últimos 7 días)

2. **Top Concesionarios**
   - Por volumen
   - Por agresividad (mayor descuento)
   - Por rotación más rápida

3. **Gráficos**
   - Evolución de precios (snapshots)
   - Distribución de estrategias (Premium/Competitivo/Agresivo)
   - Frecuencia de cambios de precio por concesionario

4. **Alertas**
   - Stock estancado > 60 días
   - Bajadas de precio recientes
   - Nuevos competidores (primeros anuncios)

---

## 📝 Notas Importantes

1. **Datos se actualizan automáticamente** cada vez que el scraper ejecuta
2. **Los snapshots permiten análisis histórico** (ejecutar diariamente)
3. **Las vistas son en tiempo real** (no hay caché)
4. **Triggers automáticos calculan** descuentos y detectan cambios
5. **Sistema escalable** para agregar más fuentes (AutoScout24, etc.)

---

## 🔧 Mantenimiento

### Limpiar historial antiguo (opcional, cada 6 meses):
```sql
-- Borrar snapshots de hace más de 6 meses
DELETE FROM comparador_precio_snapshots 
WHERE fecha_snapshot < NOW() - INTERVAL '6 months';
```

### Ver espacio usado:
```sql
SELECT 
    'comparador_scraper' as tabla,
    pg_size_pretty(pg_total_relation_size('comparador_scraper')) as tamaño
UNION ALL
SELECT 
    'comparador_historial_precios',
    pg_size_pretty(pg_total_relation_size('comparador_historial_precios'))
UNION ALL
SELECT 
    'comparador_precio_snapshots',
    pg_size_pretty(pg_total_relation_size('comparador_precio_snapshots'));
```

