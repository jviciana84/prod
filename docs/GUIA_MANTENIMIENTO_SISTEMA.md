# GUÍA DE MANTENIMIENTO DEL SISTEMA CVO

**Última actualización:** 14 de octubre de 2025  
**Estado del sistema:** ✅ ÓPTIMO (100/100)

---

## 📊 MONITOREO DIARIO

### Script de Salud del Sistema
```bash
node scripts/monitor_salud_sistema.js
```

**Resultado esperado:**
- Puntuación: 90-100/100
- Sin alertas críticas
- Advertencias menores normales

**Frecuencia recomendada:** 1 vez al día

---

## 🔍 SCRIPTS DE VERIFICACIÓN

### 1. Verificar estado de DUC_SCRAPER
```bash
node scripts/verificar_duc_scraper.js
```

**Qué verifica:**
- Total de registros
- Columnas con datos
- Vehículos RESERVADOS
- Estados de disponibilidad

**Cuándo usar:** Después de cada ejecución del scraper

---

### 2. Verificar trigger y estados
```bash
node scripts/verificar_trigger_y_estados.js
```

**Qué verifica:**
- Funcionamiento del trigger
- Sincronización RESERVADOS → VENDIDOS
- Vehículos en STOCK vs DUC
- Estados en FOTOS

**Cuándo usar:** Si sospechas problemas de sincronización

---

### 3. Buscar vehículo específico
```bash
node scripts/buscar_vehiculo.js [MATRICULA]
```

**Ejemplo:**
```bash
node scripts/buscar_vehiculo.js 0281JWJ
```

**Qué muestra:**
- Ubicación en todas las tablas
- Estados actuales
- Cómo se muestra en la interfaz

**Cuándo usar:** Para investigar un vehículo específico

---

### 4. Comparativa DUC vs STOCK
```bash
node scripts/comparativa_duc_vs_stock.js
```

**Qué hace:**
- Compara vehículos en DUC vs STOCK
- Identifica vehículos vendidos profesionalmente
- Genera lista de vehículos para marcar

**Cuándo usar:** Cada vez que el scraper se actualiza

---

### 5. Verificar estado final
```bash
node scripts/verificar_estado_final.js
```

**Qué muestra:**
- Estado completo del sistema
- Distribución en pestañas
- Resumen de cambios

**Cuándo usar:** Para obtener una vista general

---

## 🛠️ MANTENIMIENTO RUTINARIO

### Diario
1. Ejecutar monitor de salud
2. Revisar puntuación (debe ser >90)
3. Verificar alertas críticas

### Semanal
1. Ejecutar comparativa DUC vs STOCK
2. Marcar vehículos vendidos profesionalmente si es necesario
3. Revisar vehículos con fotos pendientes

### Mensual
1. Verificar integridad completa del sistema
2. Revisar documentación actualizada
3. Backup de datos críticos

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### Problema: Scraper no carga datos

**Síntomas:**
- DUC_SCRAPER con registros vacíos
- Columnas sin datos

**Solución:**
```bash
# Procesar CSV manualmente
python scripts/procesar_csv_duc_FINAL.py
```

---

### Problema: Vehículos RESERVADOS no se marcan como vendidos

**Síntomas:**
- Vehículos RESERVADOS en DUC
- Aparecen como disponibles en interfaz

**Solución:**
1. Verificar que existen en STOCK
2. Ejecutar trigger manualmente:
```sql
-- En Supabase
scripts/arreglar_trigger_reservados_simple.sql
scripts/procesar_reservados_existentes_simple.sql
```

---

### Problema: Vehículos vendidos aparecen como disponibles

**Síntomas:**
- Vehículo no está en DUC
- Está marcado como disponible en STOCK

**Solución:**
```bash
# Ejecutar comparativa
node scripts/comparativa_duc_vs_stock.js

# Si detecta vehículos pendientes, marcar
node scripts/marcar_vendidos_profesional.js
```

---

### Problema: Botón "Abrir CSV" no funciona

**Síntomas:**
- Error al hacer clic en "Abrir CSV"
- Carpeta no se abre

