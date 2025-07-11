"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings } from 'lucide-react'

interface AutoRefreshSettingsProps {
  currentInterval: number
  onIntervalChange: (interval: number) => void
  className?: string
}

const INTERVAL_OPTIONS = [
  { value: 5 * 60 * 1000, label: '5 minutos' },
  { value: 10 * 60 * 1000, label: '10 minutos' },
  { value: 15 * 60 * 1000, label: '15 minutos' },
  { value: 30 * 60 * 1000, label: '30 minutos' },
  { value: 60 * 60 * 1000, label: '1 hora' },
]

export function AutoRefreshSettings({
  currentInterval,
  onIntervalChange,
  className
}: AutoRefreshSettingsProps) {
  const [open, setOpen] = useState(false)

  const handleIntervalChange = (value: string) => {
    const interval = parseInt(value)
    onIntervalChange(interval)
    setOpen(false)
  }

  const getCurrentIntervalLabel = () => {
    const option = INTERVAL_OPTIONS.find(opt => opt.value === currentInterval)
    return option?.label || 'Personalizado'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Auto Refresh</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo de actualización</Label>
            <Select value={currentInterval.toString()} onValueChange={handleIntervalChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar intervalo" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Los datos se actualizarán automáticamente cada {getCurrentIntervalLabel().toLowerCase()}.</p>
            <p className="mt-1">Intervalos más cortos pueden afectar el rendimiento.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 