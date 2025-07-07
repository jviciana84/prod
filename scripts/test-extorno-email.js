// 🧪 SCRIPT PARA PROBAR EMAIL DE EXTORNO MANUALMENTE
// Ejecutar en la consola del navegador o como Node.js

const testExtornoEmail = async () => {
  console.log("🧪 === PRUEBA DE EMAIL EXTORNO ===")

  try {
    const response = await fetch("/api/extornos/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        extorno_id: 24,
        tipo: "registro",
        usuario_registra_email: "jordi.viciana@munichgroup.es",
        usuario_registra_nombre: "Jordi Viciana",
      }),
    })

    const result = await response.json()

    console.log("📧 Respuesta del servidor:", result)

    if (response.ok) {
      console.log("✅ Email enviado correctamente!")
    } else {
      console.error("❌ Error enviando email:", result)
    }
  } catch (error) {
    console.error("❌ Error crítico:", error)
  }
}

// Ejecutar la prueba
testExtornoEmail()
