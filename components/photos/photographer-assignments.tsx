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
import { RefreshCw, Plus, Save, Trash2, AlertCircle, Info, Users, CheckCircle } from "lucide-react"
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
  const [availableUsers, setAvailableUsers] = useState<UserInfo[]>([])
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
            }
          }) || []

        setPhotographers(formattedPhotographers)

        // Calcular el porcentaje total
        const total = formattedPhotographers.filter((p) => p.is_active).reduce((sum, p) => sum + p.percentage, 0)
        setTotalPercentage(total)

        // 4. Filtrar usuarios disponibles (que no son fotógrafos)
        const existingPhotographerIds = formattedPhotographers.map((p) => p.user_id)
        const filteredUsers = allUsers.filter((user) => !existingPhotographerIds.includes(user.id))
        setAvailableUsers(filteredUsers)

        addDebugInfo(`Usuarios disponibles para añadir: ${filteredUsers.length}`)

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
              }
            }) || []

          setPhotographers(formattedPhotographers)

          // Calcular el porcentaje total
          const total = formattedPhotographers.filter((p) => p.is_active).reduce((sum, p) => sum + p.percentage, 0)
          setTotalPercentage(total)

          // Filtrar usuarios disponibles
          const existingPhotographerIds = formattedPhotographers.map((p) => p.user_id)
          const filteredUsers = allUsers.filter((user) => !existingPhotographerIds.includes(user.id))
          setAvailableUsers(filteredUsers)

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

            // Calcular el porcentaje total
            const total = basicPhotographers.filter((p) => p.is_active).reduce((sum, p) => sum + p.percentage, 0)
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

    // Actualizar el porcentaje total
    const total = updatedPhotographers.filter((p) => p.is_active).reduce((sum, p) => sum + p.percentage, 0)
    setTotalPercentage(total)
  }

  // Actualizar estado activo
  const handleActiveChange = (index: number, value: boolean) => {
    const updatedPhotographers = [...photographers]
    updatedPhotographers[index].is_active = value
    setPhotographers(updatedPhotographers)

    // Actualizar el porcentaje total
    const total = updatedPhotographers.filter((p) => p.is_active).reduce((sum, p) => sum + p.percentage, 0)
    setTotalPercentage(total)
  }

  // Guardar cambios
  const handleSaveChanges = async () => {
    setIsSaving(true)
    setSuccessMessage(null)
    try {
      // Verificar que los porcentajes suman 100%
      const activePhotographers = photographers.filter((p) => p.is_active)
      const totalPercentage = activePhotographers.reduce((sum, p) => sum + p.percentage, 0)

      if (activePhotographers.length > 0 && totalPercentage !== 100) {
        toast({
          title: "Error",
          description:
            "Los porcentajes de fotógrafos activos deben sumar 100%. Actualmente suman " + totalPercentage + "%.",
          variant: "destructive",
        })
        return
      }

      // Actualizar cada fotógrafo
      for (const photographer of photographers) {
        // Eliminar campos que no están en la tabla
        const { email, full_name, avatar_url, ...updateData } = photographer

        const { error } = await supabase.from("fotos_asignadas").update(updateData).eq("id", photographer.id)

        if (error) throw error
      }

      setSuccessMessage("Los cambios en las asignaciones de fotógrafos se han guardado correctamente.")
      toast({
        title: "Cambios guardados",
        description: "Los cambios en las asignaciones de fotógrafos se han guardado correctamente.",
      })
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
      const selectedUser = availableUsers.find((user) => user.id === selectedUserId)

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

  // Distribuir porcentajes equitativamente entre fotógrafos activos
  const distributePercentages = () => {
    const activePhotographers = photographers.filter((p) => p.is_active)

    if (activePhotographers.length === 0) {
      toast({
        title: "Error",
        description: "No hay fotógrafos activos para distribuir porcentajes.",
        variant: "destructive",
      })
      return
    }

    const equalPercentage = Math.floor(100 / activePhotographers.length)
    let remainder = 100 - equalPercentage * activePhotographers.length

    const updatedPhotographers = [...photographers]

    updatedPhotographers.forEach((photographer) => {
      if (photographer.is_active) {
        photographer.percentage = equalPercentage
      } else {
        photographer.percentage = 0
      }
    })

    // Distribuir el resto entre los primeros fotógrafos activos
    if (remainder > 0) {
      const index = 0
      for (const photographer of updatedPhotographers) {
        if (photographer.is_active && remainder > 0) {
          photographer.percentage += 1
          remainder -= 1
        }
      }
    }

    setPhotographers(updatedPhotographers)
    setTotalPercentage(100)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="photographers" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="photographers">Fotógrafos</TabsTrigger>
          <TabsTrigger value="add-users">Añadir Usuarios</TabsTrigger>
          <TabsTrigger value="debug">Diagnóstico</TabsTrigger>
        </TabsList>

        <TabsContent value="photographers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Asignación de Fotógrafos</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Indicador de porcentaje total */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Porcentaje total asignado:</span>
                  <Badge variant={totalPercentage === 100 ? "default" : "destructive"} className="ml-2">
                    {totalPercentage}%
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={distributePercentages}
                  disabled={photographers.filter((p) => p.is_active).length === 0}
                >
                  Distribuir Equitativamente
                </Button>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                <div
                  className={`h-2.5 rounded-full ${totalPercentage === 100 ? "bg-green-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(100, totalPercentage)}%` }}
                ></div>
              </div>
              {totalPercentage !== 100 && photographers.filter((p) => p.is_active).length > 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  {totalPercentage < 100
                    ? `Faltan ${100 - totalPercentage}% por asignar`
                    : `Hay ${totalPercentage - 100}% asignados de más`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tabla de fotógrafos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Fotógrafos Asignados</CardTitle>
              <CardDescription>{photographers.length} fotógrafos encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Porcentaje</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {photographers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No hay fotógrafos asignados
                      </TableCell>
                    </TableRow>
                  ) : (
                    photographers.map((photographer, index) => (
                      <TableRow key={photographer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                              {photographer.avatar_url ? (
                                <img
                                  src={photographer.avatar_url || "/placeholder.svg"}
                                  alt={photographer.full_name || photographer.email || "Avatar"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-medium">
                                  {(
                                    photographer.full_name?.charAt(0) ||
                                    photographer.email?.charAt(0) ||
                                    "U"
                                  ).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold">{photographer.full_name || "Sin nombre"}</div>
                              <div className="text-sm text-muted-foreground">{photographer.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[photographer.percentage]}
                              min={0}
                              max={100}
                              step={5}
                              className="w-[200px]"
                              onValueChange={(value) => handlePercentageChange(index, value)}
                              disabled={!photographer.is_active}
                            />
                            <span className="font-medium w-12 text-right">{photographer.percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={photographer.is_active}
                            onCheckedChange={(value) => handleActiveChange(index, value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeletePhotographer(photographer.id, photographer.email || "")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-users" className="space-y-6">
          {/* Añadir nuevo fotógrafo desde la lista */}
          <Card>
            <CardHeader>
              <CardTitle>Añadir Fotógrafo desde Lista de Usuarios</CardTitle>
              <CardDescription>{availableUsers.length} usuarios disponibles encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              {availableUsers.length > 0 ? (
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
                      {availableUsers.map((user) => (
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
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
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
                  {availableUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableUsers.map((user) => (
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
