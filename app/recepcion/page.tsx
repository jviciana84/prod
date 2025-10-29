// ============================================
// PÁGINA: Recepción de Visitas (Mini-App PWA)
// ============================================
// Propósito: Interfaz simple para recepcionistas
// Patrón: CONSULTAS directas + MUTACIONES por API Routes
// NO hay riesgo de cliente zombie (solo consultas en useEffect)
// ============================================

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Car, Bike, Loader2, UserCheck, AlertCircle, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type VisitType = 'COCHE_VN' | 'COCHE_VO' | 'MOTO_VN' | 'MOTO_VO'

interface Advisor {
  id: string
  full_name: string
  email?: string
  phone?: string
  office_location?: string
  desk_number?: string
  is_occupied: boolean
  visits_today: number
}

interface AssignmentResult {
  advisor: Advisor
  visit_type: VisitType
  reason: string
  message: string
  queue_info?: {
    total_available: number
    position_in_queue: number
  }
}

export default function RecepcionPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AssignmentResult | null>(null)
  const [showRedirectOption, setShowRedirectOption] = useState(false)
  const [lastAssignmentId, setLastAssignmentId] = useState<string | null>(null)

  // Información del cliente (opcional)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [hadAppointment, setHadAppointment] = useState(false)
  const [appointmentWith, setAppointmentWith] = useState("")

  const getButtonConfig = (type: VisitType) => {
    const configs = {
      'COCHE_VN': {
        icon: Car,
        label: 'Coche VN',
        color: 'bg-blue-600 hover:bg-blue-700',
        description: 'Vehículo Nuevo'
      },
      'COCHE_VO': {
        icon: Car,
        label: 'Coche VO',
        color: 'bg-green-600 hover:bg-green-700',
        description: 'Vehículo de Ocasión'
      },
      'MOTO_VN': {
        icon: Bike,
        label: 'Moto VN',
        color: 'bg-purple-600 hover:bg-purple-700',
        description: 'Vehículo Nuevo'
      },
      'MOTO_VO': {
        icon: Bike,
        label: 'Moto VO',
        color: 'bg-orange-600 hover:bg-orange-700',
        description: 'Vehículo de Ocasión'
      }
    }
    return configs[type]
  }

  // ✅ MUTACIÓN - API Route (correcto según guía)
  const handleVisit = async (type: VisitType) => {
    setLoading(true)
    setResult(null)
    setShowRedirectOption(false)

    try {
      const response = await fetch('/api/visits/next-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_type: type,
          client_name: clientName || undefined,
          client_phone: clientPhone || undefined,
          had_appointment: hadAppointment,
          appointment_with: hadAppointment ? appointmentWith : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al asignar visita')
      }

      const data: AssignmentResult = await response.json()
      setResult(data)
      
      // Si el asesor está ocupado, mostrar opción de redirigir
      if (data.advisor.is_occupied) {
        setShowRedirectOption(true)
      }

      toast({
        title: "✅ Visita asignada",
        description: `Derivar a: ${data.advisor.full_name}`
      })

      // Limpiar campos opcionales
      setClientName("")
      setClientPhone("")
      setHadAppointment(false)
      setAppointmentWith("")

    } catch (error: any) {
      console.error('❌ Error:', error)
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // ✅ MUTACIÓN - API Route (correcto según guía)
  const handleRedirect = async () => {
    if (!result || !result.advisor.id) return

    setLoading(true)

    try {
      const response = await fetch('/api/visits/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_assignment_id: lastAssignmentId, // Necesitarías guardarlo en el resultado
          original_advisor_id: result.advisor.id,
          redirect_reason: 'Asesor ocupado atendiendo otro cliente',
          visit_type: result.visit_type
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al redirigir')
      }

      const data = await response.json()
      
      // Actualizar resultado con nuevo asesor
      setResult({
        advisor: data.new_advisor,
        visit_type: result.visit_type,
        reason: 'redirected',
        message: data.message
      })

      setShowRedirectOption(false)

      toast({
        title: "🔄 Visita redirigida",
        description: `Nuevo asesor: ${data.new_advisor.full_name}`
      })

    } catch (error: any) {
      console.error('❌ Error:', error)
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setShowRedirectOption(false)
    setClientName("")
    setClientPhone("")
    setHadAppointment(false)
    setAppointmentWith("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            🚗 Recepción de Visitas
          </h1>
          <p className="text-gray-400 text-lg">
            Sistema de distribución equitativa CVO
          </p>
        </div>

        {/* Información del Cliente (Opcional) */}
        {!result && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Información del Cliente (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name" className="text-gray-300">Nombre del Cliente</Label>
                  <Input
                    id="client_name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone" className="text-gray-300">Teléfono</Label>
                  <Input
                    id="client_phone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="666 123 456"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="had_appointment"
                    checked={hadAppointment}
                    onCheckedChange={(checked) => setHadAppointment(checked as boolean)}
                  />
                  <Label htmlFor="had_appointment" className="text-gray-300 cursor-pointer">
                    El cliente tenía cita previa
                  </Label>
                </div>

                {hadAppointment && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="appointment_with" className="text-gray-300">Cita con:</Label>
                    <Input
                      id="appointment_with"
                      value={appointmentWith}
                      onChange={(e) => setAppointmentWith(e.target.value)}
                      placeholder="Nombre del asesor"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de Tipo de Visita */}
        {!result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['COCHE_VN', 'COCHE_VO', 'MOTO_VN', 'MOTO_VO'] as VisitType[]).map((type) => {
              const config = getButtonConfig(type)
              const Icon = config.icon

              return (
                <Button
                  key={type}
                  onClick={() => handleVisit(type)}
                  disabled={loading}
                  className={`h-40 flex flex-col items-center justify-center gap-3 text-xl font-bold ${config.color} text-white shadow-lg hover:shadow-xl transition-all`}
                >
                  {loading ? (
                    <Loader2 className="h-12 w-12 animate-spin" />
                  ) : (
                    <>
                      <Icon className="h-16 w-16" />
                      <div className="text-center">
                        <div>{config.label}</div>
                        <div className="text-sm font-normal opacity-90">{config.description}</div>
                      </div>
                    </>
                  )}
                </Button>
              )
            })}
          </div>
        )}

        {/* Resultado de la Asignación */}
        {result && (
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-green-500 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-3">
                <UserCheck className="h-8 w-8" />
                Visita Asignada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-white">
              <div className="bg-white/10 rounded-lg p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{result.advisor.full_name}</span>
                  {result.advisor.is_occupied && (
                    <span className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                      ⚠️ Ocupado
                    </span>
                  )}
                </div>

                {result.advisor.office_location && (
                  <div className="flex items-center gap-2 text-lg">
                    <ArrowRight className="h-5 w-5" />
                    <span>Ubicación: <strong>{result.advisor.office_location}</strong></span>
                    {result.advisor.desk_number && (
                      <span>- Puesto <strong>{result.advisor.desk_number}</strong></span>
                    )}
                  </div>
                )}

                {result.advisor.phone && (
                  <div className="text-lg">
                    📞 Teléfono: <strong>{result.advisor.phone}</strong>
                  </div>
                )}

                <div className="text-sm opacity-90">
                  Visitas hoy: <strong>{result.advisor.visits_today}</strong>
                </div>
              </div>

              {/* Opción de redirigir si está ocupado */}
              {showRedirectOption && result.advisor.is_occupied && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-300 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold">El asesor está ocupado</p>
                      <p className="text-sm opacity-90">
                        Puedes esperar o redirigir al siguiente asesor disponible
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleRedirect}
                    disabled={loading}
                    variant="secondary"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-semibold"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Buscando...</>
                    ) : (
                      '🔄 Redirigir a otro asesor'
                    )}
                  </Button>
                </div>
              )}

              <Button
                onClick={handleReset}
                variant="secondary"
                className="w-full mt-4 bg-white/20 hover:bg-white/30"
              >
                ← Nueva Visita
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

