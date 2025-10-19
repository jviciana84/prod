# 🚀 ESTRATEGIA DE DEPLOY - STAGING vs PRODUCCIÓN

## 🎯 PREGUNTA CLAVE DEL USUARIO

> "¿Los cambios siempre serán en la versión de test, no?"

**Respuesta:** Depende de la estrategia que elijas.

---

## 📊 OPCIONES DE DEPLOY

### Opción 1: **Deploy Directo (NO RECOMENDADO)** ❌

```bash
git add .
git commit -m "feat: migración API Routes"
git push origin main
```

**Resultado:**
- ✅ Rápido (1 paso)
- ❌ Va directo a producción (usuarios reales afectados)
- ❌ Sin testing previo
- ❌ Riesgo alto

**Cuándo usar:** NUNCA, excepto hotfixes críticos

---

### Opción 2: **Staging Branch (RECOMENDADO)** ✅

```bash
# 1. Crear branch staging
git checkout -b staging
git add .
git commit -m "feat: migración API Routes completa"
git push origin staging

# 2. Vercel auto-deploya a URL staging
# URL: https://cursor-staging-abc123.vercel.app
# O configurado como: https://staging.controlvo.ovh

# 3. Probar en staging
# - Navegar todas las páginas
# - Verificar consola sin errores
# - Probar funcionalidades críticas

# 4. Cuando esté 100% estable
git checkout main
git merge staging
git push origin main  # Solo ahora va a producción
```

**Resultado:**
- ✅ Testing seguro en ambiente aislado
- ✅ No afecta usuarios reales
- ✅ URL diferente (staging vs producción)
- ✅ Riesgo bajo

**Cuándo usar:** SIEMPRE para features nuevas

---

### Opción 3: **Feature Branches** 🔀

```bash
# Para cada feature grande
git checkout -b feature/api-routes-migration
# ... trabajo ...
git push origin feature/api-routes-migration

# Vercel crea preview: https://cursor-feature-abc.vercel.app

# Cuando esté listo → PR a staging
# Después de testing en staging → merge a main
```

**Resultado:**
- ✅ Aislamiento total por feature
- ✅ Múltiples features en paralelo
- ✅ Code review antes de merge
- ✅ Riesgo mínimo

**Cuándo usar:** Proyectos con equipo múltiple

---

## 🏗️ ESTRUCTURA RECOMENDADA

### Branches:

```
main (producción)
├── staging (testing pre-producción)
│   ├── feature/api-routes ✅ (esta migración)
│   ├── feature/nueva-tabla
│   └── feature/nuevo-modulo
└── hotfix/bug-critico (solo emergencias)
```

### Ambientes:

| Branch | URL | Propósito | Usuarios |
|--------|-----|-----------|----------|
| `main` | `www.controlvo.ovh` | **Producción** | Usuarios reales |
| `staging` | `staging.controlvo.ovh` | **Testing** | Solo tú/equipo |
| `feature/*` | `*.vercel.app` | **Desarrollo** | Solo desarrolladores |

---

## ✅ WORKFLOW RECOMENDADO

### 1. **Desarrollo Local**
```bash
npm run dev  # Probar en local
# Verificar consola sin errores
# Navegar todas las páginas afectadas
```

### 2. **Push a Staging**
```bash
git checkout staging
git add .
git commit -m "feat: descripción clara"
git push origin staging
```

### 3. **Testing en Staging**
- ✅ URL automática de Vercel
- ✅ Probar todas las páginas migradas
- ✅ Verificar consola limpia
- ✅ Probar en móvil y desktop
- ✅ Verificar con 2-3 usuarios internos

### 4. **Deploy a Producción**
```bash
git checkout main
git merge staging
git push origin main
```

### 5. **Monitoreo Post-Deploy**
- ✅ Verificar en producción real
- ✅ Monitorear logs de Vercel
- ✅ Estar atento a reportes de usuarios

---

## 🔧 CONFIGURACIÓN VERCEL

### Domains:

