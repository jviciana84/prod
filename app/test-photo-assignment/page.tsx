"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Camera, Bell, CheckCircle } from "lucide-react"

export default function TestPhotoAssignmentPage() {
  const [licensePlate, setLicensePlate] = useState("ABC1234")
  const [model, setModel] = useState("BMW X5")
  const [photographerId, setPhotographerId] = useState("")
  const [loading, setLoading] = useState(false)

  // Simular fotógrafos disponibles
  const photographers = [
    { id: "jordi-id", name: "JordiVi", email: "jordi.viciana84@gmail.com" },
    { id: "test-id-1", name: "Fotógrafo 1", email: "fotografo1@test.com" },
    { id: "test-id-2", name: "Fotógrafo 2", email: "fotografo2@test.com" },
  ]

  const testNotification = async () => {
    if (!photographerId) {
      toast.error("Selecciona un fotógrafo")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/notifications/send-photo-assignment-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photographerId,
          vehicleId: "test-vehicle-" + Date.now(),
          licensePlate,
          model
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Notificación enviada a ${result.photographer}`)
      } else {
        toast.error(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error enviando notificación")
    } finally {
      setLoading(false)
    }
  }

  const testDatabaseTrigger = async () => {
    setLoading(true)
    try {
      // Simular una actualización en la base de datos que activaría el trigger
      const response = await fetch("/api/test-photo-assignment-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photographerId,
          licensePlate,
          model
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Trigger de base de datos ejecutado correctamente")
      } else {
        toast.error(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error ejecutando trigger")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Camera className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prueba de Asignación de Fotógrafos</h1>
          <p className="text-muted-foreground">
            Simula la asignación de fotógrafos y verifica las notificaciones
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulario de prueba */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Simular Asignación
            </CardTitle>
            <CardDescription>
              Prueba el envío de notificaciones cuando se asigna un fotógrafo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">Matrícula del vehículo</Label>
              <Input
                id="licensePlate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="ABC1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo del vehículo</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="BMW X5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photographer">Fotógrafo a asignar</Label>
              <Select value={photographerId} onValueChange={setPhotographerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un fotógrafo" />
                </SelectTrigger>
                <SelectContent>
                  {photographers.map((photographer) => (
                    <SelectItem key={photographer.id} value={photographer.id}>
                      {photographer.name} ({photographer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={testNotification} 
                disabled={loading || !photographerId}
                className="flex-1"
              >
                <Bell className="h-4 w-4 mr-2" />
                Enviar Notificación
              </Button>
              
              <Button 
                onClick={testDatabaseTrigger} 
                disabled={loading || !photographerId}
                variant="outline"
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Probar Trigger DB
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información del sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Información del Sistema
            </CardTitle>
            <CardDescription>
              Estado actual de las notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Fotógrafos disponibles:</h4>
              <ul className="text-sm space-y-1">
                {photographers.map((photographer) => (
                  <li key={photographer.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {photographer.name} - {photographer.email}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Tipos de notificación:</h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  📸 Nuevas fotografías asignadas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Notificación push (si está habilitada)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Notificación en campana
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Las notificaciones se envían automáticamente cuando:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Se asigna un fotógrafo manualmente</li>
                <li>• Se ejecuta la asignación automática</li>
                <li>• Se inserta un nuevo vehículo con fotógrafo</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 