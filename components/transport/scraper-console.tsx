"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Maximize2, Minimize2, Terminal } from "lucide-react"

interface ScraperConsoleProps {
  isOpen: boolean
  onClose: () => void
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export default function ScraperConsole({ isOpen, onClose }: ScraperConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [dotIndex, setDotIndex] = useState(0)

  // Función para obtener logs de la API
  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/scraper-logs-public?limit=100')
      if (response.ok) {
        const data = await response.json()
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs.reverse()) // Invertir para mostrar cronológicamente
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  // Polling de logs cada 2 segundos cuando la consola está abierta
  useEffect(() => {
    if (!isOpen) return

    // Cargar logs iniciales
    fetchLogs()

    // Configurar polling
    const interval = setInterval(() => {
      fetchLogs()
    }, 2000)

    return () => clearInterval(interval)
  }, [isOpen])

  // Scroll automático solo al abrir la consola
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [isOpen]) // Solo scroll cuando se abre, no cuando se actualizan logs

  // Animación de puntos de carga
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % 4) // 0, 1, 2, 3 (3 = todos blancos)
    }, 800) // Cambiar cada 800ms para que se vea mejor

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-400'
      case 'warning':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-gray-300'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return '✓'
      case 'warning':
        return '⚠'
      case 'error':
        return '✗'
      default:
        return '>'
    }
  }

  // Función para obtener el color de cada punto según la animación
  const getDotColor = (dotPosition: number) => {
    // Secuencia de colores: #81C4FF, #16588E, #E7222E
    const colors = ['#81C4FF', '#16588E', '#E7222E']
    
    if (dotIndex === 3) {
      return '#FFFFFF' // Todos blancos
    }
    
    // Mostrar puntos hasta el índice actual
    if (dotPosition <= dotIndex) {
      return colors[dotPosition]
    }
    
    return '#FFFFFF' // Blanco por defecto
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 pointer-events-none">
      <Card className={`bg-black border-green-500/30 pointer-events-auto flex flex-col ${isExpanded ? 'w-full h-full max-w-6xl max-h-[90vh]' : 'w-full max-w-2xl h-[300px]'}`}>
        <CardHeader className="bg-green-900/20 border-b border-green-500/30 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-400 font-mono">
              <Terminal className="h-5 w-5" />
              DUC Scraper Console
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 text-green-400 hover:bg-green-500/20"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-green-400 hover:bg-green-500/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div ref={scrollRef} className="h-full overflow-y-auto p-2 font-mono text-sm pr-1 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-transparent">
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 break-words">
                  <span className="text-green-500 text-xs min-w-[80px] flex-shrink-0">
                    {new Date(log.timestamp).toLocaleString('es-ES', {
                      timeZone: 'Europe/Madrid',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })} UTC
                  </span>
                  <span className={`${getLevelColor(log.level)} min-w-[20px] flex-shrink-0`}>
                    {getLevelIcon(log.level)}
                  </span>
                  <span className="text-gray-300 flex-1 text-xs leading-relaxed">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-green-500/30">
              <div className="flex items-center gap-1 text-green-400">
                <span className="text-green-500">>_</span>
                <span className="text-gray-400 text-xs">Scraper activo - Esperando próximos logs</span>
                <div className="flex items-center gap-1 ml-1">
                  <span 
                    className="transition-colors duration-300"
                    style={{ color: getDotColor(0) }}
                  >
                    .
                  </span>
                  <span 
                    className="transition-colors duration-300"
                    style={{ color: getDotColor(1) }}
                  >
                    .
                  </span>
                  <span 
                    className="transition-colors duration-300"
                    style={{ color: getDotColor(2) }}
                  >
                    .
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 