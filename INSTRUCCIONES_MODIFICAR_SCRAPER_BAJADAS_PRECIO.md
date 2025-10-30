# 📋 MODIFICAR SCRAPER PARA TRACKEAR BAJADAS DE PRECIO

## 🎯 Objetivo

Detectar automáticamente cuando un vehículo baja de precio y registrar:
- **Número de veces** que ha bajado
- **Importe total** de todas las bajadas acumuladas

---

## 🗄️ SQL YA EJECUTADO

```sql
ALTER TABLE comparador_scraper 
ADD COLUMN IF NOT EXISTS numero_bajadas_precio INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS importe_total_bajado NUMERIC DEFAULT 0;
```

📁 **Archivo**: `sql/add_historial_bajadas_precio.sql`

---

## 🔧 MODIFICACIÓN DEL SCRAPER

### Lógica Actual del Scraper

Cuando el scraper detecta un vehículo:

1. Busca si ya existe por `id_anuncio` y `source`
2. Si existe: compara el precio actual vs el de la BD
3. Si el precio cambió: actualiza `precio_anterior`, `fecha_cambio_precio`, `estado_anuncio`

### Nueva Lógica a Añadir

Cuando detectas un **cambio de precio**, añade esta lógica:

```python
# ===== CÓDIGO A AÑADIR EN EL SCRAPER =====

def actualizar_vehiculo_existente(supabase, vehiculo_scrapeado, vehiculo_bd):
    """
    Actualizar vehículo existente detectando cambios de precio
    
    Args:
        supabase: Cliente de Supabase
        vehiculo_scrapeado: Dict con datos del scraping actual
        vehiculo_bd: Dict con datos actuales en la BD
    """
    
    # Extraer precios (limpiar formato: "32.900€" -> 32900)
    precio_actual_bd = float(vehiculo_bd['precio'].replace('€', '').replace('.', '').replace(',', '.'))
    precio_nuevo_scrapeado = float(vehiculo_scrapeado['precio'].replace('€', '').replace('.', '').replace(',', '.'))
    
    # Preparar datos de actualización
    datos_actualizacion = {
        'precio': vehiculo_scrapeado['precio'],
        'ultima_actualizacion': 'NOW()',
        'updated_at': 'NOW()'
    }
    
    # ===== NUEVA LÓGICA: DETECTAR BAJADA DE PRECIO =====
    if precio_nuevo_scrapeado < precio_actual_bd:
        diferencia_bajada = precio_actual_bd - precio_nuevo_scrapeado
        
        print(f"🔽 BAJADA DE PRECIO DETECTADA:")
        print(f"   Modelo: {vehiculo_scrapeado['modelo']}")
        print(f"   Precio anterior: {precio_actual_bd}€")
        print(f"   Precio nuevo: {precio_nuevo_scrapeado}€")
        print(f"   Diferencia: -{diferencia_bajada}€")
        
        # Incrementar contador de bajadas
        numero_bajadas_actual = vehiculo_bd.get('numero_bajadas_precio', 0) or 0
        importe_total_actual = vehiculo_bd.get('importe_total_bajado', 0) or 0
        
        datos_actualizacion.update({
            'precio_anterior': vehiculo_bd['precio'],  # Guardar el precio anterior
            'fecha_cambio_precio': 'NOW()',
            'estado_anuncio': 'precio_bajado',
            'numero_bajadas_precio': numero_bajadas_actual + 1,  # Incrementar contador
            'importe_total_bajado': importe_total_actual + diferencia_bajada  # Sumar diferencia
        })
        
        print(f"   Total de bajadas: {numero_bajadas_actual + 1}")
        print(f"   Importe total bajado: {importe_total_actual + diferencia_bajada}€")
    
    # ===== DETECTAR SUBIDA DE PRECIO =====
    elif precio_nuevo_scrapeado > precio_actual_bd:
        print(f"🔼 SUBIDA DE PRECIO DETECTADA:")
        print(f"   Modelo: {vehiculo_scrapeado['modelo']}")
        print(f"   Precio anterior: {precio_actual_bd}€")
        print(f"   Precio nuevo: {precio_nuevo_scrapeado}€")
        
        datos_actualizacion.update({
            'precio_anterior': vehiculo_bd['precio'],
            'fecha_cambio_precio': 'NOW()',
            'estado_anuncio': 'precio_subido'
            # NO tocamos numero_bajadas_precio ni importe_total_bajado
        })
    
    # ===== PRECIO SIN CAMBIOS =====
    else:
        # Solo actualizar updated_at
        datos_actualizacion['estado_anuncio'] = 'activo'
    
    # Ejecutar actualización en Supabase
    result = supabase.table('comparador_scraper').update(datos_actualizacion).eq('id', vehiculo_bd['id']).execute()
    
    return result


# ===== EJEMPLO DE INTEGRACIÓN EN TU SCRAPER ACTUAL =====

def procesar_vehiculo(supabase, vehiculo_scrapeado):
    """
    Procesar un vehículo del scraping
    """
    
    # Buscar si ya existe en la BD
    vehiculo_existente = supabase.table('comparador_scraper').select('*').eq('id_anuncio', vehiculo_scrapeado['id_anuncio']).eq('source', vehiculo_scrapeado['source']).execute()
    
    if vehiculo_existente.data and len(vehiculo_existente.data) > 0:
        # Vehículo ya existe -> actualizar
        vehiculo_bd = vehiculo_existente.data[0]
        actualizar_vehiculo_existente(supabase, vehiculo_scrapeado, vehiculo_bd)
    else:
        # Vehículo nuevo -> insertar
        vehiculo_scrapeado['estado_anuncio'] = 'nuevo'
        vehiculo_scrapeado['primera_deteccion'] = 'NOW()'
        vehiculo_scrapeado['numero_bajadas_precio'] = 0  # Inicializar en 0
        vehiculo_scrapeado['importe_total_bajado'] = 0    # Inicializar en 0
        
        supabase.table('comparador_scraper').insert(vehiculo_scrapeado).execute()
```

