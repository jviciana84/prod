'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle2, FileText, Image as ImageIcon, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface FotografiasStepProps {
  onComplete: (data: {
    fotosVehiculo: {
      frontal?: string
      lateralDelanteroIzq?: string
      lateralTraseroIzq?: string
      trasera?: string
      lateralTraseroDer?: string
      lateralDelanteroDer?: string
      interiorDelantero?: string
      interiorTrasero?: string
    }
    fotosCuentakm?: string
    fotosInteriorDelantero?: string
    fotosInteriorTrasero?: string
    fotosDocumentacion: {
      permisoCirculacionFrente?: string
      permisoCirculacionDorso?: string
      fichaTecnicaFrente?: string
      fichaTecnicaDorso?: string
    }
    fotosOtras: string[]
  }) => void
  onBack: () => void
}

type FotoVehiculoKey = 
  | 'frontal' 
  | 'lateralDelanteroIzq' 
  | 'lateralTraseroIzq' 
  | 'trasera' 
  | 'lateralTraseroDer' 
  | 'lateralDelanteroDer' 
  | 'interiorDelantero' 
  | 'interiorTrasero'

type FotoDocKey = 
  | 'permisoCirculacionFrente' 
  | 'permisoCirculacionDorso' 
  | 'fichaTecnicaFrente' 
  | 'fichaTecnicaDorso'

