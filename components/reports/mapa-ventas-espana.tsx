"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TrendingUp, Users, Euro } from "lucide-react"
import type { VentaGeografica } from "@/types/ventas"

interface MapaVentasEspanaProps {
  datos: VentaGeografica[]
}

// Coordenadas aproximadas de las provincias españolas (simplificadas)
const COORDENADAS_PROVINCIAS: Record<string, { x: number; y: number; nombre: string }> = {
  "Barcelona": { x: 85, y: 35, nombre: "Barcelona" },
  "Madrid": { x: 45, y: 45, nombre: "Madrid" },
  "Valencia": { x: 75, y: 55, nombre: "Valencia" },
  "Sevilla": { x: 25, y: 75, nombre: "Sevilla" },
  "Málaga": { x: 20, y: 80, nombre: "Málaga" },
  "Bilbao": { x: 65, y: 25, nombre: "Bilbao" },
  "Zaragoza": { x: 60, y: 40, nombre: "Zaragoza" },
  "Murcia": { x: 80, y: 65, nombre: "Murcia" },
  "Alicante": { x: 75, y: 60, nombre: "Alicante" },
  "Córdoba": { x: 30, y: 70, nombre: "Córdoba" },
  "Valladolid": { x: 40, y: 35, nombre: "Valladolid" },
  "Vigo": { x: 15, y: 30, nombre: "Vigo" },
  "Gijón": { x: 25, y: 20, nombre: "Gijón" },
  "Las Palmas": { x: 5, y: 85, nombre: "Las Palmas" },
  "Santa Cruz de Tenerife": { x: 0, y: 90, nombre: "Tenerife" },
  "Granada": { x: 35, y: 75, nombre: "Granada" },
  "Oviedo": { x: 30, y: 25, nombre: "Oviedo" },
  "A Coruña": { x: 20, y: 25, nombre: "A Coruña" },
  "Pamplona": { x: 55, y: 30, nombre: "Pamplona" },
  "Logroño": { x: 50, y: 35, nombre: "Logroño" },
  "Santander": { x: 45, y: 25, nombre: "Santander" },
  "Toledo": { x: 40, y: 50, nombre: "Toledo" },
  "Badajoz": { x: 25, y: 60, nombre: "Badajoz" },
  "Cáceres": { x: 30, y: 55, nombre: "Cáceres" },
  "Salamanca": { x: 35, y: 45, nombre: "Salamanca" },
  "León": { x: 35, y: 35, nombre: "León" },
  "Burgos": { x: 45, y: 35, nombre: "Burgos" },
  "Soria": { x: 50, y: 40, nombre: "Soria" },
  "Huesca": { x: 60, y: 35, nombre: "Huesca" },
  "Teruel": { x: 65, y: 45, nombre: "Teruel" },
  "Cuenca": { x: 50, y: 50, nombre: "Cuenca" },
  "Guadalajara": { x: 45, y: 45, nombre: "Guadalajara" },
  "Ávila": { x: 40, y: 45, nombre: "Ávila" },
  "Segovia": { x: 42, y: 42, nombre: "Segovia" },
  "Palencia": { x: 40, y: 35, nombre: "Palencia" },
  "Zamora": { x: 35, y: 40, nombre: "Zamora" },
  "Ourense": { x: 25, y: 35, nombre: "Ourense" },
  "Lugo": { x: 25, y: 30, nombre: "Lugo" },
  "Pontevedra": { x: 20, y: 30, nombre: "Pontevedra" },
  "Vitoria": { x: 60, y: 30, nombre: "Vitoria" },
  "Donostia": { x: 65, y: 25, nombre: "Donostia" },
  "Huelva": { x: 20, y: 70, nombre: "Huelva" },
  "Cádiz": { x: 15, y: 75, nombre: "Cádiz" },
  "Jaén": { x: 35, y: 70, nombre: "Jaén" },
  "Almería": { x: 45, y: 75, nombre: "Almería" },
  "Albacete": { x: 55, y: 55, nombre: "Albacete" },
  "Ciudad Real": { x: 35, y: 55, nombre: "Ciudad Real" },
  "Castellón": { x: 70, y: 50, nombre: "Castellón" },
  "Tarragona": { x: 75, y: 40, nombre: "Tarragona" },
  "Lleida": { x: 70, y: 35, nombre: "Lleida" },
  "Girona": { x: 80, y: 30, nombre: "Girona" },
  "Tortosa": { x: 75, y: 45, nombre: "Tortosa" },
  "Palma": { x: 70, y: 70, nombre: "Palma" },
  "Ceuta": { x: 10, y: 80, nombre: "Ceuta" },
  "Melilla": { x: 15, y: 85, nombre: "Melilla" }
}

