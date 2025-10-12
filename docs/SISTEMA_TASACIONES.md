# Sistema de Tasaciones

## 📋 Descripción General

Sistema completo de tasaciones de vehículos con dos interfaces principales:
- **Portal Cliente**: Formulario paso a paso para que el cliente detalle su vehículo
- **BackOffice Asesor**: Panel para gestionar tasaciones recibidas

## 🎨 Características del Diseño

### Estilo Visual
- ✨ Gradientes corporativos (azul → púrpura → rosa)
- 📱 Optimizado 100% para smartphone
- 🎭 Animaciones suaves con Framer Motion
- 🔄 Transiciones entre pasos fluidas
- 📊 Barra de progreso siempre visible

### Experiencia de Usuario
- ✅ Validación en tiempo real
- 🎯 Paso a paso progresivo (no abrumador)
- 🖼️ Siluetas interactivas para marcaje de daños
- 📸 Captura de fotos con overlay guiado
- 🔐 Captcha y permisos al inicio

## 📂 Estructura de Archivos

```
app/
├── tasacion/
│   ├── [advisorSlug]/
│   │   └── page.tsx                    # Página principal del formulario
│   └── components/
│       ├── ProgressBar.tsx             # Barra de progreso inferior
│       ├── steps/
│       │   ├── InicioStep.tsx          # Paso 1: reCAPTCHA + Permisos
│       │   ├── DatosBasicosStep.tsx    # Paso 2: Matrícula, KM, Procedencia
│       │   ├── MarcaModeloStep.tsx     # Paso 3: Marca/Modelo/Versión
│       │   ├── EstadoEsteticoStep.tsx  # Paso 4: Daños exterior
│       │   ├── EstadoInteriorStep.tsx  # Paso 5: Daños interior
│       │   ├── EstadoMecanicoStep.tsx  # Paso 6: Estado mecánico + testigos
│       │   ├── DatosAdicionalesStep.tsx # Paso 7: Datos adicionales
│       │   └── FotografiasStep.tsx     # Paso 8: Captura de fotos
│       └── damage-assessment/
│           ├── CarSilhouetteFront.tsx
│           ├── CarSilhouetteLeft.tsx
│           ├── CarSilhouetteRear.tsx
│           ├── CarSilhouetteRight.tsx
│           ├── InteriorSilhouetteFront.tsx
│           └── InteriorSilhouetteRear.tsx
│
├── backoffice/
│   └── tasaciones/
│       └── page.tsx                    # Panel del asesor
│
└── types/
    └── tasacion.ts                     # Tipos TypeScript completos
```

## 🔄 Flujo del Formulario

### Paso 1: Inicio
- ✅ reCAPTCHA verificación
- 📍 Solicitud de permisos (cámara y geolocalización)
- ℹ️ Explicación de por qué se solicitan

### Paso 2: Datos Básicos
- 🚗 Matrícula del vehículo
- 📏 Kilómetros actuales
- 👤 Procedencia (Particular/Empresa)
  - ⚠️ Disclaimer si es empresa (IVA 21%)
- 📅 Fecha de matriculación (auto-detectada, confirmable)

### Paso 3: Marca/Modelo/Versión
- 🏭 Selector de marca (principales + todas + personalizada)
- 🚙 Modelo y versión (campos de texto)
- ⛽ Tipo de combustible
- ⚙️ Transmisión (Automático/Manual)
- 🔑 Segunda llave (Sí/No)
- 📝 Elementos destacables (opcional)

### Paso 4: Estado Estético Exterior
- 🎯 4 vistas interactivas del vehículo:
  - Frontal
  - Lateral izquierdo
  - Trasera
  - Lateral derecho
- 🎨 4 tipos de daño:
  - ✨ Pulir (amarillo)
  - 〰️ Rayado (naranja)
  - 💥 Golpe (rojo)
  - 🔧 Sustituir (púrpura)

### Paso 5: Estado Estético Interior
- 🪑 6 vistas del interior:
  - Delantero derecha/izquierda
  - Salpicadero
  - Trasero izquierda/derecha
  - Maletero
- 🔧 2 tipos de daño:
  - Reparar (naranja)
  - Sustituir (rojo)

### Paso 6: Estado Mecánico
- ⚙️ Evaluación de componentes:
  - Motor, Dirección, Frenos
  - Caja de cambios, Transmisión
  - Embrague, Estado general
- ⚠️ Daño estructural (Sí/No + detalle)
- 🚨 Testigos encendidos (múltiple selección)

### Paso 7: Datos Adicionales
- 🌍 Procedencia (Nacional/Importación)
- 📄 Documentos que acreditan KM
- 🆕 Comprado nuevo (Sí/No)
- 🎨 Color del vehículo (selector visual)
- 🚗 Movilidad (Total/Solo rueda/No rueda)
- 🚕 Servicio público
- 🏷️ Etiqueta medioambiental
- 📋 ITV en vigor + próxima fecha
- 💬 Observaciones

### Paso 8: Fotografías
- 📸 **Vehículo** (8 fotos guiadas):
  - Frontal, 4 laterales, trasera
  - Interior delantero y trasero
- 📄 **Documentación** (4 fotos):
  - Permiso circulación (frente/dorso)
  - Ficha técnica (frente/dorso)
- 🖼️ **Otras**: fotos adicionales libres

