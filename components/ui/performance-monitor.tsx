"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity, 
  Clock, 
  Wifi, 
  WifiOff, 
  Database, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"

interface PerformanceMetrics {
  loadTime: number
  memoryUsage: number
  networkStatus: 'online' | 'offline'
  databaseStatus: 'connected' | 'disconnected' | 'checking'
  autoRefreshStatus: 'enabled' | 'disabled'
  activeIntervals: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    memoryUsage: 0,
    networkStatus: 'online',
    databaseStatus: 'checking',
    autoRefreshStatus: 'disabled',
    activeIntervals: 0
  })
  const [isVisible, setIsVisible] = useState(false)
  const [startTime] = useState(Date.now())

  // Monitorear tiempo de carga
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        loadTime: Date.now() - startTime
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  // Monitorear estado de red
  useEffect(() => {
    const handleOnline = () => setMetrics(prev => ({ ...prev, networkStatus: 'online' }))
    const handleOffline = () => setMetrics(prev => ({ ...prev, networkStatus: 'offline' }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Verificar estado de la base de datos
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const response = await fetch('/api/test-db-connection', { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 segundos timeout
        })
        
        if (response.ok) {
          setMetrics(prev => ({ ...prev, databaseStatus: 'connected' }))
        } else {
          setMetrics(prev => ({ ...prev, databaseStatus: 'disconnected' }))
        }
      } catch (error) {
        setMetrics(prev => ({ ...prev, databaseStatus: 'disconnected' }))
      }
    }

    checkDatabase()
    const interval = setInterval(checkDatabase, 30000) // Verificar cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  // Verificar estado del auto-refresh
  useEffect(() => {
    const checkAutoRefresh = () => {
      try {
        const stored = localStorage.getItem('auto-refresh-preferences')
        if (stored) {
          const preferences = JSON.parse(stored)
          setMetrics(prev => ({ 
            ...prev, 
            autoRefreshStatus: preferences.enabled ? 'enabled' : 'disabled' 
          }))
        }
      } catch (error) {
        console.error('Error checking auto-refresh status:', error)
      }
    }

    checkAutoRefresh()
    const interval = setInterval(checkAutoRefresh, 10000) // Verificar cada 10 segundos

    return () => clearInterval(interval)
  }, [])

  // Monitorear uso de memoria (si está disponible)
  useEffect(() => {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        }))
      }

      updateMemoryUsage()
      const interval = setInterval(updateMemoryUsage, 5000) // Actualizar cada 5 segundos

      return () => clearInterval(interval)
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
      case 'enabled':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disconnected':
      case 'offline':
      case 'disabled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'checking':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
      case 'enabled':
        return 'bg-green-100 text-green-800'
      case 'disconnected':
      case 'offline':
      case 'disabled':
        return 'bg-red-100 text-red-800'
      case 'checking':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="icon"
        className="h-6 w-6 rounded-full shadow-sm bg-background/80 backdrop-blur-sm border hover:bg-background/90 transition-all duration-200"
      >
        <Activity className="h-3 w-3" />
      </Button>
    )
  }

  return (
    <Card className="absolute bottom-full right-0 mb-2 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Monitoreo de Rendimiento
          </CardTitle>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span>Tiempo de carga:</span>
            <Badge variant="outline">{formatTime(metrics.loadTime)}</Badge>
          </div>
          {metrics.memoryUsage > 0 && (
            <div className="flex items-center justify-between">
              <span>Memoria:</span>
              <Badge variant="outline">{metrics.memoryUsage}MB</Badge>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {metrics.networkStatus === 'online' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span className="text-xs">Red</span>
            </div>
            <Badge className={getStatusColor(metrics.networkStatus)}>
              {getStatusIcon(metrics.networkStatus)}
              <span className="ml-1">{metrics.networkStatus}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3" />
              <span className="text-xs">Base de datos</span>
            </div>
            <Badge className={getStatusColor(metrics.databaseStatus)}>
              {getStatusIcon(metrics.databaseStatus)}
              <span className="ml-1">{metrics.databaseStatus}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              <span className="text-xs">Auto-refresh</span>
            </div>
            <Badge className={getStatusColor(metrics.autoRefreshStatus)}>
              {getStatusIcon(metrics.autoRefreshStatus)}
              <span className="ml-1">{metrics.autoRefreshStatus}</span>
            </Badge>
          </div>
        </div>

        {metrics.loadTime > 10000 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              La carga está tomando más de 10 segundos. Considera recargar la página.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 