'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Check } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner";
import { useRouter } from 'next/navigation';
import * as Tesseract from 'tesseract.js';

export default function OCRTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'general' | 'license' | 'code'>('code');
  const [showDetectionEffect, setShowDetectionEffect] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Nuevos estados para OCR.Space y geolocalización
  const [useSpaceAPI, setUseSpaceAPI] = useState(true);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  
  // Estados para efectos de detección de texto
  const [detectionBox, setDetectionBox] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [realTimeDetection, setRealTimeDetection] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  // Activar cámara automáticamente al cargar
  useEffect(() => {
    startCamera();
    // Solicitar geolocalización automáticamente
    requestLocationPermission();
    return () => {
      stopCamera();
    };
  }, []);

  // OCR en tiempo real
  useEffect(() => {
    if (videoRef.current && !isProcessing && isCameraActive) {
      const interval = setInterval(() => {
        detectTextInRealTime();
      }, 1500); // Cada 1.5 segundos para detección más rápida

      return () => clearInterval(interval);
    }
  }, [isProcessing, isCameraActive]);

  // Detectar texto en tiempo real
  const detectTextInRealTime = async () => {
    if (!videoRef.current || !isCameraActive || isProcessing) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Usar Tesseract para detectar texto rápidamente
      const worker = await Tesseract.createWorker('eng');
      
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        tessedit_pageseg_mode: '6',
        tessedit_confidence_threshold: '15', // Más agresivo
      });
      
      const result = await worker.recognize(canvas);
      await worker.terminate();
      
      if (result.data.words && result.data.words.length > 0) {
        console.log('TEXTO DETECTADO EN TIEMPO REAL:', result.data.words.map((w: any) => w.text).join(' '));
        
        // Calcular bounding box del texto detectado
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        
        result.data.words.forEach((word: any) => {
          const bbox = word.bbox;
          minX = Math.min(minX, bbox.x0);
          minY = Math.min(minY, bbox.y0);
          maxX = Math.max(maxX, bbox.x1);
          maxY = Math.max(maxY, bbox.y1);
        });
        
        // Convertir coordenadas del canvas a coordenadas del video
        const videoElement = videoRef.current;
        const videoRect = videoElement.getBoundingClientRect();
        const scaleX = videoRect.width / video.videoWidth;
        const scaleY = videoRect.height / video.videoHeight;
        
        const detectionBoxData = {
          x: minX * scaleX,
          y: minY * scaleY,
          width: (maxX - minX) * scaleX,
          height: (maxY - minY) * scaleY
        };
        
        setDetectionBox(detectionBoxData);
        setShowDetectionEffect(true);
        setDetectionCount(prev => prev + 1);
        
        // VIBRAR cuando detecta texto (solo en móviles)
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        
        // Ocultar efecto después de 3 segundos
        setTimeout(() => {
          setShowDetectionEffect(false);
          setDetectionBox(null);
        }, 3000);
      }
      
    } catch (error) {
      console.log('Error en detección en tiempo real:', error);
    }
  };

  // Activar cámara
  const startCamera = async () => {
    try {
      console.log('Activando cámara automáticamente...');
      
      // Intentar cámara trasera primero
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Cámara trasera
            width: { ideal: 1920, max: 2560 },
            height: { ideal: 1080, max: 1440 }
          } 
        });
        console.log('Cámara trasera activada');
      } catch (rearError) {
        console.log('Cámara trasera no disponible, intentando frontal...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 1920, max: 2560 },
            height: { ideal: 1080, max: 1440 }
          } 
        });
        console.log('Cámara frontal activada');
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Reproducir automáticamente
        try {
          await videoRef.current.play();
          console.log('Video reproduciéndose automáticamente');
          setIsCameraActive(true);
        } catch (playError) {
          console.log('Error reproduciendo automáticamente:', playError);
        }
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      setCameraError('No se pudo acceder a la cámara');
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Detectar y recortar zona de texto con Tesseract
  const detectAndCropText = async (imageData: string): Promise<string> => {
    try {
      console.log('Detectando zona de texto...');
      
      // Crear canvas para procesar imagen
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = async () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          // Usar Tesseract para detectar texto y obtener coordenadas
          const worker = await Tesseract.createWorker('eng');
          
          // Configurar para detectar texto sin procesar
          await worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            tessedit_pageseg_mode: '6', // Single uniform block of text
          });
          
          const result = await worker.recognize(canvas);
          await worker.terminate();
          
          console.log('Resultado detección Tesseract:', result);
          
          if (result.data.words && result.data.words.length > 0) {
            // Calcular bounding box de todo el texto
            let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
            
            result.data.words.forEach((word: any) => {
              const bbox = word.bbox;
              minX = Math.min(minX, bbox.x0);
              minY = Math.min(minY, bbox.y0);
              maxX = Math.max(maxX, bbox.x1);
              maxY = Math.max(maxY, bbox.y1);
            });
            
            // Añadir padding
            const padding = 20;
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX = Math.min(img.width, maxX + padding);
            maxY = Math.min(img.height, maxY + padding);
            
            // Recortar zona de texto
            const cropCanvas = document.createElement('canvas');
            const cropCtx = cropCanvas.getContext('2d');
            const cropWidth = maxX - minX;
            const cropHeight = maxY - minY;
            
            cropCanvas.width = cropWidth;
            cropCanvas.height = cropHeight;
            
            cropCtx?.drawImage(
              canvas,
              minX, minY, cropWidth, cropHeight,
              0, 0, cropWidth, cropHeight
            );
            
            // Comprimir al máximo (calidad 0.3, máximo 800px)
            const maxSize = 800;
            const scale = Math.min(1, maxSize / Math.max(cropWidth, cropHeight));
            const finalWidth = Math.round(cropWidth * scale);
            const finalHeight = Math.round(cropHeight * scale);
            
            const finalCanvas = document.createElement('canvas');
            const finalCtx = finalCanvas.getContext('2d');
            finalCanvas.width = finalWidth;
            finalCanvas.height = finalHeight;
            
            finalCtx?.drawImage(
              cropCanvas,
              0, 0, cropWidth, cropHeight,
              0, 0, finalWidth, finalHeight
            );
            
            // Convertir a base64 con máxima compresión
            const compressedImage = finalCanvas.toDataURL('image/jpeg', 0.3);
            console.log(`Imagen recortada: ${cropWidth}x${cropHeight} → ${finalWidth}x${finalHeight}`);
            
            resolve(compressedImage);
          } else {
            // Si no detecta texto, usar imagen original comprimida
            console.log('No se detectó texto, usando imagen original comprimida');
            const compressedOriginal = canvas.toDataURL('image/jpeg', 0.3);
            resolve(compressedOriginal);
          }
        };
        
        img.src = imageData;
      });
    } catch (error) {
      console.error('Error en detección de texto:', error);
      // En caso de error, devolver imagen original comprimida
      return imageData;
    }
  };

  // Capturar imagen
  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Aplicar filtros para mejorar calidad
        context.filter = 'contrast(1.3) brightness(1.2) saturate(1.2)';
        context.drawImage(video, 0, 0);
        
        // Aplicar post-procesamiento adicional
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Mejorar contraste y nitidez
        for (let i = 0; i < data.length; i += 4) {
          // Convertir a escala de grises para OCR
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          
          // Aplicar umbral adaptativo
          const threshold = gray > 140 ? 255 : 0;
          
          // Aplicar contraste mejorado
          const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
          
          data[i] = contrast;     // R
          data[i + 1] = contrast; // G
          data[i + 2] = contrast; // B
          // Alpha se mantiene igual
        }
        
        // Poner los datos procesados de vuelta
        context.putImageData(imageData, 0, 0);
        
        const finalImageData = canvas.toDataURL('image/jpeg', 0.95);
        
        await processOCR(finalImageData);
      }
    }
  };

  // Procesar OCR con optimizaciones completas
  const processOCR = async (imageData: string) => {
    setIsLoading(true);
    try {
      console.log('Iniciando procesamiento OCR...');
      
      // SIEMPRE usar OCR.Space para mejor precisión
      console.log('Usando OCR.Space API...');
      await processOCRWithSpaceAPI(imageData);
      return;
    } catch (error) {
      console.error('Error en OCR:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Solicitar permisos de geolocalización
  const requestLocationPermission = async () => {
    try {
      console.log('Solicitando permisos de geolocalización...');
      
      if (!navigator.geolocation) {
        console.error('Geolocalización no soportada');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      setLocation({ lat: latitude, lng: longitude });
      setLocationPermission('granted');
      
      console.log('Ubicación obtenida:', { latitude, longitude });
      
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setLocationPermission('denied');
    }
  };

  // Procesar OCR con OCR.Space API (más preciso)
  const processOCRWithSpaceAPI = async (imageData: string) => {
    setIsLoading(true);
    try {
      console.log('Iniciando OCR con Space API...');
      
      // Detectar y recortar zona de texto con Tesseract
      const croppedImageData = await detectAndCropText(imageData);
      console.log('Imagen procesada para OCR.Space:', croppedImageData);
      
      // Convertir base64 a blob
      const base64Data = croppedImageData.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      
      // Crear FormData
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('filetype', 'jpg');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Engine más preciso
      formData.append('apikey', 'K88810169088957'); // API key de OCR.Space
      
      // Llamada a OCR.Space API
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Resultado OCR.Space:', result);
      
      if (result.IsErroredOnProcessing) {
        throw new Error(result.ErrorMessage || 'Error en el procesamiento OCR');
      }
      
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        const extractedText = result.ParsedResults[0].ParsedText;
        
        if (extractedText && extractedText.trim()) {
          // Limpiar y procesar el texto según el modo
          let cleanedText = extractedText.trim();
          
          if (scanMode === 'code') {
            // Para códigos, extraer solo alfanumérico
            const alphanumericCode = cleanedText.replace(/[^A-Z0-9]/gi, '').trim();
            if (alphanumericCode.length >= 4 && alphanumericCode.length <= 10) {
              cleanedText = alphanumericCode.toUpperCase();
            }
          } else if (scanMode === 'license') {
            // Para matrículas, formato específico
            const licensePattern = /[A-Z0-9]{4,8}/gi;
            const match = cleanedText.match(licensePattern);
            if (match) {
              cleanedText = match[0].toUpperCase();
            }
          }
          
          setScannedText(cleanedText);
          console.log('Texto extraído con OCR.Space:', cleanedText);
          
          // MOSTRAR VENTANA CON RESULTADO Y UBICACIÓN
          alert(`✅ OCR COMPLETADO\n\n📝 TEXTO DETECTADO: "${cleanedText}"\n\n📍 UBICACIÓN: ${location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'No registrada'}`);
          
          // Copiar al portapapeles automáticamente
          try {
            await navigator.clipboard.writeText(cleanedText);
          } catch (e) {
            console.log('No se pudo copiar al portapapeles');
          }
        }
      }
      
    } catch (error) {
      console.error('Error en OCR.Space:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salir al dashboard
  const exitToDashboard = () => {
    stopCamera();
    router.push('/dashboard');
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">OCR Test (PC)</h1>
          <div className="flex items-center gap-2">
            {/* Toggle OCR.Space */}
            <Button
              variant={useSpaceAPI ? 'default' : 'outline'}
              onClick={() => setUseSpaceAPI(!useSpaceAPI)}
              size="sm"
              className="text-white border-white/20 hover:bg-white/20"
            >
              {useSpaceAPI ? 'OCR+' : 'OCR'}
            </Button>
            
            {/* Toggle Detección en Tiempo Real */}
            <Button
              variant={realTimeDetection ? 'default' : 'outline'}
              onClick={() => setRealTimeDetection(!realTimeDetection)}
              size="sm"
              className="text-white border-white/20 hover:bg-white/20"
            >
              {realTimeDetection ? '🔍' : '👁️'}
            </Button>
            
            {/* Geolocalización */}
            <Button
              variant={location ? 'default' : 'outline'}
              onClick={requestLocationPermission}
              size="sm"
              className="text-white border-white/20 hover:bg-white/20"
              disabled={locationPermission === 'denied'}
            >
              📍
            </Button>
            
            <Button 
              onClick={exitToDashboard}
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video en pantalla completa */}
      <div className="flex-1 relative">
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Caja de detección de texto */}
          {detectionBox && showDetectionEffect && (
            <div
              className="absolute border-2 border-green-400 bg-green-400/20 pointer-events-none"
              style={{
                left: detectionBox.x,
                top: detectionBox.y,
                width: detectionBox.width,
                height: detectionBox.height,
                animation: 'pulse 1s infinite'
              }}
            >
              {/* Líneas de escaneo */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
                <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-green-400 animate-pulse"></div>
                <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-green-400 animate-pulse"></div>
              </div>
              
              {/* Indicador de texto detectado */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                📝 Texto detectado
              </div>
            </div>
          )}
          
          {/* Efecto de flash cuando se detecta texto */}
          {showDetectionEffect && (
            <div className="absolute inset-0 bg-green-400/30 pointer-events-none animate-pulse"></div>
          )}
          
          {/* Partículas de detección */}
          {showDetectionEffect && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Contador de detecciones */}
          {detectionCount > 0 && (
            <div className="absolute top-4 left-4 bg-blue-500/80 text-white px-2 py-1 rounded text-xs">
              Detecciones: {detectionCount}
            </div>
          )}
        </div>
        
        {/* Overlay de carga */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
            <div className="text-center">
              <p className="text-lg mb-4">{cameraError}</p>
              <Button onClick={startCamera} variant="outline">
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {/* Indicador de OCR en tiempo real */}
        {isProcessing && (
          <div className="absolute top-20 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <BMWMSpinner size={16} />
              <span className="text-sm">Analizando...</span>
            </div>
          </div>
        )}

        {/* Texto detectado en tiempo real */}
        {scannedText && (
          <div className="absolute top-20 right-4 bg-black/70 text-white p-3 rounded-lg max-w-xs">
            <p className="text-xs font-medium mb-2">Texto detectado:</p>
            <p className="text-sm whitespace-pre-wrap">{scannedText}</p>
          </div>
        )}

        {/* Efecto de detección */}
        {showDetectionEffect && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Recuadro de detección dinámico */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-4 border-green-400 rounded-lg animate-pulse shadow-lg">
              <div className="absolute -top-2 -left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                TEXTO DETECTADO
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                ✓
              </div>
            </div>
            
            {/* Líneas de escaneo */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-32">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-green-400 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 animate-pulse"></div>
              <div className="absolute top-0 left-0 w-0.5 h-full bg-green-400 animate-pulse"></div>
              <div className="absolute top-0 right-0 w-0.5 h-full bg-green-400 animate-pulse"></div>
            </div>
            
            {/* Notificación flotante */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-bounce">
              <Check className="h-4 w-4" />
              <span className="text-sm font-semibold">¡Texto detectado! ({detectionCount})</span>
            </div>
            
            {/* Efecto de flash */}
            <div className="absolute inset-0 bg-green-400 opacity-20 animate-ping"></div>
            
            {/* Partículas de éxito */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute -top-4 -left-4"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute -top-4 -right-4" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute -bottom-4 -left-4" style={{animationDelay: '0.4s'}}></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute -bottom-4 -right-4" style={{animationDelay: '0.6s'}}></div>
            </div>
          </div>
        )}
      </div>

      {/* Botones de control */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-6 pb-20">
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={captureImage}
            disabled={isLoading}
            className="flex-1 max-w-xs h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            {isLoading ? (
              <BMWMSpinner size={20} className="mr-2" />
            ) : (
              <Camera className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Procesando...' : 'Capturar'}
          </Button>
          
          <Button 
            onClick={exitToDashboard}
            variant="outline"
            className="h-14 px-6 text-lg bg-gray-800 hover:bg-gray-700 text-white border-gray-600 shadow-lg"
          >
            Salir
          </Button>
        </div>
      </div>

      {/* Canvas oculto */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Footer */}
      <footer className="dashboard-footer fixed bottom-0 left-0 right-0 bg-gray-900 text-white py-2 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm">
          <span className="hidden md:inline">© 2025 CVO - Control Vehículos de Ocasión</span>
          <span className="md:hidden">© 2025 CVO</span>
          <span className="hidden xs:inline">controlvo.ovh</span>
        </div>
      </footer>
    </div>
  );
}
