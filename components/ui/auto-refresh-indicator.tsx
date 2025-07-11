"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCw, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutoRefreshIndicatorProps {
  isActive: boolean
  interval: number // en milisegundos
  onToggle: () => void
  lastRefresh?: Date
  className?: string
}

export function AutoRefreshIndicator({
  isActive,
  interval,
  onToggle,
  lastRefresh,
  className
}: AutoRefreshIndicatorProps) {
  const [timeUntilNext, setTimeUntilNext] = useState(interval)

  // Actualizar el contador cada segundo
  useEffect(() => {
    if (!isActive) {
      setTimeUntilNext(interval)
      return
    }

    const timer = setInterval(() => {
      if (lastRefresh) {
        const elapsed = Date.now() - lastRefresh.getTime()
        const remaining = Math.max(0, interval - elapsed)
        setTimeUntilNext(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, interval, lastRefresh])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getIntervalText = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      return `${hours}h`
    }
    return `${minutes}m`
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 px-2"
            >
              {isActive ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isActive ? 'Pausar' : 'Activar'} auto refresh</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1">
          <RefreshCw className={cn(
            "h-3 w-3",
            isActive ? "animate-spin" : "text-muted-foreground"
          )} />
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs min-w-[3.5rem] text-center font-mono flex items-center justify-center">
            {isActive ? formatTime(timeUntilNext) : getIntervalText(interval)}
          </Badge>
        </div>
      </div>
    </TooltipProvider>
  )
} 