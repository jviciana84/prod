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
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '2024-01-15 14:30:25',
      level: 'info',
      message: 'Iniciando scraper DUC...'
    },
    {
      id: '2',
      timestamp: '2024-01-15 14:30:26',
      level: 'info',
      message: 'Conectando a la base de datos...'
    },
    {
      id: '3',
      timestamp: '2024-01-15 14:30:27',
      level: 'success',
      message: 'Conexión exitosa a la base de datos'
    },
    {
      id: '4',
      timestamp: '2024-01-15 14:30:28',
      level: 'info',
      message: 'Descargando archivo CSV desde DUC...'
    },
    {
      id: '5',
      timestamp: '2024-01-15 14:30:35',
      level: 'success',
      message: 'Archivo CSV descargado correctamente (2.3 MB)'
    },
    {
      id: '6',
      timestamp: '2024-01-15 14:30:36',
      level: 'info',
      message: 'Procesando datos del CSV...'
    },
    {
      id: '7',
      timestamp: '2024-01-15 14:30:40',
      level: 'success',
      message: 'Datos procesados: 1,247 registros encontrados'
    },
    {
      id: '8',
      timestamp: '2024-01-15 14:30:41',
      level: 'info',
      message: 'Aplicando filtros configurados...'
    },
    {
      id: '9',
      timestamp: '2024-01-15 14:30:42',
      level: 'success',
      message: 'Filtros aplicados: 892 registros válidos'
    },
    {
      id: '10',
      timestamp: '2024-01-15 14:30:43',
      level: 'info',
      message: 'Verificando duplicados...'
    },
    {
      id: '11',
      timestamp: '2024-01-15 14:30:45',
      level: 'warning',
      message: 'Duplicados encontrados: 15 matrículas'
    },
    {
      id: '12',
      timestamp: '2024-01-15 14:30:46',
      level: 'info',
      message: 'Insertando nuevos registros...'
    },
    {
      id: '13',
      timestamp: '2024-01-15 14:30:50',
      level: 'success',
      message: 'Nuevos registros insertados: 45 vehículos'
    },
    {
      id: '14',
      timestamp: '2024-01-15 14:30:51',
      level: 'info',
      message: 'Actualizando registros existentes...'
    },
    {
      id: '15',
      timestamp: '2024-01-15 14:30:53',
      level: 'success',
      message: 'Registros actualizados: 12 vehículos'
    },
    {
      id: '16',
      timestamp: '2024-01-15 14:30:54',
      level: 'success',
      message: 'Scraping completado exitosamente'
    },
    {
      id: '17',
      timestamp: '2024-01-15 14:30:55',
      level: 'info',
      message: 'Resumen: 45 nuevos, 12 actualizados, 15 duplicados, 820 sin cambios'
    }
  ])

  // Scroll automático al abrir la consola
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
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
                    {log.timestamp}
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
                <span className="text-gray-400 text-xs">Scraper activo - Esperando próximos logs...</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 