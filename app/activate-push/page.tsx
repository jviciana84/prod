"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff } from "lucide-react"
import { toast } from "sonner"

export default function ActivatePushPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleActivate = async () => {
    setIsLoading(true)
    try {
      toast.info("Push notifications anuladas - solo campana activa")
    } catch (error) {
      toast.error("Error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Activar Push</h1>
        <p className="text-gray-600">Página anulada - solo campana activa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>Configuración actual de notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Push Notifications:</span>
            <Badge className="bg-gray-400 text-white">
              <BellOff className="h-3 w-3 mr-1" />
              Anulado
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Campana:</span>
            <Badge className="bg-green-600 text-white">
              <Bell className="h-3 w-3 mr-1" />
              Activa
            </Badge>
          </div>
          
          <Button 
            onClick={handleActivate}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Procesando..." : "Activar (Anulado)"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 