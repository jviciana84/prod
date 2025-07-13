# Sistema de Bloqueo de Fotógrafos

## Descripción General

El sistema de bloqueo permite marcar fotógrafos específicos para que mantengan su porcentaje fijo y no se vean afectados por la función de "Distribuir Equitativamente".

## Funcionalidades

### 1. Botón de Bloqueo
- **Ubicación**: En la columna de acciones de cada fotógrafo
- **Icono**: 🔒 (bloqueado) / 🔓 (desbloqueado)
- **Tooltip**: "Bloquear porcentaje" / "Desbloquear porcentaje"
- **Estado**: Solo disponible para fotógrafos activos

### 2. Indicador Visual
- **Columna de porcentaje**: Muestra un icono de candado junto al porcentaje cuando está bloqueado
- **Slider**: Se deshabilita cuando el fotógrafo está bloqueado
- **Card principal**: Muestra información sobre fotógrafos bloqueados

### 3. Lógica de Reparto Equitativo

Cuando se ejecuta "Distribuir Equitativamente":

1. **Identifica fotógrafos bloqueados**: Suma sus porcentajes actuales
2. **Calcula porcentaje disponible**: 100% - porcentaje bloqueado
3. **Distribuye equitativamente**: El porcentaje disponible se reparte entre fotógrafos activos, no ocultos y no bloqueados
4. **Mantiene bloqueados**: Los fotógrafos bloqueados conservan su porcentaje original

### 4. Ejemplo de Funcionamiento

**Escenario:**
- Fotógrafo A: 8% (bloqueado)
- Fotógrafo B: 5% (bloqueado)  
- Fotógrafos C, D, E: 0% (no bloqueados)

**Al ejecutar "Distribuir Equitativamente":**
- Porcentaje bloqueado: 13% (8% + 5%)
- Porcentaje disponible: 87% (100% - 13%)
- Reparto: C = 29%, D = 29%, E = 29%
- Total: 100% (13% bloqueado + 87% distribuido)

## Campos de Base de Datos

### Tabla: `fotos_asignadas`
- `is_locked`: BOOLEAN DEFAULT FALSE
- Índice creado para optimizar consultas

## Validaciones

1. **Fotógrafos bloqueados**: No pueden ser modificados por el reparto equitativo
2. **Porcentaje total**: Se calcula solo con fotógrafos activos y no ocultos
3. **Distribución**: Solo afecta a fotógrafos activos, no ocultos y no bloqueados
4. **Errores**: Muestra alerta si no hay fotógrafos desbloqueados disponibles

## Interfaz de Usuario

### Indicadores Visuales
- **Icono de candado**: Junto al porcentaje de fotógrafos bloqueados
- **Slider deshabilitado**: Para fotógrafos bloqueados
- **Información contextual**: En el card principal sobre fotógrafos bloqueados
- **Colores**: Azul para elementos relacionados con bloqueo

### Estados
- **Bloqueado**: Icono azul, slider deshabilitado, porcentaje fijo
- **Desbloqueado**: Sin icono, slider habilitado, porcentaje modificable
- **Inactivo**: No se puede bloquear hasta que esté activo

## Casos de Uso

1. **Fotógrafos senior**: Bloquear porcentajes altos para fotógrafos experimentados
2. **Distribución temporal**: Bloquear algunos fotógrafos mientras se ajustan otros
3. **Gestión de cuotas**: Mantener porcentajes fijos para ciertos fotógrafos
4. **Reparto flexible**: Permitir que solo algunos fotógrafos participen en el reparto equitativo 