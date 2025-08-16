const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando HTTPS para desarrollo...');

// Crear directorio para certificados si no existe
const certsDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
  console.log('✅ Directorio de certificados creado');
}

// Verificar si mkcert está instalado
try {
  execSync('mkcert --version', { stdio: 'pipe' });
  console.log('✅ mkcert encontrado');
} catch (error) {
  console.log('❌ mkcert no encontrado. Instalando...');
  try {
    execSync('npm install -g mkcert', { stdio: 'inherit' });
    console.log('✅ mkcert instalado');
  } catch (installError) {
    console.log('❌ Error instalando mkcert. Por favor instálalo manualmente:');
    console.log('   npm install -g mkcert');
    process.exit(1);
  }
}

// Generar certificados
try {
  console.log('🔐 Generando certificados...');
  // mkcert genera automáticamente los archivos en el directorio actual
  execSync('mkcert localhost 127.0.0.1 ::1', { 
    stdio: 'inherit',
    cwd: certsDir 
  });
  console.log('✅ Certificados generados');
} catch (error) {
  console.log('❌ Error generando certificados:', error.message);
  process.exit(1);
}

console.log('🎉 Configuración HTTPS completada!');
console.log('📝 Para usar HTTPS en desarrollo:');
console.log('   npm run dev:https');
