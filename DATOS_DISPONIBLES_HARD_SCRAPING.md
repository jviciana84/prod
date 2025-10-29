# 🔥 DATOS DISPONIBLES PARA HARD SCRAPING

## 📋 Resumen Ejecutivo

Este documento detalla **qué datos adicionales** se pueden extraer entrando en las **fichas individuales** de cada vehículo (Hard Scraping) vs. el listado general (Light Scraping).

---

## 🚗 BMW PREMIUM SELECTION (BPS)

### ✅ Datos ya disponibles en LIGHT (listado general)
- Modelo
- Precio actual
- Kilómetros
- Año (solo año, ej: 2024)
- Concesionario
- URL de la ficha
- ID_Anuncio
- Precio nuevo (estimado)
- Ahorro calculado

### 🔥 Datos NUEVOS que aporta HARD (ficha individual)

| Campo | Disponible | Patrón de extracción | Valor para negocio |
|-------|-----------|---------------------|-------------------|
| **🎯 Fecha primera matriculación** | ✅ SÍ | `Fecha primera matriculación: DD / MM / YYYY` | ⭐⭐⭐⭐⭐ CRÍTICO |
| Color carrocería | ✅ SÍ | `Pintura: [Color]` | ⭐⭐⭐ |
| Combustible | ✅ SÍ | Texto: Híbrido Electro/Gasolina, Gasolina, Diésel, Eléctrico | ⭐⭐⭐⭐ |
| Potencia | ✅ SÍ | `Potencia: XXX KW (YYY CV)` | ⭐⭐⭐⭐ |
| Transmisión | ✅ SÍ | Texto: Automático / Manual | ⭐⭐⭐ |
| Cilindrada | ✅ SÍ | `XXXX cc` | ⭐⭐ |
| Etiqueta ambiental | ✅ SÍ | ECO, CERO, C, B | ⭐⭐⭐ |
| Tapizado/Interior | ⚠️ PARCIAL | `Tapizado: [Tipo]` | ⭐⭐ |
| Equipamiento completo | ⚠️ PARCIAL | Lista de extras | ⭐⭐ |
| Puertas | ⚠️ NO ENCONTRADO | - | ⭐ |
| Plazas | ⚠️ NO ENCONTRADO | - | ⭐ |
| Garantía | ⚠️ NO ENCONTRADO | - | ⭐⭐ |

### 💡 Impacto del dato MÁS IMPORTANTE: Fecha Matriculación Exacta

#### ❌ Situación ACTUAL (solo año)
- **Vehículo A**: Año 2024 → Puede ser de enero o diciembre
- **Vehículo B**: Año 2024 → Puede tener 3 meses o 12 meses
- **Problema**: Misma depreciación para vehículos con hasta 11 meses de diferencia

#### ✅ Con FECHA EXACTA (Hard Scraping)
- **Vehículo A**: 05/01/2024 → 10 meses de antigüedad
- **Vehículo B**: 20/11/2024 → 0.3 meses de antigüedad
- **Ventaja**: Precio ajustado MUCHO más preciso

#### 📊 Ejemplo real extraído
```
Modelo: BMW X1 xDrive25e
Precio: 49.500 €
KM: 19.690
Año (light): 2024
Fecha exacta (hard): 05/09/2024 ← ¡3 meses de antigüedad, no "2024"!
Potencia: 180KW (245 CV)
Combustible: Híbrido Electro/Gasolina
Cilindrada: 1499 cc
Etiqueta: ECO
Transmisión: Automático
```

---

## 🚗 MINI NEXT (MN)

### ⚠️ Estado de investigación

- **Problema**: La página de MINI Next usa JavaScript pesado y requiere interacción manual
- **Estructura diferente**: No es un listado clásico HTML, probablemente React/Angular
- **Necesita**: Más análisis del script `extract_mn_vehicle_details()` existente en `main.py`

### 📝 Datos probables (basado en función existente)

La función `extract_mn_vehicle_details()` en `main.py` (líneas 2751-2811) ya extrae:
- Precio
- KM
- Año
- Color
- Combustible
- Potencia
- Cambio
- Concesionario
- Provincia
- Extras
- ID_Anuncio

**Pendiente verificar**: ¿Tiene fecha de matriculación exacta como BPS?

---

## 🎯 Estrategia de implementación HARD

### 1️⃣ Nuevas columnas en `comparador_scraper`

