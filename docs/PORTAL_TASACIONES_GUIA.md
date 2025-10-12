# 📱 Portal de Tasaciones - Guía Completa

## 🎯 Descripción General

El Portal de Tasaciones es una aplicación web optimizada para smartphones que permite a los clientes proporcionar información detallada sobre vehículos para su valoración. El sistema está diseñado para ser intuitivo, atractivo y recopilar toda la información necesaria de forma estructurada.

## 📋 Estructura del Formulario

### **8 Pasos Principales:**

#### **1. Inicio (InicioStep)**
- ✅ Verificación de seguridad (reemplaza reCAPTCHA)
- ✅ Explicación de permisos (cámara y geolocalización)
- ✅ Aceptación de condiciones

#### **2. Datos Básicos (DatosBasicosStep)**
- Matrícula del vehículo
- Kilómetros actuales
- Procedencia (Particular/Empresa)
  - Si es empresa: Disclaimer sobre IVA 21%
- Fecha de matriculación
  - Auto-detección (requiere implementación futura)
  - Confirmación o corrección manual

#### **3. Marca, Modelo y Versión (MarcaModeloStep)**
- Selección de marca (principales + dropdown + custom)
- Tipo de combustible (Gasolina, Diesel, Híbrido, Eléctrico, Hidrógeno)
- Transmisión (Automático/Manual)
- Modelo y versión
- Segunda llave (Sí/No)
- Elementos destacables (textarea)

#### **4. Estado Estético del Vehículo (EstadoEsteticoStep)**
- **Sistema de marcado de daños:**
  - Vistas: Frontal → Lateral Izq → Trasera → Lateral Der
  - Click en imagen → Aparece 'X' en posición exacta
  - Popup para seleccionar tipo de daño:
    - 🔧 Pulir
    - 📏 Rayado
    - 💥 Golpe
    - 🔄 Sustituir
  - Resumen de daños con opción de eliminar
  - Navegación secuencial entre vistas

#### **5. Estado Mecánico del Vehículo (EstadoMecanicoStep)**
- Estado de componentes (Bueno/Regular/Malo):
  - Motor
  - Dirección
  - Frenos
  - Caja de cambios
  - Transmisión
  - Embrague
- Daño estructural (No/Sí + detalles)
- Testigos encendidos (solo texto, sin iconos)
- **Auto-scroll** a siguiente campo

#### **6. Datos del Vehículo (DatosAdicionalesStep)**
- Procedencia (Nacional/Importación)
- Documentos que acreditan KM
- Comprado nuevo (Sí/No)
- Color (múltiples opciones sin scroll)
- Movilidad de transporte
- Servicio público
- Etiqueta medioambiental (diseño redondo tipo DGT)
  - ECO: Mitad verde (izq) + mitad azul (der)
- ITV en vigor (Sí/No + fecha si No)
- **Auto-scroll** a siguiente campo

#### **7. Observaciones (ObservacionesStep)**
- Textarea opcional para información adicional
- Ejemplos: modificaciones, accesorios, mantenimientos

#### **8. Fotografías (FotografiasStep)**

**Secciones de fotos (secuenciales):**

1. **Vehículo (Exterior)**
   - SVG rotado 90° con 6 botones de cámara:
     - Frontal
     - Lateral delantero izq/der
     - Lateral trasero izq/der
     - Trasera
   - Auto-scroll al final después de cada foto

2. **Cuentakilómetros**
   - Foto del cuentakm con motor encendido
   - Disclaimer compacto visible

3. **Interior Delantero**
   - Foto general del interior delantero

4. **Interior Trasero**
   - Foto general del interior trasero

5. **Documentos**
   - Permiso de circulación
   - Ficha técnica (frente)
   - Ficha técnica (dorso)
   - **Auto-scroll agresivo** al final después de cada foto

6. **Otras (Finalizar)**
   - Cámara libre para fotos adicionales
   - Botón "Finalizar" en lugar de "Continuar"

**Características de fotografías:**
- ✅ Input file nativo (sin overlay)
- ✅ Auto-scroll al final de página después de cada foto
- ✅ Navegación secuencial (no requiere fotos obligatorias)
- ✅ Miniaturas de fotos subidas

## 🎨 Diseño y UX

### **Tema Visual:**
- Gradientes modernos (púrpura → azul → cyan)
- Tema claro optimizado para smartphone
- Transiciones suaves con Framer Motion
- Cards con backdrop blur y sombras

### **Barra de Progreso:**
- Siempre visible en parte inferior
- Muestra paso actual de 8 totales
- Gradiente animado

### **Auto-scroll:**
- ✅ Activado en todos los pasos
- ✅ Scroll al final de página en sección de fotos
- ✅ Mejora experiencia sin scroll manual

### **Inputs:**
- Fondo blanco con texto oscuro (legibilidad)
- Bordes morados con focus
- Sin overflow de texto (ellipsis)

## 🔄 Flujo de Navegación

