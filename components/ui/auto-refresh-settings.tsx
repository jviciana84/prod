"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings, RefreshCw } from "lucide-react"
import { useAutoRefreshPreferences } from "@/hooks/use-auto-refresh-preferences"

const INTERVAL_OPTIONS = [
  { value: 10 * 1000, label: "10 segundos" },
  { value: 30 * 1000, label: "30 segundos" },
  { value: 60 * 1000, label: "1 minuto" },
  { value: 2 * 60 * 1000, label: "2 minutos" },
  { value: 5 * 60 * 1000, label: "5 minutos" },
  { value: 10 * 60 * 1000, label: "10 minutos" },
]

interface AutoRefreshSettingsProps {
  className?: string
}

export function AutoRefreshSettings({ className }: AutoRefreshSettingsProps) {
  const { preferences, isLoaded, setEnabled, setInterval } = useAutoRefreshPreferences()

  if (!isLoaded) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`h-9 w-9 ${className}`}
          title="Configurar actualización automática"
        >
          <RefreshCw className={`h-4 w-4 ${preferences.enabled ? "text-green-600" : "text-muted-foreground"}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Actualización automática</h4>
            <p className="text-xs text-muted-foreground">
              Configura cómo se actualizan automáticamente las tablas
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Activar auto-actualización</label>
              <p className="text-xs text-muted-foreground">
                Las tablas se actualizarán automáticamente
              </p>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {preferences.enabled && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo de actualización</label>
              <Select
                value={preferences.interval.toString()}
                onValueChange={(value) => setInterval(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Frecuencia con la que se actualizarán los datos
              </p>
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${preferences.enabled ? "bg-green-500" : "bg-gray-400"}`} />
              <span>
                {preferences.enabled 
                  ? `Actualización cada ${INTERVAL_OPTIONS.find(opt => opt.value === preferences.interval)?.label || "30 segundos"}`
                  : "Actualización manual solamente"
                }
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}