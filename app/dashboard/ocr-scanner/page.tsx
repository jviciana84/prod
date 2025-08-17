'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileImage, Loader2, Copy, Check, Car, QrCode, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function OCRScannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanMode, setScanMode] = useState<'general' | 'license'>('general');
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Activar cámara
  const startCamera = async () => {
    try {
      console.log('Intentando activar cámara...');
      
      // Detener cualquier stream anterior
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Detectar si es un dispositivo móvil o portátil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTablet = /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
      
      console.log('Dispositivo detectado:', { isMobile, isTablet });
      
      // Configuración de video según el dispositivo
      let constraints;
      if (isMobile || isTablet) {
        // En móviles/tablets, intentar cámara trasera primero
        constraints = {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'environment' // Cámara trasera
          }
        };
        console.log('Configuración para móvil/tablet - cámara trasera');
      } else {
        // En portátiles/desktop, usar cámara frontal
        constraints = {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user' // Cámara frontal
          }
        };
        console.log('Configuración para portátil/desktop - cámara frontal');
      }
      
      console.log('Solicitando permisos de cámara...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Stream obtenido:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        
                 // Configurar eventos del video
         videoRef.current.onloadedmetadata = () => {
           console.log('Metadata cargada - Dimensiones:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
         };
         
         videoRef.current.oncanplay = () => {
           console.log('Video puede reproducir - Dimensiones:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
           setIsVideoReady(true);
         };
         
         videoRef.current.onplay = () => {
           console.log('Video reproduciéndose - Dimensiones:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
         };
         
         videoRef.current.onwaiting = () => {
           console.log('Video esperando datos...');
           setIsVideoReady(false);
         };
        
        // Intentar reproducir
        try {
          await videoRef.current.play();
          console.log('Video iniciado correctamente');
        } catch (playError) {
          console.error('Error reproduciendo video:', playError);
          
          // Intentar reproducir cuando esté listo
          videoRef.current.oncanplay = async () => {
            try {
              await videoRef.current?.play();
              console.log('Video reproducido en oncanplay');
            } catch (e) {
              console.error('Error en oncanplay:', e);
            }
          };
        }
      } else {
        throw new Error('Elemento de video no disponible');
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      
      // Si falla la cámara trasera, intentar frontal
      if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
        try {
          console.log('Intentando cámara frontal...');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              facingMode: 'user'
            }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setIsCameraActive(true);
            await videoRef.current.play();
            console.log('Cámara frontal activada');
          }
        } catch (frontError) {
          console.error('Error con cámara frontal:', frontError);
          alert('No se pudo acceder a ninguna cámara. Verifica los permisos.');
        }
      } else {
        alert('Error accediendo a la cámara: ' + error.message);
      }
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsVideoReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Capturar imagen
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      console.log('Capturando imagen...');
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('Video readyState:', video.readyState);
      console.log('Video paused:', video.paused);
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        // Configurar canvas con mejor calidad
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Aplicar filtros para mejorar la calidad
        context.filter = 'contrast(1.2) brightness(1.1)';
        context.drawImage(video, 0, 0);
        
        // Capturar con alta calidad
        const imageData = canvas.toDataURL('image/jpeg', 1.0);
        setCapturedImage(imageData);
        stopCamera();
        
        console.log('Imagen capturada exitosamente:', video.videoWidth, 'x', video.videoHeight);
        alert(`✅ Imagen capturada: ${video.videoWidth}x${video.videoHeight}`);
        
        // Mostrar la imagen capturada inmediatamente
        const img = new Image();
        img.onload = () => {
          console.log('Imagen cargada para OCR');
        };
        img.src = imageData;
      } else {
        console.error('Error: Video no tiene dimensiones válidas');
        console.log('Video width:', video.videoWidth);
        console.log('Video height:', video.videoHeight);
        alert('❌ Error al capturar imagen. Asegúrate de que la cámara esté funcionando. Dimensiones: ' + video.videoWidth + 'x' + video.videoHeight);
      }
    } else {
      console.error('Error: videoRef o canvasRef no disponibles');
      alert('❌ Error: Elementos de video no disponibles');
    }
  };

  // Procesar OCR
  const processOCR = async (imageData: string) => {
    setIsLoading(true);
    try {
      console.log('Iniciando procesamiento OCR...');
      alert('Iniciando procesamiento OCR...');
      
      const { createWorker } = await import('tesseract.js');
      console.log('Tesseract importado correctamente');
      
      const worker = await createWorker('spa');
      console.log('Worker de Tesseract creado');
      
      if (scanMode === 'license') {
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
          tessedit_pageseg_mode: '7',
        });
        console.log('Parámetros configurados para matrícula');
      } else {
        await worker.setParameters({
          tessedit_pageseg_mode: '3',
          preserve_interword_spaces: '1',
        });
        console.log('Parámetros configurados para texto general');
      }
      
      console.log('Iniciando reconocimiento de texto...');
      alert('Reconociendo texto en la imagen...');
      
      const { data: { text } } = await worker.recognize(imageData);
      console.log('Texto reconocido (raw):', text);
      
      let cleanedText = text.trim();
      console.log('Texto limpio:', cleanedText);
      
      if (scanMode === 'license') {
        cleanedText = formatLicensePlate(cleanedText);
        console.log('Texto formateado como matrícula:', cleanedText);
      } else {
        cleanedText = cleanedText.replace(/\n\s*\n\s*\n/g, '\n\n');
        console.log('Texto formateado como texto general:', cleanedText);
      }
      
      if (cleanedText.length === 0) {
        alert('⚠️ No se detectó ningún texto en la imagen. Intenta con una imagen más clara o mejor iluminada.');
        console.log('No se detectó texto');
      } else {
        setScannedText(cleanedText);
        alert(`✅ Texto extraído correctamente: "${cleanedText}"`);
        console.log('Texto extraído exitosamente');
      }
      
      await worker.terminate();
      console.log('Worker terminado');
    } catch (error) {
      console.error('Error en OCR:', error);
      alert('Error al procesar la imagen: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear matrícula
  const formatLicensePlate = (text: string): string => {
    let cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (cleaned.length >= 7) {
      const match = cleaned.match(/^([A-Z]{3,4})(\d{3,4})$/);
      if (match) {
        return `${match[1]} ${match[2]}`;
      }
    }
    return cleaned;
  };

  // Subir imagen
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Copiar texto
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(scannedText);
      setCopied(true);
      toast.success('Texto copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar texto');
    }
  };

  // Limpiar
  const clearAll = () => {
    setScannedText('');
    setCapturedImage(null);
    setCopied(false);
  };

  // Verificar estado de la cámara
  const checkCameraStatus = () => {
    console.log('Verificando estado de la cámara...');
    
    if (!videoRef.current) {
      alert('❌ No hay elemento de video disponible');
      return;
    }
    
    const video = videoRef.current;
    const stream = video.srcObject as MediaStream;
    
    const status = {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      paused: video.paused,
      srcObject: !!video.srcObject,
      currentSrc: video.currentSrc,
      networkState: video.networkState,
      hasStream: !!stream,
      streamTracks: stream ? stream.getTracks().length : 0
    };
    
    console.log('Estado del video:', status);
    
    let message = `Estado de la cámara:\n`;
    message += `• Dimensiones: ${video.videoWidth}x${video.videoHeight}\n`;
    message += `• Estado: ${video.readyState} (0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA)\n`;
    message += `• Reproduciendo: ${!video.paused}\n`;
    message += `• Tiene stream: ${!!stream}\n`;
    message += `• Tracks activos: ${stream ? stream.getTracks().length : 0}\n`;
    message += `• Network State: ${video.networkState}`;
    
    console.log(message);
    
    if (video.videoWidth === 0) {
      if (video.readyState === 0) {
        alert('⚠️ La cámara no ha cargado metadata aún. Espera un momento...');
      } else if (video.readyState === 1) {
        alert('⚠️ La cámara tiene metadata pero no datos de video. Intenta "Forzar Play"');
      } else {
        alert('⚠️ La cámara no está mostrando imagen. Verifica permisos y conexión.');
      }
    } else {
      alert(`✅ Cámara funcionando correctamente: ${video.videoWidth}x${video.videoHeight}`);
    }
  };

  // Forzar reproducción del video
  const forcePlayVideo = async () => {
    console.log('Forzando reproducción del video...');
    
    if (!videoRef.current) {
      alert('❌ No hay elemento de video disponible');
      return;
    }
    
    const video = videoRef.current;
    
    try {
      console.log('Estado antes del play:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        srcObject: !!video.srcObject
      });
      
      // Intentar reproducir
      await video.play();
      console.log('Video reproducido exitosamente');
      
      // Verificar estado después del play
      setTimeout(() => {
        console.log('Estado después del play:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          paused: video.paused
        });
        
        if (video.videoWidth > 0) {
          alert(`✅ Video funcionando: ${video.videoWidth}x${video.videoHeight}`);
        } else {
          alert('⚠️ Video reproduciéndose pero sin dimensiones. Verifica permisos.');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error forzando reproducción:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('❌ Permisos de cámara denegados. Verifica los permisos del navegador.');
      } else if (error.name === 'NotSupportedError') {
        alert('❌ El navegador no soporta reproducción automática. Intenta hacer clic en el video.');
      } else {
        alert('❌ Error al reproducir video: ' + error.message);
      }
    }
  };

  // Probar configuración de cámara
  const testCameraConfig = async () => {
    console.log('Probando configuración de cámara...');
    
    try {
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('❌ Este navegador no soporta acceso a la cámara');
        return;
      }
      
      // Enumerar dispositivos
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('Dispositivos de video disponibles:', videoDevices);
      
      let message = `Configuración de cámara:\n`;
      message += `• Dispositivos encontrados: ${videoDevices.length}\n`;
      message += `• Navegador soporta cámara: ✅\n`;
      
      if (videoDevices.length > 0) {
        message += `• Dispositivos:\n`;
        videoDevices.forEach((device, index) => {
          message += `  ${index + 1}. ${device.label || `Cámara ${index + 1}`}\n`;
        });
      } else {
        message += `• ⚠️ No se encontraron dispositivos de video\n`;
      }
      
      alert(message);
      
      // Verificar permisos
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        alert('✅ Permisos de cámara concedidos correctamente');
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        if (permError.name === 'NotAllowedError') {
          alert('❌ Permisos de cámara denegados. Verifica la configuración del navegador.');
        } else {
          alert('❌ Error verificando permisos: ' + permError.message);
        }
      }
      
    } catch (error) {
      console.error('Error probando cámara:', error);
      alert('❌ Error probando configuración de cámara: ' + error.message);
    }
  };

  // Verificar estado del videoRef
  const checkVideoRef = () => {
    console.log('Verificando videoRef...');
    console.log('videoRef.current:', videoRef.current);
    console.log('isCameraActive:', isCameraActive);
    
    if (videoRef.current) {
      alert(`✅ videoRef existe\n• Tag: ${videoRef.current.tagName}\n• ID: ${videoRef.current.id}\n• Class: ${videoRef.current.className}`);
    } else {
      alert('❌ videoRef.current es null - El elemento de video no se ha renderizado');
    }
  };

  // Cambiar entre cámaras
  const switchCamera = async () => {
    try {
      console.log('Cambiando cámara...');
      
      // Detener cámara actual
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Obtener cámaras disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Cámaras disponibles:', videoDevices);
      
      if (videoDevices.length <= 1) {
        alert('Solo hay una cámara disponible en este dispositivo');
        return;
      }
      
      // Detectar dispositivo actual
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTablet = /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
      
      if (isMobile || isTablet) {
        // En móviles/tablets, alternar entre frontal y trasera
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment', // Cámara trasera
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 }
            } 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            await videoRef.current.play();
            console.log('Cambiado a cámara trasera');
            alert('Cambiado a cámara trasera');
          }
        } catch (error) {
          console.log('Error con cámara trasera, intentando frontal:', error);
          // Si falla la trasera, intentar frontal
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'user',
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 }
            } 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            await videoRef.current.play();
            console.log('Cambiado a cámara frontal');
            alert('Cambiado a cámara frontal');
          }
        }
      } else {
        // En portátiles/desktop, solo hay cámara frontal
        alert('En este dispositivo solo hay cámara frontal disponible');
      }
    } catch (error) {
      console.error('Error en switchCamera:', error);
      alert('Error cambiando cámara: ' + error.message);
    }
  };

  // Forzar captura de imagen
  const forceCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      console.log('Forzando captura de imagen...');
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      if (context) {
        // Usar dimensiones mínimas si no están disponibles
        const width = video.videoWidth > 0 ? video.videoWidth : 640;
        const height = video.videoHeight > 0 ? video.videoHeight : 480;
        
        canvas.width = width;
        canvas.height = height;
        
        try {
          context.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 1.0);
          setCapturedImage(imageData);
          stopCamera();
          
          console.log('Imagen capturada forzadamente:', width, 'x', height);
          alert(`✅ Imagen capturada forzadamente: ${width}x${height}`);
        } catch (error) {
          console.error('Error forzando captura:', error);
          alert('Error forzando captura: ' + error);
        }
      }
    } else {
      alert('❌ No hay video disponible para capturar');
    }
  };

  // Probar OCR con imagen de prueba
  const testOCR = async () => {
    console.log('Probando OCR con imagen de prueba...');
    alert('Probando OCR con imagen de prueba...');
    
    try {
      // Crear una imagen de prueba simple con texto
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = 400;
        canvas.height = 100;
        
        // Fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 100);
        
        // Texto negro
        ctx.fillStyle = 'black';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TEST 123', 200, 60);
        
        const testImageData = canvas.toDataURL('image/jpeg', 1.0);
        console.log('Imagen de prueba creada');
        
        // Procesar OCR
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        
        console.log('Procesando imagen de prueba...');
        const { data: { text } } = await worker.recognize(testImageData);
        
        console.log('Resultado OCR:', text);
        alert(`Resultado OCR de prueba: "${text.trim()}"`);
        
        await worker.terminate();
      }
    } catch (error) {
      console.error('Error en prueba OCR:', error);
      alert('Error en prueba OCR: ' + error);
    }
  };

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4"
          segments={[
            {
              title: "Dashboard",
              href: "/dashboard",
            },
            {
              title: "Scanner OCR",
              href: "/dashboard/ocr-scanner",
            },
          ]}
        />
        <div className="flex items-center gap-3">
          <ScanLine className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scanner OCR</h1>
            <p className="text-muted-foreground">Escanea matrículas de vehículos o texto en papel usando la cámara</p>
          </div>
        </div>
      </div>

      {/* Selector de modo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <QrCode className="mr-2 h-4 w-4 text-blue-500" />
            Modo de Escaneo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Button
              variant={scanMode === 'general' ? 'default' : 'outline'}
              onClick={() => setScanMode('general')}
              className="flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              Texto General
            </Button>
            <Button
              variant={scanMode === 'license' ? 'default' : 'outline'}
              onClick={() => setScanMode('license')}
              className="flex items-center gap-2"
            >
              <Car className="h-4 w-4" />
              Matrícula
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {scanMode === 'general' 
              ? 'Ideal para documentos, facturas y texto en papel'
              : 'Optimizado para detectar matrículas de vehículos españolas'
            }
          </p>
        </CardContent>
      </Card>

      {/* Cámara */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Camera className="mr-2 h-4 w-4 text-blue-500" />
            Captura con Cámara
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {!isCameraActive && !capturedImage && (
            <div className="space-y-4">
              <Button onClick={startCamera} className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                Activar Cámara
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  💡 Consejos para mejor resultado:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Asegúrate de que el texto esté bien iluminado</li>
                  <li>• Mantén la cámara estable y paralela al texto</li>
                  <li>• Evita sombras y reflejos</li>
                  <li>• En portátiles, usa la cámara frontal</li>
                </ul>
              </div>
            </div>
          )}

          {/* Elemento de video siempre presente pero oculto cuando no está activo */}
          <div className={`relative ${!isCameraActive ? 'hidden' : ''}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              className="w-full max-w-md mx-auto border rounded-lg bg-black"
              style={{ minHeight: '240px' }}
              onLoadedMetadata={() => {
                console.log('Video metadata cargada');
                if (videoRef.current) {
                  console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                }
              }}
              onError={(e) => {
                console.error('Error en video:', e);
                alert('Error en el elemento de video');
              }}
            />
            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              Cámara activa
            </div>
                         {!isVideoReady && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                 <div className="text-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                   <p className="text-sm">Cargando cámara...</p>
                   <p className="text-xs mt-1">
                     {videoRef.current ? 
                       `Estado: ${videoRef.current.readyState === 0 ? 'Inicializando...' : 
                                  videoRef.current.readyState === 1 ? 'Cargando metadata...' : 
                                  'Preparando video...'}` : 
                       'Conectando...'}
                   </p>
                 </div>
               </div>
             )}
          </div>

          {isCameraActive && (
            <div className="space-y-4">
              <div className="flex gap-2 justify-center flex-wrap">
                <Button onClick={captureImage} variant="default" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Capturar Imagen
                </Button>
                <Button onClick={checkCameraStatus} variant="outline" size="sm">
                  Verificar
                </Button>
                <Button onClick={forcePlayVideo} variant="outline" size="sm">
                  Forzar Play
                </Button>
                <Button onClick={testCameraConfig} variant="outline" size="sm">
                  Probar Cámara
                </Button>
                <Button onClick={checkVideoRef} variant="outline" size="sm">
                  Verificar VideoRef
                </Button>
                <Button onClick={testOCR} variant="outline" size="sm">
                  Probar OCR
                </Button>
                <Button onClick={forceCapture} variant="outline" size="sm">
                  Forzar Captura
                </Button>
                <Button onClick={switchCamera} variant="outline" size="sm">
                  Cambiar Cámara
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Detener Cámara
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Coloca el texto o matrícula frente a la cámara y haz clic en "Capturar Imagen"
              </p>
            </div>
          )}

          {/* Botones siempre visibles para debugging */}
          <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-lg">
            <p className="text-sm font-medium mb-2">Botones de Debug (siempre visibles):</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={captureImage} variant="default" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Capturar Imagen
              </Button>
              <Button onClick={checkCameraStatus} variant="outline" size="sm">
                Verificar
              </Button>
              <Button onClick={forcePlayVideo} variant="outline" size="sm">
                Forzar Play
              </Button>
              <Button onClick={testCameraConfig} variant="outline" size="sm">
                Probar Cámara
              </Button>
              <Button onClick={checkVideoRef} variant="outline" size="sm">
                Verificar VideoRef
              </Button>
              <Button onClick={testOCR} variant="outline" size="sm">
                Probar OCR
              </Button>
              <Button onClick={forceCapture} variant="outline" size="sm">
                Forzar Captura
              </Button>
              <Button onClick={switchCamera} variant="outline" size="sm">
                Cambiar Cámara
              </Button>
              <Button onClick={stopCamera} variant="outline">
                Detener Cámara
              </Button>
            </div>
          </div>

          {capturedImage && (
            <div className="space-y-4">
              <img
                src={capturedImage}
                alt="Imagen capturada"
                className="w-full max-w-md mx-auto border rounded-lg"
              />
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => processOCR(capturedImage)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileImage className="mr-2 h-4 w-4" />
                  )}
                  Procesar OCR
                </Button>
                <Button onClick={clearAll} variant="outline">
                  Limpiar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subir imagen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <FileImage className="mr-2 h-4 w-4 text-blue-500" />
            Subir Imagen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-2 border border-dashed border-gray-300 rounded-lg"
          />
          
          {capturedImage && (
            <div className="space-y-4">
              <img
                src={capturedImage}
                alt="Imagen subida"
                className="w-full max-w-md mx-auto border rounded-lg"
              />
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => processOCR(capturedImage)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileImage className="mr-2 h-4 w-4" />
                  )}
                  Procesar OCR
                </Button>
                <Button onClick={clearAll} variant="outline">
                  Limpiar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {scannedText && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                {scanMode === 'license' ? 'Matrícula Detectada' : 'Texto Extraído'}
              </span>
              <Button
                onClick={copyText}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
              {scannedText}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
