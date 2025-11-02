"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Check, AlertCircle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface AvatarUploaderProps {
  onUploadComplete: (url: string) => void
}

export function AvatarUploader({ onUploadComplete }: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar el tipo de archivo
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen")
      setPreviewUrl(null)
      return
    }

    // Validar el tamaño del archivo (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no debe superar los 2MB")
      setPreviewUrl(null)
      return
    }

    // Crear una URL para la previsualización
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
    setUploadSuccess(false)
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setError("Por favor, selecciona una imagen")
      return
    }

    const file = fileInputRef.current.files[0]
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Error al subir el avatar")
      }

      const data = await response.json()

      // Notificar éxito
      toast({
        title: "Avatar subido correctamente",
        description: "El avatar ha sido subido y está listo para ser utilizado",
      })

      setUploadSuccess(true)

      // Llamar al callback con la URL del avatar subido
      onUploadComplete(data.url)
    } catch (error: any) {
      console.error("Error al subir avatar:", error)
      setError(error.message || "Error al subir el avatar")
      toast({
        title: "Error al subir avatar",
        description: error.message || "Ocurrió un error al subir el avatar",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetUploader = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setPreviewUrl(null)
    setError(null)
    setUploadSuccess(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center gap-4">
        {previewUrl ? (
          <div className="relative">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-border">
              <Image src={previewUrl || "/placeholder.svg"} alt="Vista previa" fill className="object-cover" />
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
              onClick={resetUploader}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mb-2 text-sm text-muted-foreground">Arrastra y suelta o haz clic para seleccionar</p>
              <p className="text-xs text-muted-foreground">PNG, JPG o GIF (máx. 2MB)</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            Seleccionar imagen
          </Button>
          <Button onClick={handleUpload} disabled={!previewUrl || isUploading || uploadSuccess}>
            {isUploading ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Subiendo...
              </>
            ) : uploadSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Subido
              </>
            ) : (
              "Subir avatar"
            )}
          </Button>
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  )
}
