'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ObservacionesStepProps {
  onComplete: (data: { observaciones?: string }) => void
  onBack: () => void
}

export default function ObservacionesStep({ onComplete, onBack }: ObservacionesStepProps) {
  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  
  const [observaciones, setObservaciones] = useState('')

  const handleContinue = () => {
    onComplete({ observaciones: observaciones.trim() || undefined })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4 shadow-lg"
          >
            <MessageSquare className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Observaciones
          </h2>
          <p className="text-gray-600">
            Información adicional que consideres relevante
          </p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-purple-100"
        >
          <div className="space-y-4">
            <Label htmlFor="observaciones" className="text-lg font-semibold text-gray-700">
              Observaciones (opcional)
            </Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escribe aquí cualquier información adicional sobre el vehículo que consideres importante..."
              className="min-h-[200px] bg-white text-gray-900 border-purple-200 focus:border-purple-400 focus:ring-purple-400 resize-none"
            />
            <p className="text-sm text-gray-500">
              Por ejemplo: modificaciones, accesorios, mantenimientos recientes, etc.
            </p>
          </div>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 mt-8"
        >
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="flex-1 h-14 text-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
          >
            Atrás
          </Button>
          <Button
            onClick={handleContinue}
            size="lg"
            className="flex-1 h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
          >
            Continuar
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}

