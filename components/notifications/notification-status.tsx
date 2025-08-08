"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff } from "lucide-react"
import { toast } from "sonner"

export default function NotificationStatus() {
  const handleToggle = async () => {
    toast.info("Push notifications anuladas - solo campana activa")
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-gray-400 text-white">
        <BellOff className="h-3 w-3 mr-1" />
        Push Anulado
      </Badge>

      <Button variant="ghost" size="sm" onClick={handleToggle}>
        <BellOff className="h-4 w-4" />
      </Button>
    </div>
  )
}
