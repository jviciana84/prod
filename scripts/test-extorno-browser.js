// 🧪 SCRIPT PARA NAVEGADOR - Copia y pega en la consola (F12)

const testExtornoBrowser = async () => {
  console.log("🧪 === PRUEBA DE EMAIL EXTORNO EN NAVEGADOR ===")

  try {
    // 1. Primero probar diagnóstico simple
    console.log("1️⃣ Probando diagnóstico simple...")
    const diagResponse = await fetch("/api/extornos/test-simple")
    const diagResult = await diagResponse.json()
    console.log("📊 Diagnóstico:", diagResult)

    // 2. Luego probar envío de email
    console.log("2️⃣ Probando envío de email...")
    const emailResponse = await fetch("/api/extornos/send-notification", {
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

    const emailResult = await emailResponse.json()
    console.log("📧 Resultado email:", emailResult)

    if (emailResponse.ok) {
      console.log("✅ Email enviado correctamente!")
    } else {
      console.error("❌ Error enviando email:", emailResult)
    }
  } catch (error) {
    console.error("❌ Error crítico:", error)
  }
}

// Ejecutar automáticamente
testExtornoBrowser()