```
Production (main):
  - www.controlvo.ovh
  - controlvo.ovh

Preview (staging):
  - staging.controlvo.ovh
  - cursor-staging.vercel.app

Preview (branches):
  - cursor-[branch]-[hash].vercel.app
```

### Variables de Entorno:

Usar **diferentes valores** por ambiente:

| Variable | Production | Staging | Development |
|----------|-----------|---------|-------------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.controlvo.ovh` | `https://staging.controlvo.ovh` | `http://localhost:3000` |
| `NODE_ENV` | `production` | `production` | `development` |

---

## 📋 CHECKLIST PRE-DEPLOY

### Antes de Push a Staging:

- [x] ✅ Código compilando sin errores
- [x] ✅ Linter sin errores
- [x] ✅ Pruebas locales exitosas
- [x] ✅ Consola limpia (0 errores rojos)
- [x] ✅ Documentación actualizada
- [x] ✅ Commit message descriptivo

### Antes de Merge a Main:

- [ ] ✅ Testing completo en staging
- [ ] ✅ Navegación fluida entre páginas
- [ ] ✅ Sin errores en consola staging
- [ ] ✅ Aprobación de 2+ usuarios internos
- [ ] ✅ Performance aceptable
- [ ] ✅ Sin regresiones en features existentes

---

## 🚨 ROLLBACK (Si algo sale mal)

### En Staging:
```bash
# Simplemente haz un nuevo push con el fix
git revert [commit-hash]
git push origin staging
```

### En Producción:
```bash
# Opción 1: Revert del commit
git revert [commit-hash]
git push origin main

# Opción 2: Rollback en Vercel
# Dashboard → Deployments → [deploy anterior] → "Promote to Production"
```

---

## 💡 RECOMENDACIÓN FINAL

### Para esta migración específica:

1. **✅ USAR STAGING** (opción 2)
2. **Razón:** Es un cambio arquitectural grande (18 API Routes)
3. **Beneficio:** Testing seguro sin afectar usuarios

### Comando a ejecutar:

```bash
# Ya creaste el branch staging con:
git checkout -b staging

# Solo falta:
git add .
git commit -m "feat: migración completa a API Routes - 18 routes, 14 páginas"
git push origin staging

# Vercel desplegará automáticamente
# URL: [Te la dará Vercel en el dashboard]
```

### Después del testing en staging:

```bash
# Solo cuando staging esté 100% OK:
git checkout main
git merge staging
git push origin main
```

---

## 🎯 RESPUESTA A TU PREGUNTA

> "¿Los cambios siempre serán en test?"

**Respuesta:**

- **Cambios NUEVOS → staging primero** ✅
- **Cambios PROBADOS en staging → main** ✅
- **Hotfixes CRÍTICOS → directo a main** (solo emergencias)

**Workflow normal:**
```
Local → Staging (test) → Main (producción)
```

De esta forma:
- ✅ Siempre pruebas en ambiente seguro
- ✅ Usuarios no ven bugs en desarrollo
- ✅ Puedes iterar rápido en staging
- ✅ Solo deployeas a producción cuando esté perfecto

---

## 📞 PRÓXIMOS PASOS INMEDIATOS

1. **Hacer commit y push a staging:**
```bash
git status  # Ver archivos modificados
git add .
git commit -m "feat: migración completa API Routes - 18 routes, 14 páginas, 0 errores"
git push origin staging
```

2. **Obtener URL de staging:**
- Ir a Vercel Dashboard
- Ver deployment de branch `staging`
- Copiar URL (ej: `https://cursor-staging-abc.vercel.app`)

3. **Probar en staging:**
- Abrir URL de staging
- Navegar a todas las páginas migradas
- Verificar consola sin errores
- Probar funcionalidades críticas

4. **Deploy a producción (solo cuando staging OK):**
```bash
git checkout main
git merge staging
git push origin main
```

---

**Estado actual:** ✅ Código listo para staging  
**Próximo paso:** Push a staging  
**ETA a producción:** Después de testing exitoso en staging

