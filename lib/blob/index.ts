import { put, del, list } from "@vercel/blob"
import { BLOB_CONFIG } from "@/lib/config"

/**
 * Sube un archivo a Vercel Blob
 * @param file Archivo a subir
 * @param filename Nombre del archivo
 * @returns URL del archivo en Blob
 */
export async function uploadToBlob(file: File | Buffer, filename: string): Promise<string> {
  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false, // Mantener el nombre exacto
    })

    return blob.url
  } catch (error) {
    console.error("Error al subir archivo a Blob:", error)
    throw error
  }
}

/**
 * Elimina un archivo de Vercel Blob
 * @param url URL del archivo en Blob
 */
export async function deleteFromBlob(url: string): Promise<void> {
  try {
    await del(url)
  } catch (error) {
    console.error("Error al eliminar archivo de Blob:", error)
    throw error
  }
}

/**
 * Lista todos los archivos en Vercel Blob
 * @param prefix Prefijo para filtrar archivos (opcional)
 * @returns Lista de archivos
 */
export async function listBlobFiles(prefix?: string): Promise<any[]> {
  try {
    const { blobs } = await list({ prefix })
    return blobs
  } catch (error) {
    console.error("Error al listar archivos de Blob:", error)
    throw error
  }
}

/**
 * Obtiene la URL base de Blob
 * @returns URL base de Blob
 */
export function getBlobBaseUrl(): string {
  return BLOB_CONFIG.BASE_URL
}

/**
 * Obtiene el ID del store de Blob
 * @returns ID del store
 */
export function getBlobStoreId(): string {
  return BLOB_CONFIG.STORE_ID
}

/**
 * Construye una URL de Blob para un avatar
 * @param filename Nombre del archivo
 * @returns URL completa del avatar en Blob
 */
export function getAvatarBlobUrl(filename: string): string {
  // Si ya es una URL completa, devolverla
  if (filename.startsWith("http")) {
    return filename
  }

  // Extraer solo el nombre del archivo sin la ruta
  const baseName = filename.split("/").pop() || filename

  // Construir la URL completa
  return `${BLOB_CONFIG.BASE_URL}/avatars/${baseName}`
}

/**
 * Extrae el nombre del archivo de una URL de Blob
 * @param url URL de Blob
 * @returns Nombre del archivo
 */
export function getFilenameFromBlobUrl(url: string): string {
  return url.split("/").pop() || ""
}
