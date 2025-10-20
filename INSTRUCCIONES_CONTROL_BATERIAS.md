# 🔋 CONTROL DE BATERÍAS XEV/PHEV - Instrucciones de Instalación

**Fecha:** 20 de Octubre de 2025  
**Estado:** ✅ Listo para probar en localhost

---

## 📋 RESUMEN

Nueva sección para control de carga de baterías de vehículos eléctricos (XEV) e híbridos enchufables (PHEV).

---

## 🎯 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ Funcionalidad Principal
- Detección automática de vehículos XEV/PHEV desde `duc_scraper` (columna "Tipo motor")
- Sincronización automática con tabla `battery_control`
- Edición inline de % carga, estado, cargando, observaciones
- Comparación con `sales_vehicles` para identificar vehículos vendidos
- Pestañas: Disponibles / Vendidos

### ✅ Alertas y Colores
- **Ping rojo:** Vehículo pendiente de revisión (Alerta 2)
- **Ping ámbar:** X días desde última revisión (Alerta 1, configurable)
- **Indicador batería:**
  - 🟢 Verde: Nivel correcto
  - 🟠 Ámbar: Nivel suficiente
  - 🔴 Rojo: Nivel insuficiente (acción inmediata)

### ✅ Configuración (Solo Admin)
- Días para reiniciar estado a pendiente
- Días para alerta ámbar
- Niveles de carga XEV (OK/Suficiente/Insuficiente)
- Niveles de carga PHEV (OK/Suficiente/Insuficiente)

### ✅ Validaciones
- Pendiente no puede tener "Cargando = Sí"
- Porcentaje entre 0-100
- Registro de usuario que actualiza (oculto)

---

## 🚀 INSTALACIÓN

### Paso 1: Ejecutar script SQL

```bash
# Conectar a tu base de datos Supabase
# Ejecutar el script:
sql/create_battery_control_tables.sql
```

Este script crea:
- ✅ Tabla `battery_control` (datos de cada vehículo)
- ✅ Tabla `battery_control_config` (configuración global)
- ✅ Triggers para `updated_at`
- ✅ RLS policies (admin y usuarios autenticados)
- ✅ Configuración por defecto

**⚠️ IMPORTANTE:** Este script se ejecuta **UNA SOLA VEZ** en Supabase (SQL Editor).

---

### Paso 2: Verificar estructura

Después de ejecutar el script, verifica en Supabase:

**Tabla `battery_control`:**
```sql
SELECT * FROM battery_control LIMIT 5;
```

**Tabla `battery_control_config`:**
```sql
SELECT * FROM battery_control_config;
```

Debería haber 1 registro con la configuración por defecto.

---

### Paso 3: Probar en localhost

```bash
npm run dev
```

**Navegar a:**
```
http://localhost:3000/dashboard
```

**En el sidebar:**
1. Click en **"Vehículos"** (ahora es un grupo desplegable)
2. Verás dos opciones:
   - **Stock** (existente)
   - **Control Baterías** (nuevo) ← Click aquí

---

## 📍 UBICACIÓN DE ARCHIVOS

### Backend (API Routes)
```
app/api/battery-control/
├── update/
│   └── route.ts          # POST - Actualizar % carga, estado, etc.
└── config/
    └── route.ts          # GET/POST - Configuración (solo admin)
```

### Frontend
```
app/dashboard/vehiculos/
└── baterias/
    └── page.tsx          # Página principal

components/battery-control/
└── battery-control-table.tsx  # Tabla con toda la lógica
```

### SQL
```
sql/
└── create_battery_control_tables.sql
```

### Sidebar
```
components/dashboard/
├── sidebar.tsx           # Actualizado con grupo Vehículos
└── mobile-sidebar.tsx    # Actualizado con grupo Vehículos
```

---

## 🧪 CÓMO PROBAR

### 1. Verificar que aparece en sidebar
- Sidebar debe mostrar **"Vehículos"** con flecha
- Al expandir: **Stock** y **Control Baterías**

