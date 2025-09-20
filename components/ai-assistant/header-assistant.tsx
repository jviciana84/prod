"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Search, X, Send, Loader2, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { useAuth } from "@/hooks/use-auth"
import IsolatedChat from './isolated-chat'

export default function HeaderAssistant() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState("")
  // const [isAutoHover, setIsAutoHover] = useState(false) // Removido para evitar problemas
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


  // Efecto automático de hover desactivado para evitar interferencias con el chat
  // useEffect(() => {
  //   if (isExpanded || isChatOpen || isInfoModalOpen) return
  //   const interval = setInterval(() => {
  //     setIsAutoHover(true)
  //     setTimeout(() => {
  //       setIsAutoHover(false)
  //     }, 600)
  //   }, 8000)
  //   return () => clearInterval(interval)
  // }, [isExpanded, isChatOpen, isInfoModalOpen])

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
        body: JSON.stringify({ message: searchQuery }),
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
      <IsolatedChat 
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        initialQuery={initialChatQuery}
      />
      
      {/* Contenedor del buscador expandible */}
      <div className="hidden md:flex items-center justify-center absolute left-0 right-0 top-0 bottom-0">
        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "400px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20"
              style={{
                border: '2px solid',
                borderImage: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6) 1',
                borderRadius: '8px',
                animation: 'gradientShift 3s ease-in-out infinite'
              }}
            >
              {/* Campo de búsqueda */}
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${searchQuery ? 'text-blue-500' : 'text-gray-400'}`} />
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pregunta a Edelweiss sobre CVO, ventas, stock, entregas..."
                  className="pl-10 pr-12 border-0 focus:ring-0 bg-transparent focus:bg-blue-50/50 dark:focus:bg-blue-950/20 transition-all duration-200"
                  disabled={isLoading}
                />
                {searchQuery && (
                  <Button
                    onClick={handleSearch}
                    size="sm"
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 bg-blue-500 hover:bg-blue-600 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              
              {/* Botón de cerrar */}
              <Button
                onClick={handleClose}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
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
                className="group relative text-sm font-black tracking-wider border border-gray-300 dark:border-gray-600 overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/25"
                style={{ 
                  fontFamily: '"Times New Roman", serif', 
                  fontWeight: '900', 
                  letterSpacing: '0.15em',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {/* Efecto de fondo animado - solo en hover manual */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500 ease-in-out"></div>
                
        {/* Efecto de brillo que se mueve - solo en hover manual */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out"></div>
                
                {/* Texto con efecto de color - solo en hover manual */}
                <span className="relative z-10 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
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