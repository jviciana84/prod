"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, Plus, Save, Trash2, AlertCircle, Info, Users, CheckCircle, Eye, EyeOff, Settings, ChevronDown, Lock, Unlock, Calendar, BarChart2, BarChart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Photographer {
  id: string
  user_id: string
  email?: string
  full_name?: string
  percentage: number
  is_active: boolean
  is_hidden?: boolean
  is_locked?: boolean
  avatar_url?: string
}

interface UserInfo {
  id: string
  email: string
  full_name?: string
  source: string
  avatar_url?: string
}

export default function PhotographerAssignments() {
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [allUsers, setAllUsers] = useState<UserInfo[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("photographers")
  const [totalPercentage, setTotalPercentage] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [showHidden, setShowHidden] = useState(false)
  const [showExtras, setShowExtras] = useState(false)

  // Para añadir fotógrafo manualmente
  const [newEmail, setNewEmail] = useState("")
  const [newManualUserId, setNewManualUserId] = useState("")

  // Cargar datos
  useEffect(() => {
    fetchData()
  }, [])

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${info}`])
  }

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
    setDebugInfo([])

    try {
      // 1. Obtener fotógrafos asignados
      addDebugInfo("Obteniendo fotógrafos asignados...")
      const { data: photographersData, error: photographersError } = await supabase
        .from("fotos_asignadas")
        .select("*")
        .order("percentage", { ascending: false })

      if (photographersError) {
        console.error("Error al obtener fotógrafos:", photographersError)
        addDebugInfo(`Error al obtener fotógrafos: ${photographersError.message}`)
        throw photographersError
      }

      addDebugInfo(`Fotógrafos obtenidos: ${photographersData?.length || 0}`)

      // 2. Obtener usuarios directamente de la API
      addDebugInfo("Obteniendo usuarios de la API...")
      try {
        const response = await fetch("/api/admin/users")
        if (!response.ok) {
          throw new Error(`Error al cargar usuarios: ${response.status} ${response.statusText}`)
        }

        const usersData = await response.json()
        addDebugInfo(`Usuarios obtenidos de API: ${usersData?.length || 0}`)

        // Crear un mapa de usuarios por ID
        const userMap: Record<string, UserInfo> = {}
        const allUsers: UserInfo[] = []

        if (usersData && usersData.length > 0) {
          usersData.forEach((user: any) => {
            if (user.id && user.email) {
              const userInfo: UserInfo = {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
                source: "api/admin/users",
              }
              allUsers.push(userInfo)
              userMap[user.id] = userInfo
            }
          })
        }

        // 3. Combinar datos de fotógrafos con datos de usuarios
        addDebugInfo(`Total de usuarios encontrados: ${allUsers.length}`)

        const formattedPhotographers =
          photographersData?.map((p) => {
            const userInfo = userMap[p.user_id]
            return {
              id: p.id,
              user_id: p.user_id,
              email: userInfo?.email || `Usuario ${p.user_id.substring(0, 8)}...`,
              full_name: userInfo?.full_name,
              avatar_url: userInfo?.avatar_url,
              percentage: p.percentage || 0,
              is_active: p.is_active || false,
              is_hidden: p.is_hidden || false,
              is_locked: p.is_locked || false,
            }
          }) || []

        setPhotographers(formattedPhotographers)
        setAllUsers(allUsers)

        // Calcular el porcentaje total (solo fotógrafos activos y no ocultos)
        const total = formattedPhotographers.filter((p) => p.is_active && !p.is_hidden).reduce((sum, p) => sum + p.percentage, 0)
        setTotalPercentage(total)

        if (formattedPhotographers.length === 0) {
          setSuccessMessage("No hay fotógrafos asignados. Puedes añadir fotógrafos desde la pestaña 'Añadir Usuarios'.")
        }

        if (allUsers.length === 0) {
          setError("No se encontraron usuarios en el sistema. Debes crear usuarios primero.")
        }
      } catch (apiError) {
        console.error("Error al obtener usuarios de la API:", apiError)
        addDebugInfo(
          `Error al obtener usuarios de la API: ${apiError instanceof Error ? apiError.message : String(apiError)}`,
        )

        // Si falla la API, intentamos obtener usuarios directamente de la tabla auth.users
        addDebugInfo("Intentando obtener usuarios directamente de la base de datos...")

        try {
          // Obtener usuarios de la tabla auth.users usando RPC
          const { data: authUsers, error: authError } = await supabase.rpc("get_auth_users")

          if (authError) {
            throw authError
          }

          addDebugInfo(`Usuarios obtenidos de auth.users: ${authUsers?.length || 0}`)

          // Crear un mapa de usuarios
          const userMap: Record<string, UserInfo> = {}
          const allUsers: UserInfo[] = []

          if (authUsers && authUsers.length > 0) {
            authUsers.forEach((user: any) => {
              if (user.id && user.email) {
                const userInfo: UserInfo = {
                  id: user.id,
                  email: user.email,
                  source: "auth.users",
                }
                allUsers.push(userInfo)
                userMap[user.id] = userInfo
              }
            })
          }

          // Combinar datos
          const formattedPhotographers =
            photographersData?.map((p) => {
              const userInfo = userMap[p.user_id]
              return {
                id: p.id,
                user_id: p.user_id,
                email: userInfo?.email || `Usuario ${p.user_id.substring(0, 8)}...`,
                percentage: p.percentage || 0,
                is_active: p.is_active || false,
                is_hidden: p.is_hidden || false,
                is_locked: p.is_locked || false,
              }
            }) || []

          setPhotographers(formattedPhotographers)
          setAllUsers(allUsers)

          // Calcular el porcentaje total (solo fotógrafos activos y no ocultos)
          const total = formattedPhotographers.filter((p) => p.is_active && !p.is_hidden).reduce((sum, p) => sum + p.percentage, 0)
          setTotalPercentage(total)

          // Filtrar usuarios disponibles
          const existingPhotographerIds = formattedPhotographers.map((p) => p.user_id)
          const filteredUsers = allUsers.filter((user) => !existingPhotographerIds.includes(user.id))
          // setAvailableUsers(filteredUsers) // This line was removed as per the edit hint

          addDebugInfo(`Usuarios disponibles para añadir: ${filteredUsers.length}`)
        } catch (dbError) {
          console.error("Error al obtener usuarios de la base de datos:", dbError)
          addDebugInfo(
            `Error al obtener usuarios de la base de datos: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
          )

          // Si todo falla, al menos mostramos los fotógrafos sin información de usuario
          if (photographersData) {
            const basicPhotographers = photographersData.map((p) => ({
              id: p.id,
              user_id: p.user_id,
              email: `Usuario ${p.user_id.substring(0, 8)}...`,
              percentage: p.percentage || 0,
              is_active: p.is_active || false,
            }))

            setPhotographers(basicPhotographers)

            // Calcular el porcentaje total (solo fotógrafos activos y no ocultos)
            const total = basicPhotographers.filter((p) => p.is_active && !p.is_hidden).reduce((sum, p) => sum + p.percentage, 0)
            setTotalPercentage(total)
          }

          setError("No se pudieron obtener los usuarios. Puedes añadir fotógrafos manualmente usando su ID.")
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setError("No se pudieron cargar los datos de fotógrafos. Intenta recargar la página.")
      toast({
        title: "Error al cargar usuarios",
        description: "No se pudieron cargar los datos de fotógrafos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar porcentaje de asignación
  const handlePercentageChange = (index: number, value: number[]) => {
    const updatedPhotographers = [...photographers]
    updatedPhotographers[index].percentage = value[0]
    setPhotographers(updatedPhotographers)

    // Actualizar el porcentaje total (solo fotógrafos activos y no ocultos)
    const total = updatedPhotographers.filter((p) => p.is_active && !p.is_hidden).reduce((sum, p) => sum + p.percentage, 0)
    setTotalPercentage(total)
  }

  // Actualizar estado activo
  const handleActiveChange = (index: number, value: boolean) => {
    const updatedPhotographers = [...photographers]
    updatedPhotographers[index].is_active = value
    setPhotographers(updatedPhotographers)

    // Actualizar el porcentaje total (solo fotógrafos activos y no ocultos)
    const total = updatedPhotographers.filter((p) => p.is_active && !p.is_hidden).reduce((sum, p) => sum + p.percentage, 0)
    setTotalPercentage(total)
  }

  // Cambiar el estado de bloqueo solo en el estado local
  const handleLockChange = (index: number, value: boolean) => {
    const updatedPhotographers = [...photographers]
    updatedPhotographers[index].is_locked = value
    setPhotographers(updatedPhotographers)
  }

  // Guardar cambios
  const handleSaveChanges = async () => {
    setIsSaving(true)
    setSuccessMessage(null)
    try {
      // Verificar que los porcentajes suman 100% (solo fotógrafos activos y no ocultos)
      const activePhotographers = photographers.filter((p) => p.is_active && !p.is_hidden)
      const totalPercentage = activePhotographers.reduce((sum, p) => sum + p.percentage, 0)

      if (activePhotographers.length > 0 && totalPercentage !== 100) {
        toast({
          title: "Error",
          description:
            "Los porcentajes de fotógrafos activos deben sumar 100%. Actualmente suman " + totalPercentage + "%.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      // Guardar todos los cambios de porcentaje e is_locked
      for (const photographer of photographers) {
        // Eliminar campos que no están en la tabla
        const { email, full_name, avatar_url, ...updateData } = photographer
        // Solo actualiza si el fotógrafo ya existe en la base de datos
        if (photographer.id) {
          const { error } = await supabase.from("fotos_asignadas").update(updateData).eq("id", photographer.id)
          if (error) throw error
        }
      }

      setSuccessMessage("Los cambios en las asignaciones de fotógrafos se han guardado correctamente.")
      toast({
        title: "Cambios guardados",
        description: "Los cambios en las asignaciones de fotógrafos se han guardado correctamente.",
      })
      fetchData()
    } catch (error) {
      console.error("Error al guardar cambios:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Añadir nuevo fotógrafo desde la lista
  const handleAddPhotographer = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un usuario para añadir como fotógrafo.",
        variant: "destructive",
      })
      return
    }

    try {
      // Obtener el usuario seleccionado
      const selectedUser = allUsers.find((user) => user.id === selectedUserId)

      if (!selectedUser) {
        toast({
          title: "Error",
          description: "Usuario no encontrado. Por favor, selecciona otro usuario.",
          variant: "destructive",
        })
        return
      }

      // Insertar nuevo fotógrafo
      const { data, error } = await supabase
        .from("fotos_asignadas")
        .insert({
          user_id: selectedUserId,
          percentage: 0,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      // Actualizar lista de fotógrafos
      fetchData()
      setSelectedUserId("")

      toast({
        title: "Fotógrafo añadido",
        description: "El nuevo fotógrafo ha sido añadido correctamente.",
      })
    } catch (error) {
      console.error("Error al añadir fotógrafo:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir el fotógrafo. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Añadir nuevo fotógrafo manualmente
  const handleAddManualPhotographer = async () => {
    if (!newEmail || !newManualUserId) {
      toast({
        title: "Error",
        description: "Por favor, ingresa el email y el ID del usuario.",
        variant: "destructive",
      })
      return
    }

    try {
      // Verificar si el usuario ya existe
      const { data: existingPhotographers, error: checkError } = await supabase
        .from("fotos_asignadas")
        .select("id")
        .eq("user_id", newManualUserId)

      if (checkError) throw checkError

      if (existingPhotographers && existingPhotographers.length > 0) {
        toast({
          title: "Error",
          description: "Este usuario ya está asignado como fotógrafo.",
          variant: "destructive",
        })
        return
      }

      // Insertar nuevo fotógrafo
      const { data, error } = await supabase
        .from("fotos_asignadas")
        .insert({
          user_id: newManualUserId,
          percentage: 0,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      // Actualizar lista de fotógrafos
      fetchData()
      setNewEmail("")
      setNewManualUserId("")

      toast({
        title: "Fotógrafo añadido",
        description: "El nuevo fotógrafo ha sido añadido correctamente.",
      })
    } catch (error) {
      console.error("Error al añadir fotógrafo:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir el fotógrafo. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Eliminar fotógrafo
  const handleDeletePhotographer = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al fotógrafo ${email}?`)) {
      return
    }

    try {
      const { error } = await supabase.from("fotos_asignadas").delete().eq("id", id)

      if (error) throw error

      // Actualizar lista de fotógrafos
      fetchData()

      toast({
        title: "Fotógrafo eliminado",
        description: `El fotógrafo ${email} ha sido eliminado correctamente.`,
      })
    } catch (error) {
      console.error("Error al eliminar fotógrafo:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el fotógrafo. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Distribuir porcentajes equitativamente entre fotógrafos activos (respetando bloqueos)
  const distributePercentages = () => {
    const activePhotographers = photographers.filter((p) => p.is_active && !p.is_hidden)
    const lockedPhotographers = activePhotographers.filter((p) => p.is_locked)
    const unlockedPhotographers = activePhotographers.filter((p) => !p.is_locked)

    if (unlockedPhotographers.length === 0) {
      toast({
        title: "Error",
        description: "No hay fotógrafos activos y desbloqueados para distribuir porcentajes.",
        variant: "destructive",
      })
      return
    }

    // Calcular el porcentaje total bloqueado
    const totalLockedPercentage = lockedPhotographers.reduce((sum, p) => sum + p.percentage, 0)
    const availablePercentage = 100 - totalLockedPercentage

    if (availablePercentage < 0) {
      toast({
        title: "Error",
        description: `Los fotógrafos bloqueados suman ${totalLockedPercentage}%. No hay porcentaje disponible para distribuir.`,
        variant: "destructive",
      })
      return
    }

    const equalPercentage = Math.floor(availablePercentage / unlockedPhotographers.length)
    let remainder = availablePercentage - equalPercentage * unlockedPhotographers.length

    const updatedPhotographers = [...photographers]

    updatedPhotographers.forEach((photographer) => {
      if (photographer.is_active && !photographer.is_hidden) {
        if (photographer.is_locked) {
          // Mantener el porcentaje bloqueado sin cambios
        } else {
          // Asignar porcentaje equitativo a los desbloqueados
          photographer.percentage = equalPercentage
        }
      } else {
        photographer.percentage = 0
      }
    })

    // Distribuir el resto entre los primeros fotógrafos desbloqueados
    if (remainder > 0) {
      for (const photographer of updatedPhotographers) {
        if (photographer.is_active && !photographer.is_hidden && !photographer.is_locked && remainder > 0) {
          photographer.percentage += 1
          remainder -= 1
        }
      }
    }

    setPhotographers(updatedPhotographers)
    
    // Calcular el nuevo total (solo fotógrafos activos y no ocultos)
    const newTotal = updatedPhotographers
      .filter((p) => p.is_active && !p.is_hidden)
      .reduce((sum, p) => sum + p.percentage, 0)
    setTotalPercentage(newTotal)
  }

  // Simulación de datos de estadísticas (en la práctica, estos vendrán de la base de datos o props)
  const photographerStats = photographers.map((p) => ({
    id: p.id,
    avatar_url: p.avatar_url,
    name: p.full_name || p.email,
    photos_done: Math.floor(Math.random() * 100), // Simulado
    avg_apto_days: (Math.random() * 5 + 1).toFixed(1), // Simulado
    avg_photos_days: (Math.random() * 5 + 1).toFixed(1), // Simulado
  })).filter((stat) => stat.photos_done > 0)

  return (
    <div className="space-y-6 relative">
      {/* Card de porcentaje total: 100% ancho */}
      <div>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex flex-col gap-0">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Porcentaje total asignado</CardTitle>
              </div>
              <CardDescription>Gestiona el reparto de porcentaje entre los fotógrafos activos</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={distributePercentages}
              disabled={photographers.filter((p) => p.is_active && !p.is_hidden).length === 0}
            >
              Distribuir Equitativamente
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">Porcentaje total asignado:</span>
                <Badge variant={totalPercentage === 100 ? "default" : "destructive"} className="ml-2">
                  {totalPercentage}%
                </Badge>
                {totalPercentage !== 100 && photographers.filter((p) => p.is_active && !p.is_hidden).length > 0 && (
                  <span className="ml-3 text-sm text-amber-600 whitespace-nowrap">
                    {totalPercentage < 100
                      ? `Faltan ${100 - totalPercentage}% por asignar`
                      : `Hay ${totalPercentage - 100}% asignados de más`}
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
              <div
                className={`h-2.5 rounded-full ${totalPercentage === 100 ? "bg-green-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(100, totalPercentage)}%` }}
              ></div>
            </div>
            {/* Información sobre fotógrafos bloqueados */}
            {(() => {
              const lockedPhotographers = photographers.filter((p) => p.is_active && !p.is_hidden && p.is_locked)
              const totalLockedPercentage = lockedPhotographers.reduce((sum, p) => sum + p.percentage, 0)
              if (lockedPhotographers.length > 0) {
                return (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Lock className="h-4 w-4" />
                      <span className="font-medium">
                        {lockedPhotographers.length} fotógrafo{lockedPhotographers.length > 1 ? 's' : ''} bloqueado{lockedPhotographers.length > 1 ? 's' : ''}: {totalLockedPercentage}%
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Los fotógrafos bloqueados mantienen su porcentaje fijo y no se ven afectados por el reparto equitativo.
                    </p>
                  </div>
                )
              }
              return null
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Fila con cards de fotógrafos asignados y estadísticas */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Card de fotógrafos asignados: 2/3 */}
        <div className="md:w-2/3 flex flex-col">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">Fotógrafos Asignados</CardTitle>
                </div>
                <CardDescription>Activa, bloquea y gestiona los fotógrafos disponibles</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setShowHidden((v) => !v)} title={showHidden ? "Ocultar usuarios ocultos" : "Ver usuarios ocultos"}>
                  {showHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading} title="Actualizar">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={handleSaveChanges} disabled={isSaving} title="Guardar Cambios">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ minWidth: 220 }}>Usuario</TableHead>
                    <TableHead style={{ minWidth: 220, width: 260 }}>Porcentaje</TableHead>
                    <TableHead style={{ width: 80 }}>Activo</TableHead>
                    <TableHead style={{ width: 100, paddingLeft: 0 }}>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...allUsers]
                    .filter((user) => {
                      const photographer = photographers.find((p) => p.user_id === user.id)
                      if (showHidden) return true
                      return !photographer?.is_hidden
                    })
                    .sort((a, b) => {
                      const aActive = photographers.find((p) => p.user_id === a.id)?.is_active ? 1 : 0
                      const bActive = photographers.find((p) => p.user_id === b.id)?.is_active ? 1 : 0
                      return bActive - aActive
                    })
                    .map((user, index) => {
                      const photographer = photographers.find((p) => p.user_id === user.id)
                      const isActive = photographer?.is_active || false
                      const percentage = photographer?.percentage ?? 0
                      const isHidden = photographer?.is_hidden || false
                      const isLocked = photographer?.is_locked || false
                      return (
                        <TableRow key={user.id} className={isHidden ? "opacity-60" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.avatar_url && (
                                <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                              )}
                              <div>
                                <div className="font-medium">{user.full_name || user.email}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="w-40" style={{ minWidth: 220, width: 260 }}>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[percentage]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(value) => {
                                  if (photographer) {
                                    handlePercentageChange(photographers.findIndex((p) => p.user_id === user.id), value)
                                  }
                                }}
                                disabled={!isActive || isLocked}
                                className="w-[160px] md:w-[200px] lg:w-[220px] xl:w-[240px]"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-mono">{percentage}%</span>
                                {isLocked && <Lock className="h-3 w-3 text-blue-500" title="Porcentaje bloqueado" />}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={isActive}
                              onCheckedChange={async (value) => {
                                if (photographer) {
                                  handleActiveChange(photographers.findIndex((p) => p.user_id === user.id), value)
                                } else if (value) {
                                  // Si no existe, crear el registro en la base de datos y en el estado
                                  setIsSaving(true)
                                  try {
                                    const { data, error } = await supabase
                                      .from("fotos_asignadas")
                                      .insert({
                                        user_id: user.id,
                                        percentage: 0,
                                        is_active: true,
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString(),
                                      })
                                      .select()
                                    if (error) throw error
                                    fetchData()
                                  } catch (e) {
                                    toast({
                                      title: "Error",
                                      description: "No se pudo activar el usuario como fotógrafo.",
                                      variant: "destructive",
                                    })
                                  } finally {
                                    setIsSaving(false)
                                  }
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="flex gap-2 pl-0" style={{ width: 100, paddingLeft: 0 }}>
                            {photographer && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={isLocked ? "Desbloquear porcentaje" : "Bloquear porcentaje"}
                                  onClick={() => handleLockChange(photographers.findIndex((p) => p.user_id === user.id), !isLocked)}
                                  disabled={!isActive}
                                >
                                  {isLocked ? <Unlock className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={isHidden ? "Mostrar usuario" : "Ocultar usuario"}
                                  onClick={async () => {
                                    setIsSaving(true)
                                    try {
                                      const { error } = await supabase
                                        .from("fotos_asignadas")
                                        .update({ is_hidden: !isHidden, updated_at: new Date().toISOString() })
                                        .eq("id", photographer.id)
                                      if (error) throw error
                                      fetchData()
                                    } catch (e) {
                                      toast({
                                        title: "Error",
                                        description: "No se pudo cambiar la visibilidad del usuario.",
                                        variant: "destructive",
                                      })
                                    } finally {
                                      setIsSaving(false)
                                    }
                                  }}
                                >
                                  {isHidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePhotographer(photographer.id, user.email || "")}
                                  disabled={isSaving}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        {/* Card de estadísticas: 1/3 */}
        <div className="md:w-1/3 flex flex-col">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-violet-500" />
                  <CardTitle className="text-lg">Estadísticas</CardTitle>
                </div>
                <CardDescription>Resumen de actividad y tiempos por fotógrafo</CardDescription>
              </div>
              <Button variant="outline" size="icon" title="Filtrar por fecha">
                <Calendar className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fotógrafo</TableHead>
                    <TableHead>Fotos</TableHead>
                    <TableHead>Prom. apto</TableHead>
                    <TableHead>Prom. fotos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {photographerStats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {stat.avatar_url && (
                            <img src={stat.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                          )}
                          <span className="font-medium text-sm">{stat.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{stat.photos_done}</TableCell>
                      <TableCell className="text-center">{stat.avg_apto_days} d</TableCell>
                      <TableCell className="text-center">{stat.avg_photos_days} d</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Botón de expandir extras debajo de ambos cards */}
      <div className="flex justify-end mt-2">
        <button
          className="flex items-center gap-1 px-3 py-1 rounded bg-muted hover:bg-muted/70 border border-border text-muted-foreground text-xs shadow transition-colors"
          title={showExtras ? "Ocultar utilidades" : "Mostrar utilidades"}
          onClick={() => setShowExtras((v) => !v)}
        >
          <ChevronDown className="h-4 w-4" />
          <ChevronDown className="h-4 w-4 -ml-2" />
          <ChevronDown className="h-4 w-4 -ml-2" />
        </button>
      </div>

      {/* Resto del contenido: cards extras, etc. */}
      {/* Cards extras: Añadir Usuarios y Diagnóstico */}
      {showExtras && (
        <div className="space-y-6 animate-fade-in">
          {/* Añadir nuevo fotógrafo desde la lista */}
          <Card>
            <CardHeader>
              <CardTitle>Añadir Fotógrafo desde Lista de Usuarios</CardTitle>
              <CardDescription>{allUsers.length} usuarios disponibles encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              {allUsers.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-select" className="mb-2 block">
                      Seleccionar Usuario
                    </Label>
                    <select
                      id="user-select"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                      <option value="">Seleccionar usuario...</option>
                      {allUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email} {user.full_name ? `(${user.full_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleAddPhotographer} disabled={!selectedUserId}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Fotógrafo
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">No se encontraron usuarios disponibles.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Añadir nuevo fotógrafo manualmente */}
          <Card>
            <CardHeader>
              <CardTitle>Añadir Fotógrafo Manualmente</CardTitle>
              <CardDescription>Usa esta opción si no encuentras el usuario en la lista</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-email" className="mb-2 block">
                    Email del Fotógrafo
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    (Solo para referencia, no se guardará en la base de datos)
                  </p>
                </div>
                <div>
                  <Label htmlFor="new-user-id" className="mb-2 block">
                    ID del Usuario
                  </Label>
                  <Input
                    id="new-user-id"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={newManualUserId}
                    onChange={(e) => setNewManualUserId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingresa el ID de Supabase del usuario (formato UUID)
                  </p>
                </div>
                <Button onClick={handleAddManualPhotographer} disabled={!newEmail || !newManualUserId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Fotógrafo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Diagnóstico</CardTitle>
              <CardDescription>Detalles sobre la carga de datos y usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200 max-h-[400px] overflow-y-auto">
                {debugInfo.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2" />
                    <p>No hay información de diagnóstico disponible.</p>
                    <p className="text-sm mt-2">
                      Haz clic en "Actualizar" para cargar los datos y generar información de diagnóstico.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1 text-sm font-mono">
                    {debugInfo.map((info, index) => (
                      <li key={index} className="border-b border-slate-100 pb-1">
                        {info}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Actualizar Diagnóstico
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usuarios Encontrados */}
          <Card>
            <CardHeader>
              <CardTitle>Usuarios Encontrados</CardTitle>
              <CardDescription>Lista de todos los usuarios encontrados en las diferentes tablas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    allUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.full_name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
