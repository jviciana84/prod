"use client"

import { useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { format, parseISO, addMonths } from "date-fns"
import { es } from "date-fns/locale"
import { PlusCircle, Trash2, Edit, Save, X, AlertCircle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FooterMessage {
  id: number
  message: string
  expiry_date: string
  created_at: string
  updated_at?: string
}

interface FooterMessageManagerProps {
  initialMessages: FooterMessage[]
}

export default function FooterMessageManager({ initialMessages }: FooterMessageManagerProps) {
  const [messages, setMessages] = useState<FooterMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [newExpiryDate, setNewExpiryDate] = useState(() => {
    // Fecha predeterminada: 3 meses a partir de hoy
    const date = addMonths(new Date(), 3)
    return format(date, "yyyy-MM-dd")
  })
  const [editMessage, setEditMessage] = useState("")
  const [editExpiryDate, setEditExpiryDate] = useState("")

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Añadir nuevo mensaje
  const handleAddMessage = async () => {
    if (!newMessage.trim()) {
      toast({
        title: "Error",
        description: "El mensaje no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Formatear fecha de caducidad
      const expiryDate = new Date(`${newExpiryDate}T23:59:59`)

      const response = await fetch("/api/footer/create-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error al crear mensaje")
      }

      // Actualizar la lista de mensajes
      const { data: updatedMessages, error: fetchError } = await supabase
        .from("footer_messages")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setMessages(updatedMessages || [])
      setNewMessage("")
      setShowAddForm(false)

      toast({
        title: "Mensaje añadido",
        description: "El mensaje se ha añadido correctamente",
      })
    } catch (error: any) {
      console.error("Error al añadir mensaje:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el mensaje",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminar mensaje
  const handleDeleteMessage = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este mensaje? Esta acción no se puede deshacer.")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/footer/delete-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error al eliminar mensaje")
      }

      // Actualizar la lista de mensajes
      setMessages(messages.filter((message) => message.id !== id))

      toast({
        title: "Mensaje eliminado",
        description: "El mensaje se ha eliminado correctamente",
      })
    } catch (error: any) {
      console.error("Error al eliminar mensaje:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el mensaje",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Iniciar edición
  const handleEditStart = (message: FooterMessage) => {
    setEditingId(message.id)
    setEditMessage(message.message)
    setEditExpiryDate(message.expiry_date.split("T")[0])
  }

  // Cancelar edición
  const handleEditCancel = () => {
    setEditingId(null)
    setEditMessage("")
    setEditExpiryDate("")
  }

  // Guardar cambios
  const handleSaveEdit = async (id: number) => {
    if (!editMessage.trim()) {
      toast({
        title: "Error",
        description: "El mensaje no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Formatear fecha de caducidad
      const expiryDate = new Date(`${editExpiryDate}T23:59:59`)

      const response = await fetch("/api/footer/update-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          message: editMessage,
          expiryDate: editExpiryDate,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error al actualizar mensaje")
      }

      // Actualizar la lista de mensajes
      const { data: updatedMessages, error: fetchError } = await supabase
        .from("footer_messages")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setMessages(updatedMessages || [])
      setEditingId(null)

      toast({
        title: "Mensaje actualizado",
        description: "El mensaje se ha actualizado correctamente",
      })
    } catch (error: any) {
      console.error("Error al actualizar mensaje:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el mensaje",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar si un mensaje ha caducado
  const isExpired = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    return now > expiry
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return "-"
    }
  }

  return (
    <div className="space-y-6">
      {/* Botón para añadir nuevo mensaje */}
      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Añadir nuevo mensaje
        </Button>
      )}

      {/* Formulario para añadir nuevo mensaje */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Añadir nuevo mensaje</CardTitle>
            <CardDescription>
              Este mensaje se mostrará en el footer de la aplicación hasta la fecha de caducidad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Mensaje
              </label>
              <Textarea
                id="message"
                placeholder="Escribe el mensaje que se mostrará en el footer..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="expiryDate" className="text-sm font-medium">
                Fecha de caducidad
              </label>
              <Input
                id="expiryDate"
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">El mensaje dejará de mostrarse después de esta fecha.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowAddForm(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleAddMessage} disabled={isLoading}>
              {isLoading ? <BMWMSpinner size={16} className="mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              Añadir mensaje
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Tabla de mensajes */}
      <Card>
        <CardHeader>
          <CardTitle>Mensajes del footer</CardTitle>
          <CardDescription>
            Lista de todos los mensajes configurados para mostrarse en el footer de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No hay mensajes configurados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Fecha de caducidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => {
                  const expired = isExpired(message.expiry_date)
                  const isEditing = editingId === message.id

                  return (
                    <TableRow key={message.id} className={cn(expired && "opacity-60")}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Textarea
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            rows={2}
                            className="resize-none"
                          />
                        ) : (
                          message.message
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editExpiryDate}
                            onChange={(e) => setEditExpiryDate(e.target.value)}
                          />
                        ) : (
                          formatDate(message.expiry_date)
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={expired ? "destructive" : "success"}>{expired ? "Caducado" : "Activo"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveEdit(message.id)}
                              disabled={isLoading}
                              className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-100"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleEditCancel}
                              disabled={isLoading}
                              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditStart(message)}
                              disabled={isLoading}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMessage(message.id)}
                              disabled={isLoading}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
