"use client"

import { useState, useEffect } from "react"
import type { UserWithRoles } from "@/lib/auth/types"
import { UserCard } from "./user-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DirectoryPage() {
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithRoles[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Obtener todos los usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users")
        if (!response.ok) throw new Error("Error al cargar usuarios")
        const data = await response.json()
        setUsers(data)
        setFilteredUsers(data)
        setIsLoading(false)
      } catch (error) {
        console.error("Error:", error)
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Filtrar usuarios por búsqueda y rol
  useEffect(() => {
    let result = users

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.position?.toLowerCase().includes(term),
      )
    }

    // Filtrar por rol seleccionado
    if (selectedRole) {
      result = result.filter((user) =>
        user.roles.some((role) => role.name.toLowerCase() === selectedRole.toLowerCase()),
      )
    }

    setFilteredUsers(result)
  }, [searchTerm, selectedRole, users])

  // Extraer todos los roles únicos
  const uniqueRoles = Array.from(new Set(users.flatMap((user) => user.roles.map((role) => role.name)))).sort()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Directorio de Usuarios</h1>
          <p className="text-muted-foreground">Consulta información sobre todos los usuarios de la plataforma</p>
        </div>

        <div className="w-full md:w-auto flex items-center space-x-2">
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuarios..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="todos" onClick={() => setSelectedRole(null)} className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Todos</span>
            <Badge variant="secondary" className="ml-1">
              {users.length}
            </Badge>
          </TabsTrigger>

          {uniqueRoles.map((role) => (
            <TabsTrigger
              key={role}
              value={role.toLowerCase()}
              onClick={() => setSelectedRole(role)}
              className="flex items-center gap-1"
            >
              <span>{role}</span>
              <Badge variant="secondary" className="ml-1">
                {users.filter((user) => user.roles.some((r) => r.name === role)).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="todos" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6)
                .fill(0)
                .map((_, i) => <div key={i} className="h-[220px] rounded-lg bg-muted animate-pulse"></div>)
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => <UserCard key={user.id} user={user} />)
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No se encontraron usuarios con los criterios de búsqueda.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {uniqueRoles.map((role) => (
          <TabsContent key={role} value={role.toLowerCase()} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers
                .filter((user) => user.roles.some((r) => r.name === role))
                .map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
