/**
 * Sistema de versionado automático
 *
 * Este archivo se actualiza automáticamente en cada commit.
 * La versión se genera basándose en el número de commits y hash.
 */

// Versión actual de la aplicación (generada automáticamente)
export const APP_VERSION = "1.2.357-a3b91cc"

// Función para obtener la fecha de la última actualización
export function getLastUpdateDate(): string {
  // Formato: DD/MM/YYYY
  return "23/10/2025" // Actualizada automáticamente
}

// Función para obtener información completa de la versión
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    lastUpdate: getLastUpdateDate(),
    environment: process.env.NODE_ENV || "development",
    commitHash: "a3b91cc",
    commitCount: 357,
  }
}

// Función para verificar si hay una nueva versión disponible
export function checkForNewVersion(currentVersion: string): boolean {
  return APP_VERSION !== currentVersion
}
