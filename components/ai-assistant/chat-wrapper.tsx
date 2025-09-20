'use client'

import { useState, useCallback } from 'react'
import ChatModal from './chat-modal'

interface ChatWrapperProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChatWrapper({ isOpen, onClose }: ChatWrapperProps) {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)

  const handleInfoClick = useCallback(() => {
    setIsInfoModalOpen(true)
  }, [])

  const handleCloseInfo = useCallback(() => {
    setIsInfoModalOpen(false)
  }, [])

  return (
    <>
      <ChatModal 
        isOpen={isOpen}
        onClose={onClose}
        onInfoClick={handleInfoClick}
      />
      
      {/* Modal de información de Edelweiss */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
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
                <p className="text-white/90 text-sm">Especialista en CVO • Groq Llama 3.1 8B</p>
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
    </>
  )
}