export function MapaVentasEspana({ datos }: MapaVentasEspanaProps) {
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)
  const [maxVentas, setMaxVentas] = useState(1)

  useEffect(() => {
    if (datos.length > 0) {
      const max = Math.max(...datos.map(d => d.cantidad))
      setMaxVentas(max)
    }
  }, [datos])

  const getIntensidadColor = (cantidad: number) => {
    const intensidad = Math.min((cantidad / maxVentas) * 100, 100)
    return `rgba(59, 130, 246, ${intensidad / 100})` // Azul con transparencia
  }

  const getTamañoPunto = (cantidad: number) => {
    const baseSize = 8
    const maxSize = 24
    const factor = Math.min((cantidad / maxVentas) * 2, 2)
    return Math.max(baseSize, Math.min(maxSize, baseSize * factor))
  }

  const datosProvinciaSeleccionada = datos.find(d => d.provincia === provinciaSeleccionada)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Densidad de Ventas</CardTitle>
          <CardDescription>
            Distribución geográfica de ventas por provincia. El tamaño y color de los puntos indica la cantidad de ventas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Mapa base de España (simplificado) */}
            <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 overflow-hidden">
              {/* Contorno simplificado de España */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Contorno básico de España */}
                <path
                  d="M15 25 L25 20 L35 15 L45 18 L55 15 L65 12 L75 15 L85 18 L90 25 L88 35 L85 45 L80 55 L75 65 L70 75 L65 80 L55 85 L45 88 L35 85 L25 80 L20 70 L15 60 L12 50 L15 40 L15 25 Z"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
                
                {/* Puntos de las provincias */}
                {datos.map((provincia) => {
                  const coordenadas = COORDENADAS_PROVINCIAS[provincia.provincia]
                  if (!coordenadas) return null

                  return (
                    <g key={provincia.provincia}>
                      {/* Círculo de fondo para hover */}
                      <circle
                        cx={coordenadas.x}
                        cy={coordenadas.y}
                        r={getTamañoPunto(provincia.cantidad) + 2}
                        fill="rgba(59, 130, 246, 0.1)"
                        className="transition-all duration-200 hover:fill-opacity-30 cursor-pointer"
                        onClick={() => setProvinciaSeleccionada(provincia.provincia)}
                      />
                      {/* Punto principal */}
                      <circle
                        cx={coordenadas.x}
                        cy={coordenadas.y}
                        r={getTamañoPunto(provincia.cantidad)}
                        fill={getIntensidadColor(provincia.cantidad)}
                        stroke="#1e40af"
                        strokeWidth="1"
                        className="transition-all duration-200 hover:r-6 cursor-pointer"
                        onClick={() => setProvinciaSeleccionada(provincia.provincia)}
                      />
                      {/* Etiqueta */}
                      <text
                        x={coordenadas.x}
                        y={coordenadas.y + getTamañoPunto(provincia.cantidad) + 8}
                        textAnchor="middle"
                        fontSize="2"
                        fill="#374151"
                        className="pointer-events-none"
                      >
                        {provincia.cantidad}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Leyenda */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border">
                <div className="text-xs font-medium mb-2">Leyenda</div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Baja densidad</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span>Media densidad</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-blue-700 rounded-full"></div>
                    <span>Alta densidad</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalle de provincia seleccionada */}
      {datosProvinciaSeleccionada && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {datosProvinciaSeleccionada.provincia}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {datosProvinciaSeleccionada.cantidad}
                </div>
                <div className="text-sm text-muted-foreground">Ventas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {datosProvinciaSeleccionada.ingresos.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR"
                  })}
                </div>
                <div className="text-sm text-muted-foreground">Ingresos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {datosProvinciaSeleccionada.codigosPostales?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Códigos Postales</div>
              </div>
            </div>

            {/* Top códigos postales */}
            {datosProvinciaSeleccionada.codigosPostales && datosProvinciaSeleccionada.codigosPostales.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Top Códigos Postales</h4>
                <div className="space-y-2">
                  {datosProvinciaSeleccionada.codigosPostales
                    .sort((a, b) => b.cantidad - a.cantidad)
                    .slice(0, 5)
                    .map((cp, index) => (
                      <div key={cp.codigo} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{cp.codigo}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            {cp.cantidad} ventas
                          </span>
                          <span className="font-medium">
                            {cp.ingresos.toLocaleString("es-ES", {
                              style: "currency",
                              currency: "EUR"
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estadísticas generales */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Geográfico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {datos.length}
              </div>
              <div className="text-sm text-muted-foreground">Provincias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {datos.reduce((sum, d) => sum + d.cantidad, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Ventas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {datos.reduce((sum, d) => sum + d.ingresos, 0).toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR"
                })}
              </div>
              <div className="text-sm text-muted-foreground">Total Ingresos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {datos.reduce((sum, d) => sum + (d.codigosPostales?.length || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Códigos Postales</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
