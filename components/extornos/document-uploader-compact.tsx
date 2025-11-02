"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Upload, X, Eye } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"

interface DocumentMetadata {
  id: string
  nombre: string
  tipo: string
  tamaño: number
  url: string
  subido_en: string
}

interface DocumentUploaderCompactProps {
  extornoId: number | string // Can be a temporary ID (string) for new forms or actual ID (number) for existing
  tipo: "adjunto" | "tramitacion"
  documentos: DocumentMetadata[] | File[] // Can be uploaded metadata or local File objects
  onDocumentUploaded?: (document: DocumentMetadata) => void // For existing extornos (after upload)
  onDocumentRemoved?: (documentId: string) => void // For existing extornos (after deletion)
  onFilesSelected?: (files: File[]) => void // For new extorno form (when files are selected locally)
  disabled?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 10
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
  if (tipo.startsWith("image/")) return <Eye className="h-4 w-4" />
  if (tipo === "application/pdf") return <FileText className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function DocumentUploaderCompact({
  extornoId,
  tipo,
  documentos,
  onDocumentUploaded,
  onDocumentRemoved,
  onFilesSelected,
  disabled,
}: DocumentUploaderCompactProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      const maxMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(1)
      const actualMB = (file.size / 1024 / 1024).toFixed(2)
      return `Archivo demasiado grande: ${actualMB}MB. Máximo: ${maxMB}MB`
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Tipo de archivo no permitido: ${file.type}`
    }

    if (documentos.length >= MAX_FILES) {
      return `Máximo ${MAX_FILES} archivos permitidos`
    }

    return null
  }

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) {
        return
      }

      const newFiles = Array.from(files)

      // Validate all selected files first
      for (const file of newFiles) {
        const validationError = validateFile(file)
        if (validationError) {
          toast({
            title: "Error de validación",
            description: validationError,
            variant: "destructive",
          })
          // Clear the input so the same file can be selected again
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
          return // Stop processing if any file fails validation
        }
      }

      if (typeof extornoId === "number") {
        // Existing extorno: upload immediately
        setIsUploading(true)
        for (const file of newFiles) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("extornoId", extornoId.toString())
          formData.append("tipo", tipo)

          try {
            const response = await fetch("/api/extornos/upload-document", {
              method: "POST",
              body: formData,
            })

            const result = await response.json()

            if (response.ok && result.success) {
              toast({
                title: "Documento subido",
                description: `"${file.name}" subido correctamente.`,
              })
              onDocumentUploaded?.(result.document) // Notify parent for existing extorno
            } else {
              toast({
                title: "Error al subir documento",
                description: result.error || "Error desconocido al subir el archivo.",
                variant: "destructive",
              })
            }
          } catch (error) {
            console.error("Error uploading document:", error)
            toast({
              title: "Error de red",
              description: "No se pudo conectar con el servidor para subir el documento.",
              variant: "destructive",
            })
          }
        }
        setIsUploading(false)
      } else {
        // New extorno: add to local state for later upload
        onFilesSelected?.([...(documentos as File[]), ...newFiles]) // Notify parent with all selected files
        toast({
          title: "Archivo(s) seleccionado(s)",
          description: `${newFiles.length} archivo(s) listo(s) para adjuntar.`,
        })
      }

      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [extornoId, tipo, documentos, onFilesSelected, onDocumentUploaded],
  )

  const removeDocument = async (documentIdentifier: string, isLocalFile = false) => {
    if (isLocalFile) {
      onFilesSelected?.((documentos as File[]).filter((file) => file.name !== documentIdentifier)) // Filter by name for local files
      toast({
        title: "Archivo eliminado",
        description: "El archivo ha sido removido de la lista de adjuntos pendientes.",
      })
      return
    }

    // For already uploaded documents (existing extornos)
    const docToRemove = (documentos as DocumentMetadata[]).find((d) => d.id === documentIdentifier)
    if (!docToRemove) {
      toast({
        title: "Error",
        description: "Documento no encontrado para eliminar.",
        variant: "destructive",
      })
      return
    }

    try {
      // Call the specific API route for deleting extorno documents
      const response = await fetch(
        `/api/extornos/upload-document?documento_id=${documentIdentifier}&extorno_id=${extornoId}`,
        {
          method: "DELETE",
        },
      )

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Documento eliminado",
          description: "El documento ha sido eliminado correctamente.",
        })
        onDocumentRemoved?.(documentIdentifier) // Notify parent for existing extorno
      } else {
        toast({
          title: "Error al eliminar documento",
          description: result.error || "Error desconocido al eliminar el archivo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing document:", error)
      toast({
        title: "Error de red",
        description: "No se pudo conectar con el servidor para eliminar el documento.",
        variant: "destructive",
      })
    }
  }

  const displayDocuments = documentos // This prop now directly holds the items to display

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          id={`document-upload-${tipo}-${extornoId}`}
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
          multiple // Allow multiple files
          accept={ALLOWED_TYPES.join(",")} // Restrict file types
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? <BMWMSpinner size={16} /> : <Upload className="h-4 w-4" />}
          {isUploading ? "Subiendo..." : "Seleccionar Archivo(s)"}
        </Button>
      </div>

      {displayDocuments.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
          <Label className="text-sm font-medium">Archivos seleccionados:</Label>
          {displayDocuments.map((doc, index) => (
            <Card
              key={typeof extornoId === "number" ? (doc as DocumentMetadata).id : (doc as File).name + index} // Use doc.id for uploaded, doc.name+index for local
              className="p-2"
            >
              <CardContent className="flex items-center justify-between p-0">
                <div className="flex items-center gap-2 truncate">
                  {getFileIcon(typeof extornoId === "number" ? (doc as DocumentMetadata).tipo : (doc as File).type)}
                  <span className="truncate">
                    {typeof extornoId === "number" ? (doc as DocumentMetadata).nombre : (doc as File).name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (
                    {typeof extornoId === "number"
                      ? formatFileSize((doc as DocumentMetadata).tamaño)
                      : formatFileSize((doc as File).size)}
                    )
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {typeof extornoId === "number" && (doc as DocumentMetadata).url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open((doc as DocumentMetadata).url, "_blank")}
                      className="h-6 w-6 p-0"
                    >
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      removeDocument(
                        typeof extornoId === "number" ? (doc as DocumentMetadata).id : (doc as File).name,
                        typeof extornoId !== "number",
                      )
                    }
                    disabled={disabled || isUploading}
                    className="h-6 w-6 p-0 text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
