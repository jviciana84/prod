# 📦 Configuración de Supabase Storage para Tasaciones

## 🎯 ¿Por qué Supabase Storage?

He cambiado de **OVH SFTP** a **Supabase Storage** porque:

- ✅ **Compatible con Vercel/Next.js** (sin módulos nativos)
- ✅ **CDN global** (carga rápida desde cualquier lugar)
- ✅ **Más fácil de implementar** (sin configuración SFTP)
- ✅ **Gratis hasta 1GB** (más que suficiente para empezar)
- ✅ **Integración nativa** con Supabase
- ✅ **No requiere servidor adicional**

## 🔧 Configuración en Supabase

### **Paso 1: Crear Bucket de Storage**

1. Ve a: **Supabase Dashboard** → **Storage**
2. Click en: **"New bucket"**
3. Configuración:
   ```
   Name: tasacion-fotos
   Public bucket: ✅ SÍ (marcar como público)
   Allowed MIME types: image/*
   File size limit: 10 MB
   ```
4. Click en **"Create bucket"**

### **Paso 2: Configurar Políticas de Acceso**

Ve a: **Storage** → **tasacion-fotos** → **Policies**

**Política 1: Permitir subida pública**
```sql
CREATE POLICY "Permitir subida pública"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tasacion-fotos');
```

**Política 2: Permitir lectura pública**
```sql
CREATE POLICY "Permitir lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'tasacion-fotos');
```

**Política 3: Permitir actualización**
```sql
CREATE POLICY "Permitir actualización"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tasacion-fotos');
```

### **Paso 3: Ejecutar Migración de Tablas**

Ve a: **SQL Editor** y ejecuta:

```sql
-- Contenido de: supabase/migrations/20250112000000_create_tasaciones_tables.sql
```

Esto crea:
- ✅ `tasaciones` - Datos de la tasación
- ✅ `tasacion_fotos` - URLs de las imágenes
- ✅ `advisor_tasacion_links` - Enlaces de asesores

## 📁 Estructura de Archivos en Supabase Storage

```
tasacion-fotos/
└── [uuid-tasacion]/
    ├── vehiculo/
    │   ├── frontal.jpg
    │   ├── lateralDelanteroIzq.jpg
    │   ├── lateralTraseroIzq.jpg
    │   ├── trasera.jpg
    │   ├── lateralTraseroDer.jpg
    │   └── lateralDelanteroDer.jpg
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
        └── otra_3.jpg
```

## 🌐 URLs Públicas

Las imágenes estarán disponibles en:

```
https://[tu-proyecto].supabase.co/storage/v1/object/public/tasacion-fotos/[uuid]/vehiculo/frontal.jpg
```

Ejemplo real:
```
https://abcdefgh.supabase.co/storage/v1/object/public/tasacion-fotos/123e4567-e89b-12d3-a456-426614174000/vehiculo/frontal.jpg
```

## 🔄 Flujo de Subida

### **1. Cliente captura foto:**
```typescript
// Base64 generada por FileReader
const base64 = reader.result as string
```

### **2. Se guarda en estado:**
```typescript
setFotosVehiculo(prev => ({ ...prev, frontal: base64 }))
```

### **3. Al finalizar, se sube a Supabase:**
```typescript
// En saveTasacion.ts
const uploadResponse = await fetch('/api/upload-tasacion-images', {
  body: JSON.stringify({ images, tasacionId })
})
```

### **4. API sube a Supabase Storage:**
```typescript
await supabase.storage
  .from('tasacion-fotos')
  .upload(filePath, buffer)
```

### **5. Se obtiene URL pública:**
```typescript
const { data } = supabase.storage
  .from('tasacion-fotos')
  .getPublicUrl(filePath)
```

### **6. Se guarda URL en base de datos:**
```typescript
await supabase
  .from('tasacion_fotos')
  .insert({ tasacion_id, url, ... })
```

## 📊 Límites y Capacidad

### **Plan Gratuito de Supabase:**
- 📦 **Storage:** 1 GB
- 🚀 **Transferencia:** 2 GB/mes
- 📸 **Archivos:** Ilimitados

### **Cálculos estimados:**

| Item | Tamaño | Cantidad | Total |
|------|--------|----------|-------|
| Foto del vehículo | ~500 KB | 6 | 3 MB |
| Foto cuentakm | ~500 KB | 1 | 0.5 MB |
| Foto interior | ~500 KB | 2 | 1 MB |
| Documentación | ~800 KB | 4 | 3.2 MB |
| Otras fotos | ~500 KB | ~3 | 1.5 MB |
| **Total por tasación** | | | **~9 MB** |

**Con 1GB puedes almacenar ~110 tasaciones completas**

### **Si necesitas más espacio:**
- Upgrade a plan Pro: $25/mes = 100 GB
- O comprimir imágenes antes de subir (reducir a ~3-4 MB por tasación)

## 🎨 Ventajas vs OVH SFTP

| Característica | OVH SFTP | Supabase Storage |
|----------------|----------|------------------|
| **Compatibilidad Next.js** | ❌ Requiere módulos nativos | ✅ 100% compatible |
| **Velocidad de deploy** | ❌ No funciona en Vercel | ✅ Funciona perfectamente |
| **CDN Global** | ❌ Solo servidor EU | ✅ CDN mundial |
| **Configuración** | ⚙️ Compleja (SFTP, ports) | ✅ Simple (UI web) |
| **Mantenimiento** | 🔧 Manual | ✅ Automático |
| **Costo inicial** | ✅ Gratis (ya tienes OVH) | ✅ Gratis (1GB) |
| **Escalabilidad** | 🔼 Limitado al plan OVH | ✅ Fácil upgrade |

## 🧪 Verificar que Funciona

### **1. Verificar bucket creado:**

En Supabase Dashboard → Storage, deberías ver:
```
tasacion-fotos (public) ✅
```

### **2. Probar subida manual:**

En Storage → tasacion-fotos → Upload file
- Sube una imagen de prueba
- Verifica que se pueda acceder públicamente

### **3. Probar desde la app:**

1. Completa una tasación
2. Sube fotos
3. Click en "Finalizar"
4. Revisa la consola para ver:
   ```
   ✅ Subidas 15 imágenes a Supabase Storage
   ✅ URLs de fotos guardadas en Supabase
   ```

### **4. Verificar en base de datos:**

```sql
-- Ver tasaciones recientes
SELECT * FROM tasaciones ORDER BY created_at DESC LIMIT 5;

-- Ver fotos de una tasación
SELECT * FROM tasacion_fotos 
WHERE tasacion_id = 'uuid-aqui';
```

### **5. Verificar imágenes en Storage:**

Storage → tasacion-fotos → Deberías ver carpetas con UUIDs

## 🐛 Troubleshooting

### **Error: "Bucket not found"**
→ Crear el bucket `tasacion-fotos` en Supabase Storage

### **Error: "Permission denied"**
→ Configurar las políticas de acceso público

### **Error: "File size too large"**
→ Comprimir imágenes antes de subir o aumentar límite en bucket

### **Las URLs no se pueden acceder**
→ Verificar que el bucket sea público

## 📝 Notas Importantes

- ⚠️ El bucket debe ser **público** para que las URLs funcionen
- ✅ Las imágenes se suben de forma segura (HTTPS)
- ✅ Las URLs son permanentes y no cambian
- ✅ Puedes borrar imágenes desde el dashboard de Supabase
- ✅ Las URLs se guardan en `tasacion_fotos` para fácil acceso

---

**Estado**: ✅ Implementado y listo  
**Última actualización**: Enero 2025  
**Compatibilidad**: ✅ Vercel + Next.js + Supabase

