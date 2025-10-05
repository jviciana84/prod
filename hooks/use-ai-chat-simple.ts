import { useState, useCallback } from 'react'

interface AIMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export function useAIChatSimple() {
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showAIWarning, setShowAIWarning] = useState(false)
  const [hasShownWarning, setHasShownWarning] = useState(false)
  const [conversationCount, setConversationCount] = useState(() => {
    // Obtener contador del localStorage o inicializar en 0
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('edelweiss_conversation_count')
      const count = stored ? parseInt(stored, 10) : 0
      console.log(`🔢 Contador de conversaciones inicializado: ${count}`)
      return count
    }
    return 0
  })
  
  // Estado para controlar si es la primera vez que se abre el chat
  const [isFirstTime, setIsFirstTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasOpened = localStorage.getItem('edelweiss_has_opened')
      return !hasOpened
    }
    return true
  })
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      text: "¡Hola! Soy Edelweiss, tu asistente de IA. ¿En qué puedo ayudarte?",
      isUser: false,
      timestamp: new Date()
    }
  ])

  // El modal maneja su propio cierre automático, no necesitamos timer aquí

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return

    console.log('Enviando mensaje:', message)
    console.log(`🔢 Contador actual: ${conversationCount}`)

    // Incrementar contador de conversaciones
    const newCount = conversationCount + 1
    setConversationCount(newCount)
    console.log(`🔢 Nuevo contador: ${newCount}`)
    
    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('edelweiss_conversation_count', newCount.toString())
    }

    // Mostrar modal cada 3 respuestas de Edelweiss (no del usuario)
    // El modal se muestra al abrir el chat y luego cada 3 respuestas de la IA
    const shouldShowModal = isFirstTime || (newCount > 0 && newCount % 3 === 0)
    
    if (shouldShowModal) {
      console.log(`🔔 Mostrando modal - Primera vez: ${isFirstTime}, Conversación: ${newCount}`)
      setShowAIWarning(true)
      setHasShownWarning(true)
      
      // Marcar que ya se abrió el chat
      if (isFirstTime) {
        setIsFirstTime(false)
        if (typeof window !== 'undefined') {
          localStorage.setItem('edelweiss_has_opened', 'true')
        }
      }
    }
    
    setIsLoading(true)
    setIsTyping(true)
    
    // Agregar mensaje del usuario
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      console.log('Haciendo fetch a /api/chat/test')
      
      // Enviar mensaje a la IA optimizada
      const response = await fetch('/api/chat/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error enviando mensaje')
      }

      const { response: aiResponse } = await response.json()

      // Agregar respuesta de la IA
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Error enviando mensaje:', error)
      
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        text: `Lo siento, hubo un error al procesar tu mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}. Inténtalo de nuevo.`,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }, [])

  const closeAIWarning = useCallback(() => {
    setShowAIWarning(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        text: "¡Hola! Soy Edelweiss, tu asistente de IA. ¿En qué puedo ayudarte?",
        isUser: false,
        timestamp: new Date()
      }
    ])
    // NO cerrar el modal aquí, se maneja en resetSession
  }, [])

  const resetSession = useCallback(() => {
    // Función para resetear la sesión (cuando se cierra y abre el chat)
    // NO reseteamos el contador de conversaciones, debe persistir
    setHasShownWarning(false)
    // Mostrar modal de advertencia al abrir el chat
    setShowAIWarning(true)
  }, [])

  const resetConversationCount = useCallback(() => {
    // Función para resetear manualmente el contador de conversaciones
    console.log('🔄 Reseteando contador de conversaciones a 0')
    setConversationCount(0)
    if (typeof window !== 'undefined') {
      localStorage.setItem('edelweiss_conversation_count', '0')
    }
  }, [])

  const forceShowModal = useCallback(() => {
    // Función para forzar que aparezca el modal
    console.log('🔔 Forzando aparición del modal')
    setShowAIWarning(true)
    setHasShownWarning(true)
  }, [])

  const resetModalState = useCallback(() => {
    // Función para resetear completamente el estado del modal
    console.log('🔄 Reseteando estado completo del modal')
    setConversationCount(0)
    setIsFirstTime(true)
    setHasShownWarning(false)
    setShowAIWarning(false)
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('edelweiss_conversation_count')
      localStorage.removeItem('edelweiss_has_opened')
    }
  }, [])

  const getNextModalConversation = useCallback(() => {
    // Función para calcular cuándo aparecerá el próximo modal
    if (conversationCount === 0) return 1 // Primera interacción
    const next = Math.ceil((conversationCount + 1) / 3) * 3 + 1
    return next
  }, [conversationCount])

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    isTyping,
    showAIWarning,
    closeAIWarning,
    resetSession,
    conversationCount,
    resetConversationCount,
    getNextModalConversation,
    forceShowModal,
    resetModalState,
    isFirstTime
  }
}
