# 🚗 Sistema de Tasaciones

## Resumen Ejecutivo

Sistema completo de tasaciones de vehículos con diseño moderno, optimizado para smartphone y listo para producción visual.

## ✨ Características Principales

- 📱 **Mobile-First**: Diseñado para smartphone
- 🎨 **Diseño Moderno**: Gradientes azul-púrpura-rosa corporativos
- 🔄 **8 Pasos Progresivos**: Experiencia fluida sin abrumar al usuario
- 🎯 **Siluetas Interactivas**: Marcaje visual de daños en el vehículo
- 📸 **Captura Guiada**: Fotografías con overlay para mejor encuadre
- 🔐 **Certificación**: Metadata completa (IP, geolocalización, dispositivo)
- 🔗 **Enlaces Únicos**: Cada asesor tiene su enlace personal
- 📊 **BackOffice**: Panel de gestión para asesores

## 🎯 URLs del Sistema

### Cliente (Portal de Tasación)
```
/tasacion/[advisorSlug]
```
Ejemplo: `/tasacion/juan-garcia-abc123`

### Asesor (BackOffice)
```
/backoffice/tasaciones
```

## 📋 Flujo del Usuario

### 1️⃣ Inicio
- reCAPTCHA
- Permisos (cámara + geolocalización)

### 2️⃣ Datos Básicos
- Matrícula
- Kilómetros
- Procedencia

### 3️⃣ Marca/Modelo
- Selección inteligente de marca
- Combustible y transmisión
- Segunda llave

### 4️⃣ Estado Exterior
- 4 vistas del vehículo
- Marcaje de daños por parte

### 5️⃣ Estado Interior
- 6 vistas del interior
- Elementos a reparar/sustituir

### 6️⃣ Estado Mecánico
- Evaluación de componentes
- Testigos encendidos
- Daño estructural

### 7️⃣ Datos Adicionales
- Color, ITV, etiqueta ambiental
- Movilidad y servicio público

### 8️⃣ Fotografías
- 8 fotos del vehículo
- 4 fotos de documentación
- Fotos adicionales libres

## 🎨 Paleta de Colores

```css
/* Gradiente principal */
from-blue-600 via-purple-600 to-pink-600

/* Estados de daño */
Pulir: #EAB308 (amarillo)
Rayado: #F97316 (naranja)
Golpe: #EF4444 (rojo)
Sustituir: #9333EA (púrpura)
```

## 🔧 Instalación (Para nuevos desarrolladores)

El sistema ya está integrado en el proyecto. Archivos creados:

```
✅ types/tasacion.ts
✅ app/tasacion/[advisorSlug]/page.tsx
✅ app/tasacion/components/*.tsx
✅ app/backoffice/tasaciones/page.tsx
✅ docs/SISTEMA_TASACIONES.md
```

## 🚀 Próxima Fase: Integración con Base de Datos

### Tablas a Crear

1. **advisor_tasacion_links**
   - ID, advisor_id, slug, short_url

2. **tasaciones**
   - ID, advisor_id, form_data (JSONB), metadata (JSONB), status

3. **Storage Buckets**
   - `tasaciones-vehiculo-fotos`
   - `tasaciones-documentacion`

### Endpoints API Necesarios

```typescript
// Crear/Obtener enlace del asesor
POST /api/tasaciones/advisor-link
GET /api/tasaciones/advisor-link/:advisorId

// Guardar tasación
POST /api/tasaciones/submit

// Listar tasaciones del asesor
GET /api/tasaciones/list/:advisorId

// Generar PDF
POST /api/tasaciones/generate-pdf/:tasacionId
```

## 📝 Variables de Entorno

```env
# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key
RECAPTCHA_SECRET_KEY=tu_secret_key

# Supabase (cuando se conecte)
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

## 🧪 Testing Local

1. **Probar formulario cliente:**
   ```
   http://localhost:3000/tasacion/demo-advisor
   ```

2. **Probar BackOffice:**
   ```
   http://localhost:3000/backoffice/tasaciones
   ```

## 📊 Tipos de Datos

Ver `types/tasacion.ts` para tipos completos TypeScript.

Principales interfaces:
- `TasacionFormData`: Datos completos del formulario
- `VehicleDamage`: Daños exteriores
- `InteriorDamage`: Daños interiores
- `TasacionMetadata`: Información de certificación

## 🎯 Roadmap

### ✅ Fase 1: UI/UX (Completada)
- [x] Diseño completo de componentes
- [x] Flujo de 8 pasos
- [x] Siluetas interactivas
- [x] Captura de fotos
- [x] BackOffice asesor

### ⏳ Fase 2: Base de Datos (Pendiente)
- [ ] Crear tablas en Supabase
- [ ] Configurar Storage
- [ ] Implementar API endpoints
- [ ] Sistema de enlaces cortos real

### ⏳ Fase 3: Generación PDF (Pendiente)
- [ ] Integrar librería PDF
- [ ] Diseñar plantilla
- [ ] Página de certificación
- [ ] Descarga automática

## 🛠️ Mantenimiento

### Actualizar Marcas de Vehículos
Editar: `app/tasacion/components/steps/MarcaModeloStep.tsx`
```typescript
const MARCAS_PRINCIPALES = [...]
const TODAS_LAS_MARCAS = [...]
```

### Modificar Partes del Vehículo
Editar componentes en: `app/tasacion/components/damage-assessment/`

### Cambiar Flujo de Pasos
Editar: `app/tasacion/[advisorSlug]/page.tsx`
```typescript
const totalSteps = 8
```

## 📞 Soporte

Para preguntas sobre el sistema de tasaciones:
- Ver documentación completa en `docs/SISTEMA_TASACIONES.md`
- Revisar tipos en `types/tasacion.ts`

---

**Estado**: ✅ Listo para pruebas visuales | ⏳ Pendiente conexión BD

**Última actualización**: Enero 2025


