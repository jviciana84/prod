# Sistema de Notificaciones Automáticas de Vehículos Certificados

## 🎯 Objetivo
Enviar notificaciones automáticas de campana a los asesores cuando un vehículo se certifica (CyP + Foto360 completados) y está listo para entrega.

## 🔄 Flujo Automático

### 1. Certificación del Vehículo
- **Ubicación**: Gestión de Ventas (`/dashboard/sales`)
- **Acción**: Mecánico completa CyP y Foto360
- **Trigger**: Se activa automáticamente cuando ambos estados = "completado"

### 2. Inserción en Entregas
- **Tabla**: `entregas`
- **Trigger**: `handle_cyp_to_entregas()` (ya existente)
- **Condición**: `cyp_status = 'completado'` Y `photo_360_status = 'completado'`

### 3. Notificación Automática
- **Trigger**: `handle_vehicle_certified_notification()` (nuevo)
- **Evento**: `AFTER INSERT ON entregas`
- **Acción**: Envía notificación de campana al asesor

### 4. Recepción por el Asesor
- **Ubicación**: Campana del header (`/dashboard`)
- **Sin permisos**: Aparece automáticamente sin autorización del navegador

## 📁 Archivos Creados

### API Endpoints
- `app/api/notifications/vehicle-certified/route.ts` - Endpoint para enviar notificaciones manuales
- `app/api/test/simulate-vehicle-certification/route.ts` - Simular trigger automático

### Páginas de Prueba
- `app/test-vehicle-certification/page.tsx` - Página para probar el sistema

### Scripts SQL
- `scripts/trigger_vehicle_certified_notification.sql` - Crear trigger automático
- `scripts/test_vehicle_certification_trigger.sql` - Probar el sistema

## 🚀 Instalación

### 1. Ejecutar Script SQL
```sql
-- Ejecutar en Supabase SQL Editor
\i scripts/trigger_vehicle_certified_notification.sql
```

### 2. Verificar Instalación
```sql
-- Verificar que el trigger existe
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'entregas';
```

## 🧪 Pruebas

### 1. Página de Prueba
- **URL**: `/test-vehicle-certification`
- **Funcionalidad**: 
  - Enviar notificación directa
  - Simular trigger automático
  - Ver información del sistema

### 2. Prueba Manual
```bash
# Enviar notificación directa
curl -X POST /api/notifications/vehicle-certified \
  -H "Content-Type: application/json" \
  -d '{
    "license_plate": "1234ABC",
    "model": "BMW X3",
    "advisor": "JordiVi",
    "or_value": "12345"
  }'
```

### 3. Prueba Automática
```bash
# Simular inserción en entregas
curl -X POST /api/test/simulate-vehicle-certification \
  -H "Content-Type: application/json" \
  -d '{
    "license_plate": "TEST001",
    "model": "BMW X3",
    "advisor": "JordiVi",
    "or_value": "12345"
  }'
```

## 📊 Estructura de Datos

### Notificación Generada
```json
{
  "user_id": "uuid-del-asesor",
  "title": "🚗 Vehículo Certificado",
  "body": "El vehículo 1234ABC (BMW X3) ha sido certificado y está listo para entrega",
  "data": {
    "category": "vehicle_certified",
    "url": "/dashboard/entregas",
    "license_plate": "1234ABC",
    "model": "BMW X3",
    "advisor": "JordiVi",
    "or_value": "12345",
    "certified_at": "2024-01-15T10:30:00Z"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 🔧 Configuración

### Mapeo de Asesores
El sistema busca el asesor en la tabla `profiles` usando:
- `full_name` (nombre completo)
- `alias` (alias del asesor)

### Ejemplo de Mapeo
```sql
-- Asesor en profiles
INSERT INTO profiles (id, full_name, alias) VALUES 
('uuid-1', 'Jordi Viciana Sánchez', 'JordiVi');

-- Entrada en entregas
INSERT INTO entregas (asesor) VALUES ('JordiVi');

-- Resultado: Notificación enviada al usuario con id 'uuid-1'
```

## ⚠️ Consideraciones

### 1. Sin Permisos del Navegador
- ✅ Las notificaciones aparecen automáticamente en la campana
- ✅ No se solicitan permisos de notificación
- ✅ Funciona en todos los navegadores

### 2. Trigger Automático
- ✅ Se ejecuta automáticamente al insertar en `entregas`
- ✅ No requiere intervención manual
- ✅ Manejo de errores incluido

### 3. Búsqueda de Asesor
- ⚠️ Si el asesor no existe en `profiles`, no se envía notificación
- ⚠️ Se registra en logs para debugging

## 🐛 Troubleshooting

### Problema: No se envían notificaciones
1. Verificar que el trigger existe:
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'entregas';
```

2. Verificar que el asesor existe en profiles:
```sql
SELECT * FROM profiles 
WHERE full_name ILIKE 'JordiVi' OR alias ILIKE 'JordiVi';
```

3. Verificar logs del trigger:
```sql
-- Los logs aparecen en Supabase Logs
-- Buscar: "✅ Notificación enviada a asesor"
```

### Problema: Notificaciones duplicadas
- El trigger solo se ejecuta en `INSERT`, no en `UPDATE`
- Si se inserta la misma matrícula, se usa `ON CONFLICT DO NOTHING`

## 📈 Monitoreo

### Consultas Útiles
```sql
-- Ver notificaciones de certificación
SELECT * FROM notification_history 
WHERE title LIKE '%Vehículo Certificado%'
ORDER BY created_at DESC;

-- Ver entregas recientes
SELECT * FROM entregas 
ORDER BY created_at DESC 
LIMIT 10;

-- Estadísticas
SELECT 
    COUNT(*) as total_entregas,
    COUNT(CASE WHEN fecha_entrega IS NOT NULL THEN 1 END) as entregados
FROM entregas;
```

## ✅ Estado Actual

- ✅ **Push notifications**: Anuladas (sin permisos del navegador)
- ✅ **Campana**: Funcionando automáticamente
- ✅ **Trigger automático**: Implementado
- ✅ **Página de pruebas**: Disponible en `/test-vehicle-certification`
- ✅ **Documentación**: Completa

El sistema está listo para producción. Las notificaciones aparecerán automáticamente en la campana del asesor cuando un vehículo se certifique.
