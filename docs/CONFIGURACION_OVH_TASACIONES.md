# 🔧 Configuración OVH para Tasaciones

> ⚠️ **NOTA IMPORTANTE**: Esta configuración ha sido reemplazada por **Supabase Storage**.  
> Ver: [`SUPABASE_STORAGE_SETUP.md`](./SUPABASE_STORAGE_SETUP.md)
> 
> Razón del cambio: `ssh2-sftp-client` usa módulos nativos incompatibles con Vercel.
> Supabase Storage es más simple, compatible y funciona perfectamente en producción.

---

# 🔧 Configuración OVH para Tasaciones (DEPRECADO)

## 📋 Variables de Entorno Necesarias

Agrega estas variables a tu archivo `.env.local`:

```bash
# SFTP OVH para subir imágenes
SFTP_PASSWORD=eVCNt5hMjc3.9M$

# URL del sitio (para construir URLs de imágenes)
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

## 🗄️ Base de Datos Supabase

### 1. Ejecutar migración

Ve a tu panel de Supabase > SQL Editor y ejecuta:

```sql
-- Contenido del archivo: supabase/migrations/20250112000000_create_tasaciones_tables.sql
```

Esto creará 3 tablas:
- ✅ `tasaciones` - Datos principales
- ✅ `tasacion_fotos` - URLs de imágenes en OVH
- ✅ `advisor_tasacion_links` - Enlaces únicos de asesores

### 2. Verificar tablas creadas

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'tasacion%';
```

## 📁 Estructura de Archivos en OVH

Las imágenes se guardarán en tu hosting OVH con esta estructura:

```
/home/controt/
└── tasaciones/
    └── [uuid-tasacion-id]/
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

## 🌐 Configuración Web OVH

### Opción A: Servir directamente desde el dominio principal

Si tu dominio principal apunta a `/home/controt/`, las imágenes estarán disponibles en:

```
https://tudominio.com/tasaciones/[id]/vehiculo/frontal.jpg
```

### Opción B: Crear un subdominio

1. En el panel OVH, crea un subdominio: `fotos.tudominio.com`
2. Apúntalo a `/home/controt/tasaciones/`
3. Las imágenes estarán en:

```
https://fotos.tudominio.com/[id]/vehiculo/frontal.jpg
```

Actualiza `NEXT_PUBLIC_SITE_URL` según tu elección:

```bash
# Opción A
NEXT_PUBLIC_SITE_URL=https://tudominio.com

# Opción B
NEXT_PUBLIC_SITE_URL=https://fotos.tudominio.com
```

## 🔒 Seguridad

### Permisos de archivos

Asegúrate de que los permisos sean correctos:

```bash
# Conectar via SSH
ssh controt@ftp.cluster100.hosting.ovh.net

# Establecer permisos
chmod 755 /home/controt/tasaciones
chmod 644 /home/controt/tasaciones/**/*.jpg
```

### Protección de directorios sensibles

Crea un archivo `.htaccess` en `/home/controt/tasaciones/`:

```apache
# Permitir acceso solo a imágenes
<FilesMatch "\.(jpg|jpeg|png|gif)$">
    Require all granted
</FilesMatch>

# Denegar acceso a todo lo demás
<FilesMatch "^(?!.*\.(jpg|jpeg|png|gif)$).*$">
    Require all denied
</FilesMatch>

# Prevenir listado de directorios
Options -Indexes
```

## 🔄 Flujo Completo

### Cuando un cliente completa la tasación:

1. **Frontend** → Captura fotos en base64
2. **Next.js API** → Recibe las fotos
3. **SFTP Client** → Conecta a OVH via SFTP
4. **Upload** → Sube las fotos a `/home/controt/tasaciones/[id]/`
5. **Supabase** → Guarda los datos + URLs de las fotos
6. **Response** → Devuelve URLs públicas
7. **PDF** → Genera PDF con las URLs de las imágenes

### Diagrama:

```
Cliente (smartphone)
    ↓
Next.js Frontend (captura base64)
    ↓
API Route (/api/upload-tasacion-images)
    ↓
SFTP Client (ssh2-sftp-client)
    ↓
OVH Hosting (ftp.cluster100.hosting.ovh.net:22)
    ↓
/home/controt/tasaciones/[uuid]/
    ↓
URL pública: https://tudominio.com/tasaciones/[uuid]/foto.jpg
    ↓
Supabase (guarda URL)
    ↓
Asesor (ve fotos desde backoffice)
```

## 🧪 Pruebas

### Verificar conexión SFTP

```bash
# Desde tu terminal local
sftp -P 22 controt@ftp.cluster100.hosting.ovh.net

# Una vez conectado
ls /home/controt/
mkdir /home/controt/test
rm -r /home/controt/test
exit
```

### Verificar acceso web

Sube una imagen de prueba y accede via navegador:

```
https://tudominio.com/tasaciones/test/prueba.jpg
```

Si ves la imagen, ¡todo está configurado correctamente! ✅

## 📊 Límites y Consideraciones

- **Espacio en OVH**: Verifica tu plan (generalmente 10GB-100GB)
- **Tamaño por imagen**: ~500KB-2MB cada una
- **Imágenes por tasación**: ~15-20 fotos
- **Espacio por tasación**: ~10-30MB
- **Tasaciones estimadas**: 300-1000 tasaciones (dependiendo del plan)

## 🐛 Troubleshooting

### Error: "Connection refused"
- Verifica puerto 22 (SFTP) no puerto 21 (FTP)
- Confirma usuario y contraseña

### Error: "Permission denied"
- Verifica que el usuario `controt` tenga permisos de escritura
- Revisa permisos del directorio `/home/controt/`

### Error: "Directory not found"
- El código crea directorios automáticamente
- Verifica que la ruta base exista: `/home/controt/`

### Las imágenes no son accesibles via web
- Verifica la configuración de tu dominio en OVH
- Asegúrate de que `/home/controt/` sea la raíz web
- Revisa permisos: `chmod 644` para archivos

## 📞 Soporte

Si necesitas ayuda con la configuración de OVH:
- Panel OVH: https://www.ovh.com/manager/
- Soporte OVH: https://help.ovhcloud.com/

---

**Última actualización**: Enero 2025  
**Estado**: ✅ Implementado y listo para usar

