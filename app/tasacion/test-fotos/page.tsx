'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle2, X, Upload, RotateCcw, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FotoKey = 
  | 'frontal' 
  | 'lateral_izq_delantero'
  | 'lateral_izq_trasero' 
  | 'trasera' 
  | 'lateral_der_trasero'
  | 'lateral_der_delantero'

export default function TestFotosPage() {
  const [fotos, setFotos] = useState<Record<FotoKey, string | undefined>>({
    frontal: undefined,
    lateral_izq_delantero: undefined,
    lateral_izq_trasero: undefined,
    trasera: undefined,
    lateral_der_trasero: undefined,
    lateral_der_delantero: undefined,
  })
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const [showCameraView, setShowCameraView] = useState(false)
  const [currentFoto, setCurrentFoto] = useState<FotoKey | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [currentOverlay, setCurrentOverlay] = useState<string>('')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Asignar stream al video cuando cambie
  useEffect(() => {
    if (stream && videoRef.current && showCameraView) {
      videoRef.current.srcObject = stream
    }
  }, [stream, showCameraView])

  const fotosConfig: { key: FotoKey; label: string; overlay: string }[] = [
    { key: 'frontal', label: '🚗 Frontal', overlay: '/svg/camara_overlay/overlay_frontal.svg' },
    { key: 'lateral_izq_delantero', label: '◀️ Lateral Izq. Delantero', overlay: '/svg/camara_overlay/overlay_lateral_izquierdo_delantero.svg' },
    { key: 'lateral_izq_trasero', label: '↙️ Lateral Izq. Trasero', overlay: '/svg/camara_overlay/overlay_lateral_izquierdo_trasero.svg' },
    { key: 'trasera', label: '🔙 Trasera', overlay: '/svg/camara_overlay/overlay_trasera.svg' },
    { key: 'lateral_der_trasero', label: '↘️ Lateral Der. Trasero', overlay: '/svg/camara_overlay/overlay_lateral_derecho_trasero.svg' },
    { key: 'lateral_der_delantero', label: '▶️ Lateral Der. Delantero', overlay: '/svg/camara_overlay/overlay_lateral_derecho_delantero.svg' },
  ]

  const handleCapturarFoto = (key: FotoKey) => {
    setCurrentFoto(key)
    const config = fotosConfig.find(f => f.key === key)
    if (config) {
      setCurrentOverlay(config.overlay)
    }
    setShowPhotoOptions(true)
  }

  const handlePhotoOption = async (option: 'camera' | 'gallery') => {
    setShowPhotoOptions(false)
    
    if (option === 'camera') {
      try {
        // Solicitar fullscreen para ocultar barras del navegador
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
        
        // Solicitar acceso a la cámara trasera
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        })
        
        setStream(mediaStream)
        setShowCameraView(true)
        
        console.log('✅ Stream obtenido:', mediaStream)
        console.log('📹 videoRef.current:', videoRef.current)
        
        // Solicitar orientación horizontal
        if (screen.orientation && 'lock' in screen.orientation) {
          (screen.orientation as any).lock('landscape').catch(() => {
            console.log('No se pudo bloquear orientación')
          })
        }
      } catch (error) {
        console.error('Error al acceder a la cámara:', error)
        alert('No se pudo acceder a la cámara')
      }
    } else {
      galleryInputRef.current?.click()
    }
  }

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Dibujar el frame actual del video en el canvas
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageData)
      
      // Detener stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentFoto) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setCapturedImage(result)
      setShowCameraView(true)
    }
    reader.readAsDataURL(file)
  }

  const handleConfirmPhoto = async () => {
    if (capturedImage && currentFoto) {
      setFotos(prev => ({ ...prev, [currentFoto]: capturedImage }))
      
      // Pasar a la siguiente foto automáticamente
      const currentIndex = fotosConfig.findIndex(f => f.key === currentFoto)
      if (currentIndex < fotosConfig.length - 1) {
        const nextFoto = fotosConfig[currentIndex + 1]
        setCurrentFoto(nextFoto.key)
        setCurrentOverlay(nextFoto.overlay)
        setCapturedImage(null)
        
        // Reabrir cámara para siguiente foto
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          })
          
          setStream(mediaStream)
          console.log('✅ Cámara reabierta para siguiente foto')
        } catch (error) {
          console.error('Error al reabrir cámara:', error)
        }
      } else {
        // Era la última foto
        handleClosCamera()
      }
    }
  }

  const handleRetakePhoto = async () => {
    setCapturedImage(null)
    
    // Reabrir cámara
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Error al reabrir cámara:', error)
    }
  }

  const handleClosCamera = () => {
    // Detener stream si existe
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    // Salir de fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    
    setShowCameraView(false)
    setCapturedImage(null)
    setCurrentFoto(null)
    setCurrentOverlay('')
    
    // Desbloquear orientación
    if (screen.orientation && 'unlock' in screen.orientation) {
      (screen.orientation as any).unlock()
    }
  }

  const fotosCompletadas = Object.values(fotos).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pt-6 pb-24 px-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto"
      >
        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full mb-3 shadow-lg">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🧪 TEST - Fotografías</h2>
          <p className="text-sm text-gray-600">Prueba el sistema de captura</p>
        </div>

        {/* Permisos de cámara */}
        {cameraPermission === 'pending' && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl shadow-lg p-6 mb-4">
            <h3 className="text-lg font-bold text-blue-900 mb-2 text-center">📸 Permiso de cámara</h3>
            <p className="text-sm text-blue-700 mb-4 text-center">
              Para tomar fotos, necesitas permitir el acceso a la cámara
            </p>
            <button
              onClick={async () => {
                try {
                  const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                  })
                  mediaStream.getTracks().forEach(track => track.stop())
                  setCameraPermission('granted')
                } catch (error) {
                  console.error('Permiso denegado:', error)
                  setCameraPermission('denied')
                }
              }}
              className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
            >
              Permitir acceso a cámara
            </button>
          </div>
        )}

        {cameraPermission === 'denied' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl shadow-lg p-6 mb-4">
            <h3 className="text-lg font-bold text-red-900 mb-2 text-center">❌ Acceso denegado</h3>
            <p className="text-sm text-red-700 text-center">
              No se pudo acceder a la cámara. Verifica los permisos del navegador.
            </p>
          </div>
        )}

        {/* Contador */}
        {cameraPermission === 'granted' && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-4 text-center">
            <p className="text-sm font-bold text-gray-800">
              📊 Fotos completadas: {fotosCompletadas} / {fotosConfig.length}
            </p>
          </div>
        )}

        {/* Grid de fotos */}
        {cameraPermission === 'granted' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-3">
            {fotosConfig.map((foto) => (
              <button
                key={foto.key}
                onClick={() => handleCapturarFoto(foto.key)}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                  fotos[foto.key]
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
              <div className="flex items-center gap-3">
                {fotos[foto.key] ? (
                  <img src={fotos[foto.key]} alt={foto.label} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <span className="font-semibold text-gray-900">{foto.label}</span>
              </div>
              {fotos[foto.key] && <CheckCircle2 className="w-6 h-6 text-green-600" />}
              </button>
            ))}
          </div>
        )}

        {/* Botón de reset */}
        {cameraPermission === 'granted' && (
          <Button
            onClick={() => setFotos({
              frontal: undefined,
              lateral_izq_delantero: undefined,
              lateral_izq_trasero: undefined,
              trasera: undefined,
              lateral_der_trasero: undefined,
              lateral_der_delantero: undefined,
            })}
            variant="outline"
            className="w-full mt-4"
          >
            Limpiar todo
          </Button>
        )}
      </motion.div>

      {/* Modal de opciones */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Selecciona opción</h3>
            <div className="space-y-3">
              <button
                onClick={() => handlePhotoOption('camera')}
                className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg"
              >
                <Camera className="w-5 h-5" />
                Tomar Foto
              </button>
              <button
                onClick={() => handlePhotoOption('gallery')}
                className="w-full p-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
              >
                <ImageIcon className="w-5 h-5" />
                Subir de Galería
              </button>
              <button
                onClick={() => {
                  setShowPhotoOptions(false)
                  setCurrentFoto(null)
                }}
                className="w-full p-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Vista de cámara con overlay */}
      {showCameraView && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Botón cerrar flotante (sin header) */}
          <button
            onClick={handleClosCamera}
            className="absolute top-2 right-2 z-50 text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Área de cámara con overlay - MAXIMIZADA */}
          <div className="flex-1 relative overflow-hidden">
            {capturedImage ? (
              <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
            ) : (
              <>
                {/* Video de cámara */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay SVG */}
                {currentOverlay && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <img 
                      src={currentOverlay} 
                      alt="" 
                      className="w-full h-full object-contain"
                      style={{ 
                        opacity: 1,
                        filter: 'brightness(2) drop-shadow(0 0 2px rgba(255,255,255,0.8))'
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controles compactos */}
          <div className="bg-black/60 p-3">
            {capturedImage ? (
              <div className="flex gap-2">
                <button
                  onClick={handleRetakePhoto}
                  className="flex-1 p-3 bg-gray-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Repetir
                </button>
                <button
                  onClick={handleConfirmPhoto}
                  className="flex-1 p-3 bg-green-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar
                </button>
              </div>
            ) : (
              <button
                onClick={handleCapture}
                className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capturar
              </button>
            )}
          </div>

          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Inputs ocultos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

