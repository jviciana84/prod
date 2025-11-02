"use client"

import { Badge } from "@/components/ui/badge"

interface Damage {
  parte: string
  tipo: string
  vista?: string
}

interface DamageDisplayProps {
  damages: Damage[]
  title: string
}

const DAMAGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pulir: { bg: "bg-green-100", text: "text-green-800", label: "Pulir" },
  rayado: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Rayado" },
  golpe: { bg: "bg-orange-100", text: "text-orange-800", label: "Golpe" },
  sustituir: { bg: "bg-red-100", text: "text-red-800", label: "Sustituir" },
}

const VIEW_LABELS: Record<string, string> = {
  frontal: "Frontal",
  lateral_izquierda: "Lateral Izq.",
  lateral_derecha: "Lateral Der.",
  laterial_derecha: "Lateral Der.",
  trasera: "Trasera",
  interior_delantero_izq: "Interior Delantero",
  interior_trasero_izq: "Interior Trasero",
}

export function DamageDisplay({ damages, title }: DamageDisplayProps) {
  if (!damages || damages.length === 0) {
    return null
  }

  // Agrupar daños por tipo
  const damagesByType: Record<string, Damage[]> = {}
  damages.forEach((d) => {
    const tipo = d.tipo.toLowerCase()
    if (!damagesByType[tipo]) {
      damagesByType[tipo] = []
    }
    damagesByType[tipo].push(d)
  })

  return (
    <div className="mb-1">
      {/* Leyenda compacta */}
      <div className="flex flex-wrap gap-1.5 mb-0.5">
        {Object.entries(DAMAGE_COLORS).map(([key, config]) => {
          const count = damagesByType[key]?.length || 0
          if (count === 0) return null
          
          return (
            <div key={key} className="flex items-center gap-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${config.bg}`}></div>
              <span className="text-[10px] font-medium">
                {config.label} ({count})
              </span>
            </div>
          )
        })}
      </div>

      {/* Lista compacta */}
      <div className="flex flex-wrap gap-0.5">
        {damages.map((damage, idx) => {
          const config = DAMAGE_COLORS[damage.tipo.toLowerCase()]
          if (!config) return null

          return (
            <Badge
              key={idx}
              className={`${config.bg} ${config.text} text-[10px] border-0 px-1.5 py-0`}
            >
              {damage.parte}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}

