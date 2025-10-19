# 🚀 DEPLOY A STAGING - INSTRUCCIONES

## 📋 QUÉ SE VA A HACER

### 1. Crear Branch Staging
```bash
git checkout -b staging
```
Crea una copia del código actual en un branch separado.

### 2. Commitear Todos los Cambios
```bash
git add .
git commit -m "feat: Migración completa a API Routes - solución loading infinito"
```

**Archivos incluidos en el commit:**
- ✅ 13 API Routes nuevas en `app/api/`
- ✅ 11 componentes refactorizados
- ✅ 3 archivos de documentación
- ✅ Eliminación de AbortController problemático
- ✅ Fix de tabla delivery_centers opcional

### 3. Push a Staging
```bash
git push origin staging
```

### 4. Vercel Deploy Automático
Vercel detecta el push y crea automáticamente:
- **URL de staging:** `https://controlvo-git-staging-[usuario].vercel.app`
- **Build automático** en ~2-3 minutos
- **Variables de entorno** heredadas del proyecto

---

## 🌐 URLS RESULTANTES

| Branch | URL | Uso |
|--------|-----|-----|
| `main` | `https://controlvo.ovh` | ✅ Producción (usuarios) |
| `staging` | `https://controlvo-git-staging-*.vercel.app` | ⚠️ Testing (solo tú) |

---

## 🔄 WORKFLOW DESPUÉS DEL DEPLOY

### Si Staging Funciona Bien:
```bash
# 1. Volver a main
git checkout main

# 2. Mergear staging → main
git merge staging

# 3. Push a producción
git push origin main
```

### Si Staging Tiene Problemas:
```bash
# Quedarse en staging y arreglar
git checkout staging
# Hacer cambios...
git add .
git commit -m "fix: corrección X"
git push origin staging
# Vercel redeploya automáticamente
```

---

## ⚠️ IMPORTANTE

### Producción Está Protegida
- ✅ Branch `main` NO se toca hasta que staging funcione
- ✅ Usuarios siguen viendo la versión estable
- ✅ Tú pruebas en staging sin riesgo

### Variables de Entorno
- ✅ Se heredan automáticamente en staging
- ✅ Misma configuración que producción
- ✅ Mismo Supabase, mismas credenciales

### Rollback Fácil
Si algo sale mal:
```bash
# Simplemente NO mergear a main
# Staging queda aislado
```

---

## 📊 CAMBIOS EN ESTE DEPLOY

### API Routes Nuevas (13)
1. `/api/sales/list` - Ventas
2. `/api/entregas/list` - Entregas
3. `/api/noticias/list` - Noticias
4. `/api/validados/list` - Validados
5. `/api/photos/list` - Fotos
6. `/api/stock/list` - Stock
7. `/api/transport/list` - Transportes
8. `/api/llaves/movements` - Llaves
9. `/api/conversations/list` - Conversaciones
10. `/api/conversations/sessions` - Sesiones
11. `/api/dashboard/rankings` - Rankings
12. `/api/dashboard/activity-feed` - Actividad
13. Fixes en delivery_centers

### Componentes Modificados (11)
- components/sales/sales-table.tsx
- components/entregas/entregas-table.tsx
- app/dashboard/noticias/page.tsx
- components/dashboard/news-dropdown.tsx
- components/validados/validados-table.tsx
- components/photos/photos-table.tsx
- app/dashboard/llaves/historial/page.tsx
- app/dashboard/admin/conversaciones/conversations-client.tsx
- components/dashboard/sales-ranking.tsx
- components/dashboard/financing-ranking.tsx
- components/dashboard/real-activity-feed.tsx

### Documentación Creada (3)
- SOLUCION_IMPLEMENTADA_API_ROUTES.md
- MIGRACION_COMPLETA_API_ROUTES.md
- DEPLOY_STAGING_INSTRUCCIONES.md (este archivo)

---

## 🎯 CÓMO PROBAR EN STAGING

1. **Esperar build** (~2-3 min)
2. **Abrir URL de staging** (te la muestro después del push)
3. **Probar páginas:**
   - /dashboard/ventas
   - /dashboard/entregas
   - /dashboard/noticias
   - /dashboard/validados
   - /dashboard/llaves/historial
   - /dashboard/admin/conversaciones

4. **Verificar:**
   - ✅ No hay loading infinito
   - ✅ Datos cargan correctamente
   - ✅ Navegación entre páginas funciona
   - ✅ Ediciones funcionan (usa cliente Supabase para mutaciones)

---

## ✅ VERIFICACIÓN POST-DEPLOY

### Logs Esperados en Consola (Staging):
```
🔄 [loadSoldVehicles] Iniciando carga desde API...
📊 [loadSoldVehicles] Resultado: {dataCount: 149}
✅ [loadSoldVehicles] Datos procesados correctamente
```

### Si Ves Estos Logs: ✅ TODO BIEN
Si ves loading infinito: ❌ Avísame

---

## 🔐 SEGURIDAD

- ✅ Staging NO es público (URL difícil de adivinar)
- ✅ Misma autenticación que producción
- ✅ Solo usuarios con login pueden acceder
- ✅ Datos reales de Supabase (compartidos)

---

**Fecha:** 19 de Octubre de 2025  
**Ejecutado por:** Usuario autorizado  
**Branch:** staging  
**Destino:** Test antes de producción