## 🔐 Metadata de Certificación

El sistema captura automáticamente:
- 🌐 Dirección IP del cliente
- 📍 Geolocalización (con permiso)
- 💻 Información del dispositivo:
  - User Agent
  - Platform
  - Idioma
- ⏰ Timestamp exacto

## 🔗 Sistema de Enlaces

### Asesor
- Cada asesor tiene un **slug único**: `juan-garcia-abc123`
- URL completa: `tudominio.com/tasacion/juan-garcia-abc123`
- URL corta (estilo bitly): `bit.ly/tas-juan`
- 📋 Visible en el BackOffice para copiar y compartir

### Cliente
- Accede mediante el enlace del asesor
- La tasación queda automáticamente asignada al asesor

## 💾 Datos Almacenados (Preparado para Supabase)

```typescript
interface TasacionFormData {
  // Paso 1
  recaptchaToken: string
  permisosAceptados: boolean
  
  // Paso 2
  matricula: string
  kmActuales: number
  procedencia: 'particular' | 'empresa'
  fechaMatriculacion: string
  
  // Paso 3
  marca: string
  modelo: string
  version: string
  combustible: Combustible
  transmision: Transmision
  segundaLlave: boolean
  elementosDestacables?: string
  
  // Paso 4
  danosExteriores: VehicleDamage[]
  
  // Paso 5
  danosInteriores: InteriorDamage[]
  
  // Paso 6
  estadoMotor: EstadoMecanico
  estadoDireccion: EstadoMecanico
  // ... más estados mecánicos
  danoEstructural: boolean
  testigosEncendidos: TestigoEncendido[]
  
  // Paso 7
  origenVehiculo: OrigenVehiculo
  documentosKm: DocumentosKm
  color: ColorVehiculo
  // ... más datos adicionales
  
  // Paso 8
  fotosVehiculo: { ... }
  fotosDocumentacion: { ... }
  fotosOtras: string[]
  
  // Metadata
  metadata: TasacionMetadata
}
```

## 📊 BackOffice Asesor

### Funcionalidades
- 📋 Visualización del enlace personal (completo y corto)
- 📤 Botón de copiar al portapapeles
- 📑 Lista de tasaciones recibidas
- 🔍 Buscador por matrícula/marca/modelo
- 🏷️ Estados: Pendiente, Revisada, Valorada
- 👁️ Ver detalles de cada tasación
- 💾 Descargar PDF (próximamente)

## 🎯 Próximos Pasos (Fase 2 - Base de Datos)

### Tablas Supabase a crear:

```sql
-- Asesores y sus enlaces
CREATE TABLE advisor_tasacion_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID REFERENCES auth.users(id),
  advisor_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasaciones
CREATE TABLE tasaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID REFERENCES advisor_tasacion_links(advisor_id),
  form_data JSONB NOT NULL,
  metadata JSONB NOT NULL,
  status TEXT DEFAULT 'pendiente',
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fotos del vehículo (Supabase Storage)
-- Bucket: tasaciones-vehiculo-fotos
-- Bucket: tasaciones-documentacion
```

### Storage
- 📁 Bucket `tasaciones-vehiculo-fotos`
- 📁 Bucket `tasaciones-documentacion`
- 🔒 Políticas de acceso por asesor

## 🚀 Generación de PDF (Pendiente)

### Librería sugerida
- `react-pdf` o `pdf-lib`

### Contenido del PDF
1. **Portada** con branding Edelweiss
2. **Datos del vehículo** (todas las secciones)
3. **Fotografías** organizadas por categoría
4. **Página de certificación** con:
   - Metadata del cliente
   - Geolocalización
   - Timestamp
   - Firma digital
   - Diseño estilo billete/timbre

## 🎨 Diseño Responsive

- 📱 **Mobile First**: Optimizado para smartphone
- 💻 Funciona también en tablet/desktop
- 🔄 Orientación portrait recomendada
- 📏 Max-width: 448px (md breakpoint)

## 🔧 Dependencias Utilizadas

```json
{
  "framer-motion": "animaciones suaves",
  "react-google-recaptcha": "verificación humana",
  "lucide-react": "iconos modernos",
  "tailwindcss": "estilos utility-first",
  "@/components/ui/*": "componentes shadcn/ui"
}
```

## ✅ Estado Actual

- [x] ✅ Todos los componentes visuales creados
- [x] ✅ Flujo completo de 8 pasos funcional
- [x] ✅ Siluetas interactivas del vehículo
- [x] ✅ Captura de fotografías
- [x] ✅ BackOffice con enlace del asesor
- [x] ✅ Tipos TypeScript completos
- [x] ✅ Animaciones y transiciones
- [ ] ⏳ Conexión con Supabase (Fase 2)
- [ ] ⏳ Generación de PDF (Fase 2)
- [ ] ⏳ Sistema de enlaces cortos real (Fase 2)

## 📝 Notas Importantes

- El sistema está **100% funcional visualmente**
- Los datos se capturan correctamente en el estado
- La metadata se recolecta automáticamente
- Las fotos se convierten a base64
- Listo para conectar con Supabase en Fase 2

## 🎉 Testing

Para probar el sistema:

1. **Portal Cliente**: `/tasacion/demo-advisor`
2. **BackOffice**: `/backoffice/tasaciones`

---

**Desarrollado con ❤️ para CVO**


