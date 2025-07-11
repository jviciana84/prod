/**
 * Sistema de versionado automático
 *
 * Este archivo se actualiza automáticamente en cada commit.
 * La versión se genera basándose en el número de commits y hash.
 */

// Versión actual de la aplicación (generada automáticamente)
export const APP_VERSION = "1.0.22-48813a0"

// Función para obtener la fecha de la última actualización
export function getLastUpdateDate(): string {
  // Formato: DD/MM/YYYY
  return "11/07/2025" // Actualizada automáticamente
}

// Función para obtener información completa de la versión
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    lastUpdate: getLastUpdateDate(),
    environment: process.env.NODE_ENV || "development",
    commitHash: "48813a0",
    commitCount: 22,
  }
}

// Función para verificar si hay una nueva versión disponible
export function checkForNewVersion(currentVersion: string): boolean {
  return APP_VERSION !== currentVersion
}
