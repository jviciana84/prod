"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, RefreshCw, AlertCircle, Upload, Plus } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { UserWithRoles } from "@/lib/auth/types"
import { AvatarUploader } from "./avatar-uploader"

interface AdminAvatarManagerProps {
  users: UserWithRoles[]
  avatars: string[]
}

export default function AdminAvatarManager({ users, avatars }: AdminAvatarManagerProps) {
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [customAvatars, setCustomAvatars] = useState<string[]>([])
  const { toast } = useToast()
  const router = useRouter()

  // Filtrar usuarios según el término de búsqueda
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Manejar errores de carga de imágenes
  const handleImageError = (imagePath: string) => {
    setImageErrors((prev) => ({ ...prev, [imagePath]: true }))
    console.error(`Error al cargar la imagen: ${imagePath}`)
  }

  // Obtener la URL de la imagen, con fallback para errores
  const getImageSrc = (path: string | null | undefined) => {
    if (!path) return "/avatars/default.png"
    if (imageErrors[path]) return "/avatars/default.png"

    // Si la ruta ya es una URL completa (como las de Blob), usarla directamente
    if (path.startsWith("http")) {
      return path
    }

    return path
  }

  async function handleUpdateAvatar() {
    if (!selectedUser || !selectedAvatar) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatarUrl: selectedAvatar,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al actualizar avatar")
      }

      toast({
        title: "Avatar actualizado",
        description: "El avatar del usuario ha sido actualizado exitosamente",
      })

      // Cerrar el diálogo
      setIsDialogOpen(false)
      setSelectedUser(null)
      setSelectedAvatar(null)

      // Usar router.refresh() en lugar de window.location.reload()
      router.refresh()
    } catch (error: any) {
      console.error("Error al actualizar avatar:", error)
      toast({
        title: "Error al actualizar avatar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function openAvatarDialog(user: UserWithRoles) {
    setSelectedUser(user)
    setSelectedAvatar(user.avatar_url || null)
    setIsDialogOpen(true)
  }

  function handleRefresh() {
    // Usar router.refresh() en lugar de window.location.reload()
    router.refresh()
  }

  // Manejar la subida completa de un avatar
  const handleUploadComplete = (url: string) => {
    setCustomAvatars((prev) => [...prev, url])

    // Si hay un usuario seleccionado, establecer el avatar recién subido como seleccionado
    if (selectedUser) {
      setSelectedAvatar(url)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuarios..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-4">
              <Upload className="mr-2 h-4 w-4" />
              Subir Avatar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Nuevo Avatar</DialogTitle>
              <DialogDescription>
                Sube una nueva imagen para usar como avatar. La imagen debe ser cuadrada para mejores resultados.
              </DialogDescription>
            </DialogHeader>
            <AvatarUploader onUploadComplete={handleUploadComplete} />
          </DialogContent>
        </Dialog>
      </div>

      {users.length === 0 ? (
        <div className="text-center p-6 bg-muted rounded-md">
          <p className="text-muted-foreground">
            No se encontraron usuarios. Verifica la conexión con la base de datos.
          </p>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-4">
          <BMWMSpinner size={32} />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Avatar</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No se encontraron usuarios con ese criterio de búsqueda
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="relative h-10 w-10 overflow-hidden rounded-full">
                      <Image
                        src={getImageSrc(user.avatar_url) || "/placeholder.svg"}
                        alt={user.full_name || user.email}
                        width={40}
                        height={40}
                        className="object-cover"
                        onError={() => handleImageError(user.avatar_url || "")}
                        unoptimized
                      />
                    </div>
                  </TableCell>
                  <TableCell>{user.full_name || "Sin nombre"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles && user.roles.length > 0 ? user.roles.map((role) => role.name).join(", ") : "Sin rol"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openAvatarDialog(user)}>
                      Cambiar Avatar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Diálogo para seleccionar avatar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Seleccionar Avatar</DialogTitle>
            <DialogDescription>
              Elige un nuevo avatar para {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="predefined">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="predefined">Avatares Predefinidos</TabsTrigger>
              <TabsTrigger value="custom">Avatares Personalizados</TabsTrigger>
            </TabsList>

            <TabsContent value="predefined" className="mt-4">
              <div className="grid grid-cols-6 gap-4 py-4 max-h-[400px] overflow-y-auto">
                {avatars.length === 0 ? (
                  <div className="col-span-6 flex flex-col items-center justify-center p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
                    <p className="text-muted-foreground">No se encontraron avatares disponibles.</p>
                  </div>
                ) : (
                  avatars.map((avatar) => (
                    <Card
                      key={avatar}
                      className={`cursor-pointer transition-all ${
                        selectedAvatar === avatar ? "ring-2 ring-primary" : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      <CardContent className="p-2 flex justify-center">
                        <div className="relative h-16 w-16 overflow-hidden rounded-full">
                          <Image
                            src={getImageSrc(avatar) || "/placeholder.svg"}
                            alt="Avatar"
                            width={64}
                            height={64}
                            className="object-cover"
                            onError={() => handleImageError(avatar)}
                            unoptimized
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <div className="grid grid-cols-6 gap-4 py-4 max-h-[400px] overflow-y-auto">
                {customAvatars.length === 0 ? (
                  <div className="col-span-6 flex flex-col items-center justify-center p-4 text-center">
                    <div className="mb-4 rounded-full bg-muted p-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No hay avatares personalizados.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Haz clic en "Subir Avatar" para añadir nuevos avatares.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Subir Avatar
                    </Button>
                  </div>
                ) : (
                  customAvatars.map((avatar) => (
                    <Card
                      key={avatar}
                      className={`cursor-pointer transition-all ${
                        selectedAvatar === avatar ? "ring-2 ring-primary" : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      <CardContent className="p-2 flex justify-center">
                        <div className="relative h-16 w-16 overflow-hidden rounded-full">
                          <Image
                            src={avatar || "/placeholder.svg"}
                            alt="Avatar"
                            width={64}
                            height={64}
                            className="object-cover"
                            onError={() => handleImageError(avatar)}
                            unoptimized
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateAvatar}
              disabled={loading || !selectedAvatar || selectedAvatar === selectedUser?.avatar_url}
            >
              {loading ? <BMWMSpinner size={16} className="mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
