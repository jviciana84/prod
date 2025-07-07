/**
 * Sistema de versionado manual simplificado
 *
 * Este archivo centraliza la gestión de versiones de la aplicación.
 * La versión se define aquí y debe actualizarse manualmente.
 */

// Versión actual de la aplicación
export const APP_VERSION = "1.0.1"

// Función para obtener la fecha de la última actualización
export function getLastUpdateDate(): string {
  // Formato: DD/MM/YYYY
  return "06/01/2025" // Actualiza esta fecha manualmente
}

// Función para obtener información completa de la versión
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    lastUpdate: getLastUpdateDate(),
    environment: process.env.NODE_ENV || "development",
  }
}

// Función para verificar si hay una nueva versión disponible
export function checkForNewVersion(currentVersion: string): boolean {
  return APP_VERSION !== currentVersion
}