---

## 📊 QUERIES ÚTILES DESPUÉS DE IMPLEMENTAR

### Ver vehículos con bajadas de precio
```sql
SELECT 
    source,
    modelo,
    concesionario,
    precio as precio_actual,
    precio_anterior,
    numero_bajadas_precio as veces_bajado,
    importe_total_bajado as total_bajado,
    fecha_cambio_precio as ultima_bajada
FROM comparador_scraper
WHERE numero_bajadas_precio > 0
ORDER BY numero_bajadas_precio DESC, importe_total_bajado DESC;
```

### Top 10 vehículos con más bajadas
```sql
SELECT 
    modelo,
    concesionario,
    numero_bajadas_precio,
    importe_total_bajado,
    precio as precio_actual,
    ROUND((importe_total_bajado / (precio::NUMERIC + importe_total_bajado) * 100), 2) as porcentaje_bajado
FROM comparador_scraper
WHERE numero_bajadas_precio > 0
ORDER BY numero_bajadas_precio DESC
LIMIT 10;
```

### Estadísticas generales
```sql
SELECT 
    source,
    COUNT(*) as total_vehiculos,
    COUNT(*) FILTER (WHERE numero_bajadas_precio > 0) as con_bajadas,
    ROUND(AVG(numero_bajadas_precio), 2) as promedio_bajadas,
    ROUND(AVG(importe_total_bajado), 2) as promedio_importe_bajado
FROM comparador_scraper
WHERE estado_anuncio = 'activo'
GROUP BY source;
```

---

## 🎨 EJEMPLO DE VISUALIZACIÓN EN FRONTEND

Una vez implementado, podrás mostrar en los cards:

```
┌────────────────────────────────────┐
│ Concesionario Name                 │
│ BMW X3 xDrive20d 204 CV           │
│ 45.000 km • 2022 • 15/11/2024     │
│ 2 días • Desc: 18.5%              │
│ 🔽 Bajada: -2.500€ (3 veces)     │ ← NUEVA LÍNEA
└────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] 1. Ejecutar SQL: `sql/add_historial_bajadas_precio.sql`
- [ ] 2. Modificar scraper con la lógica de `actualizar_vehiculo_existente()`
- [ ] 3. Añadir `numero_bajadas_precio = 0` al insertar vehículos nuevos
- [ ] 4. Añadir `importe_total_bajado = 0` al insertar vehículos nuevos
- [ ] 5. Probar con un vehículo que cambie de precio
- [ ] 6. Verificar que se incrementa correctamente
- [ ] 7. Modificar frontend para mostrar la información

---

## 🔍 DEBUGGING

### Ver logs del scraper
El scraper debe mostrar algo como:
```
🔽 BAJADA DE PRECIO DETECTADA:
   Modelo: BMW X3 xDrive20d
   Precio anterior: 47500€
   Precio nuevo: 45000€
   Diferencia: -2500€
   Total de bajadas: 3
   Importe total bajado: 6500€
```

### Verificar en Supabase
```sql
SELECT * FROM comparador_scraper 
WHERE id_anuncio = 'TU_ID_ANUNCIO' 
AND source = 'BPS';
```

---

**Fecha:** 30 Octubre 2024  
**Estado:** ✅ SQL preparado, lógica documentada  
**Archivo SQL:** `sql/add_historial_bajadas_precio.sql`

