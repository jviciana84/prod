# 📋 LISTADO COMPLETO DE TODAS LAS TABLAS CVO
**Inventario completo del sistema - 21 Oct 2025**

---

## 🗄️ TABLAS PRINCIPALES (Core del sistema)

### 1. **duc_scraper** (Bruta - Scraper)
- Origen: Scraper DUC (cada 8h)
- Conexiones: ❌ NO conecta con stock / ✅ Alimenta battery_control
- Página: `/dashboard/duc-scraper`

### 2. **nuevas_entradas** (Entrada Manual)
- Origen: Usuario crea manualmente
- Conexiones: → stock (trigger) + fotos (trigger)
- Página: `/dashboard/nuevas-entradas`

### 3. **stock** (TABLA CENTRAL)
- Origen: Trigger desde nuevas_entradas
- Conexiones: ↔ fotos, sales, entregas, incentivos
- Página: `/dashboard/vehicles`

### 4. **fotos** (Fotografías)
- Origen: Trigger desde nuevas_entradas
- Conexiones: ↔ stock (sincronización estados)
- Página: `/dashboard/photos`

### 5. **sales_vehicles** (Ventas)
- Origen: Usuario crea venta
- Conexiones: → stock.is_sold (trigger), pedidos_validados, entregas, vehicle_keys, vehicle_documents, soporte_tickets
- Página: `/dashboard/ventas`

### 6. **pedidos_validados** (Ventas Validadas)
- Origen: Usuario valida venta en sales_vehicles
- Conexiones: ← sales_vehicles (copia completa)
- Página: `/dashboard/validados`

### 7. **entregas** (Entregas)
- Origen: Usuario agenda entrega
- Conexiones: ← sales_vehicles, → incidencias_historial, → soporte_tickets
- Página: `/dashboard/entregas`

### 8. **incentivos** (Incentivos Comerciales)
- Origen: Usuario crea incentivo
- Conexiones: ← garantias_brutas (trigger auto-calcula)
- Página: `/dashboard/incentivos`

---

## 🗄️ TABLAS BRUTAS (Staging - Scrapers)

### 9. **garantias_brutas_mm** (CMS MM)
- Origen: Scraper CMS MM (cada 8h)
- Conexiones: → incentivos.garantia (trigger)
- Página: -

### 10. **garantias_brutas_mmc** (CMS MMC)
- Origen: Scraper CMS MMC (cada 8h)
- Conexiones: → incentivos.garantia (trigger)
- Página: -

---

## 🗄️ SISTEMA DE LLAVES Y DOCUMENTOS

### 11. **vehicle_keys** (Estado de Llaves)
- Origen: Auto-creado al ver detalle vehículo
- Conexiones: ← sales_vehicles, → key_movements
- Página: `/dashboard/vehiculos/[id]`

### 12. **key_movements** (Movimientos de Llaves)
- Origen: Usuario mueve llave
- Conexiones: ← vehicle_keys, → autoResolveIncident (resuelve incidencias)
- Página: `/dashboard/llaves`, `/dashboard/vehiculos/gestion`

### 13. **vehicle_documents** (Estado de Documentos)
- Origen: Auto-creado al ver detalle vehículo
- Conexiones: ← sales_vehicles, → document_movements
- Página: `/dashboard/vehiculos/[id]`

### 14. **document_movements** (Movimientos de Documentos)
- Origen: Usuario mueve documento
- Conexiones: ← vehicle_documents, → autoResolveIncident (resuelve incidencias)
- Página: `/dashboard/llaves`, `/dashboard/vehiculos/gestion`

### 15. **key_document_requests** (Solicitudes Docuware)
- Origen: Usuario solicita documentos faltantes
- Conexiones: ← sales_vehicles, → key_document_materials
- Página: `/dashboard/llaves`

### 16. **key_document_materials** (Materiales Solicitados)
- Origen: Al crear solicitud Docuware
- Conexiones: ← key_document_requests
- Página: `/dashboard/llaves`

### 17. **external_material_vehicles** (Vehículos Externos)
- Origen: Usuario registra material de vehículos no en sistema
- Conexiones: Independiente
- Página: `/dashboard/llaves`

### 18. **circulation_permit_requests** (Permisos de Circulación)
- Origen: Usuario solicita permiso circulación
- Conexiones: Relacionado con sales_vehicles
- Página: `/dashboard/llaves`

---

## 🗄️ SISTEMA DE INCIDENCIAS Y SOPORTE

### 19. **incidencias_historial** (Historial de Incidencias)
- Origen: Manual (usuario) + Auto (autoResolveIncident)
- Conexiones: ← entregas, ← key_movements (auto-resolución), ← document_movements (auto-resolución), → soporte_tickets
- Página: `/dashboard/entregas`

### 20. **soporte_tickets** (Portal de Soporte Cliente)
- Origen: Se alimenta de entregas + incidencias_historial + sales_vehicles
- Conexiones: ← entregas, ← incidencias_historial, ← sales_vehicles
- Página: `/soporte` (cliente), `/dashboard/admin/soporte` (admin)

---

## 🗄️ OTROS SISTEMAS

