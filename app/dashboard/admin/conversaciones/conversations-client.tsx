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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Trash2, 
  Search, 
  Filter, 
  Calendar,
  User,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  EyeOn
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

interface Session {
  id: string
  user_id: string
  title: string
  last_message_at: string
  created_at: string
}

interface UserProfile {
  id: string
  full_name: string
  email: string
}

export default function ConversationsClient() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [selectedSession, setSelectedSession] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showHidden, setShowHidden] = useState(false)

  const supabase = createClientComponentClient()

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  // Filtrar conversaciones cuando cambien los filtros
  useEffect(() => {
    loadConversations()
  }, [selectedSession, selectedUser, searchTerm, currentPage, itemsPerPage, showHidden])

  const loadData = async () => {
    try {
      await Promise.all([
        loadConversations(),
        loadSessions(),
        loadUsers()
      ])
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error",
        description: "Error cargando los datos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    try {
      let query = supabase
        .from('ai_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .range(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage - 1
        )

      // Aplicar filtros
      if (selectedSession !== "all") {
        query = query.eq('session_id', selectedSession)
      }
      
      if (selectedUser !== "all") {
        query = query.eq('user_id', selectedUser)
      }

      if (searchTerm) {
        query = query.or(`message.ilike.%${searchTerm}%,response.ilike.%${searchTerm}%`)
      }

      // Aplicar filtro de visibilidad para administradores
      if (!showHidden) {
        query = query.eq('is_hidden', false)
      }

      const { data, error, count } = await query

      if (error) throw error

      setConversations(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error("Error cargando conversaciones:", error)
      toast({
        title: "Error",
        description: "Error cargando conversaciones",
        variant: "destructive"
      })
    }
  }

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_sessions')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error("Error cargando sesiones:", error)
    }
  }

  const loadUsers = async () => {
    try {
      // Obtener usuarios únicos que tienen conversaciones
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('user_id')
        .neq('user_id', 'ai-user') // Excluir usuario genérico

      if (error) throw error

      const uniqueUserIds = [...new Set(data?.map(c => c.user_id) || [])]
      
      if (uniqueUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', uniqueUserIds)

        if (profilesError) throw profilesError
        setUsers(profiles || [])
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error

      toast({
        title: "Conversación eliminada",
        description: "La conversación ha sido eliminada permanentemente"
      })

      // Recargar conversaciones
      loadConversations()
    } catch (error) {
      console.error("Error eliminando conversación:", error)
      toast({
        title: "Error",
        description: "Error eliminando la conversación",
        variant: "destructive"
      })
    }
  }

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.full_name || user.email : userId === 'ai-user' ? 'Usuario Genérico' : 'Usuario Desconocido'
  }

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user?.email || 'N/A'
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
    setCurrentPage(1) // Resetear a la primera página
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
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Conversaciones</p>
                <p className="text-2xl font-bold">{conversations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Sesiones</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Filtros Activos</p>
                <p className="text-2xl font-bold">
                  {(selectedSession !== "all" ? 1 : 0) + (selectedUser !== "all" ? 1 : 0) + (searchTerm ? 1 : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            
            <div>
              <label className="text-sm font-medium mb-2 block">Sesión</label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las sesiones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sesiones</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.title} - {format(new Date(session.last_message_at), 'dd/MM/yyyy', { locale: es })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Usuario</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showHidden"
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="showHidden" className="text-sm font-medium">
                  Mostrar conversaciones ocultas
                </label>
              </div>
              <Button 
                onClick={() => {
                  setSelectedSession("all")
                  setSelectedUser("all")
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

      {/* Tabla de conversaciones con paginador */}
      <Card>
        <CardHeader>
          <CardTitle>Conversaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="all">Todas las Conversaciones</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="rounded-lg border bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Mensaje</TableHead>
                        <TableHead>Respuesta</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Sesión</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversations.map((conversation) => (
                        <TableRow key={conversation.id} className={conversation.is_hidden ? "opacity-60 bg-muted/30" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium">{getUserName(conversation.user_id)}</p>
                                <p className="text-sm text-muted-foreground">{getUserEmail(conversation.user_id)}</p>
                              </div>
                              {conversation.is_hidden && (
                                <Badge variant="secondary" className="text-xs">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Oculto
                                </Badge>
                              )}
                            </div>
                          </TableCell>
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
                            <Badge variant="secondary">
                              {conversation.session_id.substring(0, 8)}...
                            </Badge>
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
                                      Detalles completos de la conversación
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedConversation && (
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Usuario:</h4>
                                        <p>{getUserName(selectedConversation.user_id)} ({getUserEmail(selectedConversation.user_id)})</p>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Fecha:</h4>
                                        <p>{format(new Date(selectedConversation.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</p>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Mensaje del Usuario:</h4>
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
                                      {selectedConversation.context_data && (
                                        <div>
                                          <h4 className="font-medium mb-2">Datos de Contexto:</h4>
                                          <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                                            {JSON.stringify(selectedConversation.context_data, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm("¿Estás seguro de que quieres eliminar permanentemente esta conversación?")) {
                                    deleteConversation(conversation.id)
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Paginador separado */}
              <div className="mt-6 rounded-lg border bg-card shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {conversations.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                    -{Math.min(currentPage * itemsPerPage, conversations.length)} de <span className="font-bold">{conversations.length}</span> resultados
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Selector de filas por página */}
                    <div className="flex items-center gap-1 mr-4">
                      <span className="text-xs">Filas por página:</span>
                      <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={itemsPerPage} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Flechas y números de página */}
                    <Button variant="outline" size="icon" onClick={() => goToPage(1)} disabled={currentPage === 1} className="h-8 w-8">{'<<'}</Button>
                    <Button variant="outline" size="icon" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8">{'<'}</Button>
                    {getPageNumbers().map((n) => (
                      <Button key={n} variant={n === currentPage ? "default" : "outline"} size="icon" onClick={() => goToPage(n)} className="h-8 w-8 font-bold">{n}</Button>
                    ))}
                    <Button variant="outline" size="icon" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 w-8">{'>'}</Button>
                    <Button variant="outline" size="icon" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8">{'>>'}</Button>
                  </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
