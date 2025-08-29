import { Metadata } from "next"
import { MapaDebugCoordenadas } from "@/components/reports/mapa-debug-coordenadas"

export const metadata: Metadata = {
  title: "Debug Coordenadas - Mapa España",
  description: "Debug de coordenadas calculadas para el mapa de España",
}

export default function DebugCoordenadasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Debug: Coordenadas del Mapa
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Analizando las coordenadas calculadas para cada provincia
        </p>
      </div>
      
      <MapaDebugCoordenadas />
    </div>
  )
}
