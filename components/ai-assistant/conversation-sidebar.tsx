'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, MessageSquare, Clock, X } from 'lucide-react'
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

interface ConversationSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSelectSession: (sessionId: string) => void
  currentSessionId?: string | null
}

export function ConversationSidebar({ isOpen, onClose, onSelectSession, currentSessionId }: ConversationSidebarProps) {
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
      if (!response.ok) {
        throw new Error('Error cargando sesiones')
      }
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error cargando sesiones:', error)
      setSessions([])
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
    if (isOpen && user) {
      loadSessions()
    }
  }, [isOpen, user])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10003] flex">
      <div className="bg-white dark:bg-gray-800 w-96 h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Conversaciones</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Lista de sesiones */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Conversaciones ({sessions.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={cleanupOldConversations}
                className="text-xs"
              >
                Limpiar
              </Button>
            </div>

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
                          <Badge variant="secondary" className="text-xs">
                            {session.message_count} mensajes
                          </Badge>
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

          {/* Historial de conversación seleccionada */}
          {selectedSession && (
            <div className="border-t border-gray-200 dark:border-gray-600 p-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Historial
              </h3>
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div key={conv.id} className="space-y-2">
                    <div className="bg-blue-50 dark:bg-blue-900 p-2 rounded text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3" />
                        <span className="font-medium">Tú</span>
                        <span className="text-gray-500">
                          {new Date(conv.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{conv.message}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Edelweiss</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {conv.response.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectSession(selectedSession)}
                className="w-full mt-3"
              >
                Continuar esta conversación
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
