# 📸 Almacenamiento de Imágenes en OVH - Portal de Tasaciones

## 🎯 Arquitectura Implementada

### **Opción elegida: Híbrido OVH + Supabase**

```
┌─────────────────┐
│   Cliente Web   │ (Smartphone)
│  (Next.js App)  │
└────────┬────────┘
         │ 1. Captura fotos (base64)
         ↓
┌─────────────────────┐
│   Next.js API       │
│  /api/upload-...    │
└────────┬────────────┘
         │ 2. Sube via SFTP
         ↓
┌─────────────────────┐
│   OVH Hosting       │ 📁 Almacena imágenes
│  SFTP Port 22       │
└────────┬────────────┘
         │ 3. Retorna URLs públicas
         ↓
┌─────────────────────┐
│   Supabase DB       │ 💾 Guarda datos + URLs
│  PostgreSQL         │
└─────────────────────┘
         │ 4. Consulta desde BackOffice
         ↓
┌─────────────────────┐
│   Asesor            │ 👤 Ve tasaciones + fotos
│  (BackOffice)       │
└─────────────────────┘
```

## 📦 Componentes Creados

### **1. API Routes**

#### `app/api/upload-image/route.ts`
- Sube **una imagen** via SFTP
- Parámetros: `image`, `fileName`, `tasacionId`
- Retorna: URL pública de la imagen

#### `app/api/upload-tasacion-images/route.ts`
- Sube **múltiples imágenes** en batch
- Organiza por categorías (vehiculo, documentacion, etc.)
- Manejo de errores por imagen
- Retorna: Objeto con todas las URLs

### **2. Server Action**

#### `server-actions/saveTasacion.ts`
- Guarda tasación completa en Supabase
- Prepara y sube imágenes a OVH
- Guarda URLs de fotos en tabla `tasacion_fotos`
- Manejo robusto de errores

### **3. Base de Datos**

#### `supabase/migrations/20250112000000_create_tasaciones_tables.sql`

**Tablas creadas:**

| Tabla | Descripción |
|-------|-------------|
| `tasaciones` | Datos principales de cada tasación |
| `tasacion_fotos` | URLs de imágenes almacenadas en OVH |
| `advisor_tasacion_links` | Enlaces únicos por asesor |

**Relaciones:**
```sql
tasaciones (1) ──< (N) tasacion_fotos
```

## 🔧 Configuración Necesaria

### **1. Variables de Entorno**

Agregar a `.env.local`:

```bash
# SFTP OVH
SFTP_PASSWORD=eVCNt5hMjc3.9M$

# URL pública del sitio
NEXT_PUBLIC_SITE_URL=https://tudominio.com

# Supabase (ya configuradas)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### **2. Ejecutar Migración en Supabase**

1. Ve a: Supabase Dashboard > SQL Editor
2. Copia el contenido de `supabase/migrations/20250112000000_create_tasaciones_tables.sql`
3. Ejecuta el script
4. Verifica las tablas creadas

### **3. Configurar Hosting OVH**

Ver guía completa en: [`CONFIGURACION_OVH_TASACIONES.md`](./CONFIGURACION_OVH_TASACIONES.md)

## 🚀 Flujo de Funcionamiento

### **Paso 1: Cliente completa formulario**

```typescript
// En FotografiasStep.tsx
const base64Image = reader.result as string
setFotosVehiculo(prev => ({ ...prev, [key]: base64Image }))
```

### **Paso 2: Click en "Finalizar"**

```typescript
// En page.tsx - handleFinish()
const { saveTasacion } = await import('@/server-actions/saveTasacion')
const result = await saveTasacion(completedData, advisorSlug)
```

### **Paso 3: Server Action procesa**

```typescript
// 1. Inserta tasación en Supabase
const { data: tasacion } = await supabase.from('tasaciones').insert(...)

// 2. Llama a API para subir imágenes
const uploadResponse = await fetch('/api/upload-tasacion-images', {
  body: JSON.stringify({ images, tasacionId })
})

// 3. Guarda URLs en tasacion_fotos
await supabase.from('tasacion_fotos').insert(fotosToInsert)
```

### **Paso 4: API sube a OVH**

```typescript
// Conectar SFTP
await sftp.connect(SFTP_CONFIG)

// Crear directorio
await sftp.mkdir(`/home/controt/tasaciones/${tasacionId}`)

// Subir archivo
await sftp.put(buffer, remotePath)

