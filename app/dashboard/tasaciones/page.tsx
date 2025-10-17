"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Copy, Check, ExternalLink, Calendar, Car, Download, Eye, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { createClientComponentClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Tasacion {
  id: string
  fecha: string
  matricula: string
  marca: string
  modelo: string
  cliente: string
  status: 'pendiente' | 'revisada' | 'valorada'
  advisor_slug: string
  created_at: string
}

interface AdvisorLink {
  advisor_name: string
  slug: string
  full_url: string
  short_url?: string
  created_at: string
}

export default function TasacionesBackofficePage() {
  const [copied, setCopied] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [tasaciones, setTasaciones] = useState<Tasacion[]>([])
  const [advisorLink, setAdvisorLink] = useState<AdvisorLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadData()
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar enlace del asesor (mock por ahora)
      setAdvisorLink({
        advisor_name: currentUser?.user_metadata?.full_name || 'Asesor',
        slug: 'test-advisor',
        full_url: `${window.location.origin}/tasacion/test-advisor`,
        short_url: 'https://bit.ly/tas-test',
        created_at: new Date().toISOString()
      })

      // Cargar tasaciones (mock por ahora)
      const mockTasaciones: Tasacion[] = [
        {
          id: '1',
          fecha: '2025-01-10',
          matricula: '1234ABC',
          marca: 'BMW',
          modelo: 'Serie 3',
          cliente: 'Cliente desde enlace',
          status: 'pendiente',
          advisor_slug: 'test-advisor',
          created_at: '2025-01-10T10:00:00Z'
        },
        {
          id: '2',
          fecha: '2025-01-09',
          matricula: '5678DEF',
          marca: 'Mercedes-Benz',
          modelo: 'Clase C',
          cliente: 'Cliente desde enlace',
          status: 'revisada',
          advisor_slug: 'test-advisor',
          created_at: '2025-01-09T15:30:00Z'
        },
      ]
      
      setTasaciones(mockTasaciones)
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Enlace copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPDF = async (tasacionId: string) => {
    try {
      // Aquí implementarías la descarga del PDF
      toast.info('Descargando PDF...')
      console.log('Descargando PDF para tasación:', tasacionId)
    } catch (error) {
      toast.error('Error al descargar el PDF')
    }
  }

  const handleViewDetails = (tasacionId: string) => {
    // Aquí implementarías la vista de detalles
    toast.info('Abriendo detalles de la tasación...')
    console.log('Ver detalles de tasación:', tasacionId)
  }

  const tasacionesFiltradas = tasaciones.filter(t => 
    t.matricula.toLowerCase().includes(filtro.toLowerCase()) ||
    t.marca.toLowerCase().includes(filtro.toLowerCase()) ||
    t.modelo.toLowerCase().includes(filtro.toLowerCase()) ||
    t.cliente.toLowerCase().includes(filtro.toLowerCase())
  )

  const statusColors = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    revisada: 'bg-blue-100 text-blue-800 border-blue-300',
    valorada: 'bg-green-100 text-green-800 border-green-300',
  }

  const statusLabels = {
    pendiente: 'Pendiente',
    revisada: 'Revisada',
    valorada: 'Valorada',
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tasaciones', href: '/dashboard/tasaciones' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Portal de Tasaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de tasaciones de vehículos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {tasaciones.length} tasaciones
          </Badge>
        </div>
      </div>

      {/* Tu enlace personal */}
      {advisorLink && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Tu enlace de tasaciones
            </CardTitle>
            <CardDescription>
              Comparte este enlace con tus clientes para que puedan realizar una tasación detallada de su vehículo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enlace completo */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Enlace completo
              </label>
              <div className="flex gap-2">
                <Input
                  value={advisorLink.full_url}
                  readOnly
                  className="font-mono text-sm bg-gray-50 dark:bg-gray-800"
                />
                <Button
                  onClick={() => handleCopyLink(advisorLink.full_url)}
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Enlace corto */}
            {advisorLink.short_url && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Enlace corto (para compartir)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={advisorLink.short_url}
                    readOnly
                    className="font-mono text-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
                  />
                  <Button
                    onClick={() => handleCopyLink(advisorLink.short_url!)}
                    className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de tasaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Tasaciones recibidas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por matrícula, marca, modelo..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasacionesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Car className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No hay tasaciones aún</p>
              <p className="text-sm">Comparte tu enlace con clientes para empezar a recibir tasaciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasacionesFiltradas.map((tasacion) => (
                <motion.div
                  key={tasacion.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                          {tasacion.matricula}
                        </span>
                        <Badge className={statusColors[tasacion.status]}>
                          {statusLabels[tasacion.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                        {tasacion.marca} {tasacion.modelo}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(tasacion.fecha).toLocaleDateString('es-ES')}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {tasacion.cliente}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownloadPDF(tasacion.id)}
                        variant="outline"
                        size="sm"
                        className="border-green-300 hover:bg-green-50 hover:border-green-500 dark:border-green-700 dark:hover:bg-green-900/20"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleViewDetails(tasacion.id)}
                        variant="outline"
                        size="sm"
                        className="border-purple-300 hover:bg-purple-50 hover:border-purple-500 dark:border-purple-700 dark:hover:bg-purple-900/20"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Las tasaciones se actualizan en tiempo real cuando los clientes completan el formulario</p>
      </div>
    </div>
  )
}
