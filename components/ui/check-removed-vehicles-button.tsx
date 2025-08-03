"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Car } from 'lucide-react'
import { RemovedVehiclesModal } from './removed-vehicles-modal'
import { useToast } from '@/hooks/use-toast'

interface CheckRemovedVehiclesButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function CheckRemovedVehiclesButton({ 
  className,
  variant = 'outline',
  size = 'sm'
}: CheckRemovedVehiclesButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const handleVehicleMarkedAsProfessional = (vehicleId: string) => {
    // Aquí podrías hacer algo adicional cuando se marca como venta profesional
    console.log('Vehículo marcado como venta profesional:', vehicleId)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center justify-center ${className || ''}`}
        title="Ver vehículos ausentes"
      >
        <AlertTriangle className="h-4 w-4" />
      </Button>

      <RemovedVehiclesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVehicleMarkedAsProfessional={handleVehicleMarkedAsProfessional}
      />
    </>
  )
} 