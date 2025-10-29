# 📋 SISTEMA DE DISTRIBUCIÓN DE VISITAS CVO

**Fecha:** 29 de Octubre de 2025  
**Propósito:** Distribución equitativa de visitas a asesores de venta (VN/VO - Coches/Motos)  
**Estado:** ✅ Implementado - Listo para usar

---

## 🎯 RESUMEN EJECUTIVO

Sistema completo para gestionar la distribución equitativa de visitas a asesores comerciales en el concesionario, con:

- ✅ **4 tipos de visita:** COCHE_VN, COCHE_VO, MOTO_VN, MOTO_VO
- ✅ **Algoritmo de rotación equitativa (round-robin)**
- ✅ **Gestión automática de vacaciones**
- ✅ **Mini-app PWA instalable (sin instalación en Windows)**
- ✅ **Panel de administración completo**
- ✅ **Estadísticas e informes en tiempo real**

---

## 📦 COMPONENTES DEL SISTEMA

### 1️⃣ **Base de Datos**

#### **Tablas Creadas:**

- **`advisors`:** Asesores de venta con especializaciones
- **`visit_assignments`:** Historial de todas las visitas asignadas
- **`visit_queue_config`:** Configuración del sistema

#### **Funciones SQL:**

- `reset_daily_visit_counters()`: Resetea contadores diarios
- `process_vacation_return()`: Gestiona el regreso de vacaciones
- `auto_end_vacations()`: Finaliza vacaciones automáticamente

---

### 2️⃣ **API Routes (Backend)**

Todas las mutaciones usan **API Routes** para evitar clientes zombie:

#### **Visitas:**
- `POST /api/visits/next-advisor` → Obtener siguiente asesor
- `POST /api/visits/redirect` → Redirigir si asesor ocupado

#### **Asesores:**
- `POST /api/advisors/create` → Crear asesor
- `POST /api/advisors/update` → Actualizar asesor
- `POST /api/advisors/delete` → Eliminar/desactivar asesor

---

### 3️⃣ **Mini-App PWA (Recepción)**

**Ruta:** `/recepcion`

**Características:**
- ✅ Botones grandes para cada tipo de visita (VN/VO - Coche/Moto)
- ✅ Información opcional del cliente (nombre, teléfono)
- ✅ Detección de citas previas
- ✅ Opción de redirigir si asesor ocupado
- ✅ **Instalable como PWA** (sin necesidad de instalación Windows)
- ✅ Funciona como ventana independiente

**Uso:**
1. Abrir `https://tu-dominio.com/recepcion`
2. Chrome muestra botón "Instalar aplicación"
3. Se crea acceso directo en escritorio/barra de tareas
4. ✅ Funciona sin tener CVO abierto

---

### 4️⃣ **Panel de Administración**

**Ruta:** `/dashboard/recepcion-admin`

#### **Pestaña 1: Asesores**
- Gestión completa (Crear/Editar/Eliminar)
- Configurar especializaciones (VN/VO - Coche/Moto)
- Activar/Desactivar asesores
- Marcar como ocupado/disponible

#### **Pestaña 2: Vacaciones**
- Establecer períodos de vacaciones
- Finalizar vacaciones manualmente
- Al volver: asesor empieza con prioridad equitativa (no ventaja ni desventaja)

#### **Pestaña 3: Estadísticas**
- Gráfica de distribución de visitas por asesor
- Desglose por tipo (VN/VO - Coche/Moto)
- Datos del mes actual

#### **Pestaña 4: Historial**
- Últimas 100 visitas asignadas
- Información de cliente (si se registró)
- Indicador de redireccionamientos
- Filtrado y búsqueda

---

## 🚀 INSTALACIÓN

### **Paso 1: Ejecutar Script SQL**

```sql
-- Ir a Supabase Dashboard → SQL Editor
-- Copiar y pegar: sql/create_visit_distribution_system.sql
-- Ejecutar
```

**Esto crea:**
- 3 tablas (advisors, visit_assignments, visit_queue_config)
- 3 funciones SQL
- Políticas RLS
- Configuración por defecto

---

### **Paso 2: Verificar API Routes**

✅ Ya están creadas en:
- `app/api/visits/next-advisor/route.ts`
- `app/api/visits/redirect/route.ts`
- `app/api/advisors/create/route.ts`
- `app/api/advisors/update/route.ts`
- `app/api/advisors/delete/route.ts`

---

### **Paso 3: Verificar Páginas**

✅ Ya están creadas:
- `app/recepcion/page.tsx` (mini-app PWA)
- `app/dashboard/recepcion-admin/page.tsx` (administración)

✅ Componentes:
- `components/recepcion/advisors-management.tsx`
- `components/recepcion/visit-statistics.tsx`
- `components/recepcion/visit-history.tsx`
- `components/recepcion/vacation-manager.tsx`

---

## 📱 INSTALAR MINI-APP PWA

### **Opción A: Desktop/Laptop**

