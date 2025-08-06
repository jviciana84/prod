"use client"

import { useState } from "react"

export default function TestSimplePage() {
  const [result, setResult] = useState<string>("")

  const testAPI = async () => {
    try {
      console.log("🔍 Iniciando prueba...")
      
      const response = await fetch("/api/test-notification-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🧪 Prueba simple",
          body: "Esta es una prueba del sistema"
        })
      })

      console.log("📡 Respuesta recibida:", response.status)
      
      const data = await response.json()
      console.log("📦 Datos:", data)
      
      setResult(JSON.stringify({ status: response.status, data }, null, 2))
    } catch (error) {
      console.error("💥 Error:", error)
      setResult(`Error: ${error.message}`)
    }
  }

  const refreshSession = async () => {
    try {
      console.log("🔄 Refrescando sesión...")
      
      const response = await fetch("/api/refresh-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      const data = await response.json()
      console.log("📦 Resultado refresh:", data)
      
      setResult(JSON.stringify({ status: response.status, data }, null, 2))
    } catch (error) {
      console.error("💥 Error:", error)
      setResult(`Error: ${error.message}`)
    }
  }

  const forceLogout = async () => {
    try {
      console.log("🚪 Forzando logout...")
      
      const response = await fetch("/api/force-logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      const data = await response.json()
      console.log("📦 Resultado logout:", data)
      
      setResult(JSON.stringify({ status: response.status, data }, null, 2))
      
      // Si fue exitoso, redirigir a login después de 2 segundos
      if (data.success) {
        setTimeout(() => {
          window.location.href = "/auth/login"
        }, 2000)
      }
    } catch (error) {
      console.error("💥 Error:", error)
      setResult(`Error: ${error.message}`)
    }
  }

  const testPushNotification = async () => {
    try {
      console.log("🔔 Enviando notificación push...")
      
      const response = await fetch("/api/notifications/send-test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🧪 Prueba Push",
          body: "Esta es una notificación push de prueba",
          userId: "d8949618-e8a3-4e45-a373-1ad51532534e" // Tu userId
        })
      })

      const data = await response.json()
      console.log("📦 Resultado push:", data)
      
      setResult(JSON.stringify({ status: response.status, data }, null, 2))
    } catch (error) {
      console.error("💥 Error:", error)
      setResult(`Error: ${error.message}`)
    }
  }

  const cleanupSubscriptions = async () => {
    try {
      console.log("🧹 Limpiando suscripciones...")
      
      const response = await fetch("/api/notifications/cleanup-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "d8949618-e8a3-4e45-a373-1ad51532534e" // Tu userId
        })
      })

      const data = await response.json()
      console.log("📦 Resultado cleanup:", data)
      
      setResult(JSON.stringify({ status: response.status, data }, null, 2))
    } catch (error) {
      console.error("💥 Error:", error)
      setResult(`Error: ${error.message}`)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧪 Prueba Simple</h1>
      
      <div className="space-x-4 mb-4">
        <button 
          onClick={testAPI}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Probar API
        </button>
        <button 
          onClick={refreshSession}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Refrescar Sesión
        </button>
        <button 
          onClick={forceLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Forzar Logout
        </button>
        <button 
          onClick={testPushNotification}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Probar Push
        </button>
        <button 
          onClick={cleanupSubscriptions}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Limpiar Suscripciones
        </button>
      </div>
      
      {result && (
        <div className="mt-4">
          <h2 className="font-bold mb-2">Resultado:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {result}
          </pre>
        </div>
      )}
    </div>
  )
} 