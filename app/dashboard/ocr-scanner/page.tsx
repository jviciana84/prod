'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileImage, Loader2, Copy, Check, Car, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function OCRScannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanMode, setScanMode] = useState<'general' | 'license'>('general');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Activar cámara
  const startCamera = async () => {
    try {
      console.log('Intentando activar cámara...');
      alert('Activando cámara...');
      
      // Intentar primero cámara trasera, luego frontal
      let stream;
      try {
        console.log('Intentando cámara trasera...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Cámara trasera
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          } 
        });
        console.log('Cámara trasera activada');
        alert('Cámara trasera activada');
      } catch (rearError) {
        console.log('Cámara trasera no disponible, intentando frontal...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', // Cámara frontal como fallback
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          } 
        });
        console.log('Cámara frontal activada');
        alert('Cámara frontal activada (trasera no disponible)');
      }
      
      console.log('Stream obtenido:', stream);
      alert('Stream de cámara obtenido correctamente');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        console.log('Cámara activada correctamente');
        alert('Cámara activada correctamente');
        
        // Forzar la reproducción del video
        try {
          await videoRef.current.play();
          console.log('Video reproduciéndose automáticamente');
          alert('Video reproduciéndose automáticamente');
        } catch (playError) {
          console.log('Error reproduciendo automáticamente:', playError);
          alert('Error reproduciendo automáticamente: ' + playError);
          
          // Intentar reproducir cuando el video esté listo
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current?.play();
              console.log('Video reproducido después de cargar metadata');
              alert('Video reproducido después de cargar metadata');
            } catch (e) {
              console.log('Error reproduciendo después de metadata:', e);
              alert('Error reproduciendo después de metadata: ' + e);
            }
          };
          
          // También intentar cuando el video pueda reproducir
          videoRef.current.oncanplay = async () => {
            try {
              if (videoRef.current && videoRef.current.paused) {
                await videoRef.current.play();
                console.log('Video reproducido después de canplay');
                alert('Video reproducido después de canplay');
              }
            } catch (e) {
              console.log('Error reproduciendo después de canplay:', e);
            }
          };
          
          // Intentar reproducir después de un delay
          setTimeout(async () => {
            try {
              if (videoRef.current && videoRef.current.paused) {
                await videoRef.current.play();
                console.log('Video reproducido después de delay');
                alert('Video reproducido después de delay');
              }
            } catch (e) {
              console.log('Error reproduciendo después de delay:', e);
            }
          }, 2000);
        }
      } else {
        alert('Error: videoRef.current es null - El elemento de video no se ha renderizado');
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      alert('No se pudo acceder a la cámara. Error: ' + error);
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
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
    console.log('Botón Verificar clickeado');
    
    if (videoRef.current) {
      const video = videoRef.current;
      const status = {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        srcObject: !!video.srcObject,
        currentSrc: video.currentSrc,
        networkState: video.networkState
      };
      
      console.log('Estado del video:', status);
      
      let message = `Estado del video:\n`;
      message += `• Ancho: ${video.videoWidth}\n`;
      message += `• Alto: ${video.videoHeight}\n`;
      message += `• Estado: ${video.readyState}\n`;
      message += `• Pausado: ${video.paused}\n`;
      message += `• Tiene srcObject: ${!!video.srcObject}\n`;
      message += `• Network State: ${video.networkState}`;
      
      alert(message);
      
      if (video.videoWidth === 0) {
        alert('⚠️ La cámara no está mostrando imagen - Prueba "Forzar Play"');
      } else {
        alert(`✅ Cámara funcionando: ${video.videoWidth}x${video.videoHeight}`);
      }
    } else {
      alert('❌ No hay video disponible - Activa la cámara primero');
    }
  };

  // Forzar reproducción del video
  const forcePlayVideo = async () => {
    console.log('Botón Forzar Play clickeado');
    
    if (videoRef.current) {
      try {
        console.log('Estado del video antes del play:', {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState,
          paused: videoRef.current.paused,
          srcObject: !!videoRef.current.srcObject
        });
        
        await videoRef.current.play();
        console.log('Video forzado a reproducir exitosamente');
        alert('Video forzado a reproducir exitosamente');
        
        // Verificar estado después del play
        setTimeout(() => {
          console.log('Estado del video después del play:', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState,
            paused: videoRef.current?.paused
          });
        }, 1000);
        
      } catch (error) {
        console.error('Error forzando reproducción:', error);
        alert('Error al reproducir video: ' + error);
      }
    } else {
      alert('No hay video disponible - Activa la cámara primero');
    }
  };

  // Probar configuración de cámara
  const testCameraConfig = async () => {
    console.log('Botón Probar Cámara clickeado');
    alert('Botón Probar Cámara funcionando!');
    
    try {
      console.log('Probando configuración de cámara...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Dispositivos de video disponibles:', videoDevices);
      alert(`Cámara configurada: ${videoDevices.length} dispositivos encontrados`);
    } catch (error) {
      console.error('Error probando cámara:', error);
      alert('Error probando configuración de cámara: ' + error);
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
      alert('Cambiando cámara...');
      
      // Detener cámara actual
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Obtener cámaras disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Cámaras disponibles:', videoDevices);
      
      // Intentar cámara trasera si no está activa
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
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
        console.log('Error cambiando a cámara trasera:', error);
        alert('Error cambiando cámara: ' + error);
      }
    } catch (error) {
      console.error('Error en switchCamera:', error);
      alert('Error cambiando cámara: ' + error);
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
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Scanner OCR</h1>
        <p className="text-muted-foreground">
          Escanea matrículas de vehículos o texto en papel usando la cámara
        </p>
      </div>

      {/* Selector de modo */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Modo de Escaneo</CardTitle>
          </CardHeader>
          <CardContent>
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
      </div>

      {/* Cámara */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Captura con Cámara
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                           {videoRef.current && videoRef.current.videoWidth === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Cargando cámara...</p>
                    <p className="text-xs mt-1">Ancho: {videoRef.current.videoWidth} | Alto: {videoRef.current.videoHeight}</p>
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Subir Imagen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {scanMode === 'license' ? 'Matrícula Detectada' : 'Texto Extraído'}
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
          <CardContent>
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
