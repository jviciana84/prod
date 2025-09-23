'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Copy, Check, History, Minimize2, MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConversationSidebar } from './conversation-sidebar'
import { ChatMinimized } from './chat-minimized'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  onInfoClick: () => void
  onMinimize?: () => void
  initialQuery?: string
  user?: any
  profile?: any
  showHistory?: boolean
  onToggleHistory?: () => void
}

export default function ChatModal({ isOpen, onClose, onInfoClick, onMinimize, initialQuery, user, profile, showHistory, onToggleHistory }: ChatModalProps) {
  const [messages, setMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [availableSessions, setAvailableSessions] = useState<any[]>([])
  const [showSessionSelector, setShowSessionSelector] = useState(false)
  const [showConversationSidebar, setShowConversationSidebar] = useState(false)
  const [historySessions, setHistorySessions] = useState<any[]>([])
  const [selectedHistorySession, setSelectedHistorySession] = useState<any>(null)
  const [historyConversations, setHistoryConversations] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isHistoryFlipped, setIsHistoryFlipped] = useState(false)
  const chatInputRef = useRef<HTMLInputElement>(null)
  
  // Debug: Log user and profile info
  useEffect(() => {
    console.log('ChatModal - User:', user)
    console.log('ChatModal - Profile:', profile)
    
    // Si tenemos user y profile, loggear que está funcionando
    if (user && profile) {
      console.log('✅ ChatModal - Autenticación completa:', { 
        userId: user.id, 
        userName: profile.full_name,
        role: profile.role 
      })
    } else if (user && !profile) {
      console.log('⚠️ ChatModal - Usuario sin perfil:', user.id)
    } else if (!user) {
      console.log('⚠️ ChatModal - Sin usuario autenticado')
    }
  }, [user, profile])

  // Función para generar IDs únicos para mensajes
  const generateMessageId = useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Cargar sesiones disponibles
  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-assistant/conversations?action=sessions', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableSessions(data.sessions || [])
        setHistorySessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error cargando sesiones:', error)
    }
  }, [])

  // Cargar conversaciones del historial
  const loadHistoryConversations = useCallback(async (sessionId: string) => {
    try {
      setLoadingHistory(true)
      const response = await fetch(`/api/ai-assistant/conversations?sessionId=${sessionId}`, {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setHistoryConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error cargando conversaciones del historial:', error)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // Manejar selección de sesión en el historial
  const handleHistorySessionSelect = useCallback((session: any) => {
    setSelectedHistorySession(session)
    loadHistoryConversations(session.id)
  }, [loadHistoryConversations])

  // Cargar historial de una sesión específica
  const loadSessionHistory = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai-assistant/conversations?sessionId=${sessionId}`, {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const formattedMessages = data.conversations.map((conv: any, index: number) => [
          { id: `user-${conv.id || `conv-${index}`}-${index}`, text: conv.message, isUser: true, timestamp: new Date(conv.created_at) },
          { id: `ai-${conv.id || `conv-${index}`}-${index}`, text: conv.response, isUser: false, timestamp: new Date(conv.created_at) }
        ]).flat()
        
        setMessages(formattedMessages)
        setSessionId(sessionId)
        setShowSessionSelector(false)
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
    }
  }, [])

  // Iniciar nueva sesión
  const startNewSession = useCallback(() => {
    setMessages([])
    setSessionId(null)
    setShowSessionSelector(false)
  }, [])

  // Cargar sesiones al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadSessions()
    }
  }, [isOpen, loadSessions])

  // Manejar tecla Escape para minimizar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && onMinimize) {
        onMinimize()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onMinimize])

  // Auto-scroll al final cuando se agregan mensajes
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Resetear el flip cuando se abre el historial
  useEffect(() => {
    if (showHistory) {
      setIsHistoryFlipped(false)
    }
  }, [showHistory])

  // Función para copiar texto al portapapeles
  const copyToClipboard = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Error copiando texto:', error)
    }
  }, [])

  const handleSendMessage = useCallback(async (clearInput: boolean = true) => {
    if (!chatInput.trim() || isLoading) return

    const messageText = chatInput.trim()
    const userMessage = {
      id: generateMessageId(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    if (clearInput) {
    setChatInput('')
    }
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          message: messageText,
          sessionId: sessionId,
          userInfo: {
            id: user?.id,
            name: profile?.full_name || user?.email || 'Usuario CVO',
            email: user?.email || 'usuario@cvo.com',
            role: profile?.role || 'Usuario del Sistema'
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta')
      }

      const data = await response.json()
      
      // Actualizar sessionId si se devuelve uno nuevo
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId)
      }
      
      const aiMessage = {
        id: generateMessageId(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = {
        id: generateMessageId(),
        text: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [chatInput, isLoading, sessionId, user, profile, generateMessageId])

  // Manejar consulta inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      // Solo procesar una vez
      const messageText = initialQuery.trim()
      
      // Añadir mensaje del usuario
      const userMessage = {
        id: generateMessageId(),
        text: messageText,
        isUser: true,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage])
      setIsLoading(true)

      // Enviar al API
      fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          message: messageText,
          sessionId: sessionId,
          userInfo: {
            id: user?.id,
            name: profile?.full_name || user?.email || 'Usuario CVO',
            email: user?.email || 'usuario@cvo.com',
            role: profile?.role || 'Usuario del Sistema'
          }
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la respuesta')
        }
        return response.json()
      })
      .then(data => {
        // Actualizar sessionId si se devuelve uno nuevo
        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId)
        }
        
        const aiMessage = {
          id: generateMessageId(),
          text: data.response,
          isUser: false,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, aiMessage])
      })
      .catch(error => {
        console.error('Error:', error)
        const errorMessage = {
          id: generateMessageId(),
          text: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      })
      .finally(() => {
        setIsLoading(false)
      })
    }
  }, [isOpen, initialQuery]) // Removido sessionId, user, profile, generateMessageId para evitar re-ejecuciones

  const handleChatKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="chat-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center py-2 px-4"
        onClick={onMinimize || onClose}
      >
        <div className="flex items-center justify-center space-x-6 w-full max-w-7xl">
          {/* Card de Historial (Izquierda) */}
          {showHistory && (
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-96 h-[90vh] relative z-[10001]"
              style={{ perspective: '1000px' }}
            >
              <div 
                className={`relative w-full h-full transition-transform duration-700 ease-in-out transform-style-preserve-3d ${
                  isHistoryFlipped ? 'rotate-y-180' : ''
                }`}
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: isHistoryFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Cara Frontal - Historial */}
                <div 
                  className="absolute inset-0 w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {/* Header del historial */}
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-semibold text-white">Historial</h2>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleHistory?.()}
                        className="text-white hover:bg-white/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

              {/* Contenido del historial */}
              <div className="flex-1 overflow-y-auto p-6">
                {!selectedHistorySession ? (
                  // Lista de sesiones
                  <div className="space-y-3">
                    {historySessions.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay conversaciones</p>
                      </div>
                    ) : (
                      historySessions.map((session, index) => (
                        <div
                          key={session.id || `session-${index}`}
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleHistorySessionSelect(session)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                              {session.profiles?.avatar_url ? (
                                <img 
                                  src={session.profiles.avatar_url} 
                                  alt="Usuario" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                  {session.profiles?.full_name ? session.profiles.full_name.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {session.title || `Sesión ${index + 1}`}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {new Date(session.created_at).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Conversaciones de la sesión seleccionada
                  <div className="space-y-4">
                    {/* Header de la sesión */}
                    <div className="flex items-center space-x-2 mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedHistorySession(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ← Volver
                      </Button>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedHistorySession.title || 'Sesión'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(selectedHistorySession.created_at).toLocaleDateString('es-ES')}
                    </p>

                    {/* Lista de conversaciones */}
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                      </div>
                    ) : historyConversations.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay mensajes</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {historyConversations.map((conv, index) => (
                          <div key={conv.id || `conv-${index}`} className="space-y-2">
                            {/* Mensaje del usuario */}
                            <div className="flex justify-end">
                              <div>
                                <div className="inline-block bg-blue-500 text-white p-3 rounded-2xl rounded-br-md">
                                  <p className="text-sm">{conv.message}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-right">
                                  {new Date(conv.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>

                            {/* Respuesta de Edelweiss */}
                            <div className="flex justify-start">
                              <div>
                                <div className="inline-block bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-bl-md">
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {conv.response}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-left">
                                  {new Date(conv.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                  </div>
                </div>

                {/* Cara Trasera - Info de EDELWEISS */}
                <div 
                  className="absolute inset-0 w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Imagen de Edelweiss - 80% de arriba */}
                  <div className="h-[80%] relative overflow-hidden">
                    <img
                      src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png"
                      alt="Edelweiss"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsHistoryFlipped(false)
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 text-left">
                      <h1 
                        className="text-4xl font-black tracking-wider text-white mb-1"
                        style={{ 
                          fontFamily: '"Times New Roman", serif', 
                          fontWeight: '900', 
                          letterSpacing: '0.15em',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                        }}
                      >
                        EDELWEISS
                      </h1>
                      <p className="text-blue-200 text-xl font-medium mb-1">Asistente IA de CVO</p>
                      <p className="text-white/90 text-sm">Especialista en CVO • OpenAI GPT-4o</p>
                    </div>
                    
                    {/* Botón de cerrar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleHistory?.()}
                      className="absolute top-4 right-4 text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Información - 20% de abajo */}
                  <div className="h-[20%] p-4 flex flex-col justify-center">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">En Pruebas</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Verifica información crítica antes de usar
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                          Análisis de datos
                        </span>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                          Consultas especializadas
                        </span>
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                          Soporte técnico
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Card Principal del Chat (Derecha) */}
        <motion.div
            key="chat-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden relative z-[10001]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del chat */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl overflow-hidden min-h-[80px]">
            <div className="flex items-stretch h-full">
              <div 
                className="w-20 cursor-pointer hover:opacity-90 transition-all duration-200 overflow-hidden"
                onClick={() => {
                  if (showHistory) {
                    setIsHistoryFlipped(!isHistoryFlipped)
                  } else {
                    onInfoClick()
                  }
                }}
              >
                <img 
                  src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png" 
                  alt="Edelweiss" 
                  className="w-full h-full object-cover"
                />
              </div>
                <div className="flex-1 flex flex-col justify-center p-4 text-white">
                  <h2 className="text-xl font-bold" style={{
                    background: 'linear-gradient(45deg, #ffffff, #e0e7ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                  EDELWEISS
                </h2>
                <p className="text-blue-100 text-sm">Asistente IA de CVO</p>
                <p className="text-yellow-200 text-xs mt-1">
                    ▲ En Pruebas: Verifica información crítica
                  </p>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startNewSession}
                      className="text-white border-white hover:bg-white/10 text-xs px-2 py-1 bg-transparent"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Nuevo chat
                    </Button>
                  </div>
              </div>
                <div className="pt-2 pr-4 pb-4 pl-4 flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleHistory || (() => setShowConversationSidebar(true))}
                    className="text-white hover:bg-white/20 p-2"
                    title="Ver historial de conversaciones"
                  >
                    <History className="h-5 w-5" />
                  </Button>
                  {onMinimize && (
                    <Button
                      key="minimize-button"
                      onClick={onMinimize}
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 p-2"
                      title="Minimizar chat"
                    >
                      <Minimize2 className="h-5 w-5" />
                    </Button>
                  )}
                <Button
                  onClick={onClose}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

            {/* Selector de sesiones */}
            {showSessionSelector && (
              <div key="session-selector" className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Sesiones de Conversación</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startNewSession}
                    className="text-blue-600 hover:bg-blue-50 text-xs"
                  >
                    Nueva Sesión
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableSessions.map((session, index) => (
                    <div
                      key={session.id || `session-${index}`}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => loadSessionHistory(session.id)}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.title || `Sesión ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-4">
                {messages.length === 0 && !isLoading && (
                  <div key="loading-message" className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">¡Hola! ¿En qué puedo ayudarte hoy?</p>
                  </div>
                )}
                
            {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-start space-x-2`}>
                    {!message.isUser && (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png" 
                          alt="Edelweiss" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className={`${message.isUser ? 'order-first' : ''} max-w-[80%]`}>
                      <div className={`block p-3 rounded-2xl group relative ${
                        message.isUser 
                          ? 'bg-blue-500 text-white rounded-br-md' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words pr-8">{message.text}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.text, message.id)}
                          className={`h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 ${
                            message.isUser 
                              ? 'text-blue-100 hover:bg-blue-400' 
                              : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <p className={`text-xs mt-1 ${message.isUser ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {message.isUser && (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        {profile?.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt="Usuario" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                    )}
              </div>
            ))}
            
            {isLoading && (
                  <div key="loading-message" className="flex justify-start items-start space-x-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png" 
                    alt="Edelweiss" 
                        className="w-full h-full object-cover"
                  />
                </div>
                    <div className="max-w-[80%]">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-bl-md border border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                      </div>
                    </div>
              </div>
            )}
              </div>
          </div>

          {/* Input del chat */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-2">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="Escribe tu mensaje..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
              />
              <Button
                  onClick={() => handleSendMessage()}
                disabled={!chatInput.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}