### 21. **battery_control** (Control de Baterías)
- Origen: Filtrado automático desde duc_scraper (BEV/PHEV)
- Conexiones: ← duc_scraper (filtro), ↔ sales_vehicles (compara vendidos)
- Página: `/dashboard/vehiculos/baterias`

### 22. **battery_control_config** (Configuración Baterías)
- Origen: Configuración manual (admin)
- Conexiones: Define niveles para battery_control
- Página: `/dashboard/vehiculos/baterias`

### 23. **recogidas_historial** (Recogida Documentos)
- Origen: Usuario solicita recogida
- Conexiones: Independiente (tabla aislada)
- Página: `/dashboard/recogidas`

### 24. **bmw_noticias** (Noticias BMW)
- Origen: Scraper RSS + API noticias
- Conexiones: Independiente
- Página: `/dashboard/noticias`

### 25. **tasaciones** (Tasaciones de Vehículos)
- Origen: Clientes externos vía formulario público
- Conexiones: → advisor_links
- Página: `/tasacion/[advisorSlug]` (público), panel asesor

### 26. **advisor_links** (Enlaces de Asesores)
- Origen: Admin crea enlaces para asesores
- Conexiones: ← tasaciones
- Página: Panel de asesor

---

## 🗄️ TABLAS AUXILIARES Y CONFIGURACIÓN

### 27. **profiles** (Perfiles de Usuario)
- Origen: Auto-creado al registrarse
- Conexiones: FK en TODAS las tablas (usuario_id, photographer_id, etc.)
- Página: `/profile`

### 28. **expense_types** (Tipos de Gasto)
- Origen: Configuración manual
- Conexiones: ← stock, ← sales_vehicles, ← nuevas_entradas
- Página: `/dashboard/vehicles/expense-types`

### 29. **locations** (Ubicaciones)
- Origen: Configuración manual
- Conexiones: Usado en filtros y búsquedas
- Página: -

### 30. **delivery_centers** (Centros de Entrega)
- Origen: Configuración manual
- Conexiones: ← sales_vehicles.pre_delivery_center_id
- Página: -

### 31. **pdf_extracted_data** (Datos OCR de PDFs)
- Origen: OCR automático de PDFs de venta
- Conexiones: ← sales_vehicles.pdf_extraction_id
- Página: `/dashboard/ventas`

### 32. **user_preferences** (Preferencias de Usuario)
- Origen: Usuario configura preferencias
- Conexiones: ← profiles
- Página: `/dashboard/settings`

### 33. **footer_settings** (Configuración Footer)
- Origen: Admin configura
- Conexiones: Independiente
- Página: `/dashboard/settings`

### 34. **forced_updates** (Actualizaciones Forzadas)
- Origen: Admin fuerza actualización
- Conexiones: → user_forced_updates
- Página: -

### 35. **user_forced_updates** (Registro de Actualizaciones)
- Origen: Cuando usuario actualiza
- Conexiones: ← forced_updates
- Página: -

### 36. **filter_configs** (Configuraciones de Filtros)
- Origen: Usuario guarda filtros personalizados
- Conexiones: → filter_processing_log
- Página: `/dashboard/filter-config`

### 37. **filter_processing_log** (Log de Procesamiento)
- Origen: Al ejecutar filtros
- Conexiones: ← filter_configs
- Página: -

### 38. **column_mappings** (Mapeo de Columnas)
- Origen: Configuración de mapeo CSV
- Conexiones: Usado en importación de datos
- Página: `/dashboard/columnas`

### 39. **avatar_mappings** (Mapeo de Avatares)
- Origen: Sistema de avatares
- Conexiones: ← profiles
- Página: -

### 40. **professional_sales** (Ventas Profesionales)
- Origen: Ventas marcadas como profesionales
- Conexiones: Relacionado con sales_vehicles
- Página: `/dashboard/ventas-profesionales`

---

## 📊 TOTAL DE TABLAS: 40+

**Distribución:**
- Tablas Principales: 8
- Tablas Brutas (Scrapers): 3
- Sistema Llaves/Docs: 6
- Incidencias/Soporte: 2
- Otros Sistemas: 4
- Auxiliares/Config: 17+

---

## 🔗 GRUPOS DE TABLAS CONECTADAS

### Grupo 1: CICLO DE VIDA DEL VEHÍCULO
```
nuevas_entradas → stock → fotos → sales_vehicles → entregas → incentivos
```

### Grupo 2: LLAVES Y DOCUMENTOS
```
sales_vehicles → vehicle_keys → key_movements → autoResolveIncident
sales_vehicles → vehicle_documents → document_movements → autoResolveIncident
```

### Grupo 3: INCIDENCIAS Y SOPORTE
```
entregas → incidencias_historial → soporte_tickets
key_movements → autoResolveIncident → incidencias_historial
document_movements → autoResolveIncident → incidencias_historial
```

### Grupo 4: SCRAPERS
```
DUC Web → duc_scraper (aislada ❌)
CMS Web → garantias_brutas_mm/mmc → incentivos (✅)
DUC → battery_control (filtro BEV/PHEV ✅)
```

### Grupo 5: INDEPENDIENTES
```
recogidas_historial
bmw_noticias
tasaciones + advisor_links
user_preferences
footer_settings
```

---

**Última actualización:** 21 Oct 2025


