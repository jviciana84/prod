# 🚫 POLÍTICA: CERO DATOS FALSOS

**Vigencia:** Desde 19 de Octubre de 2025  
**Aplicable a:** TODO el código  
**Excepciones:** NINGUNA

---

## 🎯 REGLA ABSOLUTA

> **"NUNCA mostrar datos falsos, mock, o de ejemplo al usuario"**

---

## ✅ QUÉ HACER CUANDO FALLA UNA CONSULTA

### Opción 1: Mostrar array vacío (RECOMENDADO)
```typescript
if (error) {
  setData([])
  toast.error("Error al cargar datos. Contacta soporte.")
  return
}
```

### Opción 2: Mostrar mensaje de error
```typescript
if (error) {
  setError("No se pudieron cargar los datos")
  setData([])
  return
}
```

### Opción 3: Retry automático (opcional)
```typescript
if (error && retries < 3) {
  setTimeout(() => loadData(), 2000)
  return
}
setData([])
toast.error("Error después de 3 intentos")
```

---

## ❌ QUÉ NO HACER NUNCA

### ❌ Datos mock/falsos
```typescript
// ❌ PROHIBIDO
const mockData = [
  { id: "1", name: "Ejemplo 1" },
  { id: "2", name: "Ejemplo 2" },
]
setData(mockData)
```

### ❌ Funciones de fallback a datos falsos
```typescript
// ❌ PROHIBIDO
const usarDatosEjemplo = () => {
  const ejemplos = [...]
  setData(ejemplos)
  toast.info("Mostrando datos de ejemplo")
}
```

### ❌ Datos hardcodeados en API
```typescript
// ❌ PROHIBIDO en app/api/*/route.ts
const mockData = [{ id: "1", ... }]
return NextResponse.json({ data: mockData })
```

---

## 🔍 DETECCIÓN AUTOMÁTICA

### Palabras prohibidas en código:

- `mockData`
- `mockTasaciones`
- `datosEjemplo`
- `usarDatosEjemplo`
- `fallbackData`
- `exampleData`
- `fakeData`
- `datos de ejemplo`
- `showing example data`

### Búsqueda pre-commit:
```bash
# Ejecutar antes de cada commit
grep -rn "mock\|ejemplo\|fallback.*data\|fake" app/api/ components/
# Resultado esperado: 0 coincidencias
```

---

## ✅ POLÍTICA DE TESTING

### En desarrollo (local):
- ✅ Usar base de datos de desarrollo real
- ✅ Seedear datos realistas si necesario
- ❌ NO usar datos hardcodeados

### En staging:
- ✅ Datos de staging (reales pero no producción)
- ❌ NO datos mock

### En producción:
- ✅ Solo datos reales de base de datos
- ❌ NUNCA datos mock

---

## 🚨 CONSECUENCIAS DE DATOS FALSOS

### Por qué está prohibido:

1. **Decisiones incorrectas:**
   - Usuario ve datos que no son reales
   - Toma decisiones basadas en información falsa

2. **Bugs ocultos:**
   - Código "siempre funciona" con datos perfectos
   - Problemas reales no se detectan

3. **Pérdida de confianza:**
   - Usuario no sabe qué es real
   - Aplicación pierde credibilidad

4. **Problemas legales:**
   - Datos falsos en reportes
   - Auditorías fallidas

---

## ✅ ALTERNATIVAS CORRECTAS

### Para desarrollo:
```typescript
// ✅ Crear script de seed
// scripts/seed-dev.ts
async function seedDatabase() {
  await supabase.from("vehicles").insert([
    { license_plate: "DEV001", model: "Test Car" }
  ])
}
```

### Para testing:
```typescript
// ✅ Usar factories/fixtures
import { createMockVehicle } from "@/tests/factories"

test("should render vehicle", () => {
  const vehicle = createMockVehicle()
  render(<VehicleCard vehicle={vehicle} />)
})
```

### Para UI en desarrollo:
```typescript
// ✅ Storybook con datos controlados
export default {
  title: 'Vehicle Card',
  component: VehicleCard,
}

export const WithData = {
  args: {
    vehicle: { id: "1", model: "Test" }
  }
}
```

---

## 📋 CHECKLIST PRE-COMMIT

```markdown
Antes de commit:
- [ ] Busqué "mock" en mi código → 0 resultados
- [ ] Busqué "ejemplo" en mi código → 0 resultados
- [ ] Busqué "fallback" en mi código → 0 resultados
- [ ] Si consulta falla → muestra array vacío
- [ ] Si consulta falla → muestra error claro
- [ ] No hay datos hardcodeados
- [ ] Toast no dice "ejemplo" o "mock"
```

---

## 🔄 MIGRACIÓN DE CÓDIGO LEGACY

### Encontré código con datos falsos, ¿qué hago?

**Paso 1: Identificar**
```bash
grep -rn "mock\|ejemplo" components/mi-componente.tsx
```

**Paso 2: Eliminar**
```typescript
// ❌ ANTES
const usarDatosEjemplo = () => { ... }  // ELIMINAR COMPLETAMENTE

if (error) {
  usarDatosEjemplo()  // ELIMINAR
}
```

**Paso 3: Reemplazar**
```typescript
// ✅ AHORA
if (error) {
  setData([])
  toast.error("Error al cargar. Contacta soporte.")
}
```

**Paso 4: Verificar**
```bash
npm run dev
# Probar que muestra error cuando falla
# Verificar que NO muestra datos falsos
```

---

## 🎓 ENTRENAMIENTO

### Nuevo desarrollador:

**Día 1:**
- Leer esta política
- Buscar ejemplos en código
- Entender por qué está prohibido

**Día 2:**
- Migrar 1 componente con datos falsos
- Hacer PR con la corrección

**Día 3:**
- Code review: detectar datos falsos en PRs

---

## 📊 MÉTRICAS

### KPI del proyecto:

| Métrica | Objetivo |
|---------|----------|
| **Datos mock en producción** | 0 |
| **Funciones con "ejemplo"** | 0 |
| **Fallbacks a datos falsos** | 0 |
| **Arrays vacíos en error** | 100% |

### Auditoría mensual:
```bash
# Ejecutar cada mes
grep -r "mock\|ejemplo\|fallback" app/ components/
# Meta: 0 resultados
```

---

## 🚀 IMPLEMENTACIÓN

### Esta política se aplica a:

- ✅ Código nuevo (desde hoy)
- ✅ Código modificado (al tocar archivo legacy)
- ✅ Refactorización (eliminar datos falsos encontrados)
- ✅ Code review (rechazar PRs con datos falsos)

---

## ✅ RESUMEN

**3 Reglas Simples:**

1. **❌ NO datos falsos** → Nunca
2. **✅ Array vacío en error** → Siempre
3. **✅ Error claro al usuario** → Siempre

**1 Excepción:**

- **Tests unitarios** → OK usar mocks solo en tests

---

**Vigente desde:** 19 de Octubre de 2025  
**Mantenido por:** Equipo de desarrollo  
**Revisión:** Cada 3 meses

