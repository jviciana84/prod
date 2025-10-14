# 🚗 SISTEMA DE GESTIÓN DE VEHÍCULOS CVO

Sistema automatizado para la gestión y sincronización de vehículos de ocasión entre DUC y el sistema interno CVO.

---

## 📊 RESUMEN EJECUTIVO

**Estado actual:** ✅ **ÓPTIMO (100/100)**

- ✅ Scraper DUC automatizado (cada 8 horas)
- ✅ 168 vehículos en sistema
- ✅ 93 vendidos, 75 disponibles
- ✅ Sincronización automática funcionando
- ✅ 0 vehículos sin clasificar

---

## 🔄 FLUJO DEL SISTEMA

```
DUC (Web) 
   ↓ 
Scraper (cada 8h)
   ↓
duc_scraper (140 vehículos)
   ↓
Trigger automático
   ↓
stock (168 vehículos) ← Gestión interna CVO
   ↓
Interfaz Web (4 pestañas)
```

---

## 🎯 COMPONENTES PRINCIPALES

### 1. **Scraper DUC** (`cvo-scraper-v1/main.py`)
- Descarga CSV de DUC automáticamente
- Procesa 140 vehículos
- Actualiza `duc_scraper` en Supabase
- Ejecuta cada 8 horas (09:00-18:00)

### 2. **Trigger de Sincronización**
- Detecta vehículos RESERVADOS en DUC
- Marca automáticamente como vendidos
- Actualiza `stock` y `fotos`

### 3. **Sistema de Estados**
- **VENDIDOS (55%):** Aparecen en pestaña "Vendido"
- **DISPONIBLES (45%):** Aparecen en pestañas "Disponible" y "Pendiente"

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
.
├── cvo-scraper-v1/
│   ├── main.py                    # Scraper principal
│   └── dist/data/duc/             # CSV descargados
│
├── scripts/
│   ├── monitor_salud_sistema.js   # Monitor de salud
│   ├── verificar_duc_scraper.js   # Verificar DUC
│   ├── buscar_vehiculo.js         # Buscar vehículo
│   ├── comparativa_duc_vs_stock.js # Comparar tablas
│   └── marcar_vendidos_profesional.js # Marcar vendidos
│
└── docs/
    ├── GUIA_MANTENIMIENTO_SISTEMA.md  # Esta guía
    ├── correcciones_scraper_duc.md    # Correcciones aplicadas
    └── RESUMEN_LOGICA_VEHICULOS_*.md  # Documentación técnica
```

---

## 🚀 INICIO RÁPIDO

### Verificar Estado del Sistema
```bash
node scripts/monitor_salud_sistema.js
```

### Buscar un Vehículo
```bash
node scripts/buscar_vehiculo.js 0281JWJ
```

### Procesar CSV Manualmente (si falla scraper)
```bash
python scripts/procesar_csv_duc_FINAL.py
```

---

## 📋 MANTENIMIENTO

### **Diario:**
```bash
node scripts/monitor_salud_sistema.js
```
✅ Puntuación esperada: >90/100

### **Después de cada scraper:**
```bash
node scripts/comparativa_duc_vs_stock.js
```
Marcar vendidos si es necesario

### **Problemas comunes:**
- **Scraper falla:** Usar `procesar_csv_duc_FINAL.py`
- **Vehículos sin marcar:** Ejecutar `comparativa` + `marcar_vendidos`
- **Datos incorrectos:** Ver `GUIA_MANTENIMIENTO_SISTEMA.md`

---

## 📊 ESTADO ACTUAL

| Métrica | Valor |
|---------|-------|
| **Vehículos totales** | 168 |
| **Vendidos** | 93 (55%) |
| **Disponibles** | 75 (45%) |
| **En DUC** | 140 |
| **Última actualización DUC** | Hace 0 horas ✅ |
| **Salud del sistema** | 100/100 ✅ |

---

## 📞 SOPORTE

### Documentación completa:
- `docs/GUIA_MANTENIMIENTO_SISTEMA.md`
- `docs/SESION_14_OCT_2025_RESUMEN_COMPLETO.md`

### Scripts útiles:
- Monitor: `scripts/monitor_salud_sistema.js`
- Buscar: `scripts/buscar_vehiculo.js [MATRICULA]`
- Comparar: `scripts/comparativa_duc_vs_stock.js`

---

## ✅ TODO FUNCIONANDO CORRECTAMENTE

Sistema optimizado y listo para uso en producción.

**Última revisión:** 14 de octubre de 2025



