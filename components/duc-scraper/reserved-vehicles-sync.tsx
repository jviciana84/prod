"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Car } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReservedVehicle {
  "Matrícula": string
  "Modelo": string
  "Marca": string
  "Precio": string
  "Concesionario": string
  "Disponibilidad": string
  last_seen_date: string
}

interface SyncStatistics {
  reserved_in_csv: number
  sold_vehicles: number
  pending_sync: number
  sync_percentage: number
}

export default function ReservedVehiclesSync() {
  const [statistics, setStatistics] = useState<SyncStatistics | null>(null)
  const [reservedVehicles, setReservedVehicles] = useState<ReservedVehicle[]>([])
  const [pendingSync, setPendingSync] = useState<ReservedVehicle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const { toast } = useToast()

  const loadData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sync-reserved-vehicles')
      const data = await response.json()

      if (data.success) {
        setStatistics(data.statistics)
        setReservedVehicles(data.reserved_vehicles || [])
        setPendingSync(data.pending_sync || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cargar datos",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast({
        title: "Error",
        description: "Error al cargar los datos de vehículos reservados",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const syncReservedVehicles = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/sync-reserved-vehicles', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sincronización completada",
          description: `Se procesaron ${data.processed_count} vehículos reservados`,
        })
        
        // Recargar datos
        await loadData()
      } else {
        toast({
          title: "Error en sincronización",
          description: data.error || "Error al sincronizar vehículos",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error en sincronización:', error)
      toast({
        title: "Error",
        description: "Error al sincronizar vehículos reservados",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: string) => {
    if (!price) return "N/A"
    const numericPrice = price.replace(/[^\d,.-]/g, "").replace(",", ".")
    if (isNaN(Number(numericPrice))) return price
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(numericPrice))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Sincronización de Vehículos Reservados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando datos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Sincronización de Vehículos Reservados
              </CardTitle>
              <CardDescription>
                Vehículos que aparecen como "Reservado" en el CSV se consideran vendidos
              </CardDescription>
            </div>
            <Button 
              onClick={syncReservedVehicles} 
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  {statistics.reserved_in_csv}
                </Badge>
                <span className="text-sm">Reservados en CSV</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">
                  {statistics.sold_vehicles}
                </Badge>
                <span className="text-sm">Vehículos Vendidos</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-50">
                  {statistics.pending_sync}
                </Badge>
                <span className="text-sm">Pendientes de Sincronizar</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-50">
                  {statistics.sync_percentage}%
                </Badge>
                <span className="text-sm">Sincronizados</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehículos pendientes de sincronización */}
      {pendingSync.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Vehículos Pendientes de Sincronización
            </CardTitle>
            <CardDescription>
              Estos vehículos aparecen como "Reservado" en el CSV pero no están en el sistema de ventas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Concesionario</TableHead>
                  <TableHead>Última Vista</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSync.map((vehicle, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{vehicle["Matrícula"]}</TableCell>
                    <TableCell>{vehicle["Modelo"]}</TableCell>
                    <TableCell>{vehicle["Marca"]}</TableCell>
                    <TableCell>{formatPrice(vehicle["Precio"])}</TableCell>
                    <TableCell>{vehicle["Concesionario"]}</TableCell>
                    <TableCell>{formatDate(vehicle.last_seen_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Todos los vehículos reservados */}
      {reservedVehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Todos los Vehículos Reservados
            </CardTitle>
            <CardDescription>
              Lista completa de vehículos que aparecen como "Reservado" en el CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Concesionario</TableHead>
                  <TableHead>Última Vista</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservedVehicles.map((vehicle, index) => {
                  const isPending = pendingSync.some(p => p["Matrícula"] === vehicle["Matrícula"])
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{vehicle["Matrícula"]}</TableCell>
                      <TableCell>{vehicle["Modelo"]}</TableCell>
                      <TableCell>{vehicle["Marca"]}</TableCell>
                      <TableCell>{formatPrice(vehicle["Precio"])}</TableCell>
                      <TableCell>{vehicle["Concesionario"]}</TableCell>
                      <TableCell>{formatDate(vehicle.last_seen_date)}</TableCell>
                      <TableCell>
                        {isPending ? (
                          <Badge variant="outline" className="bg-amber-50">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendiente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sincronizado
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay vehículos reservados */}
      {reservedVehicles.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay vehículos reservados en el CSV</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 