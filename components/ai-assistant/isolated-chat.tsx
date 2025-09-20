'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'

interface IsolatedChatProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export default function IsolatedChat({ isOpen, onClose, initialQuery }: IsolatedChatProps) {
  const [messages, setMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date, isDisclaimer?: boolean, isError?: boolean}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [hasShownInitialDisclaimer, setHasShownInitialDisclaimer] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processedInitialQuery = useRef<string>("")
  
  // Obtener información del usuario autenticado
  const { user, profile } = useAuth()
  
  // Función para obtener el avatar del usuario
  const getUserAvatar = useCallback(() => {
    if (profile?.avatar_url) {
      return profile.avatar_url
    }
    return null
  }, [profile?.avatar_url])

  // Función para obtener las iniciales del usuario
  const getUserInitials = useCallback(() => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }, [profile?.full_name, user?.email])

  // Función para generar IDs únicos
  const generateUniqueId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Función para hacer scroll automático al final
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Función para copiar texto al portapapeles
  const copyToClipboard = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Error copiando al portapapeles:', error)
    }
  }, [])

  // Scroll automático cuando se agregan mensajes o cambia el loading
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setMessages([])
      setChatInput('')
      setIsLoading(false)
      setIsInfoModalOpen(false)
      setHasShownInitialDisclaimer(false) // Resetear el disclaimer
      processedInitialQuery.current = "" // Limpiar el ref
    }
  }, [isOpen])

  const handleSendMessage = useCallback(async (messageText?: string, skipUserMessage = false) => {
    const messageToSend = messageText || chatInput
    if (!messageToSend.trim() || isLoading) return

    // Solo agregar mensaje del usuario si no se especifica skipUserMessage
    if (!skipUserMessage) {
      const userMessage = {
        id: generateUniqueId(),
        text: messageToSend,
        isUser: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])
    }
    
    if (!messageText) setChatInput('') // Solo limpiar si no es un mensaje inicial
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageToSend,
          userInfo: {
            id: user?.id,
            name: profile?.full_name || user?.email || 'Usuario CVO',
            email: user?.email || 'usuario@cvo.com',
            role: profile?.role || 'Usuario del Sistema'
          }
        }),
        // Agregar timeout para evitar que se cuelgue
        signal: AbortSignal.timeout(30000) // 30 segundos
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Error response:', errorData)
        
        // Manejar límite de uso diario
        if (response.status === 429 && errorData?.error === 'Límite diario alcanzado') {
          const limitMessage = {
            id: generateUniqueId(),
            text: `🚫 **Límite diario alcanzado**\n\n${errorData.message}\n\n**Uso actual**: ${errorData.usage.current}/${errorData.usage.limit} preguntas\n\n💡 **Tip**: Los administradores no tienen límite de uso.`,
            isUser: false,
            timestamp: new Date(),
            isError: true
          }
          setMessages(prev => [...prev, limitMessage])
          return
        }
        
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      const aiMessage = {
        id: generateUniqueId(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error:', error)
      
      let errorText = 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.'
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          errorText = 'La respuesta está tardando demasiado. Por favor, inténtalo de nuevo.'
        } else if (error.message.includes('Failed to fetch')) {
          errorText = 'Error de conexión. Verifica que el servidor esté funcionando e inténtalo de nuevo.'
        } else if (error.message.includes('Error 500')) {
          errorText = 'Error interno del servidor. Por favor, inténtalo de nuevo en unos momentos.'
        } else if (error.message.includes('Error 429')) {
          errorText = 'Demasiadas solicitudes. Por favor, espera un momento e inténtalo de nuevo.'
        }
      }
      
      const errorMessage = {
        id: generateUniqueId(),
        text: errorText,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [chatInput, isLoading, generateUniqueId])

  // Mostrar disclaimer inicial cuando se abre el chat por primera vez
  useEffect(() => {
    if (isOpen && !hasShownInitialDisclaimer) {
      setHasShownInitialDisclaimer(true)
      
      const disclaimerMessage = {
        id: generateUniqueId(),
        text: "🤖 Soy Edelweiss, tu asistente de IA especializado en CVO. Los resultados que proporciono son generados por inteligencia artificial y pueden no ser completamente precisos. Siempre verifica información crítica antes de tomar decisiones importantes.",
        isUser: false,
        timestamp: new Date(),
        isDisclaimer: true // Marcar como disclaimer para estilos especiales
      }
      setMessages([disclaimerMessage])
    }
  }, [isOpen, hasShownInitialDisclaimer, generateUniqueId])

  // Manejar consulta inicial cuando se abre el chat
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim() && processedInitialQuery.current !== initialQuery && hasShownInitialDisclaimer) {
      // Marcar como procesada
      processedInitialQuery.current = initialQuery
      
      // Agregar el mensaje del usuario
      const userMessage = {
        id: generateUniqueId(),
        text: initialQuery,
        isUser: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])
      
      // Hacer la consulta a la IA (sin agregar mensaje del usuario porque ya se agregó arriba)
      handleSendMessage(initialQuery, true)
    }
  }, [isOpen, initialQuery, hasShownInitialDisclaimer])

  // Manejar tecla Escape para cerrar modales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isInfoModalOpen) {
          setIsInfoModalOpen(false)
        } else if (isOpen) {
          onClose() // Cerrar el modal del chat
        }
      }
    }

    if (isOpen || isInfoModalOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isInfoModalOpen, onClose])

  const handleChatKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleInfoClick = useCallback(() => {
    setIsInfoModalOpen(true)
  }, [])

  const handleCloseInfo = useCallback(() => {
    setIsInfoModalOpen(false)
  }, [])

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Chat Modal */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
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
                  onClick={handleInfoClick}
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
                    <span className="font-semibold">En Pruebas:</span> Verifica información crítica
                  </p>
                </div>
                <div className="p-4 flex items-center">
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
              {messages.map((message) => {
                // Renderizado especial para disclaimer
                if (message.isDisclaimer) {
                  return (
                    <motion.div 
                      key={message.id} 
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.3, 
                        ease: "easeOut",
                        delay: 0.1
                      }}
                      className="flex justify-center mb-4"
                    >
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                        className="max-w-[85%] rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-600"
                      >
                        <p className="text-xs leading-relaxed whitespace-pre-wrap text-center text-amber-800 dark:text-amber-200">
                          {message.text}
                        </p>
                      </motion.div>
                    </motion.div>
                  )
                }

                // Renderizado normal para mensajes regulares
                return (
                  <motion.div 
                    key={message.id} 
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.3, 
                      ease: "easeOut",
                      delay: 0.1
                    }}
                    className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isUser && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.2 }}
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage 
                            src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png" 
                            alt="Edelweiss" 
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                            E
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    )}
                    
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'}`}
                    >
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                        className={`${message.isUser ? 'max-w-[90%] min-w-fit' : 'max-w-[80%]'} rounded-lg p-3 relative group ${
                          message.isUser 
                            ? 'bg-blue-500 text-white' 
                            : message.isError
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-100 border border-red-300 dark:border-red-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${message.isUser ? 'text-right' : 'text-left'}`}>
                          {message.text}
                        </p>
                        
                        {/* Botón de copiar para mensajes de Edelweis */}
                        {!message.isUser && !message.isDisclaimer && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                            onClick={() => copyToClipboard(message.text, message.id)}
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </motion.div>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.3 }}
                        className={`text-xs mt-1 ${
                          message.isUser ? 'text-blue-400 mr-1 text-right' : 'text-gray-500 dark:text-gray-400 ml-1 text-left'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </motion.p>
                    </motion.div>
                    
                    {message.isUser && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.2 }}
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage 
                            src={getUserAvatar()} 
                            alt={profile?.full_name || user?.email || "Usuario"} 
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gray-500 text-white text-xs font-medium">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex justify-start gap-3"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage 
                        src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png" 
                        alt="Edelweiss" 
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                        E
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Edelweiss está escribiendo...</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
              
              {/* Elemento invisible para el scroll automático */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input del chat */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
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
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
          onClick={() => setIsInfoModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[30%] h-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 relative z-[10002] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen de Edelweiss - 80% de arriba */}
            <div className="h-[80%] relative overflow-hidden">
              <img
                src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png"
                alt="Edelweiss"
                className="w-full h-full object-cover"
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
            </div>

            {/* Información - 20% de abajo */}
            <div className="h-[20%] p-4 flex flex-col justify-center">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Capacidades</h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p>• Consultas sobre stock</p>
                  <p>• Análisis de ventas</p>
                  <p>• Gestión de CVO</p>
                  <p>• Procesos de taller</p>
                  <p>• Reportes y estadísticas</p>
                  <p>• Asistencia general</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
