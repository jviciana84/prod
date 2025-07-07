// Generar claves VAPID válidas para notificaciones Web Push
const crypto = require("crypto")

function generateVapidKeys() {
  // Generar par de claves usando el algoritmo correcto para VAPID
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
    publicKeyEncoding: {
      type: "spki",
      format: "der",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "der",
    },
  })

  // Convertir a base64url (formato requerido por VAPID)
  const publicKeyBase64 = publicKey.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

  const privateKeyBase64 = privateKey.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64,
  }
}

// Generar las claves
const vapidKeys = generateVapidKeys()

console.log("🔑 Claves VAPID generadas:")
console.log("")
console.log("📋 Copia estas variables de entorno:")
console.log("")
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log("")
console.log("✅ Agrega estas variables a tu proyecto de Vercel")
console.log("")
console.log("📏 Longitudes:")
console.log(`   Clave pública: ${vapidKeys.publicKey.length} caracteres`)
console.log(`   Clave privada: ${vapidKeys.privateKey.length} caracteres`)
