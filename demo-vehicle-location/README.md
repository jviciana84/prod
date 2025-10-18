# 🚗 Demo Sistema Ubicación Vehículos

## Descripción
Demo funcional del sistema de geolocalización de vehículos en instalaciones usando mapas interactivos y códigos QR.

## Características Implementadas

### ✅ Funcionalidades Principales:
- **Mapa interactivo** con Leaflet.js usando plano real
- **Simulador de QR** para escaneo de zonas
- **Selector manual** de secciones (backup sin QR)
- **Registro de vehículos** con matrícula y plaza
- **Marcadores visuales** en el mapa
- **Lista de vehículos** registrados
- **Interfaz responsive** para móvil/tablet

### 🎯 Flujo de Trabajo:
1. **Escaneo QR** → Selecciona zona automáticamente
2. **Selección manual** → Si no hay QR disponible
3. **Elegir plaza** → Dropdown con plazas de la zona
4. **Registrar matrícula** → Input con validación
5. **Marcar en mapa** → Aparece marcador 🚗
6. **Gestión** → Ver lista, eliminar vehículos

## Instalación y Uso

### Requisitos:
- Navegador web moderno
- Imagen del plano (plano-instalaciones.jpg)

### Pasos:
1. **Colocar imagen del plano** en la carpeta `demo-vehicle-location/`
2. **Abrir `index.html`** en navegador
3. **Probar funcionalidades:**
   - Click en "Escanear QR" (simula escaneo)
   - Seleccionar zona manualmente
   - Registrar vehículos
   - Ver marcadores en el mapa

## Configuración de Secciones

### Secciones Predefinidas:
```javascript
TALLER-MECANICA: T1, T2, T3, T4, T5
TALLER-PINTURA: P1, P2, P3, P4
SECTOR-1: S1-1, S1-2, S1-3, S1-4, S1-5
SECTOR-2: S2-1, S2-2, S2-3, S2-4, S2-5
RECEPCION: R1, R2, R3
ENTREGA: E1, E2, E3
```

### Personalización:
- Editar objeto `sections` en el código
- Ajustar coordenadas según tu plano
- Modificar colores y nombres

## Próximos Pasos

### Para Producción:
1. **Integrar con base de datos** (Supabase)
2. **Implementar QRs reales** con librería de escaneo
3. **Añadir autenticación** de usuarios
4. **Sistema de notificaciones** 
5. **Reportes y estadísticas**

### Mejoras Técnicas:
- **PWA** para uso offline
- **Sincronización** en tiempo real
- **API REST** para integración
- **Backup automático** de datos

## Tecnologías Utilizadas
- **Leaflet.js** - Mapas interactivos
- **HTML5/CSS3** - Interfaz responsive
- **JavaScript ES6** - Lógica de aplicación
- **Sin dependencias** - Funciona offline

## Costo Estimado
- **Desarrollo:** $0 (código abierto)
- **Hosting:** $5-10/mes
- **QRs:** $0.50-2€ por código
- **Total mensual:** <$15

---
*Demo creado para Motor Munich Terrasa - Sistema de Gestión de Vehículos*
