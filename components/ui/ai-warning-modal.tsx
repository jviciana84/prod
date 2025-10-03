'use client'

import { useEffect, useState } from 'react'

interface AIWarningModalProps {
  isVisible: boolean
  onClose: () => void
}

export function AIWarningModal({ isVisible, onClose }: AIWarningModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShow(true)
      // Cerrar automáticamente después de 4 segundos
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(onClose, 300) // Esperar a que termine la animación
      }, 4000)

      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [isVisible, onClose])

  if (!isVisible && !show) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
      show ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl p-0 max-w-lg mx-4 transform transition-all duration-300 scale-100 overflow-hidden">
        {/* Fondo con patrón */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        
        {/* Contenido */}
        <div className="relative z-10 p-8">
          {/* Imagen de Edelweiss */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Círculo de fondo con gradiente */}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
                {/* Imagen real de Edelweiss */}
                <img 
                  src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png"
                  alt="Edelweiss AI Assistant"
                  className="w-20 h-20 rounded-full object-cover"
                />
              </div>
              
              {/* Efecto de brillo */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full opacity-30 blur-lg animate-pulse" />
            </div>
          </div>

          {/* Título con estilo gótico */}
          <h3 className="text-2xl font-bold text-center text-white mb-3 tracking-wider">
            EDELWEISS
          </h3>

          {/* Subtítulo */}
          <p className="text-center text-blue-200 mb-4 text-sm font-medium">
            Asistente de Inteligencia Artificial
          </p>

          {/* Advertencia */}
          <div className="bg-orange-500/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-orange-400/30">
            <div className="flex items-center justify-center mb-2">
              <span className="font-bold text-orange-300 text-lg">EN PRUEBAS</span>
            </div>
            <p className="text-center text-orange-100 text-sm">
              Las respuestas pueden no ser completamente precisas
            </p>
          </div>

          {/* Barra de progreso animada */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>Inicializando...</span>
              <span>Edelweiss</span>
            </div>
            <div className="w-full bg-white/10 backdrop-blur-sm rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 h-3 rounded-full shadow-lg loading-bar" />
            </div>
          </div>
        </div>

        {/* Efectos de borde */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 p-[1px]">
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
        </div>
      </div>
    </div>
  )
}

// Estilos CSS para la animación de carga
const styles = `
  .loading-bar {
    animation: loading 4s ease-in-out forwards;
    width: 0%;
  }
  
  @keyframes loading {
    0% {
      width: 0%;
    }
    20% {
      width: 30%;
    }
    40% {
      width: 60%;
    }
    60% {
      width: 80%;
    }
    80% {
      width: 95%;
    }
    100% {
      width: 100%;
    }
  }
`

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
