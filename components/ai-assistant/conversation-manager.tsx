'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, MessageSquare, Clock, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface Conversation {
  id: string
  message: string
  response: string
  created_at: string
}

interface Session {
  id: string
  title: string
  last_message_at: string
  created_at: string
  message_count: number
}

export function ConversationManager() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // Cargar sesiones del usuario
  const loadSessions = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/ai-assistant/conversations?action=sessions')
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error cargando sesiones:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar conversaciones de una sesión
  const loadConversations = async (sessionId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ai-assistant/conversations?sessionId=${sessionId}`)
      const data = await response.json()
      setConversations(data.history || [])
      setSelectedSession(sessionId)
    } catch (error) {
      console.error('Error cargando conversaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  // Eliminar sesión
  const deleteSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) return
    
    try {
      const response = await fetch(`/api/ai-assistant/conversations?sessionId=${sessionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
        if (selectedSession === sessionId) {
          setSelectedSession(null)
          setConversations([])
        }
      }
    } catch (error) {
      console.error('Error eliminando sesión:', error)
    }
  }

  // Limpiar conversaciones antiguas
  const cleanupOldConversations = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todas las conversaciones antiguas (más de 30 días)?')) return
    
    try {
      const response = await fetch('/api/ai-assistant/conversations?action=cleanup', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        loadSessions()
        alert('Conversaciones antiguas eliminadas')
      }
    } catch (error) {
      console.error('Error limpiando conversaciones:', error)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [user])

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Inicia sesión para ver tus conversaciones</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mis Conversaciones</h2>
        <div className="space-x-2">
          <Button onClick={loadSessions} variant="outline" size="sm">
            Actualizar
          </Button>
          <Button onClick={cleanupOldConversations} variant="outline" size="sm">
            Limpiar Antiguas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lista de sesiones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500">Cargando...</p>
            ) : sessions.length === 0 ? (
              <p className="text-center text-gray-500">No hay conversaciones</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSession === session.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => loadConversations(session.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{session.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {session.message_count} mensajes
                          </Badge>
                          <span className="text-xs text-gray-500">
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de conversación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historial de Conversación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSession ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {conversations.map((conv) => (
                  <div key={conv.id} className="space-y-2">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">Tú</span>
                        <span className="text-xs text-gray-500">
                          {new Date(conv.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{conv.message}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
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
              <p className="text-center text-gray-500">
                Selecciona una conversación para ver el historial
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
