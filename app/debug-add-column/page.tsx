"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

export default function DebugAddColumnPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const addMovementsLogColumn = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/debug/add-movements-log-column", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Error desconocido"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Debug: Agregar Columna
          </CardTitle>
          <CardDescription>
            Agregar la columna movements_log a external_material_vehicles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={addMovementsLogColumn} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Ejecutando...
              </>
            ) : (
              "Agregar Columna movements_log"
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.success ? result.message : result.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 