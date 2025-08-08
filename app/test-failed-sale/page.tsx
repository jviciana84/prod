"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bell, AlertTriangle, Car, CheckCircle, Shield } from "lucide-react"
import { toast } from "sonner"

export default function TestFailedSalePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    license_plate: "",
    model: "",
    advisor: "",
    failed_reason: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const testFailedSaleNotification = async () => {
    if (!formData.license_plate || !formData.model || !formData.advisor) {
      toast.error("Por favor completa todos los campos obligatorios")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/failed-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: formData.license_plate.toUpperCase(),
          model: formData.model,
          advisor: formData.advisor,
          failed_reason: formData.failed_reason,
          failed_date: new Date().toISOString()
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`✅ Notificaciones enviadas a ${result.sent} administradores para ${result.vehicle}`)
        setFormData({
          license_plate: "",
          model: "",
          advisor: "",
          failed_reason: ""
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

  const simulateFailedSaleTrigger = async () => {
    setIsLoading(true)
    try {
      // Simular actualización en pedidos_validados que activaría el trigger
      const response = await fetch("/api/test/simulate-failed-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: formData.license_plate.toUpperCase() || "TEST001",
          model: formData.model || "BMW X3",
          advisor: formData.advisor || "JordiVi",
          failed_reason: formData.failed_reason || "Prueba de simulación"
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
        <h1 className="text-3xl font-bold mb-2">Test Ventas Caídas</h1>
        <p className="text-gray-600">Prueba las notificaciones automáticas de ventas caídas</p>
      </div>

      <div className="grid gap-6">
        {/* Formulario de prueba */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Datos de la Venta Caída
            </CardTitle>
            <CardDescription>Completa los datos para simular una venta caída</CardDescription>
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
                <Label htmlFor="failed_reason">Razón de la Caída</Label>
                <Input
                  id="failed_reason"
                  value={formData.failed_reason}
                  onChange={(e) => handleInputChange("failed_reason", e.target.value)}
                  placeholder="Cliente canceló"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="failed_reason_textarea">Razón Detallada</Label>
              <Textarea
                id="failed_reason_textarea"
                value={formData.failed_reason}
                onChange={(e) => handleInputChange("failed_reason", e.target.value)}
                placeholder="Describe la razón por la que la venta se cayó..."
                rows={3}
              />
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
                onClick={testFailedSaleNotification}
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
                onClick={simulateFailedSaleTrigger}
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
              <p><strong>Notificación Directa:</strong> Envía la notificación directamente a Admin/Supervisor/Director</p>
              <p><strong>Simular Trigger:</strong> Simula la actualización en pedidos_validados que activaría el trigger automático</p>
            </div>
          </CardContent>
        </Card>

        {/* Información */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Flujo Automático:</strong></p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Se marca una venta como caída en Gestión de Ventas</li>
              <li>Se actualiza <code>is_failed_sale = true</code> en pedidos_validados</li>
              <li>Trigger automático envía notificación de campana a <strong>Admin/Supervisor/Director</strong></li>
              <li>Los administradores ven la notificación en el header</li>
            </ol>
            <p className="mt-4"><strong>Nota:</strong> Las notificaciones aparecen automáticamente en la campana sin pedir permisos del navegador.</p>
            <p className="mt-2"><strong>Destinatarios:</strong> Solo usuarios con roles Admin, Supervisor o Director</p>
            <p className="mt-2"><strong>Razones comunes:</strong> Cliente canceló, problemas de financiación, vehículo no disponible, etc.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
