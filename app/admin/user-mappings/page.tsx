"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Trash2, Plus, RefreshCw, Users, AlertTriangle, UserCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface UserMapping {
  id: string
  user_id: string
  profile_name: string
  asesor_alias: string
  email: string
  active: boolean
  created_at: string
}

interface UnmappedAsesor {
  asesor: string
  entregas_count: number
}

interface AvailableUser {
  user_id: string
  full_name: string
  role: string
  email: string
}

export default function UserMappingsPage() {
  const [mappings, setMappings] = useState<UserMapping[]>([])
  const [unmappedAsesores, setUnmappedAsesores] = useState<UnmappedAsesor[]>([])
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [allAsesores, setAllAsesores] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedAsesor, setSelectedAsesor] = useState("")
  const [customAsesor, setCustomAsesor] = useState("")
  const [useCustomAsesor, setUseCustomAsesor] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/user-mappings")
      const data = await response.json()

      if (response.ok) {
        setMappings(data.mappings)
        setUnmappedAsesores(data.unmappedAsesores)
        setAvailableUsers(data.availableUsers)
        setAllAsesores(data.allAsesores || [])
      } else {
        toast.error("Error al cargar datos: " + data.error)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const createMapping = async () => {
    const asesorToUse = useCustomAsesor ? customAsesor : selectedAsesor

    if (!selectedUserId || !asesorToUse) {
      toast.error("Selecciona un usuario y un asesor")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/admin/user-mappings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          asesorAlias: asesorToUse,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Mapeo creado exitosamente")
        setIsDialogOpen(false)
        setSelectedUserId("")
        setSelectedAsesor("")
        setCustomAsesor("")
        setUseCustomAsesor(false)
        loadData()
      } else {
        toast.error("Error al crear mapeo: " + result.error)
      }
    } catch (error) {
      console.error("Error creating mapping:", error)
      toast.error("Error al crear el mapeo")
    } finally {
      setIsCreating(false)
    }
  }

  const deleteMapping = async (mappingId: string) => {
    try {
      const response = await fetch(`/api/admin/user-mappings?id=${mappingId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Mapeo eliminado exitosamente")
        loadData()
      } else {
        const result = await response.json()
        toast.error("Error al eliminar mapeo: " + result.error)
      }
    } catch (error) {
      console.error("Error deleting mapping:", error)
      toast.error("Error al eliminar el mapeo")
    }
  }

  // Filtrar usuarios que ya tienen mapeo
  const unmappedUsers = availableUsers.filter((user) => !mappings.some((mapping) => mapping.user_id === user.user_id))

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Mapeos de Usuario</h1>
          <p className="text-muted-foreground">Relaciona usuarios del sistema con sus aliases en todas las tablas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Mapeo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Mapeo</DialogTitle>
                <DialogDescription>Relaciona un usuario con su alias en el sistema</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user">Usuario</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {unmappedUsers.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Asesor</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="existing"
                      checked={!useCustomAsesor}
                      onChange={() => setUseCustomAsesor(false)}
                    />
                    <Label htmlFor="existing">Asesor existente</Label>
                    <input
                      type="radio"
                      id="custom"
                      checked={useCustomAsesor}
                      onChange={() => setUseCustomAsesor(true)}
                    />
                    <Label htmlFor="custom">Nuevo asesor</Label>
                  </div>
                </div>

                {!useCustomAsesor ? (
                  <div>
                    <Label htmlFor="asesor">Asesor Existente</Label>
                    <Select value={selectedAsesor} onValueChange={setSelectedAsesor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un asesor" />
                      </SelectTrigger>
                      <SelectContent>
                        {allAsesores.map((asesor) => {
                          const entregasCount = unmappedAsesores.find((u) => u.asesor === asesor)?.entregas_count || 0
                          return (
                            <SelectItem key={asesor} value={asesor}>
                              {asesor} {entregasCount > 0 && `(${entregasCount} entregas)`}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="customAsesor">Nuevo Alias de Asesor</Label>
                    <Input
                      id="customAsesor"
                      value={customAsesor}
                      onChange={(e) => setCustomAsesor(e.target.value)}
                      placeholder="Ej: NuevoAsesor"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={createMapping}
                  disabled={isCreating || !selectedUserId || (!selectedAsesor && !customAsesor)}
                >
                  {isCreating ? "Creando..." : "Crear Mapeo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Mapeados</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mappings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Sin Mapear</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unmappedUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asesores</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allAsesores.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asesores Sin Mapear</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unmappedAsesores.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mapeos Existentes */}
        <Card>
          <CardHeader>
            <CardTitle>Mapeos Activos ({mappings.length})</CardTitle>
            <CardDescription>Usuarios que ya tienen mapeo configurado</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{mapping.profile_name}</div>
                        <div className="text-sm text-muted-foreground">{mapping.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{mapping.asesor_alias}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMapping(mapping.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Usuarios Sin Mapear */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Sin Mapear ({unmappedUsers.length})</CardTitle>
            <CardDescription>Usuarios registrados que no tienen asesor asignado</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmappedUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role || "Sin rol"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