```
Inicio → Datos Básicos → Marca/Modelo → Estado Estético → 
Estado Mecánico → Datos Adicionales → Observaciones → 
Fotografías → Página de Confirmación
```

### **Navegación:**
- Botón "Atrás" en todos los pasos (excepto Inicio)
- Botón "Continuar" avanza al siguiente paso
- Botón "Finalizar" en último paso de fotos
- Redirección automática a página de confirmación

## 📄 Página de Confirmación

**Ruta:** `/tasacion/completada`

**Características:**
- ✅ Mensaje de éxito con animaciones
- ✅ Resumen de lo registrado
- ✅ Botón "Descargar PDF" (pendiente implementación)
- ✅ Botón "Volver al inicio"
- ✅ Datos guardados temporalmente en localStorage

## 🛠️ Tecnologías Utilizadas

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Animaciones:** Framer Motion
- **Validación:** React Hook Form + Zod (preparado)
- **Iconos:** Lucide React
- **Tipos:** TypeScript

## 📁 Estructura de Archivos

```
app/
├── tasacion/
│   ├── [advisorSlug]/
│   │   ├── page.tsx          # Página principal del formulario
│   │   └── layout.tsx        # Layout específico
│   ├── completada/
│   │   └── page.tsx          # Página de confirmación
│   └── components/
│       ├── ProgressBar.tsx   # Barra de progreso
│       └── steps/
│           ├── InicioStep.tsx
│           ├── DatosBasicosStep.tsx
│           ├── MarcaModeloStep.tsx
│           ├── EstadoEsteticoStep.tsx
│           ├── EstadoMecanicoStep.tsx
│           ├── DatosAdicionalesStep.tsx
│           ├── ObservacionesStep.tsx
│           └── FotografiasStep.tsx
├── backoffice/
│   └── tasaciones/
│       └── page.tsx          # Backoffice del asesor
types/
└── tasacion.ts               # Tipos TypeScript
public/
└── svg/
    ├── arriba.svg            # Vista superior del vehículo
    ├── frontal.svg           # Vista frontal
    ├── lateral.svg           # Vista lateral
    ├── trasera.svg           # Vista trasera
    ├── cuentakm.svg          # Icono cuentakm
    ├── interiordelantero.svg # Icono interior delantero
    └── interiortrasero.svg   # Icono interior trasero
```

## 🔮 Próximos Pasos (TODO)

### **Integración Base de Datos:**
1. Crear tablas en Supabase:
   - `tasaciones` (datos principales)
   - `tasacion_fotos` (fotografías)
   - `advisor_tasacion_links` (enlaces personalizados)

2. Implementar `server-actions`:
   - `createTasacion.ts`
   - `uploadFoto.ts`
   - `getTasacionesByAdvisor.ts`

### **BackOffice Asesor:**
1. Lista de tasaciones asignadas
2. Visualización detallada de cada tasación
3. Generación de enlace único acortado
4. Descarga de PDF

### **Generación de PDF:**
1. Implementar con `react-pdf` o `pdf-lib`
2. Incluir toda la información y fotos
3. Página de certificación con:
   - Geolocalización
   - IP
   - Dispositivo
   - Timestamp
   - Diseño estilo "billete moneda y timbre"

### **Mejoras UX:**
1. Validación de campos en tiempo real
2. Guardado automático (draft)
3. Recuperación de sesión
4. Notificaciones por email
5. Compresión de imágenes antes de subir

## 🚀 Cómo Probar

1. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   # o
   pnpm dev
   ```

2. **Acceder al portal:**
   ```
   http://localhost:3000/tasacion/test-advisor
   ```

3. **Completar formulario:**
   - Navegar por los 8 pasos
   - Añadir fotos en la sección correspondiente
   - Finalizar y ver página de confirmación

4. **Revisar datos en consola:**
   - Los datos se muestran en `console.log`
   - También guardados en `localStorage`

## 📝 Notas Importantes

- ✅ **PWA Installer deshabilitado** en rutas de tasaciones
- ✅ **Optimizado para smartphone** (responsive)
- ✅ **Sin logs excesivos** en producción
- ✅ **Auto-scroll implementado** en todas las secciones
- ✅ **Navegación secuencial** en fotografías
- ✅ **Diseño moderno** con gradientes y animaciones

## 🐛 Problemas Conocidos y Soluciones

### **Auto-scroll en documentación:**
✅ **Solucionado:** Scroll automático al final de página después de cada foto

### **Overflow de texto en botones:**
✅ **Solucionado:** Ellipsis + title attribute

### **Checkbox no visible:**
✅ **Solucionado:** Implementación custom con visual feedback

### **PWA prompt en tasaciones:**
✅ **Solucionado:** Detección de ruta y ocultación condicional

---

**Versión:** 1.0.0  
**Última actualización:** Octubre 2025  
**Estado:** ✅ UI/UX Completa - Pendiente integración BD

