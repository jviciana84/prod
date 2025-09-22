"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Search, X, Send, Loader2, User, MessageCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { useAuth } from "@/hooks/use-auth"
import ChatWrapper from './chat-wrapper'

export default function HeaderAssistant() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState("")
  const [isAutoHover, setIsAutoHover] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [initialChatQuery, setInitialChatQuery] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Obtener información del usuario autenticado (estabilizada)
  const authData = useAuth()
  const [stableUser, setStableUser] = useState(authData.user)
  const [stableProfile, setStableProfile] = useState(authData.profile)
  
  // Solo actualizar cuando realmente cambien los datos importantes (una sola vez)
  useEffect(() => {
    if (authData.user && !stableUser) {
      setStableUser(authData.user)
    }
  }, [authData.user, stableUser])
  
  useEffect(() => {
    if (authData.profile && !stableProfile) {
      setStableProfile(authData.profile)
    }
  }, [authData.profile, stableProfile])
  
  const user = stableUser
  const profile = stableProfile
  
  // Función para obtener el avatar del usuario (estabilizada)
  const getUserAvatar = useCallback(() => {
    if (profile?.avatar_url) {
      return profile.avatar_url
    }
    return "/avatars/default.svg"
  }, [profile?.avatar_url])
  
  // Función para obtener las iniciales del usuario (estabilizada)
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
    return "U"
  }, [profile?.full_name, user?.email])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])


  // Efecto automático de hover cada 8 segundos
  useEffect(() => {
    if (isExpanded || isChatOpen) return
    const interval = setInterval(() => {
      // Brillo de izquierda a derecha
      setIsAutoHover(true)
      setTimeout(() => {
        setIsAutoHover(false)
        // Pequeña pausa antes del segundo brillo
        setTimeout(() => {
          // Brillo de derecha a izquierda (usando una clase especial)
          const button = document.querySelector('.edelweiss-button')
          if (button) {
            button.classList.add('reverse-shine')
            setTimeout(() => {
              button.classList.remove('reverse-shine')
            }, 600)
          }
        }, 200)
      }, 600)
    }, 8000)
    return () => clearInterval(interval)
  }, [isExpanded, isChatOpen])

  const handleSearch = async () => {
    if (!searchQuery.trim() || isLoading) return

    setIsLoading(true)
    setLastResponse("")

    try {
      const response = await fetch("/api/ai-assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: searchQuery,
          userInfo: {
            id: user?.id,
            name: profile?.full_name || user?.email || 'Usuario CVO',
            email: user?.email || 'usuario@cvo.com',
            role: profile?.role || 'Usuario del Sistema'
          }
        }),
      })

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor")
      }

      const data = await response.json()
      setLastResponse(data.response)
    } catch (error) {
      console.error("Error al enviar consulta:", error)
      setLastResponse("Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      if (searchQuery.trim()) {
        // Pasar la consulta al chat y abrirlo
        setInitialChatQuery(searchQuery)
        setIsChatOpen(true)
        setSearchQuery("")
        setIsExpanded(false)
      }
    }
  }



  const handleClose = useCallback(() => {
    setIsExpanded(false)
    setSearchQuery("")
    setLastResponse("")
  }, [])

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false)
    setInitialChatQuery("") // Limpiar la consulta inicial
  }, [])

  const handleOpenChatWithoutQuery = useCallback(() => {
    setInitialChatQuery("")
    setIsChatOpen(true)
  }, [])

  // Limpiar la consulta inicial después de que se abra el chat
  useEffect(() => {
    if (isChatOpen && initialChatQuery) {
      // Limpiar la consulta después de un breve delay para que se procese
      const timer = setTimeout(() => {
        setInitialChatQuery("")
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isChatOpen, initialChatQuery])




  const handleToggle = useCallback(() => {
    if (isExpanded) {
      handleClose()
    } else {
      setIsExpanded(true)
    }
  }, [isExpanded])

  return (
    <>
      {/* Estilos para la animación del gradiente */}
      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% {
            border-image: linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6) 1;
          }
          50% {
            border-image: linear-gradient(135deg, #8b5cf6, #3b82f6, #8b5cf6) 1;
          }
        }
      `}</style>
      
      
      {/* Modal de Chat usando Portal */}
      <ChatWrapper 
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        initialQuery={initialChatQuery}
        user={user}
        profile={profile}
      />
      
      {/* Contenedor del buscador expandible */}
      <div className="hidden md:flex items-center justify-center absolute left-0 right-0 top-0 bottom-0">
        <AnimatePresence>
          {isExpanded ? (
            <>
              {/* Overlay para ocultar el fondo rectangular del header - solo en el área de la barra */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-full overflow-hidden"></div>
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "500px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-lg overflow-hidden relative transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 focus:outline-none"
              style={{
                border: '2px solid',
                borderImage: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6) 1',
                borderRadius: '9999px',
                animation: 'gradientShift 3s ease-in-out infinite',
                clipPath: 'inset(0 round 9999px)'
              }}
            >
              {/* Campo de búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600 dark:text-gray-300 transition-all duration-200" />
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pregunta a Edelweiss sobre CVO, ventas, stock, entregas..."
                  className="pl-10 pr-4 border-0 focus:ring-0 bg-transparent focus:bg-transparent transition-all duration-200 outline-none"
                  disabled={isLoading}
                />
              </div>
              
              {/* Separador */}
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              {/* Botón de Chat */}
              <Button
                onClick={handleOpenChatWithoutQuery}
                size="sm"
                className="h-8 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-blue-300 hover:border-blue-400"
                title="Abrir chat con Edelweiss"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="text-sm font-semibold">Chat</span>
              </Button>
              
              {/* Botón de cerrar */}
              <Button
                onClick={handleClose}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-transparent transition-all duration-200"
              >
                <X className="h-4 w-4 hover:scale-125 hover:font-black transition-all duration-200" />
              </Button>
            </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                className="edelweiss-button group relative text-sm font-black tracking-wider border border-gray-300 dark:border-gray-600 overflow-hidden transition-all duration-300 ease-in-out hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/25"
                style={{ 
                  fontFamily: '"Times New Roman", serif', 
                  fontWeight: '900', 
                  letterSpacing: '0.15em',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                
                {/* Efecto de brillo que se mueve - en hover manual y automático */}
                <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out ${isAutoHover ? 'translate-x-full' : ''}`}></div>
                
                {/* Efecto de brillo reverso - solo automático */}
                <div className="absolute inset-0 translate-x-full reverse-shine:-translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out"></div>
                
                {/* Texto sin cambio de color en hover */}
                <span className="relative z-10">
                  EDELWEISS
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Respuesta de Edelweiss */}
      {lastResponse && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="hidden md:block absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 max-w-[90vw] z-50"
        >
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">E</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Edelweiss</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {lastResponse}
                </p>
              </div>
              <Button
                onClick={() => setLastResponse("")}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

    </>
  )
}