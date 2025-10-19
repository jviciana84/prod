# 🚨 PROBLEMA CRÍTICO - CLIENTE GLOBAL EN 73 ARCHIVOS

**Fecha:** 19 de Octubre de 2025  
**Gravedad:** 🔴 CRÍTICA  
**Impacto:** Todas las mutaciones (UPDATE/INSERT/DELETE) potencialmente afectadas

---

## 🔍 DESCUBRIMIENTO

### Archivos con cliente global singleton:
- **60 archivos** en `components/`
- **13 archivos** en `app/dashboard/`
- **Total: 73 archivos**

### Patrón problemático:
```typescript
const supabase = createClientComponentClient() // ← Cliente global singleton

// Más tarde en funciones:
const handleUpdate = async () => {
  await supabase.from("table").update(...) // ← Usa cliente que puede ser zombie
}
```

---

## 🎯 COMPONENTES PRINCIPALES AFECTADOS

### Ya migrados a API Routes (consultas OK, mutaciones RIESGO):

| Componente | Consultas | Mutaciones | Riesgo |
|------------|-----------|------------|--------|
| **sales-table.tsx** | API Route ✅ | Cliente global ⚠️ | 🔴 ALTO |
| **entregas-table.tsx** | API Route ✅ | Cliente global ⚠️ | 🔴 ALTO |
| **validados-table.tsx** | API Route ✅ | Cliente global ⚠️ | 🔴 ALTO |
| **photos-table.tsx** | API Route ✅ | **FIXED** ✅ | ✅ OK |
| **conversations-client.tsx** | API Route ✅ | Cliente global ⚠️ | 🔴 ALTO |

### Componentes con tabla/formularios (ALTO RIESGO):

| Componente | Propósito | Mutaciones | Riesgo |
|------------|-----------|------------|--------|
| **transport-dashboard.tsx** | Nuevas entradas | UPDATE/DELETE | 🔴 ALTO |
| **vehicle-management.tsx** | Gestión vehículos | UPDATE/DELETE | 🔴 ALTO |
| **key-management.tsx** | Gestión llaves | UPDATE/INSERT | 🔴 ALTO |
| **document-management.tsx** | Gestión documentos | UPDATE/INSERT | 🔴 ALTO |
| **user-management.tsx** | Gestión usuarios | UPDATE/DELETE | 🔴 ALTO |
| **extornos-table.tsx** | Extornos | UPDATE | 🔴 ALTO |

---

## 📋 LISTA COMPLETA DE ARCHIVOS AFECTADOS

### components/ (60 archivos):

**Críticos (con mutaciones):**
1. components/sales/sales-table.tsx ⚠️
2. components/entregas/entregas-table.tsx ⚠️
3. components/validados/validados-table.tsx ⚠️
4. components/transport/transport-dashboard.tsx ⚠️
5. components/transport/transport-table.tsx ⚠️
6. components/vehicles/vehicle-management.tsx ⚠️
7. components/vehicles/key-management.tsx ⚠️
8. components/vehicles/document-management.tsx ⚠️
9. components/keys/key-management-form.tsx ⚠️
10. components/admin/user-management.tsx ⚠️
11. components/admin/objetivos-manager.tsx ⚠️
12. components/admin/objetivos-simple-manager.tsx ⚠️
13. components/extornos/extornos-table.tsx ⚠️
14. components/settings/vehicles-database-manager.tsx ⚠️
15. components/settings/locations-manager.tsx ⚠️
16. components/settings/expense-types-manager.tsx ⚠️

**Secundarios (pueden tener mutaciones):**
17. components/duc-scraper/duc-scraper-table.tsx
18. components/duc-scraper/duc-scraper-stats.tsx
19. components/entregas/incidencia-historial.tsx
20. components/entregas/notificaciones-incidencias.tsx
21. components/entregas/informes-incidencias.tsx
22. components/entregas/entregas-table-simple.tsx
23. components/entregas/entregas-table-with-mapping.tsx
24. components/keys/key-movements-search.tsx
25. components/keys/docuware-requests-modal.tsx
26. components/keys/circulation-permit-modal.tsx
27. components/recogidas/vehiculos-para-recoger.tsx
28. components/recogidas/recogidas-email-config.tsx
29. components/recogidas/seguimiento-updater.tsx
30. components/reports/mapa-espana-real.tsx
31. components/reports/mapa-espana-svg-real.tsx
32. components/reports/informe-ventas-mensual.tsx
33. components/sales/sales-quick-form.tsx
34. components/sales/pdf-data-dialog.tsx
35. components/photos/photographer-assignments.tsx
36. components/photos/photos-summary.tsx
37. components/photos/photos-manager.tsx
38. components/photos/user-display.tsx
39. components/notifications/user-notification-settings.tsx
40. components/notifications/admin-notification-panel.tsx
41. components/image-upload/image-uploader.tsx
42. components/image-upload/image-gallery.tsx
43. components/columnas/columnas-manager.tsx
44. components/transport/transport-detail.tsx
45. components/profile/profile-form.tsx
46. components/profile/avatar-selector.tsx
47. components/dashboard/pending-movements-card-simple.tsx
48. components/dashboard/favorites-manager.tsx
49. components/noticias/news-counter-badge.tsx
50. components/admin/footer-message-manager.tsx
51. components/admin/footer-settings-manager.tsx
52. components/auth/auth-provider.tsx
53. components/auth/auth-guard.tsx
54. components/auth/protected-route.tsx
55. components/login-page.tsx
56-60. [Backups y otros]

### app/dashboard/ (13 archivos):

**Con mutaciones probables:**
1. app/dashboard/admin/conversaciones/conversations-client.tsx ⚠️
2. app/dashboard/ventas/add/page.tsx ⚠️
3. app/dashboard/vehicles/[id]/page.tsx ⚠️
4. app/dashboard/llaves/page.tsx ⚠️
5. app/dashboard/llaves/incidencias/page.tsx ⚠️
6. app/dashboard/extornos/page.tsx ⚠️
7. app/dashboard/movimientos-pendientes/page.tsx ⚠️
8. app/dashboard/notifications/page.tsx ⚠️
9. app/dashboard/admin/carga-masiva/page.tsx ⚠️
10. app/dashboard/admin/payment-method-diagnostic/page.tsx ⚠️
11-13. [Otros debug]

---

## 🎯 COMPONENTES PRIORITARIOS CON MUTACIONES

Voy a analizar cuáles de estos tienen UPDATE/INSERT/DELETE:

