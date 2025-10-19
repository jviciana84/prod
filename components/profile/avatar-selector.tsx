"use client"

import { useState } from "react"
import Image from "next/image"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { getAllAvatars } from "@/lib/avatars"

interface AvatarSelectorProps {
  userId: string
  currentAvatar: string | null
}

export default function AvatarSelector({ userId, currentAvatar }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()
  const avatars = getAllAvatars()

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar)
  }

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return

    setIsLoading(true)

    try {
      // Actualizar avatar via API Route
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          profileData: { avatar_url: selectedAvatar },
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error al actualizar avatar")
      }

      // Actualizar los metadatos del usuario
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { avatar_url: selectedAvatar },
      })

      if (metadataError) throw metadataError

      toast({
        title: "Avatar actualizado",
        description: "Tu avatar ha sido actualizado exitosamente",
      })

      router.refresh()
      router.push("/profile")
    } catch (error: any) {
      toast({
        title: "Error al actualizar avatar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-primary">
          {selectedAvatar ? (
            <Image src={selectedAvatar || "/placeholder.svg"} alt="Avatar seleccionado" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">Sin avatar</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {avatars.map((avatar, index) => (
          <div
            key={index}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
              selectedAvatar === avatar ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/50"
            }`}
            onClick={() => handleAvatarSelect(avatar)}
          >
            <div className="aspect-square relative">
              <Image src={avatar || "/placeholder.svg"} alt={`Avatar ${index + 1}`} fill className="object-cover" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => router.push("/profile")} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSaveAvatar} disabled={!selectedAvatar || isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Guardar Avatar
        </Button>
      </div>
    </div>
  )
}
