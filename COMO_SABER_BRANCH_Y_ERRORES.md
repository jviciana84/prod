# 🔍 CÓMO SABER EN QUÉ BRANCH ESTÁS Y SOLUCIONAR ERRORES

**Fecha:** 19 de Octubre de 2025

---

## 📍 SABER EN QUÉ BRANCH ESTÁS

### Método 1: Comando git branch (RÁPIDO)
```bash
git branch

# Resultado:
#   backup-noticias-wrapper
#   main
# * staging  ← El asterisco (*) indica el branch actual
```

### Método 2: Git status
```bash
git status

# Primera línea dice:
# On branch staging
```

### Método 3: Visual (si usas VSCode/Cursor)
- Mira la barra de estado inferior izquierda
- Verás el ícono de git y el nombre del branch

### Método 4: PowerShell prompt
```bash
# Si tienes posh-git instalado, verás:
# C:\path\to\project [staging]>
```

---

## 🔄 CAMBIAR DE BRANCH

### Para ir a main:
```bash
git checkout main
```

### Para ir a staging:
```bash
git checkout staging
```

### Para crear nuevo branch:
```bash
git checkout -b nombre-nuevo-branch
```

---

## 🚨 ERROR QUE ACABAMOS DE CORREGIR

### Síntoma:
```
const { data: userData, error: userError } = await supabase.from("profiles")...
                                                    ^^^^^^^^
Error: 'supabase' is not defined
```

### Causa:
- Código legacy que usa `supabase` directamente
- Variable `supabase` no definida en el scope
- Código duplicado (`userMap` definido 2 veces)

### Solución aplicada:
1. ❌ Eliminado código duplicado
2. ❌ Eliminada consulta directa a `supabase`
3. ✅ Los `profiles` ya vienen de la API Route
4. ✅ Push a staging exitoso

**Commit:** `63b72e3`

---

## 📋 CHECKLIST AL VER ERROR DE BUILD

### 1. Identificar dónde estás:
```bash
git branch
# * staging ← Estás aquí
```

### 2. Ver el error completo:
- En Vercel Dashboard: https://vercel.com/jviciana84/prod/deployments
- Click en el deploy fallido
- Click en "View Build Logs"

### 3. Buscar el archivo problemático:
```
Import trace for requested module:
./app/dashboard/llaves/historial/page.tsx  ← Archivo con error
```

### 4. Abrir archivo y buscar error:
```bash
# En tu editor, buscar la línea mencionada
```

### 5. Corregir localmente:
```bash
# Editar archivo
# Guardar cambios
```

### 6. Commit y push:
```bash
git add archivo-corregido
git commit -m "fix: descripción del error corregido"
git push origin staging
```

### 7. Verificar nuevo build:
- Vercel automáticamente inicia nuevo build
- Esperar 2-3 minutos
- Verificar que sea exitoso

---

## 🎯 ERRORES COMUNES EN BUILD

### Error 1: Variable no definida
```typescript
// ❌ ERROR
const { data } = await supabase.from("table")...
// supabase no está definido

// ✅ SOLUCIÓN
// Opción A: Definir supabase
const supabase = createClientComponentClient()

// Opción B: Usar API Route (RECOMENDADO)
const response = await fetch("/api/table/list")
```

### Error 2: Import no encontrado
```typescript
// ❌ ERROR
import { algo } from "@/components/no-existe"

// ✅ SOLUCIÓN
// Verificar que el archivo existe
// Verificar que la exportación existe
```

### Error 3: TypeScript error
```typescript
// ❌ ERROR
const data: string = 123  // Type error

// ✅ SOLUCIÓN
const data: number = 123
// o
const data: string = "123"
```

### Error 4: Módulo no encontrado
```
Cannot find module 'alguna-libreria'

// ✅ SOLUCIÓN
npm install alguna-libreria
# o
pnpm install alguna-libreria
```

---

## 🔍 DEBUGGING EN VERCEL

### Ver logs de build:
```
1. Ir a: https://vercel.com/jviciana84/prod
2. Click "Deployments"
3. Click en el deploy (el más reciente arriba)
4. Click "Building" → Ver progreso
5. Si falla → Click "View Function Logs"
```

### Ver logs de runtime:
```
1. Vercel Dashboard
2. Click deployment
3. Click "Functions"
4. Ver logs en tiempo real
```

---

## 🎯 WORKFLOW AL ENCONTRAR ERROR

```
1. Ver error en Vercel
   ↓
2. Identificar archivo problemático
   ↓
3. Verificar en qué branch estás
   git branch
   ↓
4. Abrir archivo y corregir
   ↓
5. Commit
   git add .
   git commit -m "fix: ..."
   ↓
6. Push
   git push origin [branch-actual]
   ↓
7. Verificar nuevo build en Vercel
```

---

## 📊 BRANCHES EN ESTE PROYECTO

```
main
  ├── staging (migraciones y features grandes)
  ├── fix/* (correcciones específicas)
  └── feature/* (nuevas funcionalidades)
```

### Cuándo usar cada uno:

**main:**
- Código de producción
- Solo hacer push cuando esté 100% probado
- Último recurso para hotfixes

**staging:**
- Testing de features grandes
- Migración API Routes (este caso)
- Probar antes de producción

**fix/nombre:**
- Correcciones específicas
- Footer, bugs pequeños
- Features aisladas

---

## ✅ ESTADO ACTUAL

```bash
# Verificar:
git branch
# * staging ← Estás aquí

# Ver último commit:
git log -1
# commit 63b72e3
# fix: eliminar código duplicado...

# Ver cambios pendientes:
git status
# On branch staging
# nothing to commit, working tree clean ✅
```

---

## 🚀 PRÓXIMOS PASOS

### Si el build ahora es exitoso:
1. ✅ Vercel completará el build
2. ✅ Te dará URL de staging
3. ✅ Probar la aplicación
4. ✅ Si todo OK → merge a main

### Para trabajar en footer (otro branch):
```bash
# Volver a main
git checkout main

# Crear branch de footer
git checkout -b fix/footer-styling

# Trabajar sin afectar staging
```

---

## 📝 COMANDOS ÚTILES

### Ver en qué branch estás:
```bash
git branch
# o
git status
```

### Ver commits recientes:
```bash
git log --oneline -5
```

### Ver diferencias:
```bash
git diff
```

### Ver archivos modificados:
```bash
git status
```

### Descartar cambios locales:
```bash
git restore archivo.tsx
```

---

## 🎯 RESUMEN RÁPIDO

**Para saber en qué branch estás:**
```bash
git branch
# El que tiene * es el actual
```

**Para cambiar de branch:**
```bash
git checkout nombre-branch
```

**Para corregir error de build:**
```
1. Ver error en Vercel
2. Corregir archivo
3. git add .
4. git commit -m "fix: ..."
5. git push origin [branch-actual]
6. Esperar nuevo build
```

---

**Estado:** ✅ Error corregido  
**Branch actual:** staging  
**Último commit:** 63b72e3  
**Vercel:** Desplegando fix automáticamente

