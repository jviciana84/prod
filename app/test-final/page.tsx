"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestFinalPage() {
  const [result, setResult] = useState("")

  async function testInsert() {
    try {
      const response = await fetch("/api/notifications/simple-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "test-" + Date.now(),
          p256dh: "test-p256dh",
          auth: "test-auth",
        }),
      })

      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult("Error: " + error.message)
    }
  }

  return (
    <div className="p-6">
      <Button onClick={testInsert}>PROBAR INSERCIÓN DIRECTA</Button>
      <pre className="mt-4 p-4 bg-gray-100 rounded">{result}</pre>
    </div>
  )
}
