# Sistema de Refresh Automático

Este documento describe el nuevo sistema de refresh automático implementado para resolver el problema de tener que presionar F5 o modificar manualmente las tablas.

## 🎯 Problema Solucionado

**Problema original:** Las tablas no se cargaban automáticamente y los usuarios tenían que presionar F5 o modificar algo cada vez para que se actualizaran los datos.

**Solución:** Implementación de un sistema de refresh automático que:
- Actualiza los datos automáticamente cada 30 segundos
- Permite activar/desactivar el refresh manualmente
- Muestra indicadores visuales del estado del refresh
- Sincroniza actualizaciones entre diferentes componentes

## 🔧 Componentes Implementados

### 1. Hook `useAutoRefresh`
- **Ubicación:** `/hooks/use-auto-refresh.ts`
- **Funcionalidad:**
  - Refresh automático configurable por intervalos
  - Manejo de errores y reintentos automáticos
  - Estado visual de refresco
  - Toggle para activar/desactivar

### 2. Sistema de Eventos `useDataEvents`
- **Ubicación:** `/hooks/use-data-events.ts`
- **Funcionalidad:**
  - Comunicación entre componentes
  - Sincronización de actualizaciones
  - Historial de eventos
  - Emisión de eventos específicos

### 3. Integración en Tablas

#### Tabla de Validados (`validados-table.tsx`)
- ✅ Refresh automático cada 30 segundos
- ✅ Botón de toggle para activar/desactivar
- ✅ Indicador visual en esquina inferior derecha
- ✅ Sincronización con eventos globales

#### Tabla de Stock (`stock-table.tsx`)
- ✅ Refresh automático cada 30 segundos
- ✅ Botón de toggle para activar/desactivar
- ✅ Indicador visual en esquina inferior derecha
- ✅ Sincronización con eventos globales

## 🎨 Características de la Interfaz

### Botón de Toggle
- **Icono:** Refresh circular con indicador de estado
- **Colores:**
  - Verde: Refresh automático activado
  - Gris: Refresh automático desactivado
  - Animación: Spinner durante el refresh
- **Posición:** En la barra de controles principales

### Indicador de Estado
- **Ubicación:** Esquina inferior derecha (fixed position)
- **Contenido:**
  - Estado actual (activo/inactivo)
  - Última hora de actualización
  - Botón de refresh manual
- **Visual:** Panel flotante con información del estado

## ⚙️ Configuración

### Intervalos de Refresh
- **Por defecto:** 30 segundos
- **Configurable:** Se puede cambiar en cada hook
- **Mínimo recomendado:** 5 segundos
- **Máximo recomendado:** 5 minutos

### Reintentos Automáticos
- **Máximo de reintentos:** 3
- **Delay entre reintentos:** 1 segundo
- **Configurable** por componente

## 🔄 Flujo de Actualización

1. **Inicio:** Las tablas se cargan automáticamente al montar
2. **Refresh automático:** Cada 30 segundos se ejecuta `loadPedidos()` o `fetchStock()`
3. **Evento de actualización:** Se emite `data-updated` con información del refresh
4. **Sincronización:** Otros componentes reciben el evento y pueden actualizarse
5. **Indicadores visuales:** Se actualizan para mostrar el estado actual

## 📱 Uso Manual

### Activar/Desactivar Refresh
1. Hacer clic en el botón de toggle (ícono de refresh)
2. El color cambiará de verde a gris
3. Aparecerá un indicador en la esquina inferior derecha

### Refresh Manual
1. Hacer clic en el botón "Actualizar" en el indicador
2. O usar el botón de refresh existente en las tablas
3. Los datos se actualizarán inmediatamente

## 🐛 Solución de Problemas

### Los datos no se actualizan automáticamente
1. Verificar que el botón de toggle esté en verde (activado)
2. Comprobar la conexión a internet
3. Verificar los permisos de la base de datos

### Error en el refresh
1. El sistema reintentará automáticamente hasta 3 veces
2. Si persiste, desactive y reactive el refresh automático
3. Verifique la consola del navegador para errores

### Indicador no aparece
1. Asegurarse de que los datos se hayan cargado al menos una vez
2. Verificar que el componente esté montado correctamente
3. Comprobar que no hay errores CSS que oculten el indicador

## 🚀 Beneficios

1. **Mejor UX:** Los usuarios ya no necesitan presionar F5
2. **Datos actualizados:** Información siempre fresca
3. **Control del usuario:** Pueden activar/desactivar cuando quieran
4. **Sincronización:** Múltiples componentes se actualizan juntos
5. **Indicadores claros:** Siempre saben cuándo se actualizan los datos
6. **Manejo de errores:** Reintentos automáticos y notificaciones

## 🔮 Futuras Mejoras

- [ ] Configuración global de intervalos de refresh
- [ ] Notificaciones push para cambios importantes
- [ ] Historial de cambios en los datos
- [ ] Dashboard de estado del sistema de refresh
- [ ] Configuración por usuario de las preferencias de refresh

---

**🎉 Problema solucionado:** Ya no será necesario presionar F5 o modificar manualmente las tablas. El sistema se actualizará automáticamente cada 30 segundos con indicadores visuales claros.