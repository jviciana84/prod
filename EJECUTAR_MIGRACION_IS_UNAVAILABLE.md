# 🔧 Migración: Agregar campo is_unavailable a battery_control

## 📋 Descripción
Esta migración agrega el campo `is_unavailable` a la tabla `battery_control` para persistir el estado de vehículos marcados como "No disponibles".

## 🎯 ¿Qué hace?
- Agrega columna `is_unavailable` (BOOLEAN, DEFAULT FALSE)
- Crea índice para mejorar rendimiento de queries
- Agrega comentarios descriptivos

## 🚀 Cómo ejecutar

### Opción 1: Supabase Dashboard (Recomendado)
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Copia y pega el contenido de `migrations/add_is_unavailable_to_battery_control.sql`
5. Haz clic en **Run**

### Opción 2: CLI de Supabase
```bash
npx supabase db push
```

## ✅ Verificación
Después de ejecutar, verifica que la columna existe:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'battery_control' 
AND column_name = 'is_unavailable';
```

Deberías ver:
```
column_name     | data_type | column_default
----------------+-----------+---------------
is_unavailable  | boolean   | false
```

## 📝 Cambios en la aplicación
- El botón ⚠️ ahora guarda el estado en la BD
- Al recargar la página, se mantiene el estado "No disponible"
- El estado se sincroniza automáticamente

## 🔄 Reversión (si es necesario)
Si necesitas revertir esta migración:

```sql
DROP INDEX IF EXISTS idx_battery_control_is_unavailable;
ALTER TABLE battery_control DROP COLUMN IF EXISTS is_unavailable;
NOTIFY pgrst, 'reload schema';
```

---
**Fecha:** 22 de octubre de 2025  
**Versión:** 1.2.343

