"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Car, Calendar, Tag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface RemovedVehicle {
  id: string
  license_plate: string
  model: string
  vehicle_type: string
  source: 'stock' | 'nuevas_entradas'
  table_id: string
  reception_date?: string
  entry_date?: string
  created_at: string
}

interface RemovedVehiclesModalProps {
  isOpen: boolean
  onClose: () => void
  onVehicleMarkedAsProfessional?: (vehicleId: string) => void
}

export function RemovedVehiclesModal({ 
  isOpen, 
  onClose, 
  onVehicleMarkedAsProfessional 
}: RemovedVehiclesModalProps) {
  const [vehicles, setVehicles] = useState<RemovedVehicle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadRemovedVehicles()
    }
  }, [isOpen])

  const loadRemovedVehicles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/compare-csv-with-db')
      const data = await response.json()

      if (data.success) {
        setVehicles(data.removedVehicles || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cargar los datos",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error cargando vehículos ausentes:', error)
      toast({
        title: "Error",
        description: "Error al cargar los vehículos ausentes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsProfessional = async (vehicle: RemovedVehicle) => {
    setIsProcessing(vehicle.id)
    try {
      const response = await fetch('/api/mark-as-professional-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          source: vehicle.source,
          tableId: vehicle.table_id
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Éxito",
          description: `${vehicle.license_plate} marcado como venta profesional`,
        })

        // Remover el vehículo de la lista
        setVehicles(prev => prev.filter(v => v.id !== vehicle.id))
        
        // Notificar al componente padre
        onVehicleMarkedAsProfessional?.(vehicle.id)
      } else {
        throw new Error(data.error || 'Error desconocido')
      }
    } catch (error) {
      console.error('Error marcando como venta profesional:', error)
      toast({
        title: "Error",
        description: "Error al marcar como venta profesional",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Vehículos Ausentes del CSV
          </DialogTitle>
          <DialogDescription>
            Estos vehículos aparecen en la base de datos pero no están en el último CSV procesado.
            Puedes marcarlos como "Venta profesional" para mantenerlos en el sistema.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando vehículos ausentes...</span>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron vehículos ausentes</p>
            <p className="text-sm">Todos los vehículos en la base de datos están presentes en el CSV actual</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-sm">
                {vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''} ausente{vehicles.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRemovedVehicles}
                disabled={isLoading}
              >
                Actualizar
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-mono font-medium">
                      {vehicle.license_plate}
                    </TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={vehicle.source === 'stock' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {vehicle.source === 'stock' ? 'Stock' : 'Nuevas Entradas'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(vehicle.reception_date || vehicle.entry_date || vehicle.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsProfessional(vehicle)}
                        disabled={isProcessing === vehicle.id}
                        className="flex items-center gap-1"
                      >
                        {isProcessing === vehicle.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Tag className="h-3 w-3" />
                        )}
                        Venta Profesional
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 