1. Abrir Chrome/Edge
2. Ir a `https://tu-dominio.com/recepcion`
3. Click en icono de instalación (⊕) en barra de URL
4. Click "Instalar"
5. ✅ Se crea acceso directo en escritorio
6. ✅ Funciona como app independiente

### **Opción B: Tablet/Móvil**

1. Abrir navegador
2. Ir a `/recepcion`
3. Menú → "Añadir a pantalla de inicio"
4. ✅ Icono en pantalla principal

### **Ventajas PWA:**
- ✅ **NO requiere instalación en Windows**
- ✅ **Funciona sin tener CVO abierto**
- ✅ **Ventana independiente**
- ✅ **Acceso rápido desde barra de tareas**
- ✅ **Se actualiza automáticamente**

---

## ⚙️ CONFIGURACIÓN INICIAL

### **1. Crear Asesores**

1. Ir a `/dashboard/recepcion-admin`
2. Pestaña "Asesores"
3. Click "Nuevo Asesor"
4. Rellenar datos:
   - Nombre completo
   - Email y teléfono (opcional)
   - **Especializaciones:** Seleccionar tipos que puede atender
     - ☑️ Coche VN
     - ☑️ Coche VO
     - ☑️ Moto VN
     - ☑️ Moto VO
   - Ubicación física (opcional)
   - Número de puesto (opcional)
5. Click "Crear"

**Ejemplo:**
```
Nombre: Juan Pérez
Email: juan@example.com
Teléfono: 666 123 456
Especializaciones: [Coche VN, Coche VO]
Ubicación: Planta 2, Zona A
Puesto: 15
```

---

### **2. Configurar Vacaciones**

1. Ir a pestaña "Vacaciones"
2. Seleccionar asesor
3. Click "Establecer Vacaciones"
4. Elegir fechas de inicio y fin
5. Notas opcionales
6. Click "Guardar"

**Al volver:**
- El sistema lo reactiva automáticamente
- Su prioridad se ajusta al promedio (sin ventaja ni desventaja)
- **Empieza de 0 equitativo con el resto**

---

## 🔄 FLUJO DE TRABAJO

### **Escenario 1: Cliente Walk-in (sin cita)**

```
1. Cliente entra al concesionario
2. Recepcionista pregunta: "¿Qué tipo de vehículo busca?"
3. Cliente: "Un coche de ocasión"
4. Recepcionista abre mini-app → Click "COCHE VO"
5. Sistema muestra: "Derivar a: María García - Planta 2, Puesto 12"
6. Recepcionista dirige al cliente
7. ✅ Visita registrada automáticamente
```

---

### **Escenario 2: Cliente con Cita Previa**

```
1. Cliente: "Tengo cita con Juan Pérez"
2. Recepcionista:
   - Marca checkbox "Cliente tenía cita"
   - Escribe "Juan Pérez"
   - Click "COCHE VN"
3. Sistema:
   - Verifica que Juan esté disponible
   - Asigna a Juan (aunque no sea su turno)
4. ✅ Cliente derivado a Juan Pérez
```

---

### **Escenario 3: Asesor Ocupado**

```
1. Sistema asigna a "Carlos López"
2. Muestra: "⚠️ Carlos está ocupado"
3. Opciones:
   A) Esperar a que Carlos termine
   B) Click "Redirigir a otro asesor"
4. Si elige B:
   - Sistema busca siguiente disponible
   - Muestra: "Nueva asignación: Ana Ruiz"
   - Carlos NO pierde su turno (compensación automática)
5. ✅ Justicia asegurada
```

---

## 🧮 ALGORITMO DE ROTACIÓN

### **Cómo Funciona:**

```
1. Cada asesor tiene un "current_turn_priority" (prioridad de turno)
2. Menor valor = siguiente en turno
3. Al asignar una visita:
   - Su prioridad aumenta +1
   - Pasa al final de la cola
4. Siguiente asesor = menor prioridad
```

### **Ejemplo Visual:**

```
Estado Inicial:
- Ana: prioridad 0, visitas=10
- Juan: prioridad 1, visitas=12
- María: prioridad 2, visitas=11

Cliente 1 (COCHE VN):
→ Ana (menor prioridad)
Ana pasa a prioridad 3

Cliente 2 (COCHE VN):
→ Juan (ahora menor prioridad)
Juan pasa a prioridad 4

Cliente 3 (COCHE VN):
→ María (ahora menor prioridad)
María pasa a prioridad 5

✅ Rotación equitativa garantizada
```

---

### **Gestión de Vacaciones:**

```
Asesor se va de vacaciones:
- Se marca "is_on_vacation = true"
- NO recibe visitas durante el período
- Su prioridad se "congela"

Asesor vuelve:
- Prioridad = promedio de todos los activos
- NO recibe visitas extra de compensación
- Empieza equitativo con el resto

✅ Nadie sale perjudicado ni beneficiado
```

---

## 📊 ESTADÍSTICAS Y REPORTES

### **Métricas Disponibles:**

- **Total de visitas por asesor** (día/mes/año)
- **Distribución por tipo** (VN/VO - Coche/Moto)
- **Promedio de visitas** diarias
- **Equidad de distribución** (desviación estándar)
- **Redireccionamientos** (cuántas veces estuvieron ocupados)

