"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImageIcon } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Avatar {
  url: string
  name: string
  size: number
  uploadedAt: string
}

interface AvatarSelectorProps {
  currentAvatarUrl: string | null
  onSelect: (avatarUrl: string) => void
  triggerButton?: React.ReactNode
}

export function AvatarSelector({ currentAvatarUrl, onSelect, triggerButton }: AvatarSelectorProps) {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchAvatars()
    }
  }, [open])

  async function fetchAvatars() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/avatars/list")
      if (!response.ok) {
        throw new Error("Error al cargar avatares")
      }
      const data = await response.json()
      // Asegurarse de que data.avatars existe y es un array
      setAvatars(Array.isArray(data.avatars) ? data.avatars : [])
    } catch (error) {
      console.error("Error al cargar avatares:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los avatares",
        variant: "destructive",
      })
      // Establecer un array vacío en caso de error
      setAvatars([])
    } finally {
      setLoading(false)
    }
  }

  function handleSelectAvatar(avatarUrl: string) {
    onSelect(avatarUrl)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span>Seleccionar Avatar</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Seleccionar Avatar</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="py-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <BMWMSpinner size={32} />
              </div>
            ) : avatars.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay avatares disponibles. Por favor, carga algunos en la sección de Avatares.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {avatars.map((avatar) => (
                  <div
                    key={avatar.url}
                    className={`relative cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                      currentAvatarUrl === avatar.url
                        ? "border-primary ring-2 ring-primary ring-opacity-50"
                        : "border-transparent hover:border-gray-300"
                    }`}
                    onClick={() => handleSelectAvatar(avatar.url)}
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={avatar.url || "/placeholder.svg"}
                        alt={avatar.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