// Retornar URL pública
return { url: `https://tudominio.com/tasaciones/${tasacionId}/foto.jpg` }
```

## 📂 Estructura de Archivos en OVH

```
/home/controt/tasaciones/
└── [uuid-tasacion]/
    ├── vehiculo/
    │   ├── frontal.jpg
    │   ├── lateralDelanteroIzq.jpg
    │   └── ... (6 fotos)
    ├── cuentakm/
    │   └── cuentakm.jpg
    ├── interior_delantero/
    │   └── interior_delantero.jpg
    ├── interior_trasero/
    │   └── interior_trasero.jpg
    ├── documentacion/
    │   ├── permisoCirculacionFrente.jpg
    │   ├── permisoCirculacionDorso.jpg
    │   ├── fichaTecnicaFrente.jpg
    │   └── fichaTecnicaDorso.jpg
    └── otras/
        ├── otra_1.jpg
        ├── otra_2.jpg
        └── ... (N fotos)
```

## 🔍 Consultar Tasaciones

### **Desde el BackOffice**

```typescript
// Obtener tasaciones por asesor
const { data: tasaciones } = await supabase
  .from('tasaciones')
  .select(`
    *,
    tasacion_fotos (*)
  `)
  .eq('advisor_slug', slug)
  .order('created_at', { ascending: false })

// Acceder a las fotos
tasaciones[0].tasacion_fotos.forEach(foto => {
  console.log(foto.url) // URL pública de OVH
})
```

### **Generar PDF con fotos**

```typescript
// Las URLs ya están disponibles
const fotoFrontal = tasacion.tasacion_fotos
  .find(f => f.foto_key === 'frontal')?.url

// Usar en el PDF
<Image src={fotoFrontal} />
```

## 💾 Respaldo Automático

El sistema mantiene **doble respaldo**:

1. **localStorage** (temporal, solo navegador)
   - Se guarda antes de subir a OVH
   - Útil si falla la subida

2. **OVH Hosting** (permanente)
   - Archivos físicos en servidor
   - Accesibles via SFTP y HTTP

3. **Supabase** (permanente)
   - Datos estructurados
   - URLs de las imágenes
   - Fácil consulta y filtrado

## 📊 Ventajas de esta Arquitectura

| Aspecto | Beneficio |
|---------|-----------|
| **Costo** | ✅ Usa hosting existente (sin costo adicional) |
| **Escalabilidad** | ✅ Espacio ilimitado según plan OVH |
| **Velocidad** | ✅ Servidor europeo (baja latencia España) |
| **Seguridad** | ✅ SFTP cifrado + Supabase RLS |
| **Backup** | ✅ Triple respaldo (local + OVH + URLs en DB) |
| **Acceso** | ✅ URLs públicas directas |
| **Mantenimiento** | ✅ Sin dependencias de servicios cloud adicionales |

## ⚠️ Consideraciones

### **Tamaño de Imágenes**

Las imágenes se guardan en base64 temporalmente, lo que:
- Aumenta el tamaño ~33%
- Se recomienda comprimir antes de subir

### **Tiempo de Subida**

- **1 imagen**: ~1-2 segundos
- **15 imágenes**: ~15-30 segundos
- Se muestra en consola el progreso

### **Límites**

- **localStorage**: ~5-10 MB (respaldo temporal)
- **OVH**: Según tu plan (generalmente 10GB-100GB)
- **Supabase**: Ilimitado para URLs (solo texto)

## 🐛 Debugging

### **Ver logs en consola**

```javascript
// Cliente
console.log('🚀 Guardando en Supabase y subiendo fotos a OVH...')
console.log('✅ Tasación guardada con ID:', result.tasacionId)

// Server
console.log('✅ Tasación guardada en Supabase:', tasacion.id)
console.log(`✅ Subidas ${uploadResult.totalUploaded} imágenes a OVH`)
console.log(`✅ URLs de fotos guardadas en Supabase`)
```

### **Verificar en Supabase**

```sql
-- Ver tasaciones recientes
SELECT id, matricula, created_at 
FROM tasaciones 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver fotos de una tasación
SELECT categoria, foto_key, url
FROM tasacion_fotos
WHERE tasacion_id = 'uuid-aqui';
```

### **Verificar en OVH**

```bash
# Conectar via SFTP
sftp -P 22 controt@ftp.cluster100.hosting.ovh.net

# Listar tasaciones
ls /home/controt/tasaciones/

# Ver fotos de una tasación
ls /home/controt/tasaciones/[uuid]/vehiculo/
```

## 🔄 Próximos Pasos

1. ✅ Comprimir imágenes antes de subir (opcional)
2. ✅ Generar miniaturas para listados
3. ✅ Agregar watermark a las fotos
4. ✅ Implementar limpieza automática de fotos antiguas
5. ✅ Estadísticas de almacenamiento usado

---

**Versión**: 1.0.0  
**Fecha**: Enero 2025  
**Estado**: ✅ Implementado y funcional

