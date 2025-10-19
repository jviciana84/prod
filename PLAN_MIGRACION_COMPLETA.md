# PLAN MIGRACIÓN COMPLETA - TODAS LAS MUTATIONS
**Fecha inicio:** 19 Octubre 2025 19:00h

---

## ✅ COMPLETADO (11 mutations)

### 1. Photos (6)
- ✅ Estado pintura
- ✅ Fotógrafo
- ✅ Fotos completadas
- ✅ Marcar error
- ✅ Subsanar error
- ✅ Eliminar vehículo

### 2. Sales (4)
- ✅ CYP status
- ✅ Photo 360
- ✅ OR value
- ✅ Cell edit

### 3. Entregas (1)
- ✅ Incidencias

---

## 🔥 PRIORITARIOS (Uso diario)

### 4. Stock (~15 mutations) - 3734 líneas
- [ ] Estado venta
- [ ] Cell edit (múltiples campos)
- [ ] ~13 funciones más

### 5. Validados
- [ ] Update sales vehicle

### 6. Document Management
- [ ] Initialize records
- [ ] Document movement

### 7. Key Management  
- [ ] Initialize records
- [ ] Key movement

### 8. Transport
- [ ] Update status (transport-detail)
- [ ] Cell edit (transport-table)
- [ ] Quick form saves

### 9. Vehicle Management
- [ ] Vehicle updates

---

## 📋 MODALES Y FORMULARIOS (Uso ocasional pero CRÍTICO)

### 10. Sales Quick Form
- [ ] Create sale

### 11. PDF Data Dialog
- [ ] Update from PDF

### 12. Photographer Assignments
- [ ] Assign photographers

### 13. Photos Manager
- [ ] Batch operations

### 14. Docuware Requests
- [ ] Create/update requests

### 15. Circulation Permit Modal
- [ ] Update permits

### 16. Key Management Form
- [ ] Key operations

---

## ⚙️ SETTINGS Y ADMIN (Configuración)

### 17. Footer Message Manager
- [ ] Update footer

### 18. Objetivos Manager
- [ ] Goals management

### 19. Vehicles Database Manager
- [ ] Vehicle data

### 20. Locations Manager
- [ ] Locations

### 21. Expense Types Manager
- [ ] Expense types

### 22. User Notification Settings
- [ ] Notification prefs

### 23. Admin Notification Panel
- [ ] Admin notifications

---

## 🔔 NOTIFICACIONES Y SEGUIMIENTO

### 24. Notificaciones Incidencias
- [ ] Incident notifications

### 25. Vehiculos Para Recoger
- [ ] Pickup tracking

### 26. Recogidas Email Config
- [ ] Email config

### 27. Seguimiento Updater
- [ ] Tracking updates

---

## 👤 PERFIL Y USUARIO

### 28. Profile Form
- [ ] Update profile

### 29. Avatar Selector
- [ ] Update avatar

### 30. Image Uploader/Gallery
- [ ] Upload/manage images

---

## 📊 DASHBOARD Y UI

### 31. Header
- [ ] User updates

### 32. Pending Movements Card
- [ ] Movement updates

---

## 🗑️ A IGNORAR (Backups)
- sales-table-backup.tsx
- sales-table-backup-2.tsx
- transport-table-backup.tsx
- entregas-table-fixed.tsx
- entregas-table-admin.tsx
- use-toast.ts (no tiene mutations reales)

---

## 📈 RESUMEN

**Total estimado:** ~100 mutations
**Completadas:** 11 (11%)
**Pendientes:** ~89 (89%)

**Tiempo estimado total:** 8-12 horas
**Estrategia:** Priorizar por uso diario, sin saltarse nada

---

## 🎯 MÉTODO

Para CADA archivo:
1. Leer mutations existentes
2. Crear API Routes correspondientes
3. Refactorizar código a fetch()
4. Probar localmente
5. Commit
6. Siguiente archivo

**SIN ASUMIR IMPORTANCIA. TODO SE MIGRA.**


