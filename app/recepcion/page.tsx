"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Car, Bike } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type VisitType = 'COCHE_VN' | 'COCHE_VO' | 'MOTO_VN' | 'MOTO_VO'

export default function RecepcionPage() {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [loadingInicial, setLoadingInicial] = useState(true)
  const [loadingTipo, setLoadingTipo] = useState<VisitType | null>(null)
  const [siguientes, setSiguientes] = useState<Record<VisitType, any>>({
    COCHE_VN: null,
    COCHE_VO: null,
    MOTO_VN: null,
    MOTO_VO: null
  })

  useEffect(() => {
    cargarTodo()
  }, [])

  const cargarTodo = async () => {
    const { data: asesores } = await supabase
      .from('advisors')
      .select('*')
      .eq('is_active', true)
      .eq('is_on_vacation', false)
      .order('current_turn_priority', { ascending: true })
    
    if (!asesores) {
      setLoadingInicial(false)
      return
    }

    const next: Record<VisitType, any> = {
      COCHE_VN: null,
      COCHE_VO: null,
      MOTO_VN: null,
      MOTO_VO: null
    }

    const tipos: VisitType[] = ['COCHE_VN', 'COCHE_VO', 'MOTO_VN', 'MOTO_VO']
    
    tipos.forEach(tipo => {
      const disponibles = asesores.filter(a => a.specialization.includes(tipo))
      if (disponibles.length > 0) {
        next[tipo] = disponibles[0]
      }
    })

    setSiguientes(next)
    setLoadingInicial(false)
    setLoadingTipo(null)
  }

  const asignar = async (tipo: VisitType) => {
    const asesor = siguientes[tipo]
    if (!asesor) return

    setLoadingTipo(tipo)

    try {
      await supabase.from('visit_assignments').insert({
        advisor_id: asesor.id,
        advisor_name: asesor.full_name,
        visit_type: tipo,
        assigned_by: (await supabase.auth.getSession()).data.session?.user.id,
        assigned_by_name: 'Recepción'
      })

      await supabase
        .from('advisors')
        .update({
          total_visits: asesor.total_visits + 1,
          visits_today: asesor.visits_today + 1,
          current_turn_priority: asesor.current_turn_priority + 1
        })
        .eq('id', asesor.id)

      // SOLO recargar el siguiente asesor para ESTE tipo específico
      const { data: asesores } = await supabase
        .from('advisors')
        .select('*')
        .eq('is_active', true)
        .eq('is_on_vacation', false)
        .contains('specialization', [tipo])
        .order('current_turn_priority', { ascending: true })
      
      if (asesores && asesores.length > 0) {
        setSiguientes(prev => ({
          ...prev,
          [tipo]: asesores[0]
        }))
      }

      setLoadingTipo(null)
    } catch (error) {
      console.error('Error:', error)
      setLoadingTipo(null)
    }
  }

  const ocupado = async (tipo: VisitType) => {
    const actual = siguientes[tipo]
    if (!actual) return

    setLoadingTipo(tipo)

    await supabase
      .from('advisors')
      .update({
        current_turn_priority: actual.current_turn_priority + 1
      })
      .eq('id', actual.id)

    // SOLO recargar el siguiente asesor para ESTE tipo específico
    const { data: asesores } = await supabase
      .from('advisors')
      .select('*')
      .eq('is_active', true)
      .eq('is_on_vacation', false)
      .contains('specialization', [tipo])
      .order('current_turn_priority', { ascending: true })
    
    if (asesores && asesores.length > 0) {
      setSiguientes(prev => ({
        ...prev,
        [tipo]: asesores[0]
      }))
    }

    setLoadingTipo(null)
  }

  if (loadingInicial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      </div>
    )
  }

  const TipoCard = ({ tipo, icon: Icon, nombre, color, gradiente }: any) => {
    const asesor = siguientes[tipo]
    const isLoading = loadingTipo === tipo
    
    return (
      <div className={`relative rounded-2xl overflow-hidden ${gradiente} p-1`}>
        <div className="bg-gray-900/90 rounded-2xl p-4 h-full backdrop-blur">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-xl ${color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-lg font-bold text-white">{nombre}</div>
          </div>

          <div className="mb-4 min-h-[60px] flex items-center">
            <div className={`text-5xl font-black ${asesor ? 'text-white' : 'text-gray-600'}`}>
              {isLoading ? (
                <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
              ) : (
                asesor ? asesor.full_name.split(' ')[0].toUpperCase() : 'AUSENTE'
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => asignar(tipo)}
              disabled={!asesor || isLoading}
              className={`flex-1 h-12 text-base font-bold ${color} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Asignar'}
            </Button>
            
            {asesor && (
              <Button
                onClick={() => ocupado(tipo)}
                disabled={isLoading}
                className="h-12 px-5 text-sm font-bold bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:opacity-50"
              >
                Ocupado
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 overflow-hidden flex items-center justify-center">
      <div className="max-w-6xl w-full">
        
        {/* Header con logo */}
        <div className="mb-6">
          <img 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cvo-KUNh8rXJGJ38lK00MJ9JTEci2nGA5o.png" 
            alt="CVO Logo" 
            className="h-10 mb-4"
          />
          <h1 className="text-7xl font-black text-white text-center leading-tight">
            ¿Qué necesita el cliente?
          </h1>
        </div>

        {/* Grid de tipos */}
        <div className="grid grid-cols-2 gap-4">
          <TipoCard
            tipo="COCHE_VN"
            icon={Car}
            nombre="COCHE NUEVO"
            color="bg-gradient-to-r from-blue-600 to-blue-800"
            gradiente="bg-gradient-to-br from-blue-500 to-blue-700"
          />
          
          <TipoCard
            tipo="COCHE_VO"
            icon={Car}
            nombre="COCHE OCASIÓN"
            color="bg-gradient-to-r from-emerald-600 to-emerald-800"
            gradiente="bg-gradient-to-br from-emerald-500 to-emerald-700"
          />
          
          <TipoCard
            tipo="MOTO_VN"
            icon={Bike}
            nombre="MOTO NUEVA"
            color="bg-gradient-to-r from-purple-600 to-purple-800"
            gradiente="bg-gradient-to-br from-purple-500 to-purple-700"
          />
          
          <TipoCard
            tipo="MOTO_VO"
            icon={Bike}
            nombre="MOTO OCASIÓN"
            color="bg-gradient-to-r from-orange-600 to-orange-800"
            gradiente="bg-gradient-to-br from-orange-500 to-orange-700"
          />
        </div>

      </div>
    </div>
  )
}
