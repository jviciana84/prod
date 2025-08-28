import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { MapaEspanaGeoJSON } from "@/components/reports/mapa-espana-geojson"
import { MapaSimpleTest } from "@/components/reports/mapa-simple-test"
import { MapaSVGSimple } from "@/components/reports/mapa-svg-simple"
import { MapaFuncional } from "@/components/reports/mapa-funcional"
import { MapaConContorno } from "@/components/reports/mapa-con-contorno"
import { MapPin } from "lucide-react"

export const metadata: Metadata = {
  title: "Test Mapa GeoJSON | Dashboard",
  description: "Página de prueba para el mapa de España con GeoJSON",
}

// Datos de prueba
const datosPrueba = [
  {
    provincia: "Barcelona",
    cantidad: 15,
    ingresos: 450000,
    codigosPostales: [
      { codigo: "08001", cantidad: 5, ingresos: 150000 },
      { codigo: "08002", cantidad: 3, ingresos: 90000 },
      { codigo: "08003", cantidad: 7, ingresos: 210000 }
    ]
  },
  {
    provincia: "Madrid",
    cantidad: 12,
    ingresos: 380000,
    codigosPostales: [
      { codigo: "28001", cantidad: 4, ingresos: 120000 },
      { codigo: "28002", cantidad: 8, ingresos: 260000 }
    ]
  },
  {
    provincia: "Valencia",
    cantidad: 8,
    ingresos: 240000,
    codigosPostales: [
      { codigo: "46001", cantidad: 3, ingresos: 90000 },
      { codigo: "46002", cantidad: 5, ingresos: 150000 }
    ]
  },
  {
    provincia: "Sevilla",
    cantidad: 6,
    ingresos: 180000,
    codigosPostales: [
      { codigo: "41001", cantidad: 2, ingresos: 60000 },
      { codigo: "41002", cantidad: 4, ingresos: 120000 }
    ]
  },
  {
    provincia: "Bilbao",
    cantidad: 4,
    ingresos: 120000,
    codigosPostales: [
      { codigo: "48001", cantidad: 2, ingresos: 60000 },
      { codigo: "48002", cantidad: 2, ingresos: 60000 }
    ]
  }
]

export default function TestMapPage() {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4"
          segments={[
            {
              title: "Dashboard",
              href: "/dashboard",
            },
            {
              title: "Test Mapa",
              href: "/dashboard/test-map",
            },
          ]}
        />
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Test Mapa GeoJSON</h1>
            <p className="text-muted-foreground">Página de prueba para el mapa de España con datos reales</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">📊 Datos de Prueba</h2>
        <p className="text-blue-700 text-sm">
          Esta página usa datos de prueba para verificar que el mapa GeoJSON funciona correctamente.
          Los datos incluyen ventas simuladas para Barcelona, Madrid, Valencia, Sevilla y Bilbao.
        </p>
      </div>

      <MapaConContorno />
    </div>
  )
}