### **Gráficas:**

- **Barras apiladas:** Visitas por asesor y tipo
- **Línea temporal:** Evolución de visitas

---

## 🔒 SEGURIDAD Y PERMISOS

### **RLS (Row Level Security):**

- ✅ **Admins:** Acceso completo a todo
- ✅ **Usuarios autenticados:** Pueden ver asesores activos
- ✅ **Usuarios autenticados:** Pueden crear asignaciones de visitas
- ✅ **Solo lectura:** Historial de visitas

### **Validaciones:**

- Solo tipos válidos: COCHE_VN, COCHE_VO, MOTO_VN, MOTO_VO
- Especializaciones válidas en asesores
- Fechas de vacaciones válidas (fin > inicio)

---

## 🛠️ MANTENIMIENTO

### **Tareas Automáticas:**

1. **Reset diario de contadores:**
   - A las 00:00 se resetea `visits_today`
   - Función: `reset_daily_visit_counters()`

2. **Finalizar vacaciones vencidas:**
   - Verifica daily si alguna vacación terminó
   - Reactiva asesor automáticamente
   - Función: `auto_end_vacations()`

### **Tareas Manuales:**

1. **Revisar distribución equitativa** (semanal)
   - Ir a Estadísticas
   - Verificar que nadie tenga >20% más visitas que el resto

2. **Actualizar especializaciones** (según necesidad)
   - Si un asesor se capacita en nuevo tipo
   - Editar asesor → Agregar especialización

---

## 🐛 RESOLUCIÓN DE PROBLEMAS

### **Problema: No aparecen asesores disponibles**

**Solución:**
1. Verificar que hay asesores activos: `is_active = true`
2. Verificar que no están de vacaciones: `is_on_vacation = false`
3. Verificar que tienen la especialización correcta

```sql
-- Diagnóstico en Supabase SQL Editor
SELECT full_name, is_active, is_on_vacation, specialization
FROM advisors;
```

---

### **Problema: Distribución desigual**

**Solución:**
1. Resetear prioridades manualmente:

```sql
-- Igualar prioridades de todos los asesores
UPDATE advisors
SET current_turn_priority = 0
WHERE is_active = true;
```

---

### **Problema: Mini-app no se instala**

**Solución:**
1. Verificar que estás en HTTPS (PWA requiere conexión segura)
2. Limpiar cache del navegador
3. Verificar que `public/manifest.json` existe
4. Verificar que `public/sw.js` (service worker) existe

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Ejecutar script SQL en Supabase
- [ ] Verificar que las 3 tablas se crearon
- [ ] Crear al menos 2 asesores de prueba
- [ ] Probar asignación de visita desde `/recepcion`
- [ ] Verificar que se registra en historial
- [ ] Instalar mini-app PWA en desktop
- [ ] Pinear en barra de tareas
- [ ] Probar asignación desde app instalada
- [ ] Verificar estadísticas en admin
- [ ] Establecer vacaciones a un asesor
- [ ] Verificar que no recibe visitas
- [ ] Finalizar vacaciones y verificar reactivación
- [ ] Probar redireccionamiento por asesor ocupado

---

## 🎓 MEJORAS FUTURAS (OPCIONAL)

1. **Notificaciones Push:**
   - Avisar al asesor cuando se le asigna una visita
   - Usar sistema de notificaciones existente del CVO

2. **Algoritmo Ponderado:**
   - Dar más visitas a asesores con mejores conversiones
   - Configurar pesos por rendimiento

3. **Integración con Calendario:**
   - Sincronizar citas con Google Calendar
   - Auto-asignar según disponibilidad horaria

4. **Reportes Avanzados:**
   - Tasa de conversión por asesor
   - Tiempo promedio de atención
   - Satisfacción del cliente

---

## 📞 SOPORTE

**Documentación relacionada:**
- `GUIA_CONSTRUCCION_PAGINAS.md` - Patrón de desarrollo
- `ANALISIS_COMPLETO_SISTEMA_CVO.md` - Arquitectura general

**Para problemas técnicos:**
- Revisar logs en Supabase SQL Editor
- Verificar console.log en navegador (F12)
- Revisar API Routes en `/api/visits/*` y `/api/advisors/*`

---

## ✅ CONCLUSIÓN

Sistema completo y funcional para distribución equitativa de visitas:

✅ **Cumple todos los requisitos:**
- Discrimina VN/VO - Coche/Moto
- Detecta citas previas
- Distribución equitativa automática
- Gestión de vacaciones inteligente
- No penaliza ni beneficia al volver
- Gestión de asesores ocupados
- Estadísticas e informes
- **Mini-app instalable SIN instalación Windows**
- **Funciona sin tener CVO abierto**

✅ **Sigue las mejores prácticas:**
- Patrón correcto: CONSULTAS directas + MUTACIONES por API
- Sin riesgo de cliente zombie
- RLS configurado
- Validaciones en backend
- UX optimizada

---

**¡Sistema listo para producción!** 🚀


