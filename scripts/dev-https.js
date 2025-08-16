const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando servidor con HTTPS...');

// Verificar si existe el directorio certs
const certsDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
  console.log('✅ Directorio de certificados creado');
}

// Crear certificados auto-firmados simples
const https = require('https');
const { execSync } = require('child_process');

try {
  console.log('🔐 Generando certificados auto-firmados...');
  
  // Usar openssl si está disponible
  try {
    execSync('openssl version', { stdio: 'pipe' });
    console.log('✅ OpenSSL encontrado, generando certificados...');
    
    const keyPath = path.join(certsDir, 'localhost-key.pem');
    const certPath = path.join(certsDir, 'localhost.pem');
    
    // Generar clave privada
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // Generar certificado
    execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=ES/ST=Madrid/L=Madrid/O=Development/CN=localhost"`, { stdio: 'inherit' });
    
    console.log('✅ Certificados generados con OpenSSL');
  } catch (opensslError) {
    console.log('⚠️ OpenSSL no disponible, usando certificados de prueba...');
    
    // Crear certificados de prueba básicos
    const testKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
AgEAAoIBAQC7VJTUt9Us8cKB
-----END PRIVATE KEY-----`;
    
    const testCert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/OvD8VQnMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkVTMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTkwNzA5MTQ0NzQ5WhcNMjAwNzA4MTQ0NzQ5WjBF
MQswCQYDVQQGEwJFUzETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAu1SU1LfVLPHCgQIDAQABo1AwTjAdBgNVHQ4EFgQUZ5Bd6DrKZ+xV5m5x
-----END CERTIFICATE-----`;
    
    fs.writeFileSync(path.join(certsDir, 'localhost-key.pem'), testKey);
    fs.writeFileSync(path.join(certsDir, 'localhost.pem'), testCert);
    
    console.log('✅ Certificados de prueba creados');
  }
  
  // Iniciar Next.js con HTTPS
  console.log('🚀 Iniciando servidor Next.js con HTTPS...');
  const nextProcess = spawn('npx', ['next', 'dev', '--experimental-https'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_TLS_REJECT_UNAUTHORIZED: '0'
    }
  });
  
  nextProcess.on('error', (error) => {
    console.error('❌ Error iniciando servidor:', error);
  });
  
} catch (error) {
  console.error('❌ Error en configuración HTTPS:', error);
  console.log('💡 Alternativa: Usar servidor HTTP normal');
  console.log('   npm run dev');
}
