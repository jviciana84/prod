'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Car, Fuel, Settings, Key, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Combustible, Transmision } from '@/types/tasacion'

interface MarcaModeloStepProps {
  onComplete: (data: {
    marca: string
    modelo: string
    version: string
    combustible: Combustible
    transmision: Transmision
    segundaLlave: boolean
    elementosDestacables?: string
  }) => void
  onBack: () => void
}

const MARCAS_PRINCIPALES = [
  'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Seat', 'Renault',
  'Peugeot', 'Citroën', 'Opel', 'Ford', 'Toyota', 'Nissan'
]

const TODAS_LAS_MARCAS = [
  ...MARCAS_PRINCIPALES,
  'Alfa Romeo', 'Fiat', 'Volvo', 'Mazda', 'Honda', 'Hyundai',
  'Kia', 'Skoda', 'Dacia', 'Suzuki', 'Mitsubishi', 'Subaru',
  'Jeep', 'Land Rover', 'Porsche', 'Lexus', 'Infiniti', 'Jaguar'
].sort()

export default function MarcaModeloStep({ onComplete, onBack }: MarcaModeloStepProps) {
  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  
  const [marca, setMarca] = useState('')
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [showCustomBrand, setShowCustomBrand] = useState(false)
  const [customBrand, setCustomBrand] = useState('')
  const [modelo, setModelo] = useState('')
  const [version, setVersion] = useState('')
  const [combustible, setCombustible] = useState<Combustible | null>(null)
  const [transmision, setTransmision] = useState<Transmision | null>(null)
  const [segundaLlave, setSegundaLlave] = useState<boolean | null>(null)
  const [elementosDestacables, setElementosDestacables] = useState('')
  
  // Refs para auto-scroll
  const modeloRef = useRef<HTMLDivElement>(null)
  const combustibleRef = useRef<HTMLDivElement>(null)
  const transmisionRef = useRef<HTMLDivElement>(null)
  const llaveRef = useRef<HTMLDivElement>(null)
  const destacablesRef = useRef<HTMLDivElement>(null)

  const handleMarcaSelect = (marcaSeleccionada: string) => {
    setMarca(marcaSeleccionada)
    setShowAllBrands(false)
    setShowCustomBrand(false)
    // Auto-scroll al modelo - asegurando que los botones sean visibles
    setTimeout(() => {
      modeloRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }
  
  // Auto-scroll cuando se completan campos - asegurando botones visibles
  useEffect(() => {
    if (modelo && version && combustibleRef.current) {
      setTimeout(() => {
        combustibleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [modelo, version])
  
  useEffect(() => {
    if (combustible && transmisionRef.current) {
      setTimeout(() => {
        transmisionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [combustible])
  
  useEffect(() => {
    if (transmision && llaveRef.current) {
      setTimeout(() => {
        llaveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [transmision])
  
  useEffect(() => {
    if (segundaLlave !== null && destacablesRef.current) {
      setTimeout(() => {
        destacablesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [segundaLlave])

  const handleCustomBrandSubmit = () => {
    if (customBrand.trim()) {
      setMarca(customBrand.trim())
      setShowCustomBrand(false)
    }
  }

  const handleContinue = () => {
    if (marca && modelo && version && combustible && transmision && segundaLlave !== null) {
      onComplete({
        marca,
        modelo,
        version,
        combustible,
        transmision,
        segundaLlave,
        elementosDestacables: elementosDestacables || undefined,
      })
    }
  }

  const isValid = marca && modelo && version && combustible && transmision && segundaLlave !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pt-6 pb-24 px-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto"
      >
        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full mb-3 shadow-lg">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Marca y Modelo</h2>
          <p className="text-sm text-gray-600">Especifica las características del vehículo</p>
        </div>

        <div className="space-y-6">
          {/* Selección de marca */}
          {!marca && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Selecciona la marca
              </Label>

              {/* Marcas principales */}
              {!showAllBrands && !showCustomBrand && (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {MARCAS_PRINCIPALES.map((m) => (
                  <button
                    key={m}
                    onClick={() => handleMarcaSelect(m)}
                    className="p-3 text-sm font-semibold rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-purple-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:text-purple-900 transition-all duration-300 overflow-hidden text-ellipsis whitespace-nowrap"
                    title={m}
                  >
                    {m}
                  </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAllBrands(true)}
                      className="flex-1 p-3 text-sm font-semibold rounded-lg border-2 border-purple-300 text-purple-700 hover:bg-purple-50 transition-all"
                    >
                      Ver todas las marcas
                    </button>
                    <button
                      onClick={() => setShowCustomBrand(true)}
                      className="flex-1 p-3 text-sm font-semibold rounded-lg border-2 border-pink-300 text-pink-700 hover:bg-pink-50 transition-all"
                    >
                      No encuentro la marca
                    </button>
                  </div>
                </>
              )}

              {/* Todas las marcas */}
              {showAllBrands && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3 max-h-80 overflow-y-auto">
                    {TODAS_LAS_MARCAS.map((m) => (
                    <button
                      key={m}
                      onClick={() => handleMarcaSelect(m)}
                      className="p-3 text-sm font-semibold rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-purple-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:text-purple-900 transition-all text-left overflow-hidden text-ellipsis whitespace-nowrap block"
                      title={m}
                    >
                      {m}
                    </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAllBrands(false)}
                    className="w-full p-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Volver
                  </button>
                </>
              )}

              {/* Marca personalizada */}
              {showCustomBrand && (
                <>
                  <Input
                    type="text"
                    placeholder="Escribe la marca"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="mb-3 h-12 bg-white text-gray-900"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCustomBrandSubmit}
                      className="flex-1 p-3 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setShowCustomBrand(false)}
                      className="flex-1 p-3 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Marca seleccionada */}
          {marca && (
            <motion.div
              ref={modeloRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Marca seleccionada</Label>
                  <p className="text-xl font-bold text-purple-900">{marca}</p>
                </div>
                <button
                  onClick={() => setMarca('')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Cambiar
                </button>
              </div>

              {/* Modelo y versión */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="modelo" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Modelo
                  </Label>
                  <Input
                    id="modelo"
                    type="text"
                    placeholder="Ej: Serie 3"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="h-12 bg-white text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="version" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Versión
                  </Label>
                  <Input
                    id="version"
                    type="text"
                    placeholder="Ej: 320d xDrive M Sport"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="h-12 bg-white text-gray-900"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Combustible */}
          {marca && modelo && version && (
            <motion.div
              ref={combustibleRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                <Fuel className="w-4 h-4" />
                Tipo de combustible
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(['gasolina', 'diesel', 'hibrido', 'electrico', 'hidrogeno'] as Combustible[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCombustible(c)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold capitalize overflow-hidden text-ellipsis whitespace-nowrap ${
                      combustible === c
                        ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 text-purple-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    title={c}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Transmisión */}
          {combustible && (
            <motion.div
              ref={transmisionRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Transmisión
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {(['automatico', 'manual'] as Transmision[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTransmision(t)}
                    className={`p-4 rounded-lg border-2 transition-all capitalize font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${
                      transmision === t
                        ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 text-purple-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    title={t}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Segunda llave */}
          {transmision && (
            <motion.div
              ref={llaveRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                <Key className="w-4 h-4" />
                ¿Tiene segunda llave?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSegundaLlave(true)}
                  className={`p-4 rounded-lg border-2 transition-all font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${
                    segundaLlave === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  title="Sí"
                >
                  ✓ Sí
                </button>
                <button
                  onClick={() => setSegundaLlave(false)}
                  className={`p-4 rounded-lg border-2 transition-all font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${
                    segundaLlave === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  title="No"
                >
                  ✗ No
                </button>
              </div>
            </motion.div>
          )}

          {/* Elementos destacables */}
          {segundaLlave !== null && (
            <motion.div
              ref={destacablesRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
            >
              <Label htmlFor="destacables" className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Elementos destacables (opcional)
              </Label>
                <Textarea
                  id="destacables"
                  placeholder="Ej: Techo panorámico, llantas 19', sistema de sonido premium..."
                  value={elementosDestacables}
                  onChange={(e) => setElementosDestacables(e.target.value)}
                  className="min-h-24 resize-none bg-white text-gray-900"
                />
            </motion.div>
          )}
        </div>

        {/* Botones de navegación */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 h-12 border-2"
          >
            Atrás
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!isValid}
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold shadow-lg disabled:opacity-50"
          >
            Continuar
          </Button>
        </div>
      </motion.div>
    </div>
  )
}


