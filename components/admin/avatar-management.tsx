"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Upload, Trash2, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface Avatar {
  url: string
  name: string
  size: number
  uploadedAt: string
}

export default function AvatarManagement() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar la lista de avatares
  const fetchAvatars = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/avatars/list")
      if (!response.ok) {
        throw new Error("Error al cargar los avatares")
      }
      const data = await response.json()
      setAvatars(data.avatars || [])
    } catch (err) {
      console.error("Error fetching avatars:", err)
      setError("No se pudieron cargar los avatares. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAvatars()
  }, [])

  // Manejar la subida de un nuevo avatar
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. El tamaño máximo es 2MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/admin/avatars/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al subir el avatar")
      }

      toast({
        title: "Avatar subido",
        description: "El avatar se ha subido correctamente",
      })

      // Recargar la lista de avatares
      fetchAvatars()
    } catch (err: any) {
      console.error("Error uploading avatar:", err)
      toast({
        title: "Error",
        description: err.message || "No se pudo subir el avatar",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Limpiar el input
      e.target.value = ""
    }
  }

  // Manejar la eliminación de un avatar
  const handleDelete = async (avatarUrl: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este avatar?")) return

    try {
      const response = await fetch("/api/admin/avatars/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: avatarUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar el avatar")
      }

      toast({
        title: "Avatar eliminado",
        description: "El avatar se ha eliminado correctamente",
      })

      // Recargar la lista de avatares
      fetchAvatars()
    } catch (err: any) {
      console.error("Error deleting avatar:", err)
      toast({
        title: "Error",
        description: err.message || "No se pudo eliminar el avatar",
        variant: "destructive",
      })
    }
  }

  // Formatear el tamaño del archivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-6">
      {/* Sección de carga de avatares */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Subir nuevo avatar</h2>
            <p className="text-sm text-muted-foreground">
              Sube una nueva imagen para usarla como avatar predefinido. Se recomienda usar imágenes cuadradas de al
              menos 200x200 píxeles.
            </p>

            <div className="flex items-end gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="avatar-upload">Imagen</Label>
                <Input id="avatar-upload" type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} />
              </div>

              <Button disabled={isUploading}>
                {isUploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Sección de listado de avatares */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Avatares disponibles</h2>
          <Button variant="outline" onClick={fetchAvatars} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : avatars.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">No hay avatares disponibles</p>
            <p className="text-sm text-muted-foreground mt-2">Sube algunos avatares para que aparezcan aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {avatars.map((avatar) => (
              <Card key={avatar.url} className="overflow-hidden">
                <div className="aspect-square relative">
                  <Image src={avatar.url || "/placeholder.svg"} alt={avatar.name} fill className="object-cover" />
                </div>
                <CardContent className="p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate" title={avatar.name}>
                      {avatar.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(avatar.size)}</p>
                    <div className="flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(avatar.url)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
