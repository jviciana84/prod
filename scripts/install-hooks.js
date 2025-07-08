#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Función para instalar el hook pre-commit
function installPreCommitHook() {
  const hookPath = path.join(__dirname, '..', '.git', 'hooks', 'pre-commit');
  const hookContent = `#!/bin/sh

# Git hook para actualizar automáticamente la versión antes de cada commit

echo "🔄 Actualizando versión automáticamente..."

# Ejecutar el script de actualización de versión
node scripts/update-version.js

# Si el script falla, abortar el commit
if [ $? -ne 0 ]; then
    echo "❌ Error actualizando versión. Commit abortado."
    exit 1
fi

# Agregar el archivo de versiones actualizado al commit
git add lib/version.ts

echo "✅ Versión actualizada y agregada al commit"
`;

  try {
    fs.writeFileSync(hookPath, hookContent, 'utf8');
    // Hacer el archivo ejecutable
    fs.chmodSync(hookPath, '755');
    console.log('✅ Hook pre-commit instalado correctamente');
  } catch (error) {
    console.error('❌ Error instalando hook pre-commit:', error);
  }
}

// Función para verificar si estamos en un repositorio Git
function isGitRepository() {
  const gitPath = path.join(__dirname, '..', '.git');
  return fs.existsSync(gitPath);
}

// Función principal
function main() {
  if (!isGitRepository()) {
    console.error('❌ No se encontró un repositorio Git. Ejecuta este script desde la raíz del proyecto.');
    process.exit(1);
  }

  console.log('🔧 Instalando hooks de Git para actualización automática de versiones...');
  
  installPreCommitHook();
  
  console.log('🎉 Instalación completada!');
  console.log('📝 Ahora cada vez que hagas un commit, la versión se actualizará automáticamente.');
  console.log('💡 Para actualizar la versión manualmente, ejecuta: npm run update-version');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { installPreCommitHook, isGitRepository }; 