### 2. Acceder a Control Baterías
```
/dashboard/vehiculos/baterias
```

### 3. Ver sincronización automática
La primera vez que cargues la página:
- ✅ Debe buscar vehículos XEV/PHEV en `duc_scraper`
- ✅ Crear registros automáticamente en `battery_control`
- ✅ Mostrarlos en la tabla

### 4. Editar % de carga
- Click en el porcentaje (ej: **0%**)
- Aparece input numérico
- Cambia el valor (ej: **75**)
- Enter o click fuera → Guarda automáticamente

### 5. Cambiar estado
- Click en botón **"Pendiente"** (rojo)
- Cambia a **"Revisado"** (verde)
- Registra la fecha automáticamente

### 6. Cambiar "Cargando"
- Si está **Revisado**: puedes cambiar Sí/No
- Si está **Pendiente**: automáticamente es No (deshabilitado)

### 7. Editar observaciones
- Click en observaciones
- Aparece textarea
- Escribe texto
- Click fuera → Guarda

### 8. Configuración (Solo Admin)
- Click en **"Configuración"** (arriba derecha)
- Modal con todos los parámetros
- Cambia valores
- Click **"Guardar configuración"**

### 9. Pestaña Vendidos
- Si un vehículo aparece en `sales_vehicles`
- Automáticamente va a pestaña **"Vendidos"**

---

## 🔍 LOGS ESPERADOS EN CONSOLA

```
🔋 Cargando datos de baterías...
✅ Vehículos XEV/PHEV encontrados: 5
🆕 Creando registros para nuevos vehículos: 5
✅ Datos de baterías cargados correctamente
```

---

## 🎨 DISEÑO Y ESTILO

**Siguiendo el patrón de Gestión de Ventas:**

### Colores de alerta (Pings)
```typescript
// Rojo (Alerta 2 - Pendiente)
bg-red-500

// Ámbar (Alerta 1 - X días sin revisar)
bg-amber-500
```

### Indicadores de batería
```typescript
// Verde (Correcto)
bg-green-500 / text-green-500

// Ámbar (Suficiente)
bg-amber-500 / text-amber-500

// Rojo (Insuficiente)
bg-red-500 / text-red-500
```

### Badges de tipo
```typescript
// XEV (100% eléctrico)
Badge variant="default" + icon Zap

// PHEV (híbrido enchufable)
Badge variant="secondary" + icon BatteryCharging
```

---

## ⚙️ CONFIGURACIÓN POR DEFECTO

```typescript
{
  days_to_reset: 7,           // Reiniciar a pendiente cada 7 días
  days_alert_1: 3,            // Alerta ámbar a los 3 días
  
  // XEV (100% eléctricos)
  xev_charge_ok: 80,          // ≥80% = Verde
  xev_charge_sufficient: 50,  // ≥50% = Ámbar
  xev_charge_insufficient: 30, // <30% = Rojo
  
  // PHEV (híbridos)
  phev_charge_ok: 70,         // ≥70% = Verde
  phev_charge_sufficient: 40, // ≥40% = Ámbar
  phev_charge_insufficient: 20 // <20% = Rojo
}
```

---

## 🔐 SEGURIDAD Y PERMISOS

### RLS Policies

**`battery_control` (todos los usuarios autenticados):**
- ✅ SELECT: Ver todos los registros
- ✅ UPDATE: Actualizar cualquier registro
- ✅ INSERT: Crear nuevos registros

**`battery_control_config` (solo admin):**
- ✅ SELECT: Solo admin/administrador
- ✅ UPDATE: Solo admin/administrador

**Campo `updated_by`:**
- Se registra automáticamente en el backend
- NO visible en la UI (para estadísticas internas)

---

## 📊 PATRÓN DE CONSULTAS Y MUTACIONES

### ✅ CONSULTAS → Cliente directo
```typescript
const supabase = createClientComponentClient()

// Leer vehículos XEV/PHEV
const { data } = await supabase
  .from("duc_scraper")
  .select("*")
  .or('"Tipo motor".ilike.%XEV%,"Tipo motor".ilike.%PHEV%')
```

