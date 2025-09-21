'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Copy, Check, History, Minimize2 } from 'lucide-react'
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
}

export default function ChatModal({ isOpen, onClose, onInfoClick, onMinimize, initialQuery, user, profile }: ChatModalProps) {
  const [messages, setMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [availableSessions, setAvailableSessions] = useState<any[]>([])
  const [showSessionSelector, setShowSessionSelector] = useState(false)
  const [showConversationSidebar, setShowConversationSidebar] = useState(false)
  const chatInputRef = useRef<HTMLInputElement>(null)
  
  // Debug: Log user and profile info
  useEffect(() => {
    console.log('ChatModal - User:', user)
    console.log('ChatModal - Profile:', profile)
    console.log('ChatModal - Avatar URL:', profile?.avatar_url)
  }, [user, profile])

  // Función para generar IDs únicos
  const generateMessageId = useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Cargar sesiones disponibles
  const loadSessions = useCallback(async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/ai-assistant/conversations?action=sessions', {
        credentials: 'include'
      })
      const data = await response.json()
      setAvailableSessions(data.sessions || [])
    } catch (error) {
      console.error('Error cargando sesiones:', error)
    }
  }, [user])

  // Cargar historial de una sesión específica
  const loadSessionHistory = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai-assistant/conversations?sessionId=${sessionId}`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.history) {
        const formattedMessages = data.history.map((conv: any, index: number) => [
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

  // Cargar sesiones cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadSessions()
    }
  }, [isOpen, loadSessions])

  // Manejar tecla Escape para minimizar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && onMinimize) {
        event.preventDefault()
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

  // Función para copiar texto al portapapeles
  const copyToClipboard = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
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
        credentials: 'include', // Incluir cookies de autenticación
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
        text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
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
      // Establecer la consulta en el input y enviarla usando handleSendMessage
      setChatInput(initialQuery)
      // Usar un timeout para asegurar que el estado se actualice antes de enviar
      // No limpiar el input para consultas iniciales
      setTimeout(() => {
        handleSendMessage(false)
      }, 50)
    }
  }, [isOpen, initialQuery, handleSendMessage])

  // Limpiar el input después de que se complete el envío de la consulta inicial
  useEffect(() => {
    if (!isLoading && initialQuery && chatInput === initialQuery) {
      setChatInput('')
    }
  }, [isLoading, initialQuery, chatInput])

  const handleChatKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onMinimize || onClose}
      >
        <motion.div
          key="chat-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden relative z-[10000]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del chat */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl overflow-hidden min-h-[80px]">
            <div className="flex items-stretch h-full">
              <div 
                className="w-20 cursor-pointer hover:opacity-90 transition-all duration-200 overflow-hidden"
                onClick={onInfoClick}
              >
                <img 
                  src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png" 
                  alt="Edelweiss" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-4 flex flex-col justify-center">
                <h2 
                  className="text-lg font-black tracking-wider text-white"
                  style={{ 
                    fontFamily: '"Times New Roman", serif', 
                    fontWeight: '900', 
                    letterSpacing: '0.15em',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  EDELWEISS
                </h2>
                <p className="text-blue-100 text-sm">Asistente IA de CVO</p>
                <p className="text-yellow-200 text-xs mt-1">
                  <span className="font-semibold">⚠️ En Pruebas:</span> Verifica información crítica
                </p>
                {availableSessions.length > 0 && (
                  <div key="sessions-button" className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSessionSelector(!showSessionSelector)}
                      className="text-blue-100 hover:bg-white/20 text-xs px-2 py-1"
                    >
                      {sessionId ? 'Cambiar sesión' : 'Ver conversaciones'} ({availableSessions.length})
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-4 flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConversationSidebar(true)}
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversaciones guardadas</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startNewSession}
                  className="text-blue-600 hover:bg-blue-50 text-xs"
                >
                  Nueva conversación
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableSessions.map((session, index) => (
                  <div
                    key={session.id || `session-${index}`}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      sessionId === session.id
                        ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => loadSessionHistory(session.id)}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session.message_count} mensajes • {new Date(session.last_message_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensajes del chat */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] relative bg-gray-50/30 dark:bg-gray-900/30"
            style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0),
                radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)
              `,
              backgroundSize: '20px 20px, 20px 20px',
              backgroundPosition: '0 0, 10px 10px'
            }}
          >
            {messages.map((message, index) => (
              <div key={message.id || `msg-${index}`} className={`flex items-start gap-3 ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 overflow-hidden">
                  {message.isUser ? (
                    profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Usuario"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                    )
                  ) : (
                    <img
                      src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png"
                      alt="Edelweiss"
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                </div>
                
                {/* Mensaje */}
                <div className={`max-w-[80%] rounded-lg p-3 relative group ${
                  message.isUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}>
                  <p className={`text-sm leading-relaxed ${
                    message.isUser ? 'text-right' : 'text-left'
                  }`}>{message.text}</p>
                  
                  {/* Botón de copiar mejorado */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`absolute top-1 right-1 h-5 w-5 p-0 transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                      message.isUser 
                        ? 'hover:bg-white/20 text-white/70 hover:text-white' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    onClick={() => copyToClipboard(message.text, message.id)}
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                
                {/* Timestamp */}
                <p className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-400 text-right' : 'text-gray-500 dark:text-gray-400 text-left'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
            
            {isLoading && (
              <div key="loading-message" className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img 
                    src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png" 
                    alt="Edelweiss" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input del chat */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Sidebar de conversaciones */}
      <ConversationSidebar
        key="conversation-sidebar"
        isOpen={showConversationSidebar}
        onClose={() => setShowConversationSidebar(false)}
        onSelectSession={(sessionId) => {
          loadSessionHistory(sessionId)
          setShowConversationSidebar(false)
        }}
        currentSessionId={sessionId}
      />
    </AnimatePresence>,
    document.body
  )
}
