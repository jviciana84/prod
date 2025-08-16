"use client"

import React, { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { syncEntregas } from "@/server-actions/sync-entregas"

interface SyncButtonProps {
  onSyncComplete?: () => void
}

export function SyncEntregasButton({ onSyncComplete }: SyncButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleSync = () => {
    startTransition(async () => {
      try {
        const result = await syncEntregas(new FormData())
        if (result?.success) {
          toast.success(result.message)
          if (onSyncComplete) {
            onSyncComplete()
          }
        } else if (result?.message) {
          toast.error(result.message)
        }
      } catch (error) {
        toast.error("Error al sincronizar entregas")
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleSync}
      disabled={isPending}
      className="h-9 w-9"
      title="Sincronizar Entregas"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
    </Button>
  )
}
