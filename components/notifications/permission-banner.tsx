"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, X } from "lucide-react"
import { toast } from "sonner"

export default function PermissionBanner() {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) {
    return null
  }

  const handleAllow = async () => {
    toast.info("Push notifications anuladas - solo campana activa")
    setIsDismissed(true)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="border-gray-200 bg-gray-50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg text-gray-900">Push Anulado</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-6 w-6 p-0 text-gray-500">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-gray-700">
            Las notificaciones push están anuladas. Solo la campana está activa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleAllow} className="flex-1">
              Entendido
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
