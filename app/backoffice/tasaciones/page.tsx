'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Copy, Check, ExternalLink, Calendar, Car, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Mock data - Esto vendrá de Supabase cuando conectemos la BD
const mockAdvisorLink = {
  advisorName: 'Juan García',
  slug: 'juan-garcia-abc123',
  fullUrl: 'https://tudominio.com/tasacion/juan-garcia-abc123',
  shortUrl: 'https://bit.ly/tas-juan',
}

const mockTasaciones = [
  {
    id: '1',
    fecha: '2025-01-10',
    matricula: '1234ABC',
    marca: 'BMW',
    modelo: 'Serie 3',
    cliente: 'Cliente desde enlace',
    status: 'pendiente' as const,
  },
  {
    id: '2',
    fecha: '2025-01-09',
    matricula: '5678DEF',
    marca: 'Mercedes-Benz',
    modelo: 'Clase C',
    cliente: 'Cliente desde enlace',
    status: 'revisada' as const,
  },
]

export default function TasacionesBackofficePage() {
  const [copied, setCopied] = useState(false)
  const [filtro, setFiltro] = useState('')

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mockAdvisorLink.fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyShortLink = () => {
    navigator.clipboard.writeText(mockAdvisorLink.shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tasacionesFiltradas = mockTasaciones.filter(t => 
    t.matricula.toLowerCase().includes(filtro.toLowerCase()) ||
    t.marca.toLowerCase().includes(filtro.toLowerCase()) ||
    t.modelo.toLowerCase().includes(filtro.toLowerCase())
  )

  const statusColors = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    revisada: 'bg-blue-100 text-blue-800 border-blue-300',
    valorada: 'bg-green-100 text-green-800 border-green-300',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full mb-3 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-wider">Portal de Tasaciones</h1>
          <p className="text-sm text-gray-600">BackOffice - Gestión de tasaciones</p>
        </div>

        {/* Tu enlace personal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border-2 border-purple-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Tu enlace de tasaciones</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Comparte este enlace con tus clientes para que puedan realizar una tasación detallada de su vehículo
          </p>

          {/* Enlace completo */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Enlace completo</label>
            <div className="flex gap-2">
              <Input
                value={mockAdvisorLink.fullUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Enlace corto */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Enlace corto (para compartir)</label>
            <div className="flex gap-2">
              <Input
                value={mockAdvisorLink.shortUrl}
                readOnly
                className="font-mono text-sm bg-gradient-to-r from-blue-50 to-purple-50"
              />
              <Button
                onClick={handleCopyShortLink}
                className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Lista de tasaciones */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Tasaciones recibidas</h3>
            <Badge variant="secondary" className="text-sm">
              {mockTasaciones.length} tasaciones
            </Badge>
          </div>

          {/* Filtro */}
          <div className="mb-4">
            <Input
              placeholder="Buscar por matrícula, marca o modelo..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Tabla de tasaciones */}
          <div className="space-y-3">
            {tasacionesFiltradas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Car className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-semibold">No hay tasaciones aún</p>
                <p className="text-sm">Comparte tu enlace con clientes para empezar a recibir tasaciones</p>
              </div>
            ) : (
              tasacionesFiltradas.map((tasacion) => (
                <motion.div
                  key={tasacion.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-gray-50 to-purple-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-gray-900 font-mono">
                          {tasacion.matricula}
                        </span>
                        <Badge className={statusColors[tasacion.status]}>
                          {tasacion.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 font-semibold">
                        {tasacion.marca} {tasacion.modelo}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(tasacion.fecha).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-300 hover:bg-green-50 hover:border-green-500"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-300 hover:bg-purple-50 hover:border-purple-500"
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Información adicional */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-sm text-gray-600"
        >
          <p>Las tasaciones se actualizan en tiempo real cuando los clientes completan el formulario</p>
        </motion.div>
      </motion.div>
    </div>
  )
}


