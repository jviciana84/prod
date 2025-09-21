'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, MessageSquare, Clock, User, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

interface Conversation {
  id: string
  message: string
  response: string
  created_at: string
  user_id: string
  profiles?: {
    full_name: string
    email: string
    role: string
  }
}

interface Session {
  id: string
  title: string
  last_message_at: string
  created_at: string
  message_count?: number
  user_id: string
  profiles?: {
    full_name: string
    email: string
    role: string
    position?: string
  }
}

export default function AdminConversacionesPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Cargar sesiones cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  // Cargar sesiones del usuario
  const loadSessions = async () => {
    if (!user) {
      console.log('No hay usuario, esperando...')
      setLoading(false)
      return
    }
    
    console.log('Usuario disponible:', user.id)
    
    try {
      setLoading(true)
      const response = await fetch('/api/ai-assistant/conversations?action=sessions', {
        credentials: 'include'
      })
      if (!response.ok) {
        let errorMessage = 'Error cargando sesiones'
        try {
          const errorData = await response.json()
          console.error('Error cargando sesiones:', errorData)
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch (parseError) {
          console.error('Error parseando respuesta de error:', parseError)
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error cargando sesiones:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar las conversaciones",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar conversaciones de una sesión
  const loadConversations = async (sessionId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ai-assistant/conversations?sessionId=${sessionId}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Error cargando conversaciones')
      }
      const data = await response.json()
      setConversations(data.history || [])
      setSelectedSession(sessionId)
    } catch (error) {
      console.error('Error cargando conversaciones:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones de esta sesión",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Eliminar sesión
  const deleteSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) return
    
    try {
      const response = await fetch(`/api/ai-assistant/conversations?sessionId=${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
        if (selectedSession === sessionId) {
          setSelectedSession(null)
          setConversations([])
        }
        toast({
          title: "Conversación eliminada",
          description: "La conversación ha sido eliminada exitosamente"
        })
      } else {
        throw new Error('Error eliminando conversación')
      }
    } catch (error) {
      console.error('Error eliminando sesión:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la conversación",
        variant: "destructive"
      })
    }
  }

  // Limpiar conversaciones antiguas
  const cleanupOldConversations = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todas las conversaciones antiguas (más de 30 días)?')) return
    
    try {
      const response = await fetch('/api/ai-assistant/conversations?action=cleanup', {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        loadSessions()
        toast({
          title: "Limpieza completada",
          description: "Las conversaciones antiguas han sido eliminadas"
        })
      } else {
        throw new Error('Error limpiando conversaciones')
      }
    } catch (error) {
      console.error('Error limpiando conversaciones:', error)
      toast({
        title: "Error",
        description: "No se pudieron limpiar las conversaciones antiguas",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Conversaciones IA</h1>
            <p className="text-muted-foreground">Administra todas las conversaciones de Edelweiss AI</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversaciones ({sessions.length})
            </CardTitle>
            <CardDescription>Lista de todas las conversaciones guardadas</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={loadSessions} variant="outline" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={cleanupOldConversations} variant="outline">
              Limpiar Antiguas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de sesiones */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversaciones ({sessions.length})
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Cargando conversaciones...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay conversaciones guardadas</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Las conversaciones aparecerán aquí cuando los usuarios usen el chat
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSession === session.id
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                      onClick={() => loadConversations(session.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {session.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {session.profiles && (
                              <Badge variant="outline" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {session.profiles.full_name || session.profiles.email}
                              </Badge>
                            )}
                            {session.message_count && (
                              <Badge variant="secondary" className="text-xs">
                                {session.message_count} mensajes
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(session.last_message_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSession(session.id)
                          }}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historial de conversación */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial de Conversación
              </h3>
              {selectedSession ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="space-y-2">
                      <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {conv.profiles?.full_name || conv.profiles?.email || 'Usuario'}
                          </span>
                          {conv.profiles?.role && (
                            <Badge variant="outline" className="text-xs">
                              {conv.profiles.role}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(conv.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{conv.message}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm font-medium">Edelweiss</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{conv.response}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selecciona una conversación</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Haz clic en una conversación para ver su historial completo
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