```sql
ALTER TABLE comparador_scraper ADD COLUMN IF NOT EXISTS fecha_primera_matriculacion DATE;
ALTER TABLE comparador_scraper ADD COLUMN IF NOT EXISTS color_carroceria VARCHAR(100);
ALTER TABLE comparador_scraper ADD COLUMN IF NOT EXISTS combustible_tipo VARCHAR(50);
ALTER TABLE comparador_scraper ADD COLUMN IF NOT EXISTS potencia_kw INTEGER;
ALTER TABLE comparador_scraper ADD COLUMN IF NOT EXISTS potencia_cv INTEGER;
ALTER TABLE comparador_scraper ADD COLUMN IF NOT EXISTS transmision VARCHAR(50);
ALTER TABLE comparador_scraper ADD COLUMN IF NOT EXISTS cilindrada INTEGER;
ALTER TABLE comparador_scraper ADD COLUMN IF NOT EXISTS etiqueta_ambiental VARCHAR(20);
ALTER TABLE comparador_scraper ADD COLUMN IF NOT EXISTS equipamiento_completo TEXT[];
ALTER TABLE comparador_scraper ADD COLUMN IF NOT EXISTS ultima_extraccion_hard TIMESTAMPTZ;
```

### 2️⃣ Flujo de scraping dual

```
┌─────────────────────────────────────────────────────────────┐
│  LIGHT SCRAPING (rápido, cada 30 min)                      │
│  • Detecta NUEVOS coches                                    │
│  • Detecta CAMBIOS de precio                                │
│  • Detecta coches DESAPARECIDOS                             │
│  • Datos básicos: precio, km, año, modelo, concesionario   │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    ¿Coche nuevo?
                           ↓ SÍ
┌─────────────────────────────────────────────────────────────┐
│  HARD SCRAPING (lento, bajo demanda o programado)          │
│  • Entra en la ficha individual                             │
│  • Extrae FECHA MATRICULACIÓN exacta                        │
│  • Extrae color, combustible, potencia, etc.               │
│  • Actualiza registro existente con datos adicionales      │
│  • NO recalcula precio (solo añade datos)                  │
└─────────────────────────────────────────────────────────────┘
```

### 3️⃣ Lógica de actualización

```python
# Pseudo-código
def run_bps_hard():
    # 1. Obtener vehículos SIN datos hard (o antiguos)
    vehicles = supabase.select('*')
        .eq('source', 'BPS')
        .is_('fecha_primera_matriculacion', None)  # O antiguos
        .limit(50)  # Procesar lotes pequeños
    
    for vehicle in vehicles:
        # 2. Entrar en la ficha individual
        driver.get(vehicle['url'])
        
        # 3. Extraer datos adicionales
        fecha_matriculacion = extract_fecha_matriculacion()
        color = extract_color()
        combustible = extract_combustible()
        # ... más campos
        
        # 4. ACTUALIZAR registro (NO recalcular precio)
        supabase.update({
            'fecha_primera_matriculacion': fecha_matriculacion,
            'color_carroceria': color,
            'combustible_tipo': combustible,
            'ultima_extraccion_hard': 'now()'
        }).eq('id_anuncio', vehicle['id_anuncio'])
```

---

## 📊 Comparativa Light vs Hard

| Característica | Light | Hard |
|---------------|-------|------|
| **Velocidad** | ⚡ Rápido (5-10 seg/página) | 🐌 Lento (2-3 seg/vehículo) |
| **Frecuencia** | 🔄 Cada 30 min | 📅 Semanal o bajo demanda |
| **Datos** | 📦 Básicos (7 campos) | 🎁 Completos (15+ campos) |
| **Objetivo** | 🎯 Detectar cambios | 🎯 Enriquecer datos |
| **Carga servidor** | ✅ Baja | ⚠️ Media |

---

## ✅ Conclusión

### Datos confirmados disponibles en BPS Hard:
1. ✅ **Fecha primera matriculación** (DD/MM/YYYY) ← CRÍTICO
2. ✅ Color carrocería
3. ✅ Combustible exacto
4. ✅ Potencia (KW y CV)
5. ✅ Transmisión
6. ✅ Cilindrada
7. ✅ Etiqueta ambiental
8. ⚠️ Equipamiento (parcial)

### Pendiente:
- Verificar MINI Next si tiene fecha exacta
- Implementar funciones `run_bps_hard()` y `run_mn_hard()`
- Crear nuevas pestañas GUI
- Añadir columnas a Supabase
- Compilar versión 1.2.0

---

**Fecha documento**: 29/10/2025  
**Versión**: 1.0  
**Autor**: Investigación automática con Selenium + BeautifulSoup

