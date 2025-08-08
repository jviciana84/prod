"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bell, Car, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function TestVehicleCertificationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    license_plate: "",
    model: "",
    advisor: "",
    or_value: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const testVehicleCertification = async () => {
    if (!formData.license_plate || !formData.model || !formData.advisor) {
      toast.error("Por favor completa todos los campos obligatorios")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/vehicle-certified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: formData.license_plate.toUpperCase(),
          model: formData.model,
          advisor: formData.advisor,
          or_value: formData.or_value,
          certified_at: new Date().toISOString()
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`✅ Notificación enviada a ${result.asesor} para ${result.vehicle}`)
        setFormData({
          license_plate: "",
          model: "",
          advisor: "",
          or_value: ""
        })
      } else {
        toast.error(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  const simulateTrigger = async () => {
    setIsLoading(true)
    try {
      // Simular inserción en entregas que activaría el trigger
      const response = await fetch("/api/test/simulate-vehicle-certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: formData.license_plate.toUpperCase() || "TEST001",
          model: formData.model || "BMW X3",
          advisor: formData.advisor || "JordiVi",
          or_value: formData.or_value || "12345"
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`✅ Simulación completada: ${result.message}`)
      } else {
        toast.error(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Test Certificación Vehículos</h1>
        <p className="text-gray-600">Prueba las notificaciones automáticas de vehículos certificados</p>
      </div>

      <div className="grid gap-6">
        {/* Formulario de prueba */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Datos del Vehículo
            </CardTitle>
            <CardDescription>Completa los datos para simular la certificación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license_plate">Matrícula *</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => handleInputChange("license_plate", e.target.value)}
                  placeholder="1234ABC"
                />
              </div>
              <div>
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  placeholder="BMW X3"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="advisor">Asesor *</Label>
                <Input
                  id="advisor"
                  value={formData.advisor}
                  onChange={(e) => handleInputChange("advisor", e.target.value)}
                  placeholder="JordiVi"
                />
              </div>
              <div>
                <Label htmlFor="or_value">OR</Label>
                <Input
                  id="or_value"
                  value={formData.or_value}
                  onChange={(e) => handleInputChange("or_value", e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de prueba */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Pruebas de Notificación
            </CardTitle>
            <CardDescription>Elige el tipo de prueba que quieres realizar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={testVehicleCertification}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Enviando..." : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Enviar Notificación Directa
                  </>
                )}
              </Button>
              
              <Button 
                onClick={simulateTrigger}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? "Simulando..." : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Simular Trigger Automático
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 space-y-2">
              <p><strong>Notificación Directa:</strong> Envía la notificación directamente al asesor</p>
              <p><strong>Simular Trigger:</strong> Simula la inserción en entregas que activaría el trigger automático</p>
            </div>
          </CardContent>
        </Card>

        {/* Información */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Flujo Automático:</strong></p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Mecánico completa CyP y Foto360 en Gestión de Ventas</li>
              <li>Trigger automático inserta en tabla <code>entregas</code></li>
              <li>Trigger de notificación envía campana al asesor</li>
              <li>Asesor ve la notificación en el header</li>
            </ol>
            <p className="mt-4"><strong>Nota:</strong> Las notificaciones aparecen automáticamente en la campana sin pedir permisos del navegador.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
