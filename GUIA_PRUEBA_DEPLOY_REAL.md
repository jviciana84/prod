# 🚀 GUÍA PRUEBA Y DEPLOY REAL

**Fecha:** 19 de Octubre de 2025  
**Estado:** Lista para usar

---

## 📋 ÍNDICE

1. [Testing Local](#1-testing-local)
2. [Deploy a Staging](#2-deploy-a-staging)
3. [Testing en Staging](#3-testing-en-staging)
4. [Deploy a Producción](#4-deploy-a-producción)
5. [Rollback (si algo sale mal)](#5-rollback)

---

## 1️⃣ TESTING LOCAL

### Paso 1: Iniciar servidor

```bash
npm run dev
```

**Espera:** `✓ Ready in Xms`

---

### Paso 2: Probar páginas migradas

**Lista de páginas a probar:**

| # | Ruta | Qué verificar |
|---|------|---------------|
| 1 | `/dashboard/ventas` | 🔄 Log "Cargando desde API" → ✅ "149 vehículos" |
| 2 | `/dashboard/entregas` | 🔄 Log "Cargando entregas" → ✅ "X entregas" |
| 3 | `/dashboard/noticias` | 🔄 Log "Cargando noticias" → ✅ "X noticias" |
| 4 | `/dashboard/nuevas-entradas` | 🔄 Log "Cargando nuevas entradas" → ✅ "X transportes" |
| 5 | `/dashboard/tasaciones` | 🔄 Log "Cargando tasaciones" → ✅ "X tasaciones" |
| 6 | `/dashboard/ventas-profesionales` | 🔄 Log "Cargando ventas profesionales" → ✅ "X ventas" |
| 7 | `/dashboard/photos` | 🔄 Log "Cargando fotos" → ✅ "X fotos" |
| 8 | `/dashboard/llaves/historial` | 🔄 Log "Cargando movimientos" → ✅ "X movimientos" |
| 9 | `/dashboard/validados` | 🔄 Log "Cargando pedidos" → ✅ "X pedidos" |
| 10 | `/dashboard/admin/conversaciones` | 🔄 Log "Cargando conversaciones" → ✅ "X conversaciones" |

---

### Paso 3: Checklist por página

Para CADA página, verifica:

```markdown
Página: /dashboard/[nombre]

✅ Checklist:
- [ ] Abre sin error
- [ ] Muestra "Cargando..." o skeleton
- [ ] Datos aparecen (sin F5)
- [ ] Consola muestra: "🔍 Cargando desde API..."
- [ ] Consola muestra: "✅ Datos cargados: X"
- [ ] NO hay errores rojos en consola
- [ ] NO hay loading infinito
- [ ] Tabla/cards se ven correctas
- [ ] Filtros funcionan (si hay)
- [ ] Búsqueda funciona (si hay)

❌ Errores encontrados:
(ninguno / describir)
```

---

### Paso 4: Navegación entre páginas

**Secuencia de prueba:**

```
Dashboard 
  → Ventas (esperar carga)
  → Entregas (esperar carga)
  → Noticias (esperar carga)
  → Ventas (otra vez)
  → Dashboard (volver)
```

**Verificar:**
- [ ] Cada navegación carga correctamente
- [ ] NO se acumulan errores en consola
- [ ] NO hay loading infinito
- [ ] Datos siempre aparecen

---

### Paso 5: Test de persistencia

**Prueba "Zombie Client":**

1. Abre `/dashboard/ventas`
2. Espera que cargue
3. Deja la pestaña abierta 5 minutos
4. Navega a `/dashboard/entregas`
5. Vuelve a `/dashboard/ventas`

**Resultado esperado:**
- ✅ Ventas recarga automáticamente
- ✅ Sin loading infinito
- ✅ Datos aparecen

**Si falla:**
- ❌ Problema: Cliente zombie persiste
- 🔧 Revisar: ¿Usó API Route o cliente directo?

---

### Paso 6: Test modo incógnito

```
1. Ctrl + Shift + N (Chrome)
2. Ir a http://localhost:3000
3. Login
4. Navegar a cada página migrada
```

**Verificar:**
- [ ] Todo funciona igual que en modo normal
- [ ] Sin loading infinito
- [ ] Sin errores en consola

---

### ✅ Criterio de éxito Local:

- ✅ 10/10 páginas cargan correctamente
- ✅ 0 errores rojos en consola
- ✅ Navegación fluida
- ✅ Test zombie pasa
- ✅ Modo incógnito funciona

---

## 2️⃣ DEPLOY A STAGING

### Prerequisitos:

- [x] Testing local completo ✅
- [x] Consola sin errores ✅
- [x] Documentación completa ✅

---

### Paso 1: Limpiar archivos temporales

```bash
# Ver archivos a commitear
git status

# Limpiar archivos basura (si hay)
rm -f "0" "ion" "et --hard a24ee58" "bject -First 30" "--grep="
rm -f archivos_proyecto.txt

# Verificar de nuevo
git status
```

---

### Paso 2: Commit cambios

```bash
git add .

git commit -m "feat: migración completa a API Routes

- 18 API Routes creadas
- 14 páginas migradas
- 9 errores corregidos
- Middleware re-habilitado
- PWA re-habilitado
- 0 errores en consola
- Documentación completa

Breaking changes: Ninguno
Testing: Local completo ✅"
```

---

### Paso 3: Push a staging

```bash
# Si ya estás en branch staging:
git push origin staging

# Si estás en main:
git checkout -b staging
git push -u origin staging
```

**Vercel automáticamente:**
- ✅ Detecta el push
- ✅ Inicia build
- ✅ Despliega a URL staging

---

### Paso 4: Obtener URL staging

**Opción A: Vercel Dashboard**
```
1. Ir a https://vercel.com/[tu-proyecto]
2. Click en "Deployments"
3. Buscar deploy de branch "staging"
4. Copiar URL (ej: https://cursor-staging-abc123.vercel.app)
```

**Opción B: CLI de Vercel**
```bash
vercel --prod --scope=staging
```

---

## 3️⃣ TESTING EN STAGING

### URL Staging:
```
https://[tu-proyecto]-staging-[hash].vercel.app
```

---

### Paso 1: Testing básico

**Mismo checklist que local, pero en staging:**

```markdown
✅ Testing Staging:

Autenticación:
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Session persiste

Páginas (10):
- [ ] /dashboard/ventas
- [ ] /dashboard/entregas
- [ ] /dashboard/noticias
- [ ] /dashboard/nuevas-entradas
- [ ] /dashboard/tasaciones
- [ ] /dashboard/ventas-profesionales
- [ ] /dashboard/photos
- [ ] /dashboard/llaves/historial
- [ ] /dashboard/validados
- [ ] /dashboard/admin/conversaciones

Performance:
- [ ] Velocidad aceptable (< 3s por página)
- [ ] Sin loading infinito
- [ ] Navegación fluida

Consola:
- [ ] 0 errores rojos
- [ ] Logs de tracking presentes
- [ ] No hay warnings críticos
```

---

### Paso 2: Testing con usuarios

**Invita a 2-3 usuarios internos:**

```
Hola,

Necesito que pruebes esta versión staging:
URL: https://[staging-url]

Por favor:
1. Login con tus credenciales
2. Navega a Ventas, Entregas, Noticias
3. Reporta si ves algún error o problema
4. ¿Hay algo que NO funcione?

Gracias!
```

---

### Paso 3: Testing de edge cases

**Casos especiales:**

1. **Sesión expirada:**
   - Dejar pestaña abierta 30 min
   - Navegar → ¿Redirige a login?

2. **Sin internet:**
   - Desconectar WiFi
   - Navegar → ¿Muestra error apropiado?

3. **Permisos:**
   - Login como admin → ¿Ve todo?
   - Login como asesor → ¿Ve solo su data?

4. **Móvil:**
   - Abrir en teléfono
   - ¿Responsive funciona?
   - ¿Navegación touch funciona?

---

### ✅ Criterio de éxito Staging:

- ✅ Todas las páginas funcionan
- ✅ 2+ usuarios aprueban
- ✅ Edge cases pasan
- ✅ Performance aceptable
- ✅ Consola limpia

---

## 4️⃣ DEPLOY A PRODUCCIÓN

### ⚠️ IMPORTANTE:

**Solo hacer esto si:**
- ✅ Staging funciona 100%
- ✅ Usuarios internos aprueban
- ✅ Sin errores críticos
- ✅ Tienes backup de DB (opcional pero recomendado)

---

### Paso 1: Backup (recomendado)

**En Supabase Dashboard:**
```
1. Project → Database → Backups
2. Click "Create manual backup"
3. Esperar confirmación
```

---

### Paso 2: Merge a main

```bash
# 1. Ir a main
git checkout main

# 2. Pull últimos cambios (por si acaso)
git pull origin main

# 3. Merge desde staging
git merge staging

# 4. Resolver conflictos si hay (no debería haber)
# 5. Verificar que todo esté OK
git log --oneline -5
```

---

### Paso 3: Push a main

```bash
git push origin main
```

**Vercel automáticamente:**
- ✅ Detecta push a main
- ✅ Inicia build de producción
- ✅ Despliega a www.controlvo.ovh

---

### Paso 4: Monitoreo post-deploy

**Primeros 5 minutos:**
```markdown
✅ Monitoreo inmediato:

- [ ] Abrir www.controlvo.ovh
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Navegar a 2-3 páginas críticas
- [ ] Verificar consola sin errores

Vercel Dashboard:
- [ ] Build exitoso (green)
- [ ] No hay errores en Logs
- [ ] Functions ejecutándose OK
```

**Primeras 24 horas:**
```markdown
✅ Monitoreo extendido:

- [ ] Revisar Vercel Analytics
- [ ] Verificar logs de errores
- [ ] Estar atento a reportes de usuarios
- [ ] Monitorear Supabase Dashboard (queries)

Si todo OK:
- ✅ Celebrar 🎉
- ✅ Documentar lecciones aprendidas
- ✅ Planificar siguiente feature
```

---

## 5️⃣ ROLLBACK (Si algo sale mal)

### 🚨 Síntomas de problema:

- ❌ Loading infinito en producción
- ❌ Errores 500 en API Routes
- ❌ Múltiples usuarios reportan problemas
- ❌ Funcionalidad crítica rota

---

### Opción A: Rollback en Vercel (más rápido)

```
1. Ir a Vercel Dashboard
2. Project → Deployments
3. Buscar deploy ANTERIOR (antes del merge)
4. Click en "..." → "Promote to Production"
5. Confirmar
```

**Tiempo:** ~30 segundos

---

### Opción B: Rollback en Git

```bash
# 1. Ver historial
git log --oneline -10

# 2. Identificar commit ANTES del merge
# (ej: a24ee58)

# 3. Revertir
git revert [commit-hash-del-merge]

# 4. Push
git push origin main
```

**Tiempo:** ~2 minutos

---

### Paso post-rollback:

1. ✅ Verificar que producción funciona
2. ✅ Investigar qué salió mal
3. ✅ Corregir en staging
4. ✅ Re-probar en staging
5. ✅ Re-intentar deploy cuando esté corregido

---

## 📊 DASHBOARD DE MONITOREO

### URLs importantes:

```markdown
**Producción:**
- URL: https://www.controlvo.ovh
- Vercel: https://vercel.com/[proyecto]/deployments

**Staging:**
- URL: https://[proyecto]-staging.vercel.app
- Vercel: https://vercel.com/[proyecto]/deployments

**Database:**
- Supabase: https://supabase.com/dashboard/project/[id]
- Logs: https://supabase.com/dashboard/project/[id]/logs

**Monitoreo:**
- Vercel Analytics: https://vercel.com/[proyecto]/analytics
- Vercel Logs: https://vercel.com/[proyecto]/logs
```

---

## 📋 CHECKLIST FINAL PRE-DEPLOY

### Antes de push a main:

```markdown
### 🔒 Seguridad
- [ ] Variables de entorno configuradas
- [ ] No hay secrets en código
- [ ] Middleware habilitado
- [ ] Autenticación funciona

### 🧪 Testing
- [ ] Testing local completo
- [ ] Testing staging completo
- [ ] 2+ usuarios aprobaron
- [ ] Edge cases probados

### 📝 Documentación
- [ ] README actualizado
- [ ] CHANGELOG actualizado (opcional)
- [ ] Estándares documentados

### 🔧 Código
- [ ] Linter sin errores críticos
- [ ] Build exitoso
- [ ] No hay console.log innecesarios
- [ ] Comentarios actualizados

### 🚀 Deploy
- [ ] Backup de DB hecho (opcional)
- [ ] Equipo notificado
- [ ] Ventana de maintenance (si necesario)
```

---

## 🎓 LECCIONES APRENDIDAS

### Para el futuro:

1. **Siempre probar en staging primero**
2. **Involucrar a usuarios internos en testing**
3. **Tener plan de rollback listo**
4. **Monitorear primeras 24h**
5. **Documentar todo**

---

## 📞 CONTACTOS DE EMERGENCIA

```markdown
**Si algo sale MUY mal:**

1. Rollback inmediato (Vercel Dashboard)
2. Notificar a equipo
3. Investigar logs de Vercel
4. Revisar logs de Supabase
5. Corregir en local → staging → producción
```

---

## ✅ RESUMEN RÁPIDO

### Workflow completo:

```
1. Código → Testing Local ✅
2. Local OK → Push a Staging
3. Staging → Testing por 2+ personas
4. Staging OK → Merge a Main
5. Main → Deploy automático
6. Producción → Monitoreo 24h
7. Todo OK → Celebrar 🎉
```

### Tiempos estimados:

| Fase | Tiempo |
|------|--------|
| Testing local | 30 min |
| Push a staging | 2 min |
| Testing staging | 1 hora |
| Deploy a producción | 2 min |
| Monitoreo | 24 horas |
| **TOTAL** | **~2 horas activas** |

---

**¿Listo para empezar?** 🚀

**Siguiente paso:** Testing local (Paso 1)

```bash
npm run dev
```

