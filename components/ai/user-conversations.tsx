"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Eye, 
  EyeOff, 
  Search, 
  Trash2,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Conversation {
  id: string
  user_id: string
  session_id: string
  message: string
  response: string
  created_at: string
  context_data?: any
  is_hidden?: boolean
}

export default function UserConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showHidden, setShowHidden] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadConversations()
  }, [currentPage, itemsPerPage, searchTerm, showHidden])

  const loadConversations = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        includeHidden: showHidden.toString()
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/conversations/user?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando conversaciones')
      }

      setConversations(data.conversations)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error cargando conversaciones:', error)
      toast({
        title: "Error",
        description: "Error cargando las conversaciones",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (conversationId: string, isHidden: boolean) => {
    try {
      const response = await fetch('/api/conversations/toggle-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          isHidden: !isHidden
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando visibilidad')
      }

      toast({
        title: "Éxito",
        description: data.message
      })

      // Recargar conversaciones
      loadConversations()
    } catch (error) {
      console.error('Error cambiando visibilidad:', error)
      toast({
        title: "Error",
        description: "Error actualizando la conversación",
        variant: "destructive"
      })
    }
  }

  // Funciones de paginación
  const getPageNumbers = () => {
    const maxPagesToShow = 5
    let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let end = start + maxPagesToShow - 1
    if (end > totalPages) {
      end = totalPages
      start = Math.max(1, end - maxPagesToShow + 1)
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando conversaciones...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Conversaciones con Edelweiss</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en mensajes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showHiddenUser"
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="showHiddenUser" className="text-sm font-medium">
                  Mostrar conversaciones ocultas
                </label>
              </div>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm("")
                  setShowHidden(false)
                  setCurrentPage(1)
                }}
                variant="outline"
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de conversaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Conversaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Respuesta</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conversation) => (
                    <TableRow key={conversation.id} className={conversation.is_hidden ? "opacity-60 bg-muted/30" : ""}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate" title={conversation.message}>
                            {conversation.message}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate" title={conversation.response}>
                            {conversation.response}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {format(new Date(conversation.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {conversation.is_hidden ? (
                          <Badge variant="secondary" className="text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Oculto
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Visible
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedConversation(conversation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Conversación Completa</DialogTitle>
                                <DialogDescription>
                                  Detalles completos de tu conversación
                                </DialogDescription>
                              </DialogHeader>
                              {selectedConversation && (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Fecha:</h4>
                                    <p>{format(new Date(selectedConversation.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Tu Mensaje:</h4>
                                    <div className="bg-muted p-3 rounded-md">
                                      <p>{selectedConversation.message}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Respuesta de Edelweiss:</h4>
                                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                                      <p>{selectedConversation.response}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleVisibility(conversation.id, conversation.is_hidden || false)}
                            className={conversation.is_hidden ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"}
                            title={conversation.is_hidden ? "Mostrar conversación" : "Ocultar conversación"}
                          >
                            {conversation.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginador */}
            {totalPages > 1 && (
              <div className="mt-6 rounded-lg border bg-card shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {conversations.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                  -{Math.min(currentPage * itemsPerPage, conversations.length)} de <span className="font-bold">{conversations.length}</span> resultados
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 mr-4">
                    <span className="text-xs">Filas por página:</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => handleItemsPerPageChange(e.target.value)}
                      className="h-8 w-[70px] rounded border px-2 text-sm"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => goToPage(1)} disabled={currentPage === 1} className="h-8 w-8">{'<<'}</Button>
                  <Button variant="outline" size="icon" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8">{'<'}</Button>
                  {getPageNumbers().map((n) => (
                    <Button key={n} variant={n === currentPage ? "default" : "outline"} size="icon" onClick={() => goToPage(n)} className="h-8 w-8 font-bold">{n}</Button>
                  ))}
                  <Button variant="outline" size="icon" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 w-8">{'>'}</Button>
                  <Button variant="outline" size="icon" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8">{'>>'}</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
