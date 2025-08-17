#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Función para obtener el timestamp del último commit
function getLastCommitTimestamp() {
  const { execSync } = require('child_process');
  try {
    const timestamp = execSync('git log -1 --format=%ct', { encoding: 'utf8' }).trim();
    return parseInt(timestamp) * 1000; // Convertir a milisegundos
  } catch (error) {
    console.error('Error obteniendo timestamp del commit:', error);
    return Date.now();
  }
}

// Función para obtener el número de commits
function getCommitCount() {
  const { execSync } = require('child_process');
  try {
    const count = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
    return parseInt(count);
  } catch (error) {
    console.error('Error obteniendo número de commits:', error);
    return 1;
  }
}

// Función para obtener el hash corto del commit
function getShortHash() {
  const { execSync } = require('child_process');
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return hash;
  } catch (error) {
    console.error('Error obteniendo hash del commit:', error);
    return 'unknown';
  }
}

// Función para formatear fecha
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Función para generar versión automática
function generateVersion() {
  const commitCount = getCommitCount();
  const shortHash = getShortHash();
  const timestamp = getLastCommitTimestamp();
  
  // Formato: 1.1.{commitCount}-{shortHash}
  return `1.1.${commitCount}-${shortHash}`;
}

// Función para actualizar el archivo de versiones
function updateVersionFile() {
  const versionFilePath = path.join(__dirname, '..', 'lib', 'version.ts');
  const newVersion = generateVersion();
  const lastUpdate = formatDate(getLastCommitTimestamp());
  
  const versionContent = `/**
 * Sistema de versionado automático
 *
 * Este archivo se actualiza automáticamente en cada commit.
 * La versión se genera basándose en el número de commits y hash.
 */

// Versión actual de la aplicación (generada automáticamente)
export const APP_VERSION = "${newVersion}"

// Función para obtener la fecha de la última actualización
export function getLastUpdateDate(): string {
  // Formato: DD/MM/YYYY
  return "${lastUpdate}" // Actualizada automáticamente
}

// Función para obtener información completa de la versión
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    lastUpdate: getLastUpdateDate(),
    environment: process.env.NODE_ENV || "development",
    commitHash: "${getShortHash()}",
    commitCount: ${getCommitCount()},
  }
}

// Función para verificar si hay una nueva versión disponible
export function checkForNewVersion(currentVersion: string): boolean {
  return APP_VERSION !== currentVersion
}
`;

  try {
    fs.writeFileSync(versionFilePath, versionContent, 'utf8');
    console.log(`✅ Versión actualizada a: ${newVersion}`);
    console.log(`📅 Última actualización: ${lastUpdate}`);
  } catch (error) {
    console.error('❌ Error actualizando archivo de versiones:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateVersionFile();
}

module.exports = { updateVersionFile, generateVersion, getLastUpdateDate: formatDate }; 