### ✅ MUTACIONES → API Routes
```typescript
// Actualizar registro
const response = await fetch("/api/battery-control/update", {
  method: "POST",
  body: JSON.stringify({ id, data: { charge_percentage: 75 } })
})
```

---

## 🐛 TROUBLESHOOTING

### Problema: No aparece ningún vehículo

**Verificar:**
1. ¿Hay vehículos con "Tipo motor" = XEV o PHEV en `duc_scraper`?
   ```sql
   SELECT "Chasis", "Tipo motor" 
   FROM duc_scraper 
   WHERE "Tipo motor" ILIKE '%XEV%' OR "Tipo motor" ILIKE '%PHEV%';
   ```

2. ¿Se ejecutó el script SQL correctamente?
   ```sql
   SELECT * FROM battery_control;
   SELECT * FROM battery_control_config;
   ```

---

### Problema: Error al actualizar

**Revisar consola del navegador:**
```javascript
// Buscar errores como:
❌ Error actualizando battery_control: ...
```

**Verificar permisos:**
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('battery_control', 'battery_control_config');
```

---

### Problema: No aparece botón de Configuración

**Verificar rol:**
```typescript
// El botón solo aparece si:
userRole === "admin" || userRole === "administrador"
```

**Verificar en Supabase:**
```sql
SELECT id, email, role FROM profiles WHERE id = 'tu-user-id';
```

---

## 📝 PRÓXIMOS PASOS (OPCIONAL)

### Funcionalidades futuras:
1. **Cron job automático:** Reiniciar estado a pendiente cada X días
2. **Notificaciones:** Email cuando batería < X%
3. **Historial:** Tabla de cambios de estado por vehículo
4. **Estadísticas:** Ranking de usuarios que más actualizan
5. **Exportar PDF:** Reporte de estado de todas las baterías
6. **Dashboard widget:** Mini-card en dashboard principal con alertas

---

## ✅ CHECKLIST FINAL

Antes de mergear a staging:

- [x] Script SQL creado
- [x] API Routes creadas y documentadas
- [x] Componente table implementado
- [x] Página creada con breadcrumbs
- [x] Sidebar actualizado (desktop)
- [x] Mobile sidebar actualizado
- [x] Sin errores de linting
- [x] Patrón correcto (consultas = cliente, mutaciones = API)
- [x] Validaciones implementadas
- [x] Configuración admin implementada
- [ ] Script SQL ejecutado en Supabase
- [ ] Probado en localhost
- [ ] Probado con vehículos reales
- [ ] Probado botón configuración (admin)
- [ ] Probado edición inline
- [ ] Probado alertas (pings)
- [ ] Probado pestañas Disponibles/Vendidos

---

## 📞 SOPORTE

Si encuentras algún problema:

1. **Revisar logs de consola** (navegador y servidor)
2. **Verificar datos en Supabase** (SQL Editor)
3. **Comprobar permisos** (RLS policies)
4. **Revisar este documento** (troubleshooting)

---

## 🎉 RESULTADO FINAL

Una vez todo configurado, tendrás:

✅ Nueva sección en sidebar: **Vehículos > Control Baterías**  
✅ Tabla con todos los vehículos XEV/PHEV del parque  
✅ Edición inline de % carga, estado, cargando, observaciones  
✅ Alertas visuales (pings rojo/ámbar) según días sin revisar  
✅ Indicadores de batería (verde/ámbar/rojo) según nivel de carga  
✅ Pestañas Disponibles/Vendidos  
✅ Configuración personalizable (solo admin)  
✅ Sincronización automática con duc_scraper  
✅ Mismo estilo que Gestión de Ventas  

---

**¡Listo para probar en localhost!** 🚀

```bash
npm run dev
```

Navega a: `http://localhost:3000/dashboard/vehiculos/baterias`

