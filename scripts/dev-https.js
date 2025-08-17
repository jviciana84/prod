const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Configurando HTTPS para desarrollo local...');
console.log('📱 Esto permitirá probar la cámara en móviles');

// Crear archivo de configuración temporal para Next.js
const nextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    https: true
  }
}

module.exports = nextConfig
`;

const configPath = path.join(__dirname, '..', 'next.config.https.js');

// Escribir configuración temporal
fs.writeFileSync(configPath, nextConfig);

console.log('✅ Configuración HTTPS creada');
console.log('🚀 Iniciando servidor con HTTPS...');
console.log('📱 Accede a: https://localhost:3000');
console.log('⚠️  Acepta el certificado no seguro en tu navegador');

// Iniciar Next.js con configuración HTTPS
const nextDev = spawn('npx', [
  'next', 'dev',
  '-c', configPath,
  '-p', '3000'
], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_TLS_REJECT_UNAUTHORIZED: '0',
    HTTPS: 'true'
  }
});

// Limpiar archivo de configuración al salir
process.on('SIGINT', () => {
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    console.log('🧹 Configuración temporal eliminada');
  }
  process.exit(0);
});

nextDev.on('close', (code) => {
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    console.log('🧹 Configuración temporal eliminada');
  }
  console.log(`Servidor cerrado con código: ${code}`);
});
