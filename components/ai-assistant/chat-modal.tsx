'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  onInfoClick: () => void
}

export default function ChatModal({ isOpen, onClose, onInfoClick }: ChatModalProps) {
  const [messages, setMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll al final cuando se agregan mensajes
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      text: chatInput,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: chatInput }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta')
      }

      const data = await response.json()
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [chatInput, isLoading])

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
            {messages.map((message) => (
              <div key={message.id} className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.isUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
                <p className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-400 mr-1' : 'text-gray-500 dark:text-gray-400 ml-1'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <img 
                    src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png" 
                    alt="Edelweiss" 
                    className="w-6 h-6 rounded-full object-cover"
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
    </AnimatePresence>,
    document.body
  )
}
