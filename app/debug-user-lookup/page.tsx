"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function DebugUserLookup() {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkUserInAuth = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/debug-user-lookup", {
        method: "GET"
      })

      const data = await response.json()
      setResult(data)
      toast.info("Búsqueda completada")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error buscando usuario")
    } finally {
      setIsLoading(false)
    }
  }

  const checkUserInProfiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/debug-user-profiles", {
        method: "GET"
      })

      const data = await response.json()
      setResult(data)
      toast.info("Búsqueda en profiles completada")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error buscando en profiles")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Debug Búsqueda de Usuario</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuario viciana84@gmail.com</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={checkUserInAuth}
              disabled={isLoading}
              variant="outline"
            >
              Buscar en auth.users
            </Button>
            
            <Button 
              onClick={checkUserInProfiles}
              disabled={isLoading}
              variant="default"
            >
              Buscar en profiles
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 