# Sistema de Notificaciones de Ventas Nuevas

## Objetivo
Enviar notificaciones automáticas de campana a **Admin**, **Supervisor** y **Director** cuando se registre una nueva venta en el sistema.

## Flujo Automático
1. **Nueva Venta**: Se registra una venta en Gestión de Ventas
2. **Inserción**: Se inserta un nuevo registro en `sales_vehicles`
3. **Trigger**: El trigger automático detecta la inserción
4. **Notificación**: Se envía notificación de campana a Admin/Supervisor/Director
5. **Visualización**: Los administradores ven la notificación en el header

## Archivos Creados

### API Endpoints
- `app/api/notifications/new-sale/route.ts` - Endpoint para enviar notificaciones directas
- `app/api/test/simulate-new-sale/route.ts` - Endpoint para simular trigger automático

### Scripts SQL
- `scripts/trigger_new_sale_notification.sql` - Script para crear trigger automático
- `scripts/test_new_sale_notification_trigger.sql` - Script para probar el trigger

### Páginas de Prueba
- `app/test-new-sale/page.tsx` - Página para probar el sistema

## Instalación

### 1. Ejecutar Script SQL
```sql
-- Ejecutar en Supabase SQL Editor
\i scripts/trigger_new_sale_notification.sql
```

### 2. Verificar Instalación
```sql
-- Verificar que el trigger se creó correctamente
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles'
AND trigger_name = 'new_sale_notification_trigger';
```

## Pruebas

### 1. Prueba Manual
- Ir a `/test-new-sale`
- Completar formulario con datos de venta
- Hacer clic en "Enviar Notificación Directa"

### 2. Prueba Automática
- Ir a `/test-new-sale`
- Completar formulario con datos de venta
- Hacer clic en "Simular Trigger Automático"

### 3. Prueba SQL Directa
```sql
-- Ejecutar en Supabase SQL Editor
\i scripts/test_new_sale_notification_trigger.sql
```

## Estructura de Datos

### Tabla `sales_vehicles`
```sql
CREATE TABLE sales_vehicles (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    advisor VARCHAR NOT NULL,
    advisor_name VARCHAR,
    sale_date TIMESTAMP,
    customer_name VARCHAR,
    sale_amount VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Notificación Generada
```json
{
    "user_id": "uuid_del_admin",
    "title": "🚗 Nueva Venta",
    "body": "Nueva venta registrada: 1234ABC (BMW X3) por JordiVi",
    "data": {
        "category": "new_sale",
        "url": "/dashboard/sales",
        "license_plate": "1234ABC",
        "model": "BMW X3",
        "advisor": "JordiVi",
        "sale_date": "2024-01-15T10:30:00Z",
        "customer_name": "Juan Pérez",
        "sale_amount": "45000"
    },
    "created_at": "2024-01-15T10:30:00Z"
}
```

## Configuración

### Destinatarios
- **Admin**: Usuarios con `role = 'admin'`
- **Supervisor**: Usuarios con `role = 'supervisor'`
- **Director**: Usuarios con `role = 'director'`

### Campos Requeridos
- `license_plate`: Matrícula del vehículo
- `model`: Modelo del vehículo
- `advisor`: Nombre del asesor

### Campos Opcionales
- `customer_name`: Nombre del cliente
- `sale_amount`: Importe de la venta
- `sale_date`: Fecha de la venta

## Consideraciones

### Seguridad
- Solo usuarios con roles Admin/Supervisor/Director reciben notificaciones
- El trigger usa `SECURITY DEFINER` para permisos adecuados

### Rendimiento
- El trigger se ejecuta solo en inserciones (`INSERT`)
- No afecta actualizaciones ni eliminaciones
- Usa cursor para procesar múltiples destinatarios eficientemente

### Monitoreo
- Los logs del trigger aparecen en Supabase Logs
- Se pueden verificar notificaciones en `notification_history`

## Troubleshooting

### Problema: No se envían notificaciones
1. Verificar que existen usuarios con roles Admin/Supervisor/Director
2. Verificar que el trigger está activo en `sales_vehicles`
3. Revisar logs de Supabase para errores

### Problema: Notificaciones duplicadas
- El trigger solo se ejecuta en `INSERT`, no en `UPDATE`
- Verificar que no hay triggers duplicados

### Problema: Error en trigger
1. Verificar permisos de la función
2. Revisar estructura de tabla `sales_vehicles`
3. Verificar que `notification_history` existe

## Monitoreo

### Verificar Trigger Activo
```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles';
```

### Verificar Notificaciones Recientes
```sql
SELECT nh.title, nh.body, nh.created_at, p.full_name, p.role
FROM notification_history nh
JOIN profiles p ON nh.user_id = p.id
WHERE nh.data->>'category' = 'new_sale'
AND nh.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY nh.created_at DESC;
```

### Verificar Usuarios Destinatarios
```sql
SELECT id, full_name, alias, role
FROM profiles 
WHERE role ILIKE 'admin' 
   OR role ILIKE 'supervisor' 
   OR role ILIKE 'director'
ORDER BY role, full_name;
```
