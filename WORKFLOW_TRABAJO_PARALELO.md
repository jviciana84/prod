# 🔀 WORKFLOW - TRABAJO EN PARALELO

**Fecha:** 19 de Octubre de 2025  
**Propósito:** Trabajar en múltiples features sin mezclar cambios

---

## 🎯 SITUACIÓN ACTUAL

### Branch Principal:
```
main (producción actual)
  └── staging (migración API Routes) ✅ LISTO PARA PUSH
```

### Trabajo Pendiente:
1. ✅ **Migración API Routes** → Push a staging AHORA
2. ⏳ **Footer fixes** → Nuevo branch separado
3. ⏳ **Otros cambios** → Nuevos branches según necesidad

---

## 📋 PLAN DE ACCIÓN

### PASO 1: Commit y Push a Staging (AHORA)

```bash
# Estamos en branch staging (o crearlo)
git status

# Commit TODOS los cambios de migración
git add .
git commit -m "feat: migración completa API Routes

- 18 API Routes creadas
- 14 páginas migradas
- 12 errores corregidos
- Middleware re-habilitado
- PWA re-habilitado
- Datos falsos eliminados
- 0 errores en consola

Archivos modificados: 54
Breaking changes: Ninguno
Testing: Pendiente en staging

Refs: README_MIGRACION_API_ROUTES.md"

# Push a staging
git push origin staging
```

---

### PASO 2: Crear Branch para Footer

```bash
# Volver a main (código actual de producción)
git checkout main

# Crear nuevo branch desde main
git checkout -b fix/footer-styling

# Ahora puedes trabajar en footer sin afectar staging
```

---

### PASO 3: Estructura de Branches

```
main (producción)
  ├── staging (migración API Routes) ← Testing aquí
  ├── fix/footer-styling (footer fixes) ← Trabajar aquí
  └── feature/nueva-funcionalidad (futuro)
```

---

## 🔄 WORKFLOW RECOMENDADO

### Para CADA tarea nueva:

```bash
# 1. Partir desde main (limpio)
git checkout main
git pull origin main

# 2. Crear branch descriptivo
git checkout -b tipo/descripcion
# Ejemplos:
# - fix/footer-styling
# - feat/nueva-tabla
# - refactor/componente-x

# 3. Trabajar en tu branch
# ... hacer cambios ...
git add .
git commit -m "..."

# 4. Push a tu branch
git push origin tipo/descripcion

# 5. Cuando esté listo: merge
git checkout main
git merge tipo/descripcion
git push origin main
```

---

## 📊 ESTADO ACTUAL DE BRANCHES

### staging (migración)
```
Estado: ✅ Listo para push
Cambios: 54 archivos
Próximo: Testing en staging
```

### main (producción)
```
Estado: ✅ Estable (producción actual)
Próximo: Base para nuevos branches
```

### fix/footer-styling (nuevo)
```
Estado: ⏳ Por crear
Base: main
Propósito: Arreglar footer
```

---

## 🎨 EJEMPLO: Trabajar en Footer

### Terminal 1 (Chat actual - Staging):
```bash
# Estamos trabajando en staging
git status
# On branch staging

# Push cuando esté listo
git push origin staging
```

### Terminal 2 (Otro chat - Footer):
```bash
# Crear branch desde main
git checkout main
git checkout -b fix/footer-styling

# Trabajar en footer
# ... modificar components/dashboard/footer.tsx ...
git add components/dashboard/footer.tsx
git commit -m "fix: mejorar estilos de footer"
git push origin fix/footer-styling
```

---

## 🚫 EVITAR CONFLICTOS

### ✅ HACER:
```bash
# Cada tarea en su propio branch
git checkout -b fix/tarea-especifica

# Commits frecuentes
git commit -m "..."

# Push regularmente
git push origin fix/tarea-especifica
```

### ❌ NO HACER:
```bash
# NO trabajar en main directamente
git checkout main
# ... hacer cambios ... ❌

# NO mezclar múltiples tareas en un branch
git checkout -b varios-cambios-mezclados ❌
```

---

## 🔀 MERGE STRATEGY

