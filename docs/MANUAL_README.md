# Manual del Sistema - Documentación

## 📖 Descripción

El manual del sistema es una guía completa que documenta todas las funcionalidades del Sistema de Gestión de Entregas. Está disponible tanto en formato web como en PDF descargable.

## 🚀 Características

- **Página Web Interactiva**: `/about` - Manual completo con navegación por secciones
- **Descarga PDF**: Botón para descargar el manual completo en formato PDF
- **Contenido Dinámico**: Sistema de actualización fácil y rápido
- **Diseño Visual**: Interfaz atractiva con animaciones y estilos retro

## 📁 Estructura de Archivos

```
app/about/page.tsx          # Página principal del manual
lib/pdf-generator.ts        # Generador de PDF del manual
lib/manual-content.ts       # Contenido centralizado del manual
scripts/update-manual.ts    # Script para actualizar el manual
```

## 🔧 Actualización del Manual

### Comandos Disponibles

```bash
# Listar todas las secciones disponibles
npm run update-manual --list

# Ver información de una sección específica
npm run update-manual --section dashboard
npm run update-manual --section entregas
npm run update-manual --section recogidas

# Ver información del proyecto
npm run update-manual --project

# Ver stack tecnológico
npm run update-manual --tech
```

### Secciones Disponibles

- `dashboard` - Dashboard Principal
- `entregas` - Sistema de Entregas
- `recogidas` - Sistema de Recogidas
- `vehiculos` - Gestión de Vehículos
- `usuarios` - Gestión de Usuarios
- `reportes` - Sistema de Reportes
- `configuracion` - Configuración del Sistema

### Cómo Actualizar Contenido

1. **Editar el archivo de contenido**:
   ```typescript
   // lib/manual-content.ts
   export const MANUAL_SECTIONS: ManualSection[] = [
     {
       id: 'dashboard',
       title: 'Dashboard',
       description: '...',
       content: {
         overview: '...',
         features: ['...'],
         subsections: [...]
       }
     }
   ]
   ```

2. **Actualizar información del proyecto**:
   ```typescript
   export const PROJECT_INFO: ProjectInfo = {
     name: 'Sistema de Gestión de Entregas',
     version: '1.0.0',
     developer: 'Jordi Viciana',
     // ...
   }
   ```

3. **Actualizar stack tecnológico**:
   ```typescript
   export const TECH_STACK: TechStackItem[] = [
     { name: 'Next.js 15', description: '...', category: 'frontend' },
     // ...
   ]
   ```

## 🎨 Personalización Visual

### Colores y Temas

El manual utiliza el tema retro que prefieres:
- **Fondo**: Gradiente de slate-900 a purple-900
- **Cards**: slate-800 con bordes slate-700
- **Texto**: Blanco para títulos, gris para contenido
- **Acentos**: Púrpura para elementos destacados

### Animaciones

- **Framer Motion**: Animaciones suaves en la carga
- **Hover Effects**: Efectos en cards y botones
- **Transiciones**: Cambios suaves entre secciones

## 📄 Generación de PDF

### Características del PDF

- **Portada profesional** con información del proyecto
- **Índice completo** con todas las secciones
- **Formato A4** optimizado para impresión
- **Tipografía clara** con jerarquía visual
- **Listas organizadas** con bullets
- **Información de contacto** al final

### Funcionalidad

```typescript
// Generar y descargar PDF
import { generateManualPDF } from '@/lib/pdf-generator'

const handleDownloadPDF = () => {
  generateManualPDF()
}
```

## 🔄 Sistema de Actualización

### Funciones de Actualización

```typescript
import { 
  updateManualSection, 
  updateProjectInfo, 
  updateTechStack 
} from '@/lib/manual-content'

// Actualizar una sección específica
updateManualSection('dashboard', {
  title: 'Nuevo Título',
  content: { ... }
})

// Actualizar información del proyecto
updateProjectInfo({
  version: '1.1.0',
  developer: 'Nuevo Desarrollador'
})

// Actualizar stack tecnológico
updateTechStack([
  { name: 'Nueva Tech', description: '...', category: 'frontend' }
])
```

## 📋 Ejemplos de Uso

### Actualizar Sección de Entregas

```bash
# Ver contenido actual
npm run update-manual --section entregas

# Editar lib/manual-content.ts
# Agregar nuevas funcionalidades, estados, etc.

# Verificar cambios
npm run update-manual --section entregas
```

### Actualizar Información del Proyecto

```bash
# Ver información actual
npm run update-manual --project

# Editar PROJECT_INFO en lib/manual-content.ts
# Cambiar versión, desarrollador, características, etc.

# Verificar cambios
npm run update-manual --project
```

### Actualizar Stack Tecnológico

```bash
# Ver stack actual
npm run update-manual --tech

# Editar TECH_STACK en lib/manual-content.ts
# Agregar nuevas tecnologías, cambiar versiones, etc.

# Verificar cambios
npm run update-manual --tech
```

## 🎯 Mejores Prácticas

1. **Mantener consistencia**: Usar los mismos términos en toda la documentación
2. **Actualizar regularmente**: Mantener el manual sincronizado con el código
3. **Usar nombres frontend**: Evitar términos técnicos de backend
4. **Ser específico**: Incluir ejemplos y casos de uso concretos
5. **Mantener estructura**: Seguir el formato establecido para nuevas secciones

## 🐛 Solución de Problemas

### PDF no se genera
- Verificar que jsPDF esté instalado: `npm install jspdf jspdf-autotable`
- Revisar la consola del navegador para errores
- Verificar que el contenido esté bien formateado

### Contenido no se actualiza
- Verificar que los cambios estén en `lib/manual-content.ts`
- Ejecutar `npm run build` para regenerar
- Limpiar caché: `npm run clear-cache`

### Errores de TypeScript
- Verificar que las interfaces estén bien definidas
- Comprobar que los tipos coincidan con el contenido
- Ejecutar `npm run lint` para verificar

## 📞 Soporte

Para consultas sobre el manual o reportar problemas:

- **Desarrollador**: Jordi Viciana
- **Archivo**: `lib/manual-content.ts`
- **Script**: `scripts/update-manual.ts`
- **Página**: `/about`

---

*Última actualización: ${new Date().toLocaleDateString('es-ES')}* 