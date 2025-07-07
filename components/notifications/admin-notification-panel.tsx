"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Bell, Plus, Send } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface NotificationType {
  id: string
  name: string
  description: string
  category: string
  is_active: boolean
  is_critical: boolean
  created_at: string
}

interface TestNotification {
  title: string
  body: string
  category: string
  data?: any
}

export default function AdminNotificationPanel() {
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingType, setIsAddingType] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [newType, setNewType] = useState({
    name: "",
    description: "",
    category: "incidencias",
    is_critical: false,
  })
  const [testNotification, setTestNotification] = useState<TestNotification>({
    title: "",
    body: "",
    category: "incidencias",
  })

  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadNotificationTypes()
  }, [])

  const loadNotificationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_types")
        .select("*")
        .order("category", { ascending: true })

      if (error) throw error
      setNotificationTypes(data || [])
    } catch (error) {
      console.error("Error loading notification types:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los tipos de notificaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("notification_types")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      setNotificationTypes((prev) => prev.map((type) => (type.id === id ? { ...type, is_active: isActive } : type)))

      toast({
        title: "Actualizado",
        description: `Tipo de notificación ${isActive ? "activado" : "desactivado"}`,
      })
    } catch (error) {
      console.error("Error updating notification type:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el tipo de notificación",
        variant: "destructive",
      })
    }
  }

  const handleAddType = async () => {
    if (!newType.name || !newType.description) {
      toast({
        title: "Error",
        description: "Nombre y descripción son requeridos",
        variant: "destructive",
      })
      return
    }

    setIsAddingType(true)
    try {
      const { data, error } = await supabase
        .from("notification_types")
        .insert([
          {
            name: newType.name.toLowerCase().replace(/\s+/g, "_"),
            description: newType.description,
            category: newType.category,
            is_critical: newType.is_critical,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setNotificationTypes((prev) => [...prev, data])
      setNewType({ name: "", description: "", category: "incidencias", is_critical: false })

      toast({
        title: "Éxito",
        description: "Tipo de notificación creado correctamente",
      })
    } catch (error) {
      console.error("Error adding notification type:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el tipo de notificación",
        variant: "destructive",
      })
    } finally {
      setIsAddingType(false)
    }
  }

  const handleSendTestNotification = async () => {
    if (!testNotification.title || !testNotification.body) {
      toast({
        title: "Error",
        description: "Título y mensaje son requeridos",
        variant: "destructive",
      })
      return
    }

    setIsSendingTest(true)
    try {
      const response = await fetch("/api/notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testNotification),
      })

      if (!response.ok) throw new Error("Error sending test notification")

      toast({
        title: "Éxito",
        description: "Notificación de prueba enviada",
      })

      setTestNotification({ title: "", body: "", category: "incidencias" })
    } catch (error) {
      console.error("Error sending test notification:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación de prueba",
        variant: "destructive",
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Cargando panel de administración...</div>
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tipos</p>
                <p className="text-2xl font-bold">{notificationTypes.length}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {notificationTypes.filter((t) => t.is_active).length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Críticos</p>
                <p className="text-2xl font-bold text-red-600">
                  {notificationTypes.filter((t) => t.is_critical).length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestión de tipos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tipos de Notificaciones</CardTitle>
              <CardDescription>Gestiona los tipos de notificaciones disponibles en el sistema</CardDescription>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Tipo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Tipo de Notificación</DialogTitle>
                  <DialogDescription>Crea un nuevo tipo de notificación para el sistema</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={newType.name}
                      onChange={(e) => setNewType((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="ej: nueva_incidencia"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={newType.description}
                      onChange={(e) => setNewType((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="ej: Nueva incidencia registrada"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={newType.category}
                      onValueChange={(value) => setNewType((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incidencias">Incidencias</SelectItem>
                        <SelectItem value="vehiculos">Vehículos</SelectItem>
                        <SelectItem value="fotos">Fotografías</SelectItem>
                        <SelectItem value="incentivos">Incentivos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="critical"
                      checked={newType.is_critical}
                      onCheckedChange={(checked) => setNewType((prev) => ({ ...prev, is_critical: checked }))}
                    />
                    <Label htmlFor="critical">Notificación crítica (no se puede desactivar por usuarios)</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={handleAddType} disabled={isAddingType}>
                    {isAddingType ? "Creando..." : "Crear"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{type.description}</span>
                    <Badge variant="outline">{type.category}</Badge>
                    {type.is_critical && <Badge variant="destructive">Crítica</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{type.name}</p>
                </div>

                <Switch checked={type.is_active} onCheckedChange={(checked) => handleToggleActive(type.id, checked)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enviar notificación de prueba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Notificación de Prueba
          </CardTitle>
          <CardDescription>Envía una notificación de prueba a todos los usuarios suscritos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-title">Título</Label>
              <Input
                id="test-title"
                value={testNotification.title}
                onChange={(e) => setTestNotification((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Título de la notificación"
              />
            </div>

            <div>
              <Label htmlFor="test-body">Mensaje</Label>
              <Textarea
                id="test-body"
                value={testNotification.body}
                onChange={(e) => setTestNotification((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Contenido de la notificación"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="test-category">Categoría</Label>
              <Select
                value={testNotification.category}
                onValueChange={(value) => setTestNotification((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incidencias">Incidencias</SelectItem>
                  <SelectItem value="vehiculos">Vehículos</SelectItem>
                  <SelectItem value="fotos">Fotografías</SelectItem>
                  <SelectItem value="incentivos">Incentivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSendTestNotification} disabled={isSendingTest}>
              {isSendingTest ? "Enviando..." : "Enviar Notificación de Prueba"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
