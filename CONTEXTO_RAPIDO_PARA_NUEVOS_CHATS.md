# 🚀 CONTEXTO RÁPIDO - Para nuevos chats

**Fecha:** 19 de Octubre de 2025  
**Estado:** Post-migración API Routes  
**Branch actual:** `staging` (en testing)

---

## 📋 COPIA Y PEGA ESTO EN CHAT NUEVO:

```
Hola, estoy trabajando en el proyecto CVO Dashboard.

CONTEXTO IMPORTANTE:

1. ACABO DE HACER UNA MIGRACIÓN COMPLETA:
   - 18 API Routes creadas
   - Todas las consultas ahora usan fetch("/api/...") 
   - NO usar createClientComponentClient() para consultas iniciales
   - Cliente Supabase SOLO para mutaciones

2. PATRÓN OBLIGATORIO:
   ✅ Consultas iniciales → API Route + fetch
   ❌ NO usar: const supabase = createClientComponentClient() en useEffect

3. ARCHIVOS CLAVE:
   - README_MIGRACION_API_ROUTES.md (documentación completa)
   - ESTANDARES_DESARROLLO_API_ROUTES.md (patrón a seguir)
   - POLITICA_CERO_DATOS_FALSOS.md (NO datos mock)

4. BRANCHES:
   - main: producción actual
   - staging: migración API Routes (en testing)
   - fix/*: para correcciones específicas

5. REGLAS:
   - NO datos falsos/mock en ningún lado
   - Siempre usar API Routes para consultas
   - Logs de tracking (🔍/✅/❌)
   - Manejo de errores robusto

AHORA necesito ayuda con: [describe tu problema aquí]
```

---

## 📚 VARIANTES POR TIPO DE PROBLEMA

### Para bugs/errores:
```
CONTEXTO: Migración API Routes completada (19 Oct 2025)
- 18 API Routes creadas
- Patrón: fetch("/api/...") para consultas
- NO usar createClientComponentClient() en useEffect
- Branch: staging (en testing)

PROBLEMA QUE VEO:
[descripción del error]

ARCHIVOS RELACIONADOS:
[lista de archivos que crees relevantes]
```

---

### Para nuevas features:
```
CONTEXTO: Proyecto usa API Routes (desde 19 Oct 2025)

PATRÓN OBLIGATORIO:
1. Backend: app/api/[recurso]/list/route.ts
2. Frontend: fetch("/api/[recurso]/list")
3. NO cliente directo para consultas
4. Ver ejemplo: app/api/sales/list/route.ts

NUEVA FEATURE QUE QUIERO:
[descripción de la feature]

SEGUIR PATRÓN: README_MIGRACION_API_ROUTES.md
```

---

### Para refactorización:
```
CONTEXTO: Código migrado a API Routes (19 Oct 2025)

ESTÁNDAR ACTUAL:
- API Routes para todas las consultas
- createClientComponentClient solo para mutaciones
- NO datos mock/falsos
- Ver: ESTANDARES_DESARROLLO_API_ROUTES.md

CÓDIGO A REFACTORIZAR:
[archivo o componente]

OBJETIVO:
[qué quieres mejorar]
```

---

## 📄 DOCUMENTOS DE REFERENCIA

### Para consulta rápida:
1. **`README_MIGRACION_API_ROUTES.md`** (línea 916)
   - Copiar URL del archivo
   - Decir: "Lee este archivo para contexto completo"

2. **`ESTANDARES_DESARROLLO_API_ROUTES.md`**
   - Para saber cómo codear
   - Plantillas listas

3. **`POLITICA_CERO_DATOS_FALSOS.md`**
   - NO datos mock
   - Siempre datos reales o vacío

---

## 🎯 EJEMPLOS REALES

### Ejemplo 1: Fix en footer
```
CONTEXTO: Proyecto en staging, migración API Routes completada.
Branch: staging
API creada: app/api/settings/footer/route.ts

PROBLEMA: Footer no muestra animación marquee

Lee: components/dashboard/footer.tsx (línea 26-122)
Lee: app/api/settings/footer/route.ts

¿Qué campos debería devolver la API para que funcione?
```

