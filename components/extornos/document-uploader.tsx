"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Upload, FileText, ImageIcon, File, Eye, AlertCircle, Trash2 } from "lucide-react"

interface DocumentUploaderProps {
  extornoId: number | string
  tipo: "adjunto" | "tramitacion"
  documentos: any[]
  onDocumentUploaded: (documento: any) => void
  onDocumentRemoved: (documentoId: string) => void
  disabled?: boolean
  maxFiles?: number
  maxFileSize?: number
}

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB
const MAX_FILES = 5
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]

const getFileIcon = (tipo: string) => {
  if (tipo.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
  if (tipo === "application/pdf") return <FileText className="h-4 w-4" />
  return <File className="h-4 w-4" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function DocumentUploader({
  extornoId,
  tipo,
  documentos,
  onDocumentUploaded,
  onDocumentRemoved,
  disabled = false,
  maxFiles = MAX_FILES,
  maxFileSize = MAX_FILE_SIZE,
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Validar tamaño
    if (file.size > maxFileSize) {
      const maxMB = (maxFileSize / 1024 / 1024).toFixed(1)
      const actualMB = (file.size / 1024 / 1024).toFixed(2)
      return `Archivo demasiado grande: ${actualMB}MB. Máximo: ${maxMB}MB`
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Tipo de archivo no permitido: ${file.type}`
    }

    // Validar cantidad
    if (documentos.length >= maxFiles) {
      return `Máximo ${maxFiles} archivos permitidos`
    }

    return null
  }

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      toast({
        title: "Error de validación",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      console.log(`📎 Subiendo archivo: ${file.name} para extorno ${extornoId}`)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("extorno_id", extornoId.toString())
      formData.append("tipo", tipo)

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/extornos/upload-document", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (response.ok && result.success) {
        console.log("✅ Archivo subido exitosamente:", result.documento)

        toast({
          title: "Archivo subido",
          description: `${file.name} se ha subido correctamente`,
        })

        onDocumentUploaded(result.documento)
      } else {
        console.error("❌ Error subiendo archivo:", result)
        toast({
          title: "Error subiendo archivo",
          description: result.error || "Error desconocido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error crítico subiendo archivo:", error)
      toast({
        title: "Error crítico",
        description: "Error inesperado al subir el archivo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      uploadFile(file)
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (disabled || uploading) return

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !uploading) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeDocument = async (documentoId: string) => {
    try {
      console.log(`🗑️ Eliminando documento ${documentoId}`)

      const response = await fetch(
        `/api/extornos/upload-document?documento_id=${documentoId}&extorno_id=${extornoId}`,
        {
          method: "DELETE",
        },
      )

      const result = await response.json()

      if (response.ok && result.success) {
        console.log("✅ Documento eliminado exitosamente")
        onDocumentRemoved(documentoId)

        toast({
          title: "Documento eliminado",
          description: "El documento se ha eliminado correctamente",
        })
      } else {
        console.error("❌ Error eliminando documento:", result)
        toast({
          title: "Error eliminando documento",
          description: result.error || "Error desconocido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error crítico eliminando documento:", error)
      toast({
        title: "Error crítico",
        description: "Error inesperado al eliminar el documento",
        variant: "destructive",
      })
    }
  }

  const openFile = (url: string) => {
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-4">
      {/* Zona de Drop */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : disabled
              ? "border-gray-200 bg-gray-50"
              : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6">
          <div className="text-center">
            <Upload className={`mx-auto h-12 w-12 ${disabled ? "text-gray-400" : "text-gray-500"}`} />
            <div className="mt-4">
              <p className={`text-lg font-medium ${disabled ? "text-gray-400" : "text-gray-900"}`}>
                {uploading ? "Subiendo archivo..." : "Arrastra archivos aquí"}
              </p>
              <p className={`text-sm ${disabled ? "text-gray-400" : "text-gray-500"}`}>
                o{" "}
                <button
                  type="button"
                  className={`font-medium ${disabled ? "text-gray-400" : "text-blue-600 hover:text-blue-500"}`}
                  onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
                  disabled={disabled || uploading}
                >
                  selecciona archivos
                </button>
              </p>
            </div>

            {uploading && (
              <div className="mt-4">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-500 mt-2">{uploadProgress}% completado</p>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              <p>
                Máximo {maxFiles} archivos • {(maxFileSize / 1024 / 1024).toFixed(1)}MB por archivo
              </p>
              <p>PDF, imágenes, Word, Excel, texto</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_TYPES.join(",")}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Lista de documentos */}
      {documentos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Documentos ({documentos.length}/{maxFiles})
          </h4>
          {documentos.map((doc) => (
            <Card key={doc.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">{getFileIcon(doc.tipo)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.nombre}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(doc.tamaño)}</span>
                      <span>•</span>
                      <span>{new Date(doc.subido_en).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {tipo}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => openFile(doc.url)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeDocument(doc.id)}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Información de límites */}
      {documentos.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <span>
            {maxFiles - documentos.length} archivos restantes • Total:{" "}
            {formatFileSize(documentos.reduce((sum, doc) => sum + doc.tamaño, 0))}
          </span>
        </div>
      )}
    </div>
  )
}
