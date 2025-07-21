# 📋 SISTEMA DE SOLICITUDES DE LLAVES Y DOCUMENTOS - DOCUMENTACIÓN COMPLETA

## 🗂️ ESTRUCTURA DE ARCHIVOS Y COMPONENTES

### 1. PÁGINA PRINCIPAL
- **Archivo:** `app/dashboard/llaves/page.tsx`
- **Funcionalidad:** Página principal con botones para abrir modales de solicitudes
- **Botones:** 
  - "Solicitudes de Llaves y Documentos" (abre modal directamente)
  - "Permiso de circulación" (llama a `/api/circulation-permit/sync-requests`)

### 2. MODALES PRINCIPALES
- **DocuwareRequestsModal:** `components/keys/docuware-requests-modal.tsx`
- **CirculationPermitModal:** `components/keys/circulation-permit-modal.tsx`

### 3. ENDPOINTS API

#### Solicitudes de Llaves y Documentos:
- `/api/docuware/requests` - Obtiene solicitudes desde ventas (GET/POST)
- `/api/docuware/update-material` - Actualiza estado de materiales

#### Permisos de Circulación:
- `/api/circulation-permit/sync-requests` - Sincroniza solicitudes de permisos
- `/api/circulation-permit/requests` - Gestiona solicitudes de permisos

### 4. ESTRUCTURA DE BASE DE DATOS

#### Tabla Principal: `key_document_requests`
```sql
- id (UUID, PRIMARY KEY)
- email_subject (TEXT) - Asunto del email original (ahora valores por defecto)
- email_body (TEXT) - Cuerpo del email original (ahora valores por defecto)
- license_plate (VARCHAR(20)) - Matrícula del vehículo
- requester (VARCHAR(100)) - Quien solicita (asesor de venta)
- request_date (DATE) - Fecha de la solicitud
- status (VARCHAR(20)) - 'pending', 'confirmed', 'completed'
- observations (TEXT) - Observaciones generales
- receiver_alias (TEXT) - Alias del destinatario (asesor)
- created_at (TIMESTAMP) - Fecha de creación
- updated_at (TIMESTAMP) - Fecha de actualización
```

#### Tabla de Materiales: `key_document_materials`
```sql
- id (UUID, PRIMARY KEY)
- key_document_request_id (UUID, FOREIGN KEY) - Referencia a solicitud
- material_type (VARCHAR(50)) - 'second_key', 'technical_sheet', 'card_key', etc.
- material_label (VARCHAR(100)) - Etiqueta del material
- selected (BOOLEAN) - Si está completado
- observations (TEXT) - Observaciones del material
- created_at (TIMESTAMP) - Fecha de creación
```

### 5. FUNCIONALIDADES IMPLEMENTADAS

#### ✅ Sistema Automático de Generación:
- **Trigger SQL:** Genera solicitudes automáticamente al registrar ventas
- **Materiales por defecto:** 2ª llave + ficha técnica
- **Información del asesor:** Se obtiene desde la venta

#### ✅ Modal de Gestión:
- **Filtrado por tipo:** 2ª llaves y fichas técnicas
- **Estados:** Pendientes y completados
- **Búsqueda:** Por matrícula, solicitante o receptor
- **Selección múltiple:** Para procesar varios materiales
- **Observaciones:** Edición en tiempo real

#### ✅ Procesamiento de Movimientos:
- **Registro automático:** En key_movements y document_movements
- **Actualización de vehicle_keys:** Estado de llaves
- **Resolución de incidencias:** Automática
- **Emails de notificación:** Consolidados por usuario

#### ✅ Funciones de Debug:
- **Impresión:** Lista de solicitudes pendientes
- **Logs detallados:** Para troubleshooting
- **Estadísticas:** Conteo de materiales pendientes

### 6. CONFIGURACIÓN Y VARIABLES DE ENTORNO