### Opción 1: Merge Directo (Simple)
```bash
git checkout main
git merge staging
git push origin main
```

### Opción 2: Pull Request (Recomendado)
```
1. Push a branch
2. GitHub/GitLab → Create Pull Request
3. Code review
4. Merge cuando aprobado
```

### Opción 3: Cherry-pick (Selectivo)
```bash
# Si solo quieres algunos commits
git cherry-pick <commit-hash>
```

---

## 📋 CHECKLIST POR TAREA

### Antes de empezar nueva tarea:

```markdown
- [ ] ¿En qué branch estoy? `git status`
- [ ] ¿Tengo cambios sin commit? `git status`
- [ ] ¿Estoy en main? `git checkout main`
- [ ] ¿Tengo lo último? `git pull origin main`
- [ ] ¿Creo nuevo branch? `git checkout -b tipo/nombre`
```

### Antes de push:

```markdown
- [ ] ¿Todos los cambios commiteados? `git status`
- [ ] ¿Mensaje de commit claro? `git log -1`
- [ ] ¿Branch correcto? `git branch`
- [ ] Push: `git push origin <branch>`
```

---

## 🎯 PLAN INMEDIATO

### HOY - Chat Actual:
```bash
# 1. Commit migración
git add .
git commit -m "feat: migración completa API Routes"

# 2. Push a staging
git push origin staging

# 3. Testing en staging
# URL: https://[proyecto]-staging.vercel.app

# 4. Si OK: Merge a main (mañana/cuando esté listo)
```

### HOY/MAÑANA - Otro Chat (Footer):
```bash
# 1. Nuevo branch desde main
git checkout main
git checkout -b fix/footer-styling

# 2. Arreglar footer
# ... cambios en footer ...

# 3. Commit y push
git add .
git commit -m "fix: mejorar estilos footer"
git push origin fix/footer-styling

# 4. Probar en preview de Vercel

# 5. Si OK: Merge a main
```

---

## 🔍 COMANDOS ÚTILES

### Ver branches:
```bash
git branch -a
```

### Ver en qué branch estás:
```bash
git status
git branch
```

### Ver cambios pendientes:
```bash
git status
git diff
```

### Ver historial:
```bash
git log --oneline --graph --all
```

### Cambiar de branch (si no tienes cambios):
```bash
git checkout nombre-branch
```

### Cambiar de branch (si tienes cambios):
```bash
# Opción 1: Guardar cambios
git stash
git checkout otro-branch
git stash pop

# Opción 2: Commit primero
git add .
git commit -m "WIP: trabajo en progreso"
git checkout otro-branch
```

---

## 🚨 RESOLUCIÓN DE CONFLICTOS

### Si hay conflicto al merge:

```bash
# 1. Ver conflictos
git status

# 2. Abrir archivos con conflictos
# Buscar: <<<<<<< HEAD

# 3. Resolver manualmente

# 4. Marcar como resuelto
git add archivo-resuelto

# 5. Completar merge
git commit
```

---

## 📊 DASHBOARD DE BRANCHES

### Visualización recomendada:

```
main (producción) ───────────────────────→ (usuarios)
  │
  ├── staging (testing) ─────────────────→ (tu testing)
  │     └── Migración API Routes ✅
  │
  ├── fix/footer-styling ────────────────→ (en progreso)
  │     └── Footer fixes ⏳
  │
  └── feature/nueva-tabla (futuro) ──────→ (por hacer)
```

---

## ✅ RESUMEN

### 3 Reglas Simples:

1. **1 tarea = 1 branch**
2. **Partir siempre de main**
3. **Push frecuente**

### Workflow:
```
main → nuevo branch → trabajar → commit → push → merge → main
```

---

## 🎯 ACCIÓN INMEDIATA

**AHORA en este chat:**
```bash
git add .
git commit -m "feat: migración completa API Routes"
git push origin staging
```

**DESPUÉS en otro chat:**
```bash
git checkout main
git checkout -b fix/footer-styling
# ... trabajar en footer ...
```

---

**Estado:** ✅ Workflow documentado  
**Próximo paso:** Push a staging

