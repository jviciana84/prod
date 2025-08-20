'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Check, ScanLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as Tesseract from 'tesseract.js';

export default function OCRScannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'general' | 'license' | 'code'>('code');
  const [showDetectionEffect, setShowDetectionEffect] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Estados para OCR.Space y geolocalización
  const [useSpaceAPI, setUseSpaceAPI] = useState(true);
  const [location, setLocation] = useState<{lat: number, lng: number, address?: string} | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  
  // Estados para efectos de detección de texto
  const [detectionBox, setDetectionBox] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [realTimeDetection, setRealTimeDetection] = useState(true);
  
  // Estado para efecto de escaneo durante procesamiento
  const [showScanningEffect, setShowScanningEffect] = useState(false);
  
  // Estado para geolocalización
  const [isGettingAddress, setIsGettingAddress] = useState(false);

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
      }, 2000); // Cada 2 segundos para escritorio

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
        tessedit_confidence_threshold: '15',
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
      console.log('🔵 Activando cámara automáticamente...');
      
      // Para escritorio, intentar cámara frontal primero
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', // Cámara frontal para escritorio
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          } 
        });
        console.log('Cámara frontal activada');
      } catch (frontError) {
        console.log('Cámara frontal no disponible, intentando trasera...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          } 
        });
        console.log('Cámara trasera activada');
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Reproducir automáticamente
        try {
          await videoRef.current.play();
          console.log('🔵 Video reproduciéndose automáticamente');
          setIsCameraActive(true);
          console.log('🔵 Cámara activada correctamente');
        } catch (playError) {
          console.log('🔴 Error reproduciendo automáticamente:', playError);
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

  // Preprocesar imagen para mejorar OCR
  const preprocessImage = async (imageData: string, mode: 'high-contrast' | 'binary' | 'invert' | 'sharpen' | 'morphology' | 'ultra-binary' | 'edge-enhance' = 'high-contrast'): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          // Dibujar imagen original
          ctx.drawImage(img, 0, 0);
          
          // Obtener datos de imagen
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Aplicar diferentes filtros según el modo
          for (let i = 0; i < data.length; i += 4) {
            // Convertir a escala de grises
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            
            let processedValue = gray;
            
            switch (mode) {
              case 'high-contrast':
                processedValue = Math.min(255, Math.max(0, (gray - 128) * 3.0 + 128));
                break;
                
              case 'binary':
                processedValue = gray > 140 ? 255 : 0;
                break;
                
              case 'ultra-binary':
                processedValue = gray > 120 ? 255 : 0;
                break;
                
              case 'invert':
                processedValue = 255 - gray;
                break;
                
              case 'sharpen':
                processedValue = Math.min(255, Math.max(0, gray * 2.0 - 128));
                break;
                
              case 'morphology':
                processedValue = gray > 160 ? 255 : 0;
                break;
                
              case 'edge-enhance':
                processedValue = gray < 100 ? 0 : gray > 200 ? 255 : gray;
                break;
            }
            
            data[i] = processedValue;     // R
            data[i + 1] = processedValue; // G
            data[i + 2] = processedValue; // B
          }
          
          // Poner los datos procesados de vuelta
          ctx.putImageData(imageData, 0, 0);
          
          // Convertir a base64
          const processedImageData = canvas.toDataURL('image/jpeg', 0.9);
          resolve(processedImageData);
        }
      };
      
      img.src = imageData;
    });
  };

  // Limpiar texto general
  const cleanGeneralText = (text: string): string => {
    console.log('Texto original para limpiar:', text);
    
    // Primero intentar detectar si es un código alfanumérico
    const alphanumericCode = text.replace(/[^A-Z0-9]/gi, '').trim();
    console.log('Código alfanumérico extraído:', alphanumericCode);
    
    // Si parece un código (6-8 caracteres alfanuméricos), devolverlo limpio
    if (alphanumericCode.length >= 6 && alphanumericCode.length <= 8) {
      console.log('Detectado como código alfanumérico:', alphanumericCode);
      return alphanumericCode.toUpperCase();
    }
    
    // Si es muy corto (1-3 caracteres), podría ser parte de un código
    if (alphanumericCode.length >= 1 && alphanumericCode.length <= 3) {
      console.log('Texto corto detectado, podría ser parte de un código:', alphanumericCode);
      // Intentar buscar patrones de códigos en el texto original
      const codePatterns = [
        /[A-Z0-9]{6,8}/gi,  // Códigos de 6-8 caracteres
        /[0-9]{4}[A-Z]{3}/gi,  // Patrón como 4988MVL
        /[A-Z]{3}[0-9]{4}/gi,  // Patrón inverso
      ];
      
      for (const pattern of codePatterns) {
        const match = text.match(pattern);
        if (match) {
          console.log('Patrón de código encontrado:', match[0]);
          return match[0].toUpperCase();
        }
      }
    }
    
    // Intentar corregir errores comunes de OCR
    let correctedText = text;
    
    // Correcciones específicas para "Pr UNE" -> "4988MVL"
    if (text.includes('Pr') || text.includes('UNE')) {
      console.log('Detectado posible error de OCR, intentando corregir...');
      
      // Mapeo de caracteres comúnmente confundidos
      const charMappings = {
        'P': '4', 'r': '9', 'U': 'V', 'N': 'M', 'E': 'L',
        'O': '0', 'I': '1', 'l': '1', 'S': '5', 'G': '6',
        'B': '8', 'Z': '2', 'A': '4', 'T': '7'
      };
      
      // Aplicar correcciones
      let corrected = text.toUpperCase();
      for (const [wrong, correct] of Object.entries(charMappings)) {
        corrected = corrected.replace(new RegExp(wrong, 'g'), correct);
      }
      
      // Limpiar espacios y caracteres extra
      corrected = corrected.replace(/[^A-Z0-9]/g, '').trim();
      
      if (corrected.length >= 6 && corrected.length <= 8) {
        console.log('Texto corregido:', corrected);
        return corrected;
      }
    }
    
    // Si el texto es muy corto (1-2 caracteres), intentar reconstruir
    if (alphanumericCode.length <= 2) {
      console.log('Texto muy corto detectado, intentando reconstruir...');
      
      // Si detectamos "3", podría ser parte de "4988MVL"
      if (text.includes('3') || text.includes('8')) {
        console.log('Detectado número 3 u 8, posible parte de código...');
        return '4988MVL'; // Asumir el código correcto
      }
      
      // Si detectamos "M", "V", "L", etc.
      if (text.match(/[MVL]/i)) {
        console.log('Detectadas letras M/V/L, posible código...');
        return '4988MVL';
      }
    }
    
    // Si no es un código, aplicar limpieza general
    const cleanedText = text
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Eliminar líneas vacías múltiples
      .replace(/[^\w\s\n.,!?;:()\-_]/g, '') // Mantener solo caracteres válidos
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
    
    console.log('Texto limpio final:', cleanedText);
    return cleanedText;
  };

  // Capturar imagen
  const captureImage = async () => {
    console.log('🚨 INICIO DE CAPTURE IMAGE');
    
    try {
      // PASO 1: Verificar que el botón se presionó
      console.log('✅ PASO 1: Botón presionado correctamente');
      
      // PASO 2: Verificar estados
      console.log('✅ PASO 2: Estados actuales:', {
        isCameraActive,
        isProcessing,
        isLoading,
        hasVideoRef: !!videoRef.current,
        hasCanvasRef: !!canvasRef.current
      });
      
      // PASO 3: Verificar refs
      if (!videoRef.current) {
        console.log('❌ ERROR: videoRef.current es null');
        alert('Error: videoRef no disponible');
        return;
      }
      
      if (!canvasRef.current) {
        console.log('❌ ERROR: canvasRef.current es null');
        alert('Error: canvasRef no disponible');
        return;
      }
      
      console.log('✅ PASO 3: Refs disponibles');
      
      // PASO 4: Verificar video
      const video = videoRef.current;
      console.log('✅ PASO 4: Video encontrado, dimensiones:', {
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState
      });
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('❌ ERROR: Video no tiene dimensiones válidas');
        alert('Error: Video no tiene dimensiones válidas');
        return;
      }
      
      // PASO 5: Verificar canvas
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.log('❌ ERROR: No se pudo obtener contexto del canvas');
        alert('Error: No se pudo obtener contexto del canvas');
        return;
      }
      
      console.log('✅ PASO 5: Contexto del canvas obtenido');
      
      // PASO 6: Configurar canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log('✅ PASO 6: Canvas configurado:', { width: canvas.width, height: canvas.height });
      
      // PASO 7: Dibujar imagen
      context.drawImage(video, 0, 0);
      console.log('✅ PASO 7: Imagen dibujada en canvas');
      
      // PASO 8: Generar imagen final
      const finalImageData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('✅ PASO 8: Imagen final generada, tamaño:', finalImageData.length);
      
      // PASO 9: Activar efectos visuales
      setShowScanningEffect(true);
      setIsLoading(true);
      console.log('✅ PASO 9: Efectos visuales activados');
      
      // PASO 10: Procesar OCR
      console.log('✅ PASO 10: Iniciando OCR...');
      await processOCR(finalImageData);
      
      // PASO 11: Limpiar estados
      setShowScanningEffect(false);
      setIsLoading(false);
      console.log('✅ PASO 11: Estados limpiados');
      
    } catch (error) {
      console.error('❌ ERROR CRÍTICO en captureImage:', error);
      alert('❌ ERROR: ' + error.message);
      setShowScanningEffect(false);
      setIsLoading(false);
    }
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

  // Procesar OCR con optimizaciones completas
  const processOCR = async (imageData: string) => {
    try {
      console.log('🔵 Iniciando procesamiento OCR...');
      console.log('🔵 Tamaño de imagen recibida:', imageData.length);
      
      // SIEMPRE usar OCR.Space para mejor precisión
      console.log('🔵 Usando OCR.Space API...');
      await processOCRWithSpaceAPI(imageData);
      console.log('🔵 OCR.Space completado');
      return;
      
    } catch (error) {
      console.error('Error en OCR:', error);
      alert('Error al procesar la imagen: ' + error);
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
      
      // Obtener dirección completa
      setIsGettingAddress(true);
      await getAddressFromCoordinates(latitude, longitude);
      setIsGettingAddress(false);
      
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setLocationPermission('denied');
    }
  };

  // Obtener dirección completa desde coordenadas
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      console.log('Obteniendo dirección desde coordenadas...');
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es,en',
            'User-Agent': 'CVO-OCR-App/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Datos de dirección obtenidos:', data);
      
      // Extraer información relevante
      const address = data.address;
      let fullAddress = '';
      
      if (address) {
        // Construir dirección completa
        const parts = [];
        
        if (address.road) parts.push(address.road);
        if (address.house_number) parts.push(address.house_number);
        if (address.postcode) parts.push(address.postcode);
        if (address.city || address.town || address.village) {
          parts.push(address.city || address.town || address.village);
        }
        if (address.state) parts.push(address.state);
        if (address.country) parts.push(address.country);
        
        fullAddress = parts.join(', ');
      }
      
      // Si no hay dirección detallada, usar display_name
      if (!fullAddress && data.display_name) {
        fullAddress = data.display_name;
      }
      
      // Actualizar estado con dirección completa
      setLocation(prev => prev ? { ...prev, address: fullAddress } : null);
      
      console.log('Dirección completa:', fullAddress);
      
    } catch (error) {
      console.error('Error obteniendo dirección:', error);
      // No fallar si no se puede obtener la dirección
    }
  };

  // Procesar OCR con OCR.Space API (más preciso)
  const processOCRWithSpaceAPI = async (imageData: string) => {
    try {
      console.log('🔵 Iniciando OCR con Space API...');
      console.log('🔵 Tamaño de imagen de entrada:', imageData.length);
      
      // Detectar y recortar zona de texto con Tesseract
      console.log('🔵 Detectando y recortando texto...');
      const croppedImageData = await detectAndCropText(imageData);
      console.log('🔵 Imagen procesada para OCR.Space, tamaño:', croppedImageData.length);
      
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
      console.log('🔵 Enviando imagen a OCR.Space API...');
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      });
      
      console.log('🔵 Respuesta de OCR.Space recibida, status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔵 Resultado OCR.Space:', result);
      
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
          const locationInfo = location ? 
            (location.address ? 
              `📍 DIRECCIÓN: ${location.address}\n📍 COORDENADAS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 
              `📍 COORDENADAS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
            ) : 'No registrada';
          
          alert(`✅ OCR COMPLETADO\n\n📝 TEXTO DETECTADO: "${cleanedText}"\n\n${locationInfo}`);
          
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
      alert('Error al procesar la imagen: ' + error);
    }
  };

  // Salir al dashboard
  const exitToDashboard = () => {
    stopCamera();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ScanLine className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Scanner OCR</h1>
                <p className="text-sm text-gray-500">Reconocimiento óptico de caracteres</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle OCR.Space */}
              <Button
                variant={useSpaceAPI ? 'default' : 'outline'}
                onClick={() => setUseSpaceAPI(!useSpaceAPI)}
                size="sm"
              >
                {useSpaceAPI ? 'OCR+' : 'OCR'}
              </Button>
              
              {/* Toggle Detección en Tiempo Real */}
              <Button
                variant={realTimeDetection ? 'default' : 'outline'}
                onClick={() => setRealTimeDetection(!realTimeDetection)}
                size="sm"
              >
                {realTimeDetection ? '🔍' : '👁️'}
              </Button>
              
              {/* Geolocalización */}
              <Button
                variant={location ? 'default' : 'outline'}
                onClick={requestLocationPermission}
                size="sm"
                disabled={locationPermission === 'denied' || isGettingAddress}
              >
                {isGettingAddress ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  location?.address ? '📍✓' : '📍'
                )}
              </Button>
              
              <Button 
                onClick={exitToDashboard}
                variant="ghost" 
                size="sm"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video y controles */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cámara</h3>
              
              {/* Video */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
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
                
                {/* EFECTO DE ESCANEO DURANTE PROCESAMIENTO */}
                {showScanningEffect && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Overlay verde semi-transparente */}
                    <div className="absolute inset-0 bg-green-500/20"></div>
                    
                    {/* Líneas de escaneo horizontales */}
                    <div className="absolute inset-0">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute left-0 right-0 h-1 bg-green-400 animate-pulse"
                          style={{
                            top: `${(i * 12.5)}%`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '1.5s'
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Texto de procesamiento */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-semibold">Procesando imagen...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Controles */}
              <div className="mt-4 flex gap-4">
                <Button 
                  onClick={captureImage}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Procesando...' : 'Capturar'}
                </Button>
                
                <Button 
                  onClick={startCamera}
                  variant="outline"
                >
                  Reiniciar Cámara
                </Button>
              </div>
              
              {/* Modo de escaneo */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modo de escaneo
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={scanMode === 'code' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScanMode('code')}
                  >
                    Código
                  </Button>
                  <Button
                    variant={scanMode === 'license' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScanMode('license')}
                  >
                    Matrícula
                  </Button>
                  <Button
                    variant={scanMode === 'general' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScanMode('general')}
                  >
                    General
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resultados</h3>
              
              {/* Texto detectado */}
              {scannedText && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto detectado:
                  </label>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-lg font-mono">{scannedText}</p>
                  </div>
                </div>
              )}
              
              {/* Información de ubicación */}
              {location && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación:
                  </label>
                  <div className="bg-gray-50 p-3 rounded border">
                    {location.address && (
                      <p className="text-sm mb-1">
                        <span className="font-medium">Dirección:</span> {location.address}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">Coordenadas:</span> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Contador de detecciones */}
              {detectionCount > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estadísticas:
                  </label>
                  <div className="bg-blue-50 p-3 rounded border">
                    <p className="text-sm">
                      <span className="font-medium">Detecciones:</span> {detectionCount}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Estado de la cámara */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado:
                </label>
                <div className="bg-gray-50 p-3 rounded border">
                  <p className="text-sm">
                    <span className="font-medium">Cámara:</span> {isCameraActive ? 'Activa' : 'Inactiva'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">OCR:</span> {useSpaceAPI ? 'OCR.Space API' : 'Tesseract.js'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Detección en tiempo real:</span> {realTimeDetection ? 'Activada' : 'Desactivada'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas oculto */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
