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
  EyeOn,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  TrendingDown
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
  
  // Estados para feedback
  const [feedbackData, setFeedbackData] = useState<any[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackPage, setFeedbackPage] = useState(1)
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1)
  const [feedbackType, setFeedbackType] = useState<string>('all')

  const supabase = createClientComponentClient()

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  // Filtrar conversaciones cuando cambien los filtros
  useEffect(() => {
    loadConversations()
  }, [selectedSession, selectedUser, searchTerm, currentPage, itemsPerPage, showHidden])

  // Cargar feedback cuando cambien los filtros
  useEffect(() => {
    loadFeedback()
  }, [feedbackPage, feedbackType])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar datos en paralelo, pero manejar errores individualmente
      const results = await Promise.allSettled([
        loadConversations(),
        loadSessions(),
        loadUsers()
      ])

      // Verificar si algún proceso falló
      const failed = results.filter(result => result.status === 'rejected')
      if (failed.length > 0) {
        console.warn(`${failed.length} procesos fallaron al cargar datos`)
      }

    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error",
        description: "Error cargando algunos datos",
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

  // Cargar feedback
  const loadFeedback = async () => {
    setFeedbackLoading(true)
    try {
      const params = new URLSearchParams({
        page: feedbackPage.toString(),
        limit: '20'
      })

      if (feedbackType !== 'all') {
        params.append('type', feedbackType)
      }

      const response = await fetch(`/api/feedback?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error cargando feedback')
      }

      setFeedbackData(data.feedback || [])
      setFeedbackTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error("Error loading feedback:", error)
      toast({
        title: "Error",
        description: "Error al cargar el feedback.",
        variant: "destructive"
      })
    } finally {
      setFeedbackLoading(false)
    }
  }

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_sessions')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error obteniendo sesiones:", error)
        setSessions([])
        return
      }
      
      setSessions(data || [])
    } catch (error) {
      console.error("Error cargando sesiones:", error)
      setSessions([])
    }
  }

  const loadUsers = async () => {
    try {
      // Obtener usuarios únicos que tienen conversaciones
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('user_id')
        .neq('user_id', 'ai-user') // Excluir usuario genérico

      if (error) {
        console.error("Error obteniendo user_ids:", error)
        setUsers([])
        return
      }

      const uniqueUserIds = [...new Set(data?.map(c => c.user_id) || [])]
      
      if (uniqueUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', uniqueUserIds)

        if (profilesError) {
          console.error("Error obteniendo profiles:", profilesError)
          setUsers([])
          return
        }
        
        setUsers(profiles || [])
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error)
      setUsers([])
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
                 <Tabs defaultValue="conversations" className="w-full">
                   <TabsList className="grid w-full grid-cols-3">
                     <TabsTrigger value="conversations">Conversaciones</TabsTrigger>
                     <TabsTrigger value="feedback">Feedback</TabsTrigger>
                     <TabsTrigger value="insights">Insights</TabsTrigger>
                   </TabsList>
            
            <TabsContent value="conversations" className="space-y-4">
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

                   {/* Pestaña de Feedback */}
                   <TabsContent value="feedback" className="space-y-4">
                     {/* Filtros de feedback */}
                     <div className="flex gap-4 mb-4">
                       <Select value={feedbackType} onValueChange={(value) => {
                         setFeedbackType(value)
                         setFeedbackPage(1)
                       }}>
                         <SelectTrigger className="w-[200px]">
                           <SelectValue placeholder="Tipo de feedback" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todos</SelectItem>
                           <SelectItem value="positive">Positivo 👍</SelectItem>
                           <SelectItem value="negative">Negativo 👎</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     {/* Tabla de feedback */}
                     <div className="rounded-lg border bg-card shadow-sm">
                       <div className="overflow-x-auto">
                         <Table>
                           <TableHeader>
                             <TableRow>
                               <TableHead>Usuario</TableHead>
                               <TableHead>Tipo</TableHead>
                               <TableHead>Mensaje Original</TableHead>
                               <TableHead>Respuesta</TableHead>
                               <TableHead>Comentario</TableHead>
                               <TableHead>Fecha</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {feedbackLoading ? (
                               <TableRow>
                                 <TableCell colSpan={6} className="text-center py-4">
                                   Cargando feedback...
                                 </TableCell>
                               </TableRow>
                             ) : feedbackData.length === 0 ? (
                               <TableRow>
                                 <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                   No hay feedback disponible
                                 </TableCell>
                               </TableRow>
                             ) : (
                               feedbackData.map((feedback) => (
                                 <TableRow key={feedback.id}>
                                   <TableCell>
                                     <div>
                                       <p className="font-medium">{feedback.profiles?.full_name || 'Usuario'}</p>
                                       <p className="text-sm text-muted-foreground">{feedback.profiles?.email}</p>
                                     </div>
                                   </TableCell>
                                   <TableCell>
                                     <Badge 
                                       variant={feedback.feedback_type === 'positive' ? 'default' : 'destructive'}
                                       className="flex items-center gap-1 w-fit"
                                     >
                                       {feedback.feedback_type === 'positive' ? (
                                         <><ThumbsUp className="h-3 w-3" /> Positivo</>
                                       ) : (
                                         <><ThumbsDown className="h-3 w-3" /> Negativo</>
                                       )}
                                     </Badge>
                                   </TableCell>
                                   <TableCell>
                                     <div className="max-w-xs">
                                       <p className="truncate" title={feedback.ai_conversations?.message}>
                                         {feedback.ai_conversations?.message}
                                       </p>
                                     </div>
                                   </TableCell>
                                   <TableCell>
                                     <div className="max-w-xs">
                                       <p className="truncate" title={feedback.ai_conversations?.response}>
                                         {feedback.ai_conversations?.response}
                                       </p>
                                     </div>
                                   </TableCell>
                                   <TableCell>
                                     <div className="max-w-xs">
                                       <p className="truncate" title={feedback.feedback_text || 'Sin comentario'}>
                                         {feedback.feedback_text || 'Sin comentario'}
                                       </p>
                                     </div>
                                   </TableCell>
                                   <TableCell>
                                     <Badge variant="outline">
                                       {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                     </Badge>
                                   </TableCell>
                                 </TableRow>
                               ))
                             )}
                           </TableBody>
                         </Table>
                       </div>
                     </div>

                     {/* Paginador de feedback */}
                     <div className="mt-6 rounded-lg border bg-card shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                       <div className="text-sm text-muted-foreground">
                         Mostrando {feedbackData.length === 0 ? 0 : (feedbackPage - 1) * 20 + 1}
                         -{Math.min(feedbackPage * 20, feedbackData.length)} de <span className="font-bold">{feedbackData.length}</span> resultados
                       </div>
                       <div className="flex items-center gap-2">
                         <Button variant="outline" size="icon" onClick={() => setFeedbackPage(1)} disabled={feedbackPage === 1} className="h-8 w-8">{'<<'}</Button>
                         <Button variant="outline" size="icon" onClick={() => setFeedbackPage(feedbackPage - 1)} disabled={feedbackPage === 1} className="h-8 w-8">{'<'}</Button>
                         <span className="px-3 py-1 text-sm font-medium">
                           Página {feedbackPage} de {feedbackTotalPages}
                         </span>
                         <Button variant="outline" size="icon" onClick={() => setFeedbackPage(feedbackPage + 1)} disabled={feedbackPage === feedbackTotalPages} className="h-8 w-8">{'>'}</Button>
                         <Button variant="outline" size="icon" onClick={() => setFeedbackPage(feedbackTotalPages)} disabled={feedbackPage === feedbackTotalPages} className="h-8 w-8">{'>>'}</Button>
                       </div>
                     </div>
                   </TabsContent>

                   {/* Pestaña de Insights */}
                   <TabsContent value="insights" className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                       {/* Estadísticas principales */}
                       <Card>
                         <CardHeader className="pb-2">
                           <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
                         </CardHeader>
                         <CardContent>
                           <div className="text-2xl font-bold text-green-600">85%</div>
                           <p className="text-xs text-muted-foreground">+5% vs período anterior</p>
                         </CardContent>
                       </Card>
                       
                       <Card>
                         <CardHeader className="pb-2">
                           <CardTitle className="text-sm font-medium">Feedback Total</CardTitle>
                         </CardHeader>
                         <CardContent>
                           <div className="text-2xl font-bold">47</div>
                           <p className="text-xs text-muted-foreground">Últimos 7 días</p>
                         </CardContent>
                       </Card>

                       <Card>
                         <CardHeader className="pb-2">
                           <CardTitle className="text-sm font-medium">Problemas Críticos</CardTitle>
                         </CardHeader>
                         <CardContent>
                           <div className="text-2xl font-bold text-red-600">3</div>
                           <p className="text-xs text-muted-foreground">Requieren atención</p>
                         </CardContent>
                       </Card>
                     </div>

                     {/* Acciones de mejora */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <TrendingUp className="h-5 w-5" />
                           Mejoras Automáticas Sugeridas
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-3">
                           <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                             <div>
                               <p className="font-medium">🔍 Verificación de Datos</p>
                               <p className="text-sm text-muted-foreground">3 usuarios reportaron información incorrecta</p>
                             </div>
                             <Button size="sm" variant="outline">Aplicar</Button>
                           </div>
                           
                           <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                             <div>
                               <p className="font-medium">📝 Respuestas Más Completas</p>
                               <p className="text-sm text-muted-foreground">5 usuarios pidieron más detalles</p>
                             </div>
                             <Button size="sm" variant="outline">Aplicar</Button>
                           </div>

                           <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                             <div>
                               <p className="font-medium">🎯 Lenguaje Más Claro</p>
                               <p className="text-sm text-muted-foreground">2 usuarios encontraron respuestas confusas</p>
                             </div>
                             <Button size="sm" variant="outline">Aplicar</Button>
                           </div>
                         </div>
                       </CardContent>
                     </Card>

                     {/* Análisis de patrones */}
                     <Card>
                       <CardHeader>
                         <CardTitle>Análisis de Patrones</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                             <h4 className="font-medium mb-2">Problemas Más Comunes</h4>
                             <div className="space-y-2">
                               <div className="flex justify-between text-sm">
                                 <span>Información incorrecta</span>
                                 <span className="font-medium">3 casos</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span>Respuesta incompleta</span>
                                 <span className="font-medium">5 casos</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span>Lenguaje confuso</span>
                                 <span className="font-medium">2 casos</span>
                               </div>
                             </div>
                           </div>
                           
                           <div>
                             <h4 className="font-medium mb-2">Horarios Problemáticos</h4>
                             <div className="space-y-2">
                               <div className="flex justify-between text-sm">
                                 <span>Mañana (9-12h)</span>
                                 <span className="font-medium">40% problemas</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span>Tarde (14-17h)</span>
                                 <span className="font-medium">35% problemas</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span>Noche (18-21h)</span>
                                 <span className="font-medium">25% problemas</span>
                               </div>
                             </div>
                           </div>
                         </div>
                       </CardContent>
                     </Card>

                     {/* Botones de acción */}
                     <div className="flex gap-3">
                       <Button className="bg-blue-600 hover:bg-blue-700">
                         <TrendingUp className="h-4 w-4 mr-2" />
                         Analizar Feedback Reciente
                       </Button>
                       <Button variant="outline">
                         <TrendingDown className="h-4 w-4 mr-2" />
                         Ver Reporte Completo
                       </Button>
                       <Button variant="outline">
                         🔄 Aplicar Todas las Mejoras
                       </Button>
                     </div>
                   </TabsContent>
                 </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
