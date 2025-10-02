import { useState, useCallback } from 'react'

interface AIMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export function useAIChat() {
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      text: "¡Hola! Soy Edelweiss, tu asistente de IA. ¿En qué puedo ayudarte?",
      isUser: false,
      timestamp: new Date()
    }
  ])

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return

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
      // Enviar mensaje a la API de prueba
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

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        text: "¡Hola! Soy Edelweiss, tu asistente de IA. ¿En qué puedo ayudarte?",
        isUser: false,
        timestamp: new Date()
      }
    ])
  }, [])

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    isTyping
  }
}
