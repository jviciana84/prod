# Gestión de Columnas - Documentación

## Descripción General

La funcionalidad de Gestión de Columnas permite administrar las columnas de las tablas `nuevas_entradas` y `stock`, incluyendo la capacidad de crear nuevas columnas basadas en archivos Excel y mapear datos existentes.

## Características Principales

### 1. Visualización de Columnas Existentes
- Muestra la estructura completa de las tablas `nuevas_entradas` y `stock`
- Información detallada de cada columna:
  - Nombre de la columna
  - Tipo de dato
  - Si es requerida (NOT NULL)
  - Valor por defecto
  - Restricciones (clave primaria, clave foránea)
  - Descripción de la columna

### 2. Subida de Archivos Excel
- Soporte para archivos `.xlsx`, `.xls` y `.csv`
- Límite de tamaño: 10MB
- Extracción automática de columnas y datos
- Preview de los datos extraídos (máximo 100 filas)

### 3. Mapeo de Columnas
- Mapeo a columnas existentes
- Creación de nuevas columnas con configuración personalizada
- Tipos de datos soportados:
  - Texto (VARCHAR)
  - Número entero (INTEGER)
  - Número decimal (NUMERIC)
  - Booleano (BOOLEAN)
  - Fecha (DATE)

## Acceso y Permisos

### Roles Requeridos
- `admin`
- `Administración`
- `Director`
- `Supervisor`

### Ubicación
- Ruta: `/dashboard/columnas`
- Menú: Administración > Gestión de Columnas

## Funcionalidades Técnicas

### Función SQL Actualizada
La función `get_table_structure` ha sido actualizada para incluir información sobre claves primarias y foráneas:

```sql
CREATE OR REPLACE FUNCTION get_table_structure(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text,
  is_primary_key boolean,
  is_foreign_key boolean
)
```

### Server Actions
- `createNewColumns`: Crea nuevas columnas en las tablas
- `getTableStructure`: Obtiene la estructura de una tabla
- `updateExistingData`: Actualiza datos existentes (preparado para futuras implementaciones)

## Componentes Creados

### 1. Página Principal
- `app/dashboard/columnas/page.tsx`
- Verificación de permisos
- Obtención de estructura de tablas
- Renderizado del componente principal

### 2. Componente Principal
- `components/columnas/columnas-manager.tsx`
- Gestión de estado global
- Navegación entre pestañas
- Integración con server actions

### 3. Componentes Específicos
- `components/columnas/columnas-existentes.tsx`: Visualización de columnas existentes
- `components/columnas/excel-uploader.tsx`: Subida y procesamiento de archivos Excel
- `components/columnas/mapeo-columnas.tsx`: Configuración de mapeos

### 4. Server Actions
- `server-actions/columnas-actions.ts`: Lógica del servidor para crear columnas

## Flujo de Trabajo

### 1. Visualización de Columnas Existentes
1. Acceder a la página `/dashboard/columnas`
2. Ver la pestaña "Columnas Existentes"
3. Revisar la estructura de ambas tablas

### 2. Subida de Archivo Excel
1. Ir a la pestaña "Subir Excel"
2. Arrastrar y soltar o seleccionar archivo
3. Verificar que el archivo se procese correctamente
4. Revisar las columnas detectadas

### 3. Configuración de Mapeos
1. Ir a la pestaña "Mapeo"
2. Para cada columna del Excel:
   - Mapear a columna existente, o
   - Crear nueva columna con configuración personalizada
3. Configurar tipo de dato, restricciones y valores por defecto

### 4. Creación de Columnas
1. Revisar el resumen de mapeos
2. Hacer clic en "Crear Columnas"
3. Verificar que las columnas se creen correctamente
4. La página se recargará automáticamente

## Consideraciones Importantes

### Seguridad
- Solo usuarios con roles administrativos pueden acceder
- Validación de tipos de archivo
- Límites de tamaño de archivo
- Sanitización de nombres de columnas

### Rendimiento
- Procesamiento de máximo 100 filas para preview
- Creación de columnas una por una para mejor control de errores
- Recarga de página después de crear columnas

### Compatibilidad
- Soporte para archivos CSV con separador `;`
- Mapeo automático de tipos de datos
- Validación de nombres de columnas existentes

## Scripts SQL

### Actualización de Función
Ejecutar el script `scripts/update_table_structure_function.sql` en Supabase SQL Editor para actualizar la función `get_table_structure`.

### Verificación
```sql
-- Verificar que la función funciona
SELECT * FROM get_table_structure('nuevas_entradas') LIMIT 5;
SELECT * FROM get_table_structure('stock') LIMIT 5;
```

## Próximas Mejoras

1. **Importación de Datos**: Implementar la funcionalidad para importar datos del Excel a las nuevas columnas
2. **Validación Avanzada**: Agregar validaciones más sofisticadas para tipos de datos
3. **Historial de Cambios**: Registrar qué columnas se han creado y cuándo
4. **Rollback**: Capacidad de eliminar columnas creadas
5. **Mapeo Inteligente**: Sugerencias automáticas de mapeo basadas en nombres de columnas

## Solución de Problemas

### Error: "La función get_table_structure no existe"
- Ejecutar el script `scripts/update_table_structure_function.sql`

### Error: "No tienes permisos para acceder"
- Verificar que el usuario tenga uno de los roles requeridos
- Contactar al administrador del sistema

### Error: "El archivo es demasiado grande"
- Reducir el tamaño del archivo Excel
- Convertir a CSV si es posible
- Dividir el archivo en partes más pequeñas

### Error: "La columna ya existe"
- Verificar el nombre de la columna en la tabla correspondiente
- Usar un nombre diferente para la nueva columna
- Mapear a la columna existente en lugar de crear una nueva 