#### Variables Requeridas:
```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

#### Configuración de Email (Opcional):
```env
SMTP_HOST=tu_smtp_host
SMTP_PORT=587
SMTP_USER=tu_email
SMTP_PASS=tu_password
```

### 7. FLUJOS DE TRABAJO

#### Flujo de Generación Automática:
1. **Registro de venta** en `sales_vehicles`
2. **Trigger SQL** detecta la inserción
3. **Crea solicitud** en `key_document_requests`
4. **Genera materiales** por defecto (2ª llave + ficha técnica)
5. **Asigna asesor** como solicitante y receptor

#### Flujo de Procesamiento:
1. **Abrir modal** desde página de llaves
2. **Seleccionar materiales** pendientes
3. **Registrar movimientos** automáticamente
4. **Actualizar estados** de materiales
5. **Enviar emails** de notificación
6. **Resolver incidencias** automáticamente

### 8. FUNCIONES DE DEBUG Y MANTENIMIENTO

#### Scripts SQL Disponibles:
- `scripts/limpiar_docuware_actual.sql` - Limpia datos antiguos
- `scripts/renombrar_tablas_docuware_simple.sql` - Renombra tablas
- `scripts/trigger_generar_solicitudes_automaticas.sql` - Crea trigger
- `scripts/migrar_ventas_existentes_simple.sql` - Migra ventas existentes
- `scripts/actualizar_estructura_tabla.sql` - Actualiza estructura

#### Endpoints de Debug:
- `/api/debug-sales-dashboard` - Debug de ventas
- `/api/debug-table-structure` - Estructura de tablas

### 9. COMANDOS ÚTILES

#### Verificar Trigger:
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generar_solicitud_key_document';
```

#### Verificar Solicitudes:
```sql
SELECT 
    kdr.license_plate,
    kdr.requester,
    kdr.status,
    COUNT(kdm.id) as materiales
FROM key_document_requests kdr
LEFT JOIN key_document_materials kdm ON kdr.id = kdm.key_document_request_id
GROUP BY kdr.id, kdr.license_plate, kdr.requester, kdr.status
ORDER BY kdr.created_at DESC;
```

#### Verificar Materiales Pendientes:
```sql
SELECT 
    material_type,
    COUNT(*) as pendientes
FROM key_document_materials
WHERE selected = false
GROUP BY material_type;
```

### 10. CHECKLIST DE RESTAURACIÓN

#### Si necesitas restaurar el sistema:
1. ✅ **Ejecutar limpieza:** `scripts/limpiar_docuware_actual.sql`
2. ✅ **Renombrar tablas:** `scripts/renombrar_tablas_docuware_simple.sql`
3. ✅ **Crear trigger:** `scripts/trigger_generar_solicitudes_automaticas.sql`
4. ✅ **Migrar ventas:** `scripts/migrar_ventas_existentes_simple.sql`
5. ✅ **Actualizar código:** Todos los archivos ya están actualizados
6. ✅ **Verificar funcionamiento:** Probar registro de venta nueva

#### Archivos Modificados:
- ✅ `app/api/docuware/requests/route.ts`
- ✅ `app/api/docuware/update-material/route.ts`
- ✅ `components/keys/docuware-requests-modal.tsx`
- ✅ `app/dashboard/llaves/page.tsx`

#### Archivos Eliminados:
- ❌ `app/api/process-emails/route.ts`
- ❌ `app/api/docuware/email-processor/route.ts`
- ❌ `.github/workflows/cron-process-emails.yml`

### 11. NOTAS IMPORTANTES

#### Cambios Principales:
- **Sistema automático:** Ya no depende de emails
- **Generación desde ventas:** Trigger SQL automático
- **Nombres actualizados:** `key_document_requests` y `key_document_materials`
- **Funcionalidad intacta:** Modal funciona igual que antes

#### Beneficios del Nuevo Sistema:
- ✅ **Más confiable:** No depende de emails externos
- ✅ **Más rápido:** Generación automática inmediata
- ✅ **Más preciso:** Datos directos desde ventas
- ✅ **Más mantenible:** Menos componentes externos

---

**Última actualización:** 21/07/2025
**Versión del sistema:** 2.0 - Sistema Automático 