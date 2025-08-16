'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OCRMobilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  // Activar cámara automáticamente al cargar
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // OCR en tiempo real
  useEffect(() => {
    if (videoRef.current && !isProcessing) {
      const interval = setInterval(() => {
        performRealTimeOCR();
      }, 2000); // Cada 2 segundos

      return () => clearInterval(interval);
    }
  }, [isProcessing]);

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
        context.filter = 'contrast(1.3) brightness(1.2)';
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 1.0);
        await processOCR(imageData);
      }
    }
  };

  // OCR en tiempo real
  const performRealTimeOCR = async () => {
    if (videoRef.current && canvasRef.current && !isProcessing) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.filter = 'contrast(1.3) brightness(1.2)';
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
          setIsProcessing(true);
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('spa');
          
          await worker.setParameters({
            tessedit_pageseg_mode: '3',
            preserve_interword_spaces: '1',
          });
          
          const { data: { text } } = await worker.recognize(imageData);
          const cleanedText = text.trim().replace(/\n\s*\n\s*\n/g, '\n\n');
          
          if (cleanedText.length > 0) {
            setScannedText(cleanedText);
          }
          
          await worker.terminate();
        } catch (error) {
          console.error('Error en OCR en tiempo real:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  // Procesar OCR
  const processOCR = async (imageData: string) => {
    setIsLoading(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('spa');
      
      await worker.setParameters({
        tessedit_pageseg_mode: '3',
        preserve_interword_spaces: '1',
      });
      
      const { data: { text } } = await worker.recognize(imageData);
      const cleanedText = text.trim().replace(/\n\s*\n\s*\n/g, '\n\n');
      
      if (cleanedText.length > 0) {
        setScannedText(cleanedText);
        // Copiar al portapapeles automáticamente
        try {
          await navigator.clipboard.writeText(cleanedText);
        } catch (e) {
          console.log('No se pudo copiar al portapapeles');
        }
      }
      
      await worker.terminate();
    } catch (error) {
      console.error('Error en OCR:', error);
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
          <h1 className="text-lg font-semibold">Scanner OCR</h1>
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

      {/* Video en pantalla completa */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
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
              <Loader2 className="h-4 w-4 animate-spin" />
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
      </div>

      {/* Botones de control */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-6">
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={captureImage}
            disabled={isLoading}
            className="flex-1 max-w-xs h-12 text-lg font-semibold"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Camera className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Procesando...' : 'Capturar'}
          </Button>
          
          <Button 
            onClick={exitToDashboard}
            variant="outline"
            className="h-12 px-6 text-lg"
          >
            Salir
          </Button>
        </div>
      </div>

      {/* Canvas oculto */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