export default function FotografiasStep({ onComplete, onBack }: FotografiasStepProps) {
  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // Auto-scroll a los 3 segundos
    const scrollTimer = setTimeout(() => {
      window.scrollTo({ 
        top: document.documentElement.scrollHeight, 
        behavior: 'smooth' 
      })
    }, 3000)
    
    return () => clearTimeout(scrollTimer)
  }, [])
  
  const [seccionActual, setSeccionActual] = useState<'vehiculo' | 'cuentakm' | 'interiorDelantero' | 'interiorTrasero' | 'documentos' | 'otras'>('vehiculo')
  const [fotosVehiculo, setFotosVehiculo] = useState<Record<FotoVehiculoKey, string | undefined>>({
    frontal: undefined,
    lateralDelanteroIzq: undefined,
    lateralTraseroIzq: undefined,
    trasera: undefined,
    lateralTraseroDer: undefined,
    lateralDelanteroDer: undefined,
    interiorDelantero: undefined,
    interiorTrasero: undefined,
  })
  const [fotosDocumentacion, setFotosDocumentacion] = useState<Record<FotoDocKey, string | undefined>>({
    permisoCirculacionFrente: undefined,
    permisoCirculacionDorso: undefined,
    fichaTecnicaFrente: undefined,
    fichaTecnicaDorso: undefined,
  })
  const [fotosOtras, setFotosOtras] = useState<string[]>([])
  const [fotosCuentakm, setFotosCuentakm] = useState<string | undefined>(undefined)
  const [fotosInteriorDelantero, setFotosInteriorDelantero] = useState<string | undefined>(undefined)
  const [fotosInteriorTrasero, setFotosInteriorTrasero] = useState<string | undefined>(undefined)
  const [fotoActual, setFotoActual] = useState<string | null>(null)
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const [showCameraView, setShowCameraView] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [currentOverlay, setCurrentOverlay] = useState<string>('')
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0) // Para flujo automático
  const [showBackConfirmation, setShowBackConfirmation] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Mapeo de overlays para cada foto
  const overlayMap: Record<string, string> = {
    'frontal': '/svg/camara_overlay/overlay_frontal.svg',
    'lateralDelanteroIzq': '/svg/camara_overlay/overlay_lateral_izquierdo_delantero.svg',
    'lateralTraseroIzq': '/svg/camara_overlay/overlay_lateral_izquierdo_trasero.svg',
    'trasera': '/svg/camara_overlay/overlay_trasera.svg',
    'lateralTraseroDer': '/svg/camara_overlay/overlay_lateral_derecho_trasero.svg',
    'lateralDelanteroDer': '/svg/camara_overlay/overlay_lateral_derecho_delantero.svg',
  }

  // Asignar stream al video cuando cambie
  useEffect(() => {
    if (stream && videoRef.current && showCameraView) {
      videoRef.current.srcObject = stream
    }
  }, [stream, showCameraView])

  // Prevenir scroll del body cuando la cámara está abierta
  useEffect(() => {
    if (showCameraView) {
      // Prevenir scroll
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      
      return () => {
        // Restaurar scroll al cerrar
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }
    }
  }, [showCameraView])

  // Auto-scroll cuando se entra a sección de documentos u otras
  useEffect(() => {
    if (seccionActual === 'documentos' || seccionActual === 'otras') {
      setTimeout(() => {
        // Scroll hasta el final para ver botones de navegación
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 3000)
    }
  }, [seccionActual])

  // Orden en sentido horario (agujas del reloj) - rotación natural del vehículo
  const fotosVehiculoConfig: { key: FotoVehiculoKey; label: string; emoji: string }[] = [
    { key: 'frontal', label: 'Frontal', emoji: '🚗' },
    { key: 'lateralDelanteroDer', label: 'Lateral delantero der.', emoji: '▶️' },
    { key: 'lateralTraseroDer', label: 'Lateral trasero der.', emoji: '↘️' },
    { key: 'trasera', label: 'Trasera', emoji: '🔙' },
    { key: 'lateralTraseroIzq', label: 'Lateral trasero izq.', emoji: '↙️' },
    { key: 'lateralDelanteroIzq', label: 'Lateral delantero izq.', emoji: '◀️' },
  ]

  const fotosDocConfig: { key: FotoDocKey; label: string; emoji: string }[] = [
    { key: 'permisoCirculacionFrente', label: 'Permiso circulación (frente)', emoji: '📄' },
    { key: 'permisoCirculacionDorso', label: 'Permiso circulación (dorso)', emoji: '📃' },
    { key: 'fichaTecnicaFrente', label: 'Ficha técnica (frente)', emoji: '📋' },
    { key: 'fichaTecnicaDorso', label: 'Ficha técnica (dorso)', emoji: '📋' },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'vehiculo' | 'documento' | 'otra' | 'cuentakm' | 'interiorDelantero' | 'interiorTrasero', key?: string, skipAutoAdvance = false) => {
    console.log('handleFileChange llamado:', { tipo, key, files: e.target.files, skipAutoAdvance })
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No hay archivo seleccionado')
      return
    }

    console.log('Archivo seleccionado:', file.name, file.type)
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      
      if (tipo === 'vehiculo' && key) {
        setFotosVehiculo(prev => ({ ...prev, [key]: base64 }))
        // Si es foto de vehículo subida desde galería dentro de cámara, avanzar automáticamente
        if (showCameraView && !skipAutoAdvance) {
          console.log('📸 Foto subida desde galería en cámara, avanzando...')
          advanceToNextVehiclePhoto()
        }
      } else if (tipo === 'documento' && key) {
        setFotosDocumentacion(prev => ({ ...prev, [key]: base64 }))
      } else if (tipo === 'otra') {
        setFotosOtras(prev => prev.length < 6 ? [...prev, base64] : prev)
      } else if (tipo === 'cuentakm') {
        setFotosCuentakm(base64)
      } else if (tipo === 'interiorDelantero') {
        setFotosInteriorDelantero(base64)
      } else if (tipo === 'interiorTrasero') {
        setFotosInteriorTrasero(base64)
      }
      
      if (!skipAutoAdvance) {
        setFotoActual(null)
      }
      console.log('Foto guardada para tipo:', tipo)
      
      // Auto-scroll después de cargar imagen en cualquier sección (solo si no estamos en cámara)
      if (!showCameraView) {
        setTimeout(() => {
          window.scrollTo({ 
            top: document.documentElement.scrollHeight, 
            behavior: 'smooth' 
          })
        }, 400)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCapturarFoto = (tipo: 'vehiculo' | 'documento' | 'otra' | 'cuentakm' | 'interiorDelantero' | 'interiorTrasero', key?: string) => {
    console.log('handleCapturarFoto llamado:', { tipo, key })
    setFotoActual(key || 'otra')
    
    // Establecer overlay si es foto de vehículo
    if (key && overlayMap[key]) {
      setCurrentOverlay(overlayMap[key])
    } else {
      setCurrentOverlay('')
    }
    
    // Guardar tipo de foto para orientación
    ;(window as any).__tipoFotoActual = tipo
    
    setShowPhotoOptions(true)
  }

  const handlePhotoOption = async (option: 'camera' | 'gallery') => {
    setShowPhotoOptions(false)
    
    if (option === 'camera') {
      try {
        // Solicitar fullscreen
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
        
        // Solicitar orientación según tipo de foto
        const tipoFoto = (window as any).__tipoFotoActual
        const orientacion = tipoFoto === 'documento' ? 'portrait' : 'landscape'
        
        if (screen.orientation && 'lock' in screen.orientation) {
          (screen.orientation as any).lock(orientacion).catch(() => {
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
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageData)
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
    }
  }

  const handleConfirmCameraPhoto = () => {
    if (!capturedImage || !fotoActual) return

    // Guardar la foto en el estado correspondiente
    const file = dataURLtoFile(capturedImage, 'photo.jpg')
    const event = {
      target: {
        files: [file]
      }
    } as any

    if (fotoActual === 'otra') {
      handleFileChange(event, 'otra', undefined, true)
    } else if (fotoActual === 'cuentakm') {
      handleFileChange(event, 'cuentakm', undefined, true)
    } else if (fotoActual === 'interiorDelantero') {
      handleFileChange(event, 'interiorDelantero', undefined, true)
    } else if (fotoActual === 'interiorTrasero') {
      handleFileChange(event, 'interiorTrasero', undefined, true)
    } else if (fotosVehiculoConfig.some(f => f.key === fotoActual)) {
      // Para fotos de vehículo: guardar SIN auto-advance (skipAutoAdvance=true)
      handleFileChange(event, 'vehiculo', fotoActual, true)
      console.log('📸 Foto de vehículo confirmada, avanzando a siguiente...')
      // Luego avanzar manualmente UNA VEZ
      advanceToNextVehiclePhoto()
      return // No cerrar cámara, solo resetear captura
    } else if (fotosDocConfig.some(f => f.key === fotoActual)) {
      handleFileChange(event, 'documento', fotoActual, true)
    }

    // Cerrar cámara (solo si NO es foto de vehículo)
    handleCloseCamera()
  }

  // Función para avanzar a la siguiente foto del vehículo automáticamente
  const advanceToNextVehiclePhoto = async () => {
    const currentIndex = fotosVehiculoConfig.findIndex(f => f.key === fotoActual)
    const nextIndex = currentIndex + 1
    
    console.log(`📸 Avanzando: índice actual ${currentIndex} → siguiente ${nextIndex}`)
    
    if (nextIndex < fotosVehiculoConfig.length) {
      // Hay más fotos, pasar a la siguiente
      const nextPhoto = fotosVehiculoConfig[nextIndex]
      console.log(`📸 Siguiente foto: ${nextPhoto.key}`)
      
      // Cambiar overlay primero
      if (overlayMap[nextPhoto.key]) {
        setCurrentOverlay(overlayMap[nextPhoto.key])
      } else {
        setCurrentOverlay('')
      }
      
      // Resetear captura para que pueda tomar la siguiente
      setCapturedImage(null)
      
      // Cambiar fotoActual
      setFotoActual(nextPhoto.key)
      setCurrentPhotoIndex(nextIndex)
      
      // Asegurar que el stream está activo
      console.log('📸 Stream activo antes de verificar:', !!stream)
      
      if (!stream || !videoRef.current?.srcObject) {
        console.log('⚠️ Stream no activo, reactivando cámara...')
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
          }
          console.log('✅ Cámara reactivada correctamente')
        } catch (error) {
          console.error('❌ Error al reactivar cámara:', error)
        }
      } else {
        console.log('✅ Stream ya activo, continuando...')
      }
      
      console.log('📸 Cámara lista para siguiente foto')
    } else {
      // Era la última foto, cerrar cámara
      console.log('📸 Última foto completada, cerrando cámara')
      handleCloseCamera()
    }
  }

  // Función para obtener el nombre legible de la vista actual
  const getCurrentViewName = (): string => {
    if (!fotoActual) return ''
    
    const vehiculoPhoto = fotosVehiculoConfig.find(f => f.key === fotoActual)
    if (vehiculoPhoto) return vehiculoPhoto.label.toUpperCase()
    
    const docPhoto = fotosDocConfig.find(f => f.key === fotoActual)
    if (docPhoto) return docPhoto.label.toUpperCase()
    
    if (fotoActual === 'cuentakm') return 'CUENTAKILÓMETROS'
    if (fotoActual === 'interiorDelantero') return 'INTERIOR DELANTERO'
    if (fotoActual === 'interiorTrasero') return 'INTERIOR TRASERO'
    if (fotoActual === 'otra') return 'FOTO ADICIONAL'
    
    return ''
  }

  // Manejar subida desde galería dentro de la cámara
  const handleUploadFromCamera = () => {
    // Cerrar la cámara actual
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCapturedImage(null)
    setShowCameraView(false)
    
    // Abrir selector de galería
    galleryInputRef.current?.click()
  }

  const handleRetakePhoto = async () => {
    setCapturedImage(null)
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      setStream(mediaStream)
    } catch (error) {
      console.error('Error al reabrir cámara:', error)
    }
  }

  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    
    setShowCameraView(false)
    setCapturedImage(null)
    setCurrentOverlay('')
    
    // Desbloquear orientación y volver a portrait
    if (screen.orientation && 'unlock' in screen.orientation) {
      (screen.orientation as any).unlock()
      
      // Volver a forzar orientación vertical
      setTimeout(() => {
        if (screen.orientation && 'lock' in screen.orientation) {
          (screen.orientation as any).lock('portrait').catch(() => {
            console.log('No se pudo restaurar orientación vertical')
          })
        }
      }, 100)
    }
  }

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while(n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  const handleEliminarFotoOtra = (index: number) => {
    setFotosOtras(prev => prev.filter((_, i) => i !== index))
  }

  const handleBackButton = () => {
    // Navegar entre secciones: otras → documentos → interiorTrasero → interiorDelantero → cuentakm → vehiculo
    if (seccionActual === 'otras') {
      setSeccionActual('documentos')
    } else if (seccionActual === 'documentos') {
      setSeccionActual('interiorTrasero')
    } else if (seccionActual === 'interiorTrasero') {
      setSeccionActual('interiorDelantero')
    } else if (seccionActual === 'interiorDelantero') {
      setSeccionActual('cuentakm')
    } else if (seccionActual === 'cuentakm') {
      setSeccionActual('vehiculo')
    } else if (seccionActual === 'vehiculo') {
      // Mostrar advertencia de pérdida de fotos
      const tieneFotos = Object.values(fotosVehiculo).some(Boolean) || 
                         fotosCuentakm || 
                         fotosInteriorDelantero || 
                         fotosInteriorTrasero ||
                         Object.values(fotosDocumentacion).some(Boolean) ||
                         fotosOtras.length > 0
      
      console.log('🔙 Volver desde vehículo. ¿Tiene fotos?', tieneFotos)
      console.log('📸 Fotos vehículo:', Object.values(fotosVehiculo).filter(Boolean).length)
      console.log('📸 Otras fotos:', { cuentakm: !!fotosCuentakm, intDel: !!fotosInteriorDelantero, intTr: !!fotosInteriorTrasero, docs: Object.values(fotosDocumentacion).filter(Boolean).length, otras: fotosOtras.length })
      
      if (tieneFotos) {
        console.log('⚠️ Mostrando advertencia de pérdida de fotos')
        setShowBackConfirmation(true)
      } else {
        console.log('✅ No hay fotos, volviendo sin advertencia')
        onBack()
      }
    }
  }

  const handleContinue = () => {
    console.log('handleContinue llamado, seccionActual:', seccionActual)
    
    // Flujo secuencial: vehículo -> cuentakm -> interior delantero -> interior trasero -> documentos -> otras -> finalizar
    
    if (seccionActual === 'vehiculo') {
      setSeccionActual('cuentakm');
      return;
    }
    
    if (seccionActual === 'cuentakm') {
      setSeccionActual('interiorDelantero');
      return;
    }
    
    if (seccionActual === 'interiorDelantero') {
      setSeccionActual('interiorTrasero');
      return;
    }
    
    if (seccionActual === 'interiorTrasero') {
      setSeccionActual('documentos');
      return;
    }
    
    if (seccionActual === 'documentos') {
      setSeccionActual('otras');
      return;
    }
    
    // Si estamos en otras, finalizar
    if (seccionActual === 'otras') {
      console.log('Finalizando tasación...')
      
      const dataToComplete = {
        fotosVehiculo,
        fotosCuentakm,
        fotosInteriorDelantero,
        fotosInteriorTrasero,
        fotosDocumentacion,
        fotosOtras,
      }
      
      console.log('Datos a enviar:', dataToComplete)
      
      onComplete(dataToComplete)
    }
  }

  const fotosVehiculoCompletas = fotosVehiculoConfig
    .map(foto => fotosVehiculo[foto.key])
    .filter(Boolean).length
  const fotosDocCompletas = Object.values(fotosDocumentacion).filter(Boolean).length
  const totalFotosVehiculo = fotosVehiculoConfig.length
  const totalFotosDoc = fotosDocConfig.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pt-6 pb-24 px-4">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fotografías</h2>
          <p className="text-sm text-gray-600">Captura las imágenes del vehículo</p>
        </div>

        {/* Selector de sección */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 mb-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSeccionActual('vehiculo')}
              className={`py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                seccionActual === 'vehiculo'
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Vehículo
              <div className="text-[10px] mt-1">{fotosVehiculoCompletas}/{totalFotosVehiculo}</div>
            </button>
            <button
              onClick={() => setSeccionActual('cuentakm')}
              className={`py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                seccionActual === 'cuentakm'
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Cuentakm
              <div className="text-[10px] mt-1">{fotosCuentakm ? 1 : 0}/1</div>
            </button>
            <button
              onClick={() => setSeccionActual('interiorDelantero')}
              className={`py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                seccionActual === 'interiorDelantero'
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Interior Del.
              <div className="text-[10px] mt-1">{fotosInteriorDelantero ? 1 : 0}/1</div>
            </button>
            <button
              onClick={() => setSeccionActual('interiorTrasero')}
              className={`py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                seccionActual === 'interiorTrasero'
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Interior Tr.
              <div className="text-[10px] mt-1">{fotosInteriorTrasero ? 1 : 0}/1</div>
            </button>
            <button
              onClick={() => setSeccionActual('documentos')}
              className={`py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                seccionActual === 'documentos'
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Documentos
              <div className="text-[10px] mt-1">{fotosDocCompletas}/{totalFotosDoc}</div>
            </button>
            <button
              onClick={() => setSeccionActual('otras')}
              className={`py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                seccionActual === 'otras'
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Otras
              <div className="text-[10px] mt-1">{fotosOtras.length}</div>
            </button>
          </div>
        </div>

        {/* Contenido de secciones */}
        <AnimatePresence mode="wait">
          {seccionActual === 'vehiculo' && (
            <motion.div
              key="vehiculo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6"
            >
              {/* SVG del coche con botones de cámara */}
              <div className="relative w-full h-80 mx-auto bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src="/svg/arriba.svg" 
                  alt="Vista superior del coche" 
                  className="w-full h-full object-contain transform rotate-90"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
                  onError={(e) => {
                    console.error('Error cargando imagen:', e);
                    e.currentTarget.style.display = 'none';
                    // Mostrar mensaje de fallback
                    const fallback = document.createElement('div');
                    fallback.className = 'text-center text-gray-500 p-4';
                    fallback.innerHTML = `
                      <div class="text-6xl mb-2">🚗</div>
                      <p>Vista superior del vehículo</p>
                      <p class="text-sm">Error cargando imagen</p>
                    `;
                    e.currentTarget.parentNode?.appendChild(fallback);
                  }}
                  onLoad={() => {
                    console.log('Imagen del coche cargada correctamente');
                  }}
                />

                {/* Botones de cámara posicionados correctamente */}
                
                {/* Frontal - centro superior */}
                <button
                  onClick={() => handleCapturarFoto('vehiculo', 'frontal')}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                >
                  {fotosVehiculo.frontal ? (
                    <img src={fotosVehiculo.frontal} alt="Frontal" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Lateral izquierdo delantero */}
                <button
                  onClick={() => handleCapturarFoto('vehiculo', 'lateralDelanteroIzq')}
                  className="absolute top-20 left-8 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                >
                  {fotosVehiculo.lateralDelanteroIzq ? (
                    <img src={fotosVehiculo.lateralDelanteroIzq} alt="Lateral Izq" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Lateral izquierdo trasero */}
                <button
                  onClick={() => handleCapturarFoto('vehiculo', 'lateralTraseroIzq')}
                  className="absolute bottom-20 left-8 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                >
                  {fotosVehiculo.lateralTraseroIzq ? (
                    <img src={fotosVehiculo.lateralTraseroIzq} alt="Lateral Izq Trasero" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Trasera - centro inferior */}
                <button
                  onClick={() => handleCapturarFoto('vehiculo', 'trasera')}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                >
                  {fotosVehiculo.trasera ? (
                    <img src={fotosVehiculo.trasera} alt="Trasera" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Lateral derecho trasero */}
                <button
                  onClick={() => handleCapturarFoto('vehiculo', 'lateralTraseroDer')}
                  className="absolute bottom-20 right-8 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                >
                  {fotosVehiculo.lateralTraseroDer ? (
                    <img src={fotosVehiculo.lateralTraseroDer} alt="Lateral Der Trasero" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Lateral derecho delantero */}
                <button
                  onClick={() => handleCapturarFoto('vehiculo', 'lateralDelanteroDer')}
                  className="absolute top-20 right-8 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                >
                  {fotosVehiculo.lateralDelanteroDer ? (
                    <img src={fotosVehiculo.lateralDelanteroDer} alt="Lateral Der" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>

              </div>

              {/* Leyenda */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Toca los botones para capturar las fotografías</p>
                <div className="flex justify-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Exterior</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {seccionActual === 'cuentakm' && (
            <motion.div
              key="cuentakm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6"
            >
              {/* Disclaimer importante */}
              <div className="mb-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded-r text-center">
                <p className="text-xs text-yellow-800 font-medium">
                  <strong>IMPORTANTE:</strong> Hacer fotografía con el motor encendido
                </p>
              </div>

              {/* SVG del cuentakm con botón de cámara */}
              <div className="relative w-full h-80 mx-auto">
                <img 
                  src="/svg/cuentakm.svg" 
                  alt="Cuentakilómetros" 
                  className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
                />
                
                {/* Botón de cámara centrado */}
                <button
                  onClick={() => handleCapturarFoto('cuentakm', 'cuentakm')}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                >
                  {fotosCuentakm ? (
                    <img src={fotosCuentakm} alt="Cuentakm" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Captura una foto del cuentakilómetros del vehículo</p>
              </div>
            </motion.div>
          )}

          {seccionActual === 'interiorDelantero' && (
            <motion.div
              key="interiorDelantero"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6"
            >
              {/* SVG del interior delantero con botón de cámara */}
              <div className="relative w-full h-80 mx-auto">
                <img 
                  src="/svg/interiordelantero.svg" 
                  alt="Interior Delantero" 
                  className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
                />
                
                {/* Botón de cámara centrado */}
                <button
                  onClick={() => handleCapturarFoto('interiorDelantero', 'interiorDelantero')}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                >
                  {fotosInteriorDelantero ? (
                    <img src={fotosInteriorDelantero} alt="Interior Delantero" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Captura una foto del interior delantero del vehículo</p>
              </div>
            </motion.div>
          )}

          {seccionActual === 'interiorTrasero' && (
            <motion.div
              key="interiorTrasero"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6"
            >
              {/* SVG del interior trasero con botón de cámara */}
              <div className="relative w-full h-80 mx-auto">
                <img 
                  src="/svg/interiortrasero.svg" 
                  alt="Interior Trasero" 
                  className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
                />
                
                {/* Botón de cámara centrado */}
                <button
                  onClick={() => handleCapturarFoto('interiorTrasero', 'interiorTrasero')}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                >
                  {fotosInteriorTrasero ? (
                    <img src={fotosInteriorTrasero} alt="Interior Trasero" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Captura una foto del interior trasero del vehículo</p>
              </div>
            </motion.div>
          )}

          {seccionActual === 'documentos' && (
            <motion.div
              key="documentos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {fotosDocConfig.map((foto) => (
                <div
                  key={foto.key}
                  data-foto-key={foto.key}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{foto.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{foto.label}</p>
                        {fotosDocumentacion[foto.key] && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Capturada
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCapturarFoto('documento', foto.key)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        fotosDocumentacion[foto.key]
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                      }`}
                    >
                      {fotosDocumentacion[foto.key] ? 'Cambiar' : 'Capturar'}
                    </button>
                  </div>
                  {fotosDocumentacion[foto.key] && (
                    <motion.img
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      src={fotosDocumentacion[foto.key]}
                      alt={foto.label}
                      className="mt-3 w-full rounded-lg"
                    />
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {seccionActual === 'otras' && (
            <motion.div
              key="otras"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-4">
                <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Fotografías adicionales
                </Label>
                <button
                  onClick={() => handleCapturarFoto('otra')}
                  className="w-full py-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600 font-semibold"
                >
                  <Camera className="w-5 h-5" />
                  Agregar foto
                </button>
              </div>

              {fotosOtras.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {fotosOtras.map((foto, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative bg-white rounded-lg overflow-hidden shadow-lg"
                    >
                      <img src={foto} alt={`Otra ${index + 1}`} className="w-full h-40 object-cover" />
                      <button
                        onClick={() => handleEliminarFotoOtra(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal compacto de opciones de foto */}
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
                  onClick={() => setShowPhotoOptions(false)}
                  className="w-full p-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Input oculto para cámara */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (fotoActual === 'otra') {
              handleFileChange(e, 'otra')
            } else if (fotoActual === 'cuentakm') {
              handleFileChange(e, 'cuentakm')
            } else if (fotoActual === 'interiorDelantero') {
              handleFileChange(e, 'interiorDelantero')
            } else if (fotoActual === 'interiorTrasero') {
              handleFileChange(e, 'interiorTrasero')
            } else if (fotoActual && fotosVehiculoConfig.some(f => f.key === fotoActual)) {
              handleFileChange(e, 'vehiculo', fotoActual)
            } else if (fotoActual && fotosDocConfig.some(f => f.key === fotoActual)) {
              handleFileChange(e, 'documento', fotoActual)
            }
          }}
        />

        {/* Input oculto para galería */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (fotoActual === 'otra') {
              handleFileChange(e, 'otra')
            } else if (fotoActual === 'cuentakm') {
              handleFileChange(e, 'cuentakm')
            } else if (fotoActual === 'interiorDelantero') {
              handleFileChange(e, 'interiorDelantero')
            } else if (fotoActual === 'interiorTrasero') {
              handleFileChange(e, 'interiorTrasero')
            } else if (fotoActual && fotosVehiculoConfig.some(f => f.key === fotoActual)) {
              handleFileChange(e, 'vehiculo', fotoActual)
            } else if (fotoActual && fotosDocConfig.some(f => f.key === fotoActual)) {
              handleFileChange(e, 'documento', fotoActual)
            }
          }}
        />

        {/* Botones de navegación */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleBackButton}
            variant="outline"
            className="flex-1 h-12 border-2"
          >
            Atrás
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold shadow-lg"
          >
            {seccionActual === 'otras' ? 'Finalizar' : 'Continuar'}
          </Button>
        </div>
      </motion.div>

      {/* Modal de confirmación para volver */}
      {showBackConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-3">¿Estás seguro?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Si vuelves a "Datos del Vehículo" perderás todas las fotografías capturadas.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowBackConfirmation(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setShowBackConfirmation(false)
                  onBack()
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Sí, volver
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Vista de cámara fullscreen con overlay */}
      {showCameraView && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden touch-none">
          {/* Indicador de vista actual (superior derecha, discreto) */}
          <div className="absolute top-4 right-4 z-50 bg-black/70 px-3 py-1.5 rounded-lg pointer-events-none">
            <p className="text-white text-xs font-semibold">{getCurrentViewName()}</p>
          </div>

          {/* Botones compactos superpuestos (inferior izquierda) - Solo cuando NO hay captura */}
          {!capturedImage && (
            <div className="absolute bottom-24 left-4 z-50 flex flex-col gap-2">
              <button
                onClick={handleCloseCamera}
                className="px-3 py-2 bg-black/80 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-black/90 transition-all backdrop-blur-sm border border-white/20"
              >
                <X className="w-3.5 h-3.5" />
                Menú
              </button>
              <button
                onClick={handleUploadFromCamera}
                className="px-3 py-2 bg-black/80 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-black/90 transition-all backdrop-blur-sm border border-white/20"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Subir
              </button>
            </div>
          )}

          <div className="flex-1 relative overflow-hidden">
            {capturedImage ? (
              <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Rejilla fotográfica con punto central */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Grid de regla de tercios */}
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Líneas verticales */}
                    <line x1="33.33" y1="0" x2="33.33" y2="100" stroke="white" strokeWidth="0.2" opacity="0.4" />
                    <line x1="66.67" y1="0" x2="66.67" y2="100" stroke="white" strokeWidth="0.2" opacity="0.4" />
                    {/* Líneas horizontales */}
                    <line x1="0" y1="33.33" x2="100" y2="33.33" stroke="white" strokeWidth="0.2" opacity="0.4" />
                    <line x1="0" y1="66.67" x2="100" y2="66.67" stroke="white" strokeWidth="0.2" opacity="0.4" />
                  </svg>
                  
                  {/* Punto central */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                  </div>
                </div>
                
                {/* Overlay de silueta (solo si existe) */}
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

          {/* Botonera con fondo negro */}
          <div className="bg-black p-3">
            {/* Botones principales */}
            {capturedImage ? (
              <div className="flex gap-2">
                <button
                  onClick={handleRetakePhoto}
                  className="flex-1 p-3 bg-gray-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-600 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Repetir
                </button>
                <button
                  onClick={handleConfirmCameraPhoto}
                  className="flex-1 p-3 bg-green-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-500 transition-all"
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

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  )
}