"use client"

import React from "react"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { toast } from "sonner"
import { syncEntregas } from "@/server-actions/sync-entregas" // Import the server action

interface SyncButtonProps {
  onSyncComplete?: () => void
}

export function SyncEntregasButton({ onSyncComplete }: SyncButtonProps) {
  // useActionState para manejar el estado de la acción del servidor
  const [state, formAction, isPending] = useActionState(syncEntregas, null)

  // Efecto para mostrar notificaciones basadas en el resultado de la acción
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      if (onSyncComplete) {
        onSyncComplete() // Llama al callback para refrescar la tabla principal
      }
    } else if (state?.message) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => formAction(new FormData())} // Llama a la acción del servidor
      disabled={isPending}
      className="h-9 w-9"
      title="Sincronizar Entregas"
    >
      {isPending ? <BMWMSpinner size={16} /> : <Trophy className="h-4 w-4" />}
    </Button>
  )
}
