"use client"

import type React from "react"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { UserProfile } from "@/lib/auth/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileFormProps {
  user: User
  profile: UserProfile
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [position, setPosition] = useState(profile?.position || "")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Actualizar via API Route
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          profileData: {
            full_name: fullName,
            phone,
            position,
            updated_at: new Date().toISOString(),
          },
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error al actualizar perfil")
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada exitosamente",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error al actualizar perfil",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || user.email || ""} />
          <AvatarFallback>{getInitials(profile?.full_name || user.email || "")}</AvatarFallback>
        </Avatar>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre Completo</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Cargo</Label>
          <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  )
}