**Solución:**
- Verificar que existe `cvo-scraper-v1/dist/data/duc`
- El scraper debería crear las carpetas automáticamente
- Si persiste, revisar `cvo-scraper-v1/main.py` líneas 72, 464, 1145

---

### Problema: Puntuación de salud baja (<70)

**Acciones:**
1. Revisar alertas críticas
2. Ejecutar scripts de verificación específicos
3. Corregir problemas identificados
4. Re-ejecutar monitor de salud

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Antes de finalizar el día:
- [ ] Monitor de salud ejecutado
- [ ] Puntuación > 90
- [ ] Sin alertas críticas
- [ ] DUC actualizado en las últimas 12 horas

### Después de ejecutar scraper:
- [ ] Verificar registros cargados
- [ ] Comparar con ejecución anterior
- [ ] Verificar vehículos RESERVADOS
- [ ] Ejecutar comparativa DUC vs STOCK

### Antes de marcar vehículos masivamente:
- [ ] Ejecutar comparativa
- [ ] Revisar lista de vehículos
- [ ] Confirmar que son vendidos profesionalmente
- [ ] Backup de datos (opcional)
- [ ] Ejecutar script de marcado

---

## 🔐 ARCHIVOS CRÍTICOS

### No modificar sin autorización:
- `cvo-scraper-v1/main.py` - Scraper principal
- `triggers/*` - Triggers de base de datos
- `types/supabase.ts` - Definición de esquema

### Seguros para modificar:
- `scripts/*` - Scripts de verificación
- `docs/*` - Documentación

---

## 📞 REFERENCIAS RÁPIDAS

### Documentación:
- `docs/correcciones_scraper_duc.md` - Correcciones aplicadas
- `docs/RESUMEN_LOGICA_VEHICULOS_STOCK_FOTOS_VENDIDOS.md` - Lógica del sistema
- `docs/SESION_14_OCT_2025_RESUMEN_COMPLETO.md` - Resumen completo

### Scripts clave:
- `scripts/monitor_salud_sistema.js` - Monitor de salud
- `scripts/buscar_vehiculo.js` - Buscar vehículo
- `scripts/comparativa_duc_vs_stock.js` - Comparativa
- `scripts/procesar_csv_duc_FINAL.py` - Procesar CSV manual

---

## 🎯 MÉTRICAS OBJETIVO

### KPIs del Sistema:
- **Puntuación de salud:** > 90/100
- **Actualización DUC:** < 12 horas
- **Vehículos sin clasificar:** 0
- **Duplicados:** 0
- **Integridad de datos:** 100%

### Alertas a monitorear:
- ⚠️ DUC sin actualizar > 24 horas
- ⚠️ Vehículos disponibles no sincronizados > 10
- ⚠️ Fotos pendientes > 50
- ⚠️ Puntuación < 70

---

## 🔄 FLUJO DE TRABAJO RECOMENDADO

```
┌─────────────────────────────────────┐
│ 1. Scraper ejecuta (automático)    │
│    Cada 8 horas                      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. Verificar datos (manual)         │
│    node scripts/verificar_duc_      │
│    scraper.js                        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. Comparar DUC vs STOCK (manual)   │
│    node scripts/comparativa_duc_    │
│    vs_stock.js                       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. Marcar vendidos si es necesario  │
│    node scripts/marcar_vendidos_    │
│    profesional.js                    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 5. Monitor de salud (diario)        │
│    node scripts/monitor_salud_      │
│    sistema.js                        │
└─────────────────────────────────────┘
```

---

## ✅ ESTADO ACTUAL DEL SISTEMA

**Última verificación:** 14/10/2025 12:35:51

| Métrica | Valor | Estado |
|---------|-------|--------|
| Puntuación de salud | 100/100 | ✅ |
| Vehículos totales | 168 | ✅ |
| Vendidos | 93 (55%) | ✅ |
| Disponibles | 75 (45%) | ✅ |
| DUC actualizado | Hace 0 horas | ✅ |
| Integridad datos | 100% | ✅ |
| Duplicados | 0 | ✅ |
| Fotos pendientes | 34 | ✅ |

**Conclusión:** Sistema funcionando óptimo, sin acciones requeridas.

---

**FIN DE LA GUÍA**



