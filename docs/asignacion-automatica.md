# Sistema de Asignación Automática de Fotógrafos

## Flujo de trabajo

1. **Registro inicial**: Un coche se registra en la tabla "nuevas_entradas"

2. **Marcado como recibido**: Cuando el coche se marca como recibido, se activa un trigger que copia automáticamente la matrícula y el modelo a la tabla "fotos"

3. **Asignación automática**: En ese momento, el trigger `assign_photographer_trigger` asigna automáticamente un fotógrafo a ese vehículo, respetando los porcentajes configurados

4. **Respeto de asignaciones existentes**: Las asignaciones ya realizadas no se modifican, solo se asignan los nuevos vehículos

5. **Cumplimiento de porcentajes**: El sistema va asignando nuevos vehículos a medida que entran, manteniendo los porcentajes configurados para cada fotógrafo

## Componentes del sistema

### 1. Trigger de base de datos

El trigger `assign_photographer_trigger` se ejecuta automáticamente cuando se inserta un nuevo registro en la tabla "fotos". Este trigger:

- Verifica si el vehículo ya tiene un fotógrafo asignado
- Si no tiene fotógrafo, calcula qué fotógrafo debe recibir el vehículo según los porcentajes configurados
- Asigna el vehículo al fotógrafo seleccionado

### 2. Función de asignación manual

La función `assignVehiclesToPhotographers` permite realizar asignaciones masivas manualmente. Esta función:

- Obtiene todos los vehículos pendientes de asignar
- Calcula cuántos vehículos debe recibir cada fotógrafo según su porcentaje
- Asigna los vehículos a los fotógrafos correspondientes

### 3. Estadísticas de asignación

El componente `AssignmentStats` muestra estadísticas sobre la distribución actual de vehículos entre fotógrafos:

- Porcentaje objetivo vs. porcentaje actual
- Número de vehículos asignados a cada fotógrafo
- Diferencia entre el porcentaje objetivo y el actual

## Mantenimiento

Para mantener el sistema funcionando correctamente:

1. Asegúrate de que los porcentajes de los fotógrafos activos sumen 100%
2. Verifica regularmente las estadísticas para asegurarte de que la distribución se mantiene cercana a los porcentajes objetivo
3. Si es necesario, puedes realizar asignaciones manuales para corregir desviaciones importantes
