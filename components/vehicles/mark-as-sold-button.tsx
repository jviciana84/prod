"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { useToast } from "@/hooks/use-toast"
import { markVehicleAsSold } from "@/server-actions/mark-vehicle-sold"

interface MarkAsSoldButtonProps {
  vehicleId: string
  licensePlate: string
  model: string
  onSuccess?: () => void
}

export function MarkAsSoldButton({ 
  vehicleId, 
  licensePlate, 
  model, 
  onSuccess 
}: MarkAsSoldButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const handleMarkAsSold = async () => {
    setIsLoading(true)

    try {
      const result = await markVehicleAsSold(vehicleId, licensePlate, model)

      if (result.success) {
        toast({
          title: "✅ Vehículo marcado como vendido",
          description: result.message,
        })
        
        setIsOpen(false)
        onSuccess?.()
      } else {
        toast({
          title: "❌ Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "❌ Error",
        description: "Error inesperado al marcar como vendido",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-orange-600 border-orange-200 hover:bg-orange-50"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Marcar como Vendido
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Marcar como vendido?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres marcar el vehículo <strong>{licensePlate}</strong> ({model}) como vendido?
            <br /><br />
            <strong>Esto activará automáticamente:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Crear registro en entregas</li>
              <li>Eliminar del stock</li>
              <li>Buscar fecha de venta/entrega apropiada</li>
            </ul>
            <br />
            Esta acción es <strong>irreversible</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleMarkAsSold}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Procesando...
              </>
            ) : (
              "Marcar como Vendido"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
