"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, RefreshCw, KeyRound, Key, Users, Zap } from "lucide-react"
import Link from "next/link"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import type { UserWithRoles } from "@/lib/auth/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UserPlus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { AvatarSelector } from "./avatar-selector"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { detectAndSuggestMapping, createAutoMapping } from "@/lib/auto-mapping-service"

// Roles estáticos para evitar problemas con la base de datos
// Remove the entire `STATIC_ROLES` array.

export default function UserManagement() {
  const [users, setUsers] = useState<(UserWithRoles & { alias?: string; welcome_email_sent?: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSetPasswordDialogOpen, setIsSetPasswordDialogOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserFullName, setNewUserFullName] = useState("")
  const [newUserAlias, setNewUserAlias] = useState("")
  const [newUserRole, setNewUserRole] = useState("")
  const [newUserPhone, setNewUserPhone] = useState("")
  const [newUserPosition, setNewUserPosition] = useState("")
  const [skipWelcomeEmail, setSkipWelcomeEmail] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sendingWelcomeEmail, setSendingWelcomeEmail] = useState<string | null>(null)
  const [sendingResetEmail, setSendingResetEmail] = useState<string | null>(null)
  const [settingPassword, setSettingPassword] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [forcePasswordChange, setForcePasswordChange] = useState(true)
  const [passwordUserEmail, setPasswordUserEmail] = useState("")
  const [passwordUserId, setPasswordUserId] = useState("")
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Estados para la edición de usuario
  const [editUserFullName, setEditUserFullName] = useState("")
  const [editUserAlias, setEditUserAlias] = useState("")
  const [editUserPhone, setEditUserPhone] = useState("")
  const [editUserPosition, setEditUserPosition] = useState("")
  const [editUserAvatarUrl, setEditUserAvatarUrl] = useState<string | null>(null)

  // Estados para la gestión de avatares
  const [newUserAvatarUrl, setNewUserAvatarUrl] = useState<string | null>(null)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [selectedAvatarUser, setSelectedAvatarUser] = useState<UserWithRoles | null>(null)
  const [availableAvatars, setAvailableAvatars] = useState<any[]>([])
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false)

  // Add a new state variable to store the dynamically fetched roles:
  const [availableRoles, setAvailableRoles] = useState<any[]>([])

  // Estado para forzar actualización
  const [isForcingUpdate, setIsForcingUpdate] = useState(false)
  const [isDeactivatingUpdate, setIsDeactivatingUpdate] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchRandomAvatar()
  }, [])

  // Add a new `useEffect` hook to fetch roles when the component mounts:
  useEffect(() => {
    async function fetchAvailableRoles() {
      try {
        const response = await fetch("/api/admin/roles") // Assuming you'll create this API route
        if (!response.ok) {
          throw new Error("Error al cargar roles disponibles")
        }
        const data = await response.json()
        setAvailableRoles(data)
      } catch (error) {
        console.error("Error fetching available roles:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los roles disponibles.",
          variant: "destructive",
        })
      }
    }
    fetchAvailableRoles()
  }, []) // Remover toast de las dependencias

  // Generar alias automáticamente a partir del nombre completo
  const generateAlias = useCallback((fullName: string) => {
    if (!fullName) return ""

    const nameParts = fullName.split(" ")
    if (nameParts.length === 1) return nameParts[0].substring(0, 6)

    // Tomar el primer nombre completo y las primeras letras de los apellidos
    const firstName = nameParts[0]
    const lastInitials = nameParts
      .slice(1)
      .map((part) => part.charAt(0))
      .join("")

    return `${firstName}${lastInitials}`
  }, [])

  // Actualizar el alias cuando cambia el nombre completo
  useEffect(() => {
    if (newUserFullName && !newUserAlias) {
      setNewUserAlias(generateAlias(newUserFullName))
    }
  }, [newUserFullName, generateAlias])

  async function fetchUsers() {
    setLoading(true)
    try {
      console.log("🔄 Iniciando carga de usuarios...")
      const startTime = Date.now()

      // Obtener usuarios directamente desde la API del servidor
      const response = await fetch("/api/admin/users", {
        cache: "no-store", // Evitar cache para datos actualizados
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al cargar usuarios")
      }

      const usersData = await response.json()
      const endTime = Date.now()
      console.log(`✅ Usuarios cargados en ${endTime - startTime}ms. Total: ${usersData.length}`)

      setUsers(usersData)
    } catch (error: any) {
      console.error("❌ Error al cargar usuarios:", error)
      toast({
        title: "Error al cargar usuarios",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchRandomAvatar() {
    try {
      const response = await fetch("/api/admin/avatars/list")
      if (!response.ok) {
        console.warn("⚠️ No se pudieron cargar avatares, continuando sin avatar")
        return
      }
      const data = await response.json()

      if (data.avatars && data.avatars.length > 0) {
        // Seleccionar un avatar aleatorio
        const randomIndex = Math.floor(Math.random() * data.avatars.length)
        setNewUserAvatarUrl(data.avatars[randomIndex].url)
        setAvailableAvatars(data.avatars)
      } else {
        console.warn("⚠️ No hay avatares disponibles")
      }
    } catch (error) {
      console.warn("⚠️ Error al cargar avatar aleatorio (continuando sin avatar):", error)
      // No fallar, simplemente continuar sin avatar
    }
  }

  async function handleForceUpdate() {
    setIsForcingUpdate(true)
    try {
      // Obtener el userId actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "No se pudo obtener el usuario actual",
          variant: "destructive",
        })
        setIsForcingUpdate(false)
        return
      }

      const response = await fetch("/api/admin/force-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: true,
          message: "Actualización del sistema requerida",
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error("Error al forzar actualización")
      }

      toast({
        title: "✅ Actualización forzada",
        description: "Todos los usuarios verán el popup al iniciar sesión",
      })

      // Disparar evento para verificación inmediata
      window.dispatchEvent(new CustomEvent('force-update'))
      
      // También forzar recarga de la página para ver el popup inmediatamente
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Error al forzar actualización:", error)
      toast({
        title: "Error",
        description: "No se pudo forzar la actualización",
        variant: "destructive",
      })
    } finally {
      setIsForcingUpdate(false)
    }
  }

  async function handleDeactivateUpdate() {
    setIsDeactivatingUpdate(true)
    try {
      // Obtener el userId actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "No se pudo obtener el usuario actual",
          variant: "destructive",
        })
        setIsDeactivatingUpdate(false)
        return
      }

      const response = await fetch("/api/admin/force-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: false,
          message: "Actualización del sistema requerida",
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error("Error al desactivar actualización")
      }

      toast({
        title: "✅ Actualización desactivada",
        description: "El popup ya no aparecerá a los usuarios",
      })

      // Disparar evento para verificación inmediata
      window.dispatchEvent(new CustomEvent('force-update'))
      
      // También forzar recarga de la página
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Error al desactivar actualización:", error)
      toast({
        title: "Error",
        description: "No se pudo desactivar la actualización",
        variant: "destructive",
      })
    } finally {
      setIsDeactivatingUpdate(false)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Usar la API Route del servidor para crear el usuario
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUserEmail,
          fullName: newUserFullName,
          alias: newUserAlias,
          phone: newUserPhone,
          position: newUserPosition,
          roleId: newUserRole ? Number.parseInt(newUserRole) : undefined,
          avatarUrl: newUserAvatarUrl,
          skipWelcomeEmail: skipWelcomeEmail,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || "Error al crear usuario")
      }

      toast({
        title: "Usuario creado",
        description: skipWelcomeEmail
          ? "Usuario creado sin envío de correo"
          : "Se ha enviado un correo para establecer la contraseña",
      })

      setIsCreateDialogOpen(false)
      setNewUserEmail("")
      setNewUserFullName("")
      setNewUserAlias("")
      setNewUserPhone("")
      setNewUserPosition("")
      setNewUserRole("")
      setNewUserAvatarUrl(null)
      setSkipWelcomeEmail(false)
      await fetchUsers()
      await fetchRandomAvatar() // Obtener un nuevo avatar aleatorio para el próximo usuario

      // Intentar crear mapeo automático
      if (responseData.user && responseData.user.id) {
        try {
          const mappingSuggestions = await detectAndSuggestMapping(responseData.user.id, newUserFullName, newUserEmail)

          if (mappingSuggestions && mappingSuggestions.length > 0) {
            const bestMatch = mappingSuggestions[0]
            if (bestMatch.confidence > 0.8) {
              // Auto-crear mapeo con alta confianza
              await createAutoMapping(responseData.user.id, newUserFullName, bestMatch.asesor, newUserEmail)

              toast({
                title: "Mapeo automático creado",
                description: `Usuario mapeado automáticamente a ${bestMatch.asesor}`,
              })
            }
          }
        } catch (error) {
          console.log("No se pudo crear mapeo automático:", error)
        }
      }
    } catch (error: any) {
      console.error("Error al crear usuario:", error)
      setErrorMessage(error.message)
      toast({
        title: "Error al crear usuario",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser) return
    setIsSubmitting(true)

    try {
      console.log("🔄 Actualizando usuario:", {
        userId: selectedUser.id,
        fullName: editUserFullName,
        alias: editUserAlias,
        phone: editUserPhone,
        position: editUserPosition,
        avatarUrl: editUserAvatarUrl,
        roleId: selectedRole,
      })

      // Actualizar todos los datos del usuario en una sola llamada
      const userResponse = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: editUserFullName,
          alias: editUserAlias,
          phone: editUserPhone,
          position: editUserPosition,
          avatarUrl: editUserAvatarUrl,
          roleId: selectedRole ? Number.parseInt(selectedRole) : null,
        }),
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.message || "Error al actualizar usuario")
      }

      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario han sido actualizados exitosamente",
      })

      setIsEditDialogOpen(false)
      setSelectedUser(null)
      setSelectedRole("")
      setEditUserFullName("")
      setEditUserAlias("")
      setEditUserPhone("")
      setEditUserPosition("")
      setEditUserAvatarUrl(null)
      await fetchUsers()
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error)
      toast({
        title: "Error al actualizar usuario",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return
    setIsSubmitting(true)

    try {
      // Usar la API Route del servidor para eliminar el usuario
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      // Intentar obtener la respuesta JSON incluso si hay un error
      const data = await response.json().catch(() => ({ message: "Error desconocido" }))

      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar usuario")
      }

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      })

      // Actualizar la lista de usuarios localmente para una respuesta más rápida
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error)
      toast({
        title: "Error al eliminar usuario",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para enviar el correo de bienvenida a un usuario
  async function handleSendWelcomeEmail(userId: string, email: string) {
    setSendingWelcomeEmail(userId)
    try {
      const response = await fetch("/api/admin/users/send-welcome-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al enviar correo de bienvenida")
      }

      toast({
        title: "Correo enviado",
        description: "Se ha enviado el correo de bienvenida exitosamente",
      })

      // Actualizar el estado del usuario en la lista local
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.id === userId) {
            return { ...user, welcome_email_sent: true }
          }
          return user
        }),
      )
    } catch (error: any) {
      console.error("Error al enviar correo de bienvenida:", error)
      toast({
        title: "Error al enviar correo",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSendingWelcomeEmail(null)
    }
  }

  // Función para enviar el correo de reset de contraseña
  async function handleSendResetEmail(email: string) {
    setSendingResetEmail(email)
    try {
      const response = await fetch("/api/admin/users/send-reset-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al enviar correo de restablecimiento")
      }

      toast({
        title: "Correo enviado",
        description: "Se ha enviado el correo de restablecimiento de contraseña",
      })
    } catch (error: any) {
      console.error("Error al enviar correo de restablecimiento:", error)
      toast({
        title: "Error al enviar correo",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSendingResetEmail(null)
    }
  }

  // Función para establecer una contraseña directamente
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Las contraseñas no coinciden")
      setIsSubmitting(false)
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/admin/users/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: passwordUserId,
          password: newPassword,
          forceChange: forcePasswordChange,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al establecer la contraseña")
      }

      toast({
        title: "Contraseña establecida",
        description: forcePasswordChange
          ? "Se ha establecido la contraseña temporal. El usuario deberá cambiarla en el primer inicio de sesión."
          : "Se ha establecido la nueva contraseña para el usuario.",
      })

      setIsSetPasswordDialogOpen(false)
      setNewPassword("")
      setConfirmNewPassword("")
      setForcePasswordChange(true)
      setPasswordUserEmail("")
      setPasswordUserId("")
    } catch (error: any) {
      console.error("Error al establecer contraseña:", error)
      setErrorMessage(error.message)
      toast({
        title: "Error al establecer contraseña",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para abrir el diálogo de establecer contraseña
  function openSetPasswordDialog(user: UserWithRoles) {
    setPasswordUserEmail(user.email)
    setPasswordUserId(user.id)
    setIsSetPasswordDialogOpen(true)
  }

  // Función para abrir el diálogo de selección de avatar para un usuario existente
  function openAvatarDialog(user: UserWithRoles) {
    setSelectedAvatarUser(user)
    setIsAvatarDialogOpen(true)
  }

  // Función para actualizar el avatar de un usuario existente
  async function handleUpdateAvatar(userId: string, avatarUrl: string) {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al actualizar avatar")
      }

      toast({
        title: "Avatar actualizado",
        description: "El avatar del usuario ha sido actualizado exitosamente",
      })

      // Actualizar el usuario en la lista local
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.id === userId) {
            return { ...user, avatar_url: avatarUrl }
          }
          return user
        }),
      )

      setIsAvatarDialogOpen(false)
      setSelectedAvatarUser(null)
    } catch (error: any) {
      console.error("Error al actualizar avatar:", error)
      toast({
        title: "Error al actualizar avatar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para regenerar el alias basado en el nombre completo
  function regenerateAlias() {
    if (newUserFullName) {
      setNewUserAlias(generateAlias(newUserFullName))
    }
  }

  // Función para regenerar el alias en el modo de edición
  function regenerateEditAlias() {
    if (editUserFullName) {
      setEditUserAlias(generateAlias(editUserFullName))
    }
  }

  // Función para obtener el color de la etiqueta de rol
  function getRoleBadgeColor(role: string) {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "administrador":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "supervisor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "logística":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "asesor ventas":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "mecánica":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "carrocería":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300"
    }
  }

  // Generar una contraseña aleatoria segura
  function generateRandomPassword() {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?"
    let password = ""
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      password += charset[randomIndex]
    }
    setNewPassword(password)
    setConfirmNewPassword(password)
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>Administra los usuarios y sus roles en el sistema</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleForceUpdate}
              disabled={isForcingUpdate || isDeactivatingUpdate}
              variant="destructive"
              size="sm"
            >
              {isForcingUpdate ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Forzando...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-3 w-3" />
                  Forzar actualización
                </>
              )}
            </Button>
            <Button
              onClick={handleDeactivateUpdate}
              disabled={isForcingUpdate || isDeactivatingUpdate}
              variant="outline"
              size="sm"
            >
              {isDeactivatingUpdate ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Desactivando...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-3 w-3" />
                  Desactivar
                </>
              )}
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Ingresa los datos del usuario. Recibirá un correo para establecer su contraseña.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-120px)] pr-4 md:pr-0">
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nombre Completo</Label>
                        <Input
                          id="fullName"
                          value={newUserFullName}
                          onChange={(e) => setNewUserFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="alias">Alias</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  type="button"
                                  onClick={regenerateAlias}
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Regenerar alias</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="alias"
                          value={newUserAlias}
                          onChange={(e) => setNewUserAlias(e.target.value)}
                          placeholder="Alias para identificación rápida"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={newUserPhone}
                          onChange={(e) => setNewUserPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Cargo en la empresa</Label>
                        <Input
                          id="position"
                          value={newUserPosition}
                          onChange={(e) => setNewUserPosition(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select value={newUserRole} onValueChange={setNewUserRole} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          {/* Update the `SelectContent` in the "Invitar Nuevo Usuario" dialog to use `availableRoles`: */}
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Avatar</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                          {newUserAvatarUrl ? (
                            <Image
                              src={newUserAvatarUrl || "/placeholder.svg"}
                              alt="Avatar"
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <span className="text-xs font-medium">?</span>
                            </div>
                          )}
                        </div>
                        <AvatarSelector
                          currentAvatarUrl={newUserAvatarUrl}
                          onSelect={(url) => setNewUserAvatarUrl(url)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skipWelcomeEmail"
                        checked={skipWelcomeEmail}
                        onCheckedChange={(checked) => setSkipWelcomeEmail(checked === true)}
                      />
                      <Label
                        htmlFor="skipWelcomeEmail"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        No enviar correo de bienvenida (para pruebas)
                      </Label>
                    </div>
                    {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
                    <DialogFooter className="pt-4">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          "Crear Usuario"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <Button variant="outline" asChild>
              <Link href="/admin/user-mappings">
                <Users className="mr-2 h-4 w-4" />
                Mapeos de Usuario
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div
                          className="relative h-10 w-10 overflow-hidden rounded-full cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          onClick={() => openAvatarDialog(user)}
                          title="Cambiar avatar"
                        >
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url || "/placeholder.svg"}
                              alt={user.full_name || "Avatar"}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <span className="text-xs font-medium">
                                {user.full_name
                                  ? user.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .substring(0, 2)
                                  : user.email.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.full_name || "Sin nombre"}</TableCell>
                      <TableCell>{user.alias || "-"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || "No disponible"}</TableCell>
                      <TableCell>{user.position || "No disponible"}</TableCell>
                      <TableCell>
                        {user.roles && user.roles.length > 0
                          ? user.roles.map((role, index) => (
                              <Badge key={index} variant="outline" className={`${getRoleBadgeColor(role.name)} mr-1`}>
                                {role.name}
                              </Badge>
                            ))
                          : "Sin rol"}
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          {!user.welcome_email_sent && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSendWelcomeEmail(user.id, user.email)}
                                    disabled={sendingWelcomeEmail === user.id}
                                  >
                                    {sendingWelcomeEmail === user.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Mail className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Enviar correo de bienvenida</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSendResetEmail(user.email)}
                                  disabled={sendingResetEmail === user.email}
                                >
                                  {sendingResetEmail === user.email ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <KeyRound className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Enviar correo de restablecimiento</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openSetPasswordDialog(user)}
                                  disabled={settingPassword === user.id}
                                >
                                  {settingPassword === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Key className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Establecer contraseña</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Dialog
                            open={isEditDialogOpen && selectedUser?.id === user.id}
                            onOpenChange={(open) => {
                              setIsEditDialogOpen(open)
                              if (open) {
                                setSelectedUser(user)
                                setSelectedRole(user.roles && user.roles.length > 0 ? user.roles[0].id.toString() : "")
                                setEditUserFullName(user.full_name || "")
                                setEditUserAlias(user.alias || "")
                                setEditUserPhone(user.phone || "")
                                setEditUserPosition(user.position || "")
                                setEditUserAvatarUrl(user.avatar_url)
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Editar Usuario</DialogTitle>
                                <DialogDescription>Actualiza los datos del usuario</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="userEmail">Email</Label>
                                    <Input id="userEmail" value={user.email} disabled />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="userFullName">Nombre Completo</Label>
                                    <Input
                                      id="userFullName"
                                      value={editUserFullName}
                                      onChange={(e) => setEditUserFullName(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor="userAlias">Alias</Label>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              type="button"
                                              onClick={regenerateEditAlias}
                                            >
                                              <RefreshCw className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Regenerar alias</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                    <Input
                                      id="userAlias"
                                      value={editUserAlias}
                                      onChange={(e) => setEditUserAlias(e.target.value)}
                                      placeholder="Alias para identificación rápida"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="userPhone">Teléfono</Label>
                                    <Input
                                      id="userPhone"
                                      value={editUserPhone}
                                      onChange={(e) => setEditUserPhone(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="userPosition">Cargo</Label>
                                    <Input
                                      id="userPosition"
                                      value={editUserPosition}
                                      onChange={(e) => setEditUserPosition(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="userRole">Rol</Label>
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar rol" />
                                      </SelectTrigger>
                                      {/* Update the `SelectContent` in the "Editar Usuario" dialog to use `availableRoles`: */}
                                      <SelectContent>
                                        {availableRoles.map((role) => (
                                          <SelectItem key={role.id} value={role.id.toString()}>
                                            {role.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Avatar</Label>
                                  <div className="flex items-center gap-4">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                                      {editUserAvatarUrl ? (
                                        <Image
                                          src={editUserAvatarUrl || "/placeholder.svg"}
                                          alt="Avatar"
                                          fill
                                          sizes="64px"
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-muted">
                                          <span className="text-xs font-medium">
                                            {editUserFullName
                                              ? editUserFullName
                                                  .split(" ")
                                                  .map((n) => n[0])
                                                  .join("")
                                                  .toUpperCase()
                                                  .substring(0, 2)
                                              : user.email.substring(0, 2).toUpperCase()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <AvatarSelector
                                      currentAvatarUrl={editUserAvatarUrl}
                                      onSelect={(url) => setEditUserAvatarUrl(url)}
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={handleUpdateUser} disabled={isSubmitting}>
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Guardando...
                                    </>
                                  ) : (
                                    "Guardar Cambios"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para cambiar el avatar de un usuario existente */}
      {selectedAvatarUser && (
        <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Cambiar Avatar</DialogTitle>
              <DialogDescription>
                Selecciona un nuevo avatar para {selectedAvatarUser.full_name || selectedAvatarUser.email}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                  {selectedAvatarUser.avatar_url ? (
                    <Image
                      src={selectedAvatarUser.avatar_url || "/placeholder.svg"}
                      alt="Avatar actual"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <span className="text-xs font-medium">
                        {selectedAvatarUser.full_name
                          ? selectedAvatarUser.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .substring(0, 2)
                          : selectedAvatarUser.email.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Avatar actual</p>
                  <p className="text-xs text-muted-foreground">Selecciona uno nuevo de la lista</p>
                </div>
              </div>

              <AvatarSelector
                currentAvatarUrl={selectedAvatarUser.avatar_url}
                onSelect={(url) => handleUpdateAvatar(selectedAvatarUser.id, url)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo para establecer contraseña */}
      <Dialog open={isSetPasswordDialogOpen} onOpenChange={setIsSetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Establecer Contraseña</DialogTitle>
            <DialogDescription>Establece una contraseña para el usuario {passwordUserEmail}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRandomPassword}
                    className="h-8 text-xs"
                  >
                    Generar Contraseña
                  </Button>
                </div>
                <Input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmNewPassword"
                  type="text"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="forcePasswordChange"
                  checked={forcePasswordChange}
                  onCheckedChange={(checked) => setForcePasswordChange(checked === true)}
                />
                <Label
                  htmlFor="forcePasswordChange"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Forzar cambio de contraseña en el primer inicio de sesión
                </Label>
              </div>
              {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSetPasswordDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Establecer Contraseña"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
