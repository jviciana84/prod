# Auto Refresh - Gestión de Ventas

## Descripción

El sistema de auto refresh en la página de gestión de ventas permite mantener los datos actualizados automáticamente sin necesidad de recargar manualmente la página.

## Características

### ⚡ Auto Refresh Automático
- **Intervalo por defecto**: 10 minutos
- **Configuración flexible**: 5, 10, 15, 30 minutos o 1 hora
- **Persistencia**: Las preferencias se guardan en localStorage
- **Indicador visual**: Muestra el tiempo restante hasta la próxima actualización

### 🎛️ Controles de Usuario
- **Botón Play/Pause**: Activar/desactivar auto refresh
- **Configuración**: Cambiar intervalo de actualización
- **Indicador de estado**: Muestra si está activo y tiempo restante

### 🔔 Notificaciones
- **Notificación automática**: Avisa cuando se actualizan los datos
- **Frecuencia controlada**: Evita spam de notificaciones
- **Posición**: Bottom-right para no interferir con el trabajo

## Componentes

### `useAutoRefresh` Hook
```typescript
const { isActive } = useAutoRefresh({
  interval: 10 * 60 * 1000, // 10 minutos
  enabled: true,
  onRefresh: handleRefresh,
  onError: (error) => console.error(error)
})
```

### `AutoRefreshIndicator` Component
Muestra el estado del auto refresh con:
- Botón de play/pause
- Contador de tiempo restante
- Icono animado cuando está activo

### `AutoRefreshSettings` Component
Permite configurar:
- Intervalo de actualización
- Opciones predefinidas (5m, 10m, 15m, 30m, 1h)

### `useAutoRefreshPreferences` Hook
Maneja las preferencias guardadas:
- Estado activo/inactivo
- Intervalo seleccionado
- Persistencia en localStorage

## Rendimiento

### Optimizaciones Implementadas
- **Lazy loading**: Solo carga cuando es necesario
- **Error handling**: Manejo robusto de errores
- **Memory cleanup**: Limpia intervalos al desmontar
- **Debounced notifications**: Evita spam de notificaciones

### Recomendaciones de Uso
- **Intervalo mínimo**: 5 minutos para evitar sobrecarga
- **Intervalo recomendado**: 10-15 minutos para balance rendimiento/actualización
- **En producción**: Considerar 15-30 minutos para reducir carga del servidor

## Implementación en Otras Páginas

Para implementar auto refresh en otras páginas:

1. **Importar hooks**:
```typescript
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { useAutoRefreshPreferences } from "@/hooks/use-auto-refresh-preferences"
```

2. **Configurar el hook**:
```typescript
const { preferences, setEnabled, setInterval } = useAutoRefreshPreferences()
const { isActive } = useAutoRefresh({
  interval: preferences.interval,
  enabled: preferences.enabled,
  onRefresh: handleRefresh
})
```

3. **Agregar componentes UI**:
```typescript
<AutoRefreshIndicator
  isActive={isActive}
  interval={preferences.interval}
  onToggle={() => setEnabled(!preferences.enabled)}
  lastRefresh={lastRefresh}
/>
<AutoRefreshSettings
  currentInterval={preferences.interval}
  onIntervalChange={setInterval}
/>
```

## Consideraciones Técnicas

### Impacto en Rendimiento
- **Carga del servidor**: Mínima, solo actualiza datos necesarios
- **Uso de memoria**: Optimizado con cleanup automático
- **Ancho de banda**: Solo descarga datos nuevos/changed

### Compatibilidad
- **Navegadores**: Todos los navegadores modernos
- **Dispositivos**: Responsive en móvil y desktop
- **Accesibilidad**: Controles accesibles por teclado

### Seguridad
- **Validación**: Verifica datos antes de actualizar
- **Error handling**: Manejo seguro de errores de red
- **Fallback**: Funciona sin auto refresh si hay problemas 