---

### Ejemplo 2: Error en tabla
```
CONTEXTO: Migración API Routes (19 Oct 2025)
Branch: staging
Patrón: fetch("/api/...") para todas las consultas

PROBLEMA: Tabla de [nombre] da error
Error: [copiar mensaje de error]

Archivo: components/[nombre]/[nombre]-table.tsx
API: app/api/[nombre]/list/route.ts (si existe)

¿Qué está mal?
```

---

### Ejemplo 3: Nueva página
```
CONTEXTO: Proyecto usa API Routes desde 19 Oct 2025

PATRÓN A SEGUIR:
Backend: app/api/sales/list/route.ts (ejemplo)
Frontend: components/sales/sales-table.tsx (ejemplo)

NUEVA PÁGINA: [nombre]
Necesito: Tabla con datos de [tabla_supabase]

Crear siguiendo el patrón de sales.
```

---

## 🔧 INFORMACIÓN TÉCNICA ÚTIL

### Stack actual:
```
- Next.js 15.2.4
- Supabase (SSR con @supabase/ssr)
- TypeScript
- Tailwind CSS
- shadcn/ui components
```

### Arquitectura:
```
app/
  ├── api/              → 18 API Routes (SSR)
  ├── dashboard/        → Páginas (CSR con fetch)
  └── globals.css       → Estilos globales

components/
  ├── dashboard/        → Componentes principales
  └── [feature]/        → Tablas y formularios

lib/
  ├── supabase/
  │   ├── server.ts     → createServerClient (API Routes)
  │   └── client.ts     → createClientComponentClient (mutaciones)
  └── auth/
      └── permissions.ts → Roles y permisos
```

---

## 📊 APIs CREADAS (18)

Para referencia rápida:
```
1. /api/sales/list
2. /api/entregas/list
3. /api/noticias/list
4. /api/validados/list
5. /api/photos/list
6. /api/stock/list
7. /api/transport/list
8. /api/llaves/movements
9. /api/conversations/list
10. /api/conversations/sessions
11. /api/dashboard/rankings
12. /api/dashboard/activity-feed
13. /api/settings/footer
14. /api/footer/message
15. /api/tasaciones/list
16. /api/ventas-profesionales/list
```

---

## ⚡ RESUMEN ULTRA-CORTO

**Para cuando tengas prisa:**

```
Proyecto: CVO Dashboard
Fecha: 19 Oct 2025
Migración: API Routes completada
Branch: staging (testing)

REGLA DE ORO:
- Consultas → fetch("/api/...")
- Mutaciones → createClientComponentClient()
- NO datos falsos

PROBLEMA: [tu problema aquí]
```

---

## 🎯 TEMPLATES ESPECÍFICOS

### Bug en consola:
```
CONTEXTO: Staging branch, migración API Routes
ERROR EN CONSOLA: [copiar error]
PÁGINA: /dashboard/[nombre]
¿Qué está causando este error?
```

### Página no carga:
```
CONTEXTO: Proyecto usa API Routes
PÁGINA: /dashboard/[nombre]
SÍNTOMA: Loading infinito / No carga datos
COMPONENTE: components/[nombre]/[nombre].tsx
¿Usa fetch("/api/...") o cliente directo?
```

### Build falla:
```
CONTEXTO: Deploy en Vercel staging
ERROR DE BUILD: [copiar de Vercel logs]
ARCHIVO: [archivo mencionado en error]
¿Cómo lo corrijo?
```

---

## 📞 ÚLTIMA LÍNEA

**Si el chat no entiende, agrega:**

```
Lee estos archivos para contexto completo:
1. README_MIGRACION_API_ROUTES.md
2. ESTANDARES_DESARROLLO_API_ROUTES.md

Trabajamos en este repo: https://github.com/jviciana84/prod
Branch actual: staging
```

---

**Copia la sección "COPIA Y PEGA" de arriba y modifícala según tu necesidad!**

