"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Send, History, Trash2, MoreVertical, Info } from "lucide-react"
import { useAIChatSimple } from "@/hooks/use-ai-chat-simple"
import { TypingIndicator } from "@/components/ui/typing-indicator"
import { AIWarningModal } from "@/components/ui/ai-warning-modal"
import { CopyButton } from "@/components/ui/copy-button"
import { FeedbackButtons } from "@/components/ui/feedback-buttons"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { toast } from "@/hooks/use-toast"

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface ChatConversation {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
  is_hidden?: boolean
}

interface CompactChatWindowProps {
  isOpen: boolean
  onClose: () => void
}

export function CompactChatWindow({ isOpen, onClose }: CompactChatWindowProps) {
  const { messages, sendMessage, clearMessages, isLoading, isTyping, showAIWarning, closeAIWarning, resetSession } = useAIChatSimple()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [inputValue, setInputValue] = useState("")
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Resetear sesión cuando se abre el chat
  useEffect(() => {
    if (isOpen) {
      resetSession()
    }
  }, [isOpen, resetSession])

  // Carrusel automático de tarjetas de información
  useEffect(() => {
    if (!isInfoOpen) return

    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % 6) // 6 tarjetas total
    }, 3000) // Cambia cada 3 segundos

    return () => clearInterval(interval)
  }, [isInfoOpen])

  // Resetear índice cuando se abre el panel
  useEffect(() => {
    if (isInfoOpen) {
      setCurrentCardIndex(0)
    }
  }, [isInfoOpen])

  // Datos de las tarjetas del carrusel
  const infoCards = [
    {
      icon: "🤖",
      title: "Tecnología",
      content: "Powered by OpenAI GPT-4o para conversaciones inteligentes y respuestas precisas."
    },
    {
      icon: "💬",
      title: "Funcionalidad", 
      content: "Asistente virtual especializado en consultas sobre vehículos, soporte técnico y gestión de datos."
    },
    {
      icon: "🎯",
      title: "Especialización",
      content: "Experto en BMW, gestión de stock, ventas y soporte al cliente en el sector automotriz."
    },
    {
      icon: "⚡",
      title: "Características",
      content: "Respuestas en tiempo real, análisis de datos avanzado, soporte multilingüe e integración con sistemas CVO."
    },
    {
      icon: "🔧",
      title: "Capacidades Técnicas",
      content: "Procesamiento de lenguaje natural, análisis de datos en tiempo real, integración con APIs externas y Machine Learning avanzado."
    },
    {
      icon: "🚗",
      title: "Especialización BMW",
      content: "Conocimiento de modelos BMW, gestión de inventario, soporte técnico especializado y análisis de mercado automotriz."
    }
  ]

  // Manejar eventos del header
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      const message = event.detail.message
      if (message) {
        // Usar sendMessage del hook para procesar el mensaje
        sendMessage(message)
      }
    }

    const handleOpenChatHistory = () => {
      // Asegurar que el chat esté expandido primero
      setIsMinimized(false)
      setIsMaximized(false)
      // Luego abrir el historial
      setTimeout(() => {
        setIsHistoryOpen(true)
      }, 200)
    }

    window.addEventListener('chatMessage', handleChatMessage as EventListener)
    window.addEventListener('openChatHistory', handleOpenChatHistory)

    return () => {
      window.removeEventListener('chatMessage', handleChatMessage as EventListener)
      window.removeEventListener('openChatHistory', handleOpenChatHistory)
    }
  }, [])

  // Manejar clic fuera y tecla Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const chatElement = document.querySelector('[data-chat-window]')
      const historyElement = document.querySelector('[data-history-window]')
      const infoElement = document.querySelector('[data-info-window]')
      
      // Verificar si se está haciendo clic en algún panel
      const isClickingChat = chatElement && chatElement.contains(event.target as Node)
      const isClickingHistory = historyElement && historyElement.contains(event.target as Node)
      const isClickingInfo = infoElement && infoElement.contains(event.target as Node)
      
      // Solo cerrar el panel de información si se hace clic fuera de él Y no se está haciendo clic en otros paneles
      if (isInfoOpen && !isClickingInfo && !isClickingChat && !isClickingHistory) {
        setIsInfoOpen(false)
      }
      
      // Solo cerrar el historial si se hace clic fuera de él Y no se está haciendo clic en otros paneles
      if (isHistoryOpen && !isClickingHistory && !isClickingChat && !isClickingInfo) {
        setIsHistoryOpen(false)
        setIsMinimized(true)
      }
      
      // Solo minimizar el chat si se hace clic fuera de él Y no se está haciendo clic en otros paneles
      if (!isMinimized && !isClickingChat && !isClickingHistory && !isClickingInfo) {
        setIsMinimized(true)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isInfoOpen) {
          setIsInfoOpen(false)
        } else if (isHistoryOpen) {
          // Cerrar historial y chat juntos
          setIsHistoryOpen(false)
          setIsMinimized(true)
        } else if (!isMinimized) {
          setIsMinimized(true)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isMinimized, isHistoryOpen, isInfoOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const messageText = inputValue
    setInputValue("")

    try {
      await sendMessage(messageText)
    } catch (error) {
      console.error('Error enviando mensaje:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  const handleHistoryToggle = () => {
    if (!isHistoryOpen) {
      // Al abrir historial, expandir el chat y cargar conversaciones
      setIsMinimized(false)
      setIsMaximized(true)
      loadUserConversations()
    } else {
      // Al cerrar historial, también cerrar el chat
      setIsMinimized(true)
    }
    setIsHistoryOpen(!isHistoryOpen)
  }

  // Cargar conversaciones del usuario
  const loadUserConversations = async () => {
    try {
      setLoadingConversations(true)
      
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        includeHidden: 'false' // Los usuarios solo ven sus conversaciones "activas"
      })

      const response = await fetch(`/api/conversations/user?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando conversaciones')
      }

      // Convertir las conversaciones de la API al formato del componente
      const formattedConversations: ChatConversation[] = data.conversations.map((conv: any) => ({
        id: conv.id,
        title: conv.message.length > 30 ? conv.message.substring(0, 30) + '...' : conv.message,
        lastMessage: conv.response.length > 50 ? conv.response.substring(0, 50) + '...' : conv.response,
        timestamp: new Date(conv.created_at),
        messageCount: 1, // Cada conversación tiene al menos 1 mensaje
        is_hidden: conv.is_hidden
      }))

      setConversations(formattedConversations)
    } catch (error) {
      console.error('Error cargando conversaciones:', error)
      toast({
        title: "Error",
        description: "Error cargando el historial de conversaciones",
        variant: "destructive"
      })
    } finally {
      setLoadingConversations(false)
    }
  }

  // Eliminar conversación (ocultar para el usuario)
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch('/api/conversations/toggle-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          isHidden: true // Marcar como "eliminada" para el usuario
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error eliminando conversación')
      }

      toast({
        title: "Conversación eliminada",
        description: "La conversación ha sido eliminada"
      })

      // Recargar conversaciones para que desaparezca de la lista
      loadUserConversations()
    } catch (error) {
      console.error('Error eliminando conversación:', error)
      toast({
        title: "Error",
        description: "Error eliminando la conversación",
        variant: "destructive"
      })
    }
  }

  const handleNewConversation = () => {
    clearMessages()
  }

  const handleInfoToggle = () => {
    setIsInfoOpen(!isInfoOpen)
    // No minimizar el chat al abrir información
    // El chat debe permanecer en su estado actual
  }

  const handleHeaderClick = () => {
    if (isMinimized) {
      setIsMinimized(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
    <Card 
      data-chat-window
      className={`fixed right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-2xl flex flex-col !border-0 rounded-xl transition-all duration-300 ${
        isMinimized ? 'h-12 w-1/5' : isMaximized ? 'h-[80%] w-[23%]' : 'h-[50%] w-1/5'
      }`} 
      style={{ bottom: '33px' }}
    >
        <CardHeader 
          onClick={handleHeaderClick}
          className={`pb-2 pt-2 rounded-t-xl ${
            isMinimized 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 cursor-pointer hover:from-blue-600 hover:to-purple-700' 
              : 'bg-black'
          }`}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-white tracking-widest" style={{ fontFamily: 'serif' }}>
              EDELWEISS
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                onClick={handleHistoryToggle}
                variant="ghost"
                size="sm"
                className={`h-5 w-5 p-0 text-white hover:bg-white/20 ${isHistoryOpen ? 'bg-white/20' : ''}`}
                title="Historial de conversaciones"
              >
                <History className="h-3 w-3" />
              </Button>
              <Button
                onClick={handleMinimize}
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-white hover:bg-white/20"
              >
                {/* Icono minimizar de Windows */}
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="2" y="5.5" width="8" height="1" />
                </svg>
              </Button>
              <Button
                onClick={handleMaximize}
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-white hover:bg-white/20"
              >
                {isMaximized ? (
                  /* Icono restaurar de Windows - versión simple */
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                    <rect x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none"/>
                    <rect x="4" y="4" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none"/>
                  </svg>
                ) : (
                  /* Icono maximizar de Windows */
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                    <rect x="2" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none"/>
                  </svg>
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-white hover:bg-red-500/20 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex-1 flex flex-col p-3 min-h-0">
          {/* Área de mensajes */}
          <div className="flex-1 chat-scroll space-y-2 mb-3 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex group ${message.isUser ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%] relative">
                  <div
                    className={`rounded-lg px-3 py-2 text-xs ${
                      message.isUser
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-start">
                      {message.isUser ? (
                        <span>{message.text}</span>
                      ) : (
                        <MarkdownRenderer 
                          content={message.text} 
                          className="text-xs leading-relaxed"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    
                    {/* Botones de acción alineados a la izquierda */}
                    {!message.isUser && (
                      <div className="flex gap-1">
                        <CopyButton 
                          text={message.text} 
                          className="h-5 w-5 p-0"
                        />
                        <FeedbackButtons 
                          messageId={message.id}
                          onFeedback={(messageId, feedback) => {
                            console.log(`Feedback para mensaje ${messageId}: ${feedback}`)
                            // Aquí puedes agregar lógica para guardar el feedback
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
                  <div ref={messagesEndRef} />
                  
                  {/* Indicador de escritura */}
                  {isTyping && <TypingIndicator />}
                </div>

          {/* Área de entrada */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="text-xs h-8 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <Button
              onClick={handleSendMessage}
              size="sm"
              variant="outline"
                    className={`h-8 px-3 border transition-all duration-300 ${
                      isLoading
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white animate-pulse" 
                        : "border-gray-300 dark:border-gray-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:border-transparent hover:text-white"
                    }`}
              disabled={!inputValue.trim()}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
          </CardContent>
        )}
    </Card>
    
    {/* Panel de historial */}
    {isHistoryOpen && (
      <Card 
        data-history-window
        className="fixed z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-2xl flex flex-col !border-0 rounded-xl transition-all duration-500 h-[80%] w-[23%] animate-in slide-in-from-bottom-4 fade-in"
        style={{ 
          bottom: '33px',
          right: 'calc(23% + 16px)' // Separado del chat principal
        }}
      >
        <CardHeader className="pb-2 pt-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-white" style={{ fontFamily: 'serif' }}>
              Historial
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                onClick={handleInfoToggle}
                variant="ghost"
                size="sm"
                className={`h-5 w-5 p-0 text-white hover:bg-white/20 ${isInfoOpen ? 'bg-white/20' : ''}`}
                title="Información de Edelweiss"
              >
                <Info className="h-3 w-3" />
              </Button>
              <Button
                onClick={handleHistoryToggle}
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-white hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-3 min-h-0">
          {/* Indicador de carga */}
          {loadingConversations && (
            <div className="mb-3 flex justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
          )}
          
          <div className="flex-1 chat-scroll space-y-2">
            {conversations.length === 0 && !loadingConversations ? (
              <div className="text-center text-white/60 text-xs py-4">
                No hay conversaciones disponibles
              </div>
            ) : (
              conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-medium truncate">{conversation.title}</h4>
                    <span className="text-xs text-muted-foreground">({conversation.messageCount})</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {conversation.lastMessage}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conversation.timestamp.toLocaleDateString()} {conversation.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    onClick={() => {
                      if (confirm("¿Estás seguro de que quieres eliminar esta conversación?")) {
                        handleDeleteConversation(conversation.id)
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:bg-red-500/20"
                    title="Eliminar conversación"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Panel de información de Edelweiss */}
    {isInfoOpen && (
      <Card 
        data-info-window
        className="fixed z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-2xl !border-0 rounded-xl transition-all duration-500 h-[80%] w-[23%] animate-in slide-in-from-bottom-4 fade-in"
        style={{ 
          bottom: '33px',
          right: 'calc(23% + 23% + 32px)' // A la izquierda del historial
        }}
      >
        <CardContent 
          className="p-0 relative h-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Imagen de fondo que ocupa todo el card */}
          <img 
            src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png"
            alt="Edelweiss AI Assistant"
            className="absolute inset-0 w-full h-full object-cover rounded-xl"
          />
          
          {/* Botón cerrar flotante */}
          <Button
            onClick={handleInfoToggle}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 bg-black/50 text-white hover:bg-black/70 rounded-full z-10"
          >
            <X className="h-3 w-3" />
          </Button>

          {/* Área de texto sobrepuesta en el 35% inferior con carrusel */}
          <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-black/90 via-black/70 to-transparent rounded-b-xl">
            <div className="h-full flex flex-col">
              {/* Título más contundente */}
              <div className="text-center p-3 pb-2">
                <h3 className="text-2xl font-black text-white mb-1 tracking-wider drop-shadow-2xl" style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                  EDELWEISS
                </h3>
                <p className="text-sm text-white/90 font-medium">
                  Asistente de IA basado en ChatGPT-4o
                </p>
                
                {/* Indicadores del carrusel - MUY PEQUEÑOS, justo debajo del texto */}
                <div className="flex justify-center space-x-2 mt-2">
                  {infoCards.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentCardIndex(index)
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        index === currentCardIndex 
                          ? 'bg-white scale-125' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      title={`Ver ${infoCards[index].title}`}
                    />
                  ))}
                </div>
              </div>

              {/* Carrusel de tarjetas */}
              <div className="flex-1 px-4 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm">
                  <div className="relative overflow-hidden rounded-lg">
                    <div 
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{ transform: `translateX(-${currentCardIndex * 100}%)` }}
                    >
                      {infoCards.map((card, index) => (
                        <div key={index} className="w-full flex-shrink-0">
                          <div className="p-3 bg-white/15 backdrop-blur-sm rounded-lg border border-white/20 mx-1">
                            <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1">
                              {card.icon} {card.title}
                            </h4>
                            <p className="text-xs text-white/90 leading-tight">
                              {card.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Modal de advertencia de IA */}
    <AIWarningModal 
      isVisible={showAIWarning} 
      onClose={closeAIWarning} 
    />
    </>
  )
}
