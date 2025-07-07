# Gestión de Avatares

Este documento explica cómo configurar y utilizar el sistema de avatares en la aplicación.

## Descarga de Avatares

Para descargar los avatares desde Google Drive, sigue estos pasos:

1. Edita el archivo `scripts/download-avatars.ts` y añade las URLs de tus avatares en Google Drive.
   - Para obtener la URL de descarga directa, usa el formato: `https://drive.google.com/uc?export=download&id=ID_DEL_ARCHIVO`
   - Donde `ID_DEL_ARCHIVO` es el ID que aparece en la URL de Google Drive (por ejemplo, en `https://drive.google.com/file/d/1lzwPDLcUIEtgCCTJTgsKw9A0t3-ouHZo/view`, el ID es `1lzwPDLcUIEtgCCTJTgsKw9A0t3-ouHZo`)

2. Ejecuta el script de descarga:
   \`\`\`bash
   npm install axios fs-extra
   npx tsx scripts/download-avatars.ts
   \`\`\`

3. El script descargará los avatares a la carpeta `public/avatars/` y generará placeholders para los avatares que no se puedan descargar.

## Avatar por Defecto

Para generar un avatar por defecto que se usará cuando no se pueda cargar un avatar específico:

\`\`\`bash
npx tsx scripts/generate-default-avatar.ts
\`\`\`

## Subida Manual de Avatares

Si prefieres subir los avatares manualmente:

1. Crea la carpeta `public/avatars/` si no existe
2. Coloca tus avatares en esta carpeta con nombres del 1 al 36 (por ejemplo, `1.png`, `2.png`, etc.)
3. Asegúrate de incluir un archivo `default.png` que se usará como fallback

## Solución de Problemas

Si los avatares no se muestran correctamente:

1. Verifica que los archivos existen en la carpeta `public/avatars/`
2. Asegúrate de que los nombres de los archivos son correctos (del 1 al 36 con extensión .png)
3. Comprueba la consola del navegador para ver si hay errores de carga de imágenes
4. Si usas URLs de Google Drive, asegúrate de que los archivos son públicos y accesibles

## Personalización

Para personalizar el sistema de avatares:

1. Edita `lib/avatars/index.ts` para cambiar la lógica de selección de avatares
2. Modifica `components/admin/avatar-manager.tsx` para cambiar la interfaz de selección de avatares
3. Ajusta `app/api/admin/users/[userId]/avatar/route.ts` para modificar la lógica de actualización de avatares
