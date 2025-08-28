"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TrendingUp, Users, Euro } from "lucide-react"
import type { VentaGeografica } from "@/types/ventas"

interface MapaEspanaGeoJSONProps {
  datos: VentaGeografica[]
}

interface GeoJSONFeature {
  type: "Feature"
  properties: {
    name: string
    [key: string]: any
  }
  geometry: {
    type: string
    coordinates: number[][][]
  }
}

interface GeoJSONData {
  type: "FeatureCollection"
  features: GeoJSONFeature[]
}

export function MapaEspanaGeoJSON({ datos }: MapaEspanaGeoJSONProps) {
  const [geoJSONData, setGeoJSONData] = useState<GeoJSONData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)
  const [maxVentas, setMaxVentas] = useState(1)
  const svgRef = useRef<SVGSVGElement>(null)

  // Cargar GeoJSON
  useEffect(() => {
    const cargarGeoJSON = async () => {
      try {
        setLoading(true)
                 const response = await fetch('/data/spain-provinces-simple.geojson')
        if (!response.ok) {
          throw new Error('No se pudo cargar el GeoJSON')
        }
        const data = await response.json()
        setGeoJSONData(data)
      } catch (err) {
        console.error('Error cargando GeoJSON:', err)
        setError('Error al cargar el mapa de España')
      } finally {
        setLoading(false)
      }
    }

    cargarGeoJSON()
  }, [])

  // Calcular máximo de ventas
  useEffect(() => {
    if (datos.length > 0) {
      const max = Math.max(...datos.map(d => d.cantidad))
      setMaxVentas(max)
    }
  }, [datos])

  const getIntensidadColor = (cantidad: number) => {
    const intensidad = Math.min((cantidad / maxVentas) * 100, 100)
    return `rgba(59, 130, 246, ${intensidad / 100})`
  }

  const getColorHover = () => {
    return "rgba(59, 130, 246, 0.3)"
  }

  const getColorDefault = () => {
    return "rgba(59, 130, 246, 0.1)"
  }

  const getStrokeColor = (cantidad: number) => {
    if (cantidad > 0) {
      return "#1e40af"
    }
    return "#cbd5e1"
  }

  const getStrokeWidth = (cantidad: number) => {
    if (cantidad > 0) {
      return 1
    }
    return 0.5
  }

  // Función para convertir coordenadas GeoJSON a SVG
  const geoJSONToSVG = (coordinates: number[][][]) => {
    if (!coordinates || coordinates.length === 0) return ""

    const paths: string[] = []
    
    coordinates.forEach(polygon => {
      if (!polygon || polygon.length === 0) return
      
      const validPoints: string[] = []
      
      polygon.forEach(coord => {
        if (coord && coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
          // Convertir coordenadas geográficas a coordenadas SVG
          // España está aproximadamente entre -9.5 y 3.5 longitud, 36 y 44 latitud
          const x = ((coord[0] + 9.5) / 13) * 800 // 800 es el ancho del SVG
          const y = ((44 - coord[1]) / 8) * 600   // 600 es el alto del SVG
          
          if (!isNaN(x) && !isNaN(y)) {
            validPoints.push(`${x},${y}`)
          }
        }
      })
      
      if (validPoints.length > 0) {
        paths.push(`M ${validPoints.join(' L ')} Z`)
      }
    })
    
    return paths.join(' ')
  }

  // Función simplificada para calcular el centro de una provincia
  const calcularCentroProvincia = (coordinates: number[][][]) => {
    if (!coordinates || coordinates.length === 0) return { x: 400, y: 300 }
    
    // Para el formato simplificado, usar el primer polígono
    const polygon = coordinates[0]
    if (!polygon || polygon.length === 0) return { x: 400, y: 300 }
    
    let totalX = 0
    let totalY = 0
    let validPoints = 0
    
    polygon.forEach(coord => {
      if (coord && coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
        const x = ((coord[0] + 9.5) / 13) * 800
        const y = ((44 - coord[1]) / 8) * 600
        
        if (!isNaN(x) && !isNaN(y)) {
          totalX += x
          totalY += y
          validPoints++
        }
      }
    })
    
    if (validPoints === 0) {
      return { x: 400, y: 300 }
    }
    
    return {
      x: totalX / validPoints,
      y: totalY / validPoints
    }
  }

  // Encontrar datos de la provincia seleccionada
  const datosProvinciaSeleccionada = datos.find(d => d.provincia === provinciaSeleccionada)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Densidad de Ventas</CardTitle>
          <CardDescription>Cargando mapa de España...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Cargando mapa...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !geoJSONData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Densidad de Ventas</CardTitle>
          <CardDescription>Error al cargar el mapa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{error || 'No se pudo cargar el mapa'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Densidad de Ventas</CardTitle>
          <CardDescription>
            Distribución geográfica de ventas por provincia usando datos reales de España
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <svg
              ref={svgRef}
              className="w-full h-96 border rounded-lg"
              viewBox="0 0 800 600"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Fondo */}
              <rect width="800" height="600" fill="#f8fafc" />
              
                             {/* Provincias */}
               {geoJSONData.features.map((feature, index) => {
                 const provinciaNombre = feature.properties.name
                 
                 // Mapeo de nombres de provincias para mejor coincidencia
                 const mapeoNombres: Record<string, string> = {
                   "Barcelona": "Barcelona",
                   "Madrid": "Madrid", 
                   "Valencia": "Valencia",
                   "Sevilla": "Sevilla",
                   "Bilbao": "Bilbao",
                   "Málaga": "Málaga",
                   "Zaragoza": "Zaragoza",
                   "Murcia": "Murcia",
                   "Alicante": "Alicante",
                   "Córdoba": "Córdoba",
                   "Valladolid": "Valladolid",
                   "Vigo": "Vigo",
                   "Gijón": "Gijón",
                   "Las Palmas": "Las Palmas",
                   "Santa Cruz de Tenerife": "Santa Cruz de Tenerife",
                   "Granada": "Granada",
                   "Oviedo": "Oviedo",
                   "A Coruña": "A Coruña",
                   "Pamplona": "Pamplona",
                   "Logroño": "Logroño",
                   "Santander": "Santander",
                   "Toledo": "Toledo",
                   "Badajoz": "Badajoz",
                   "Cáceres": "Cáceres",
                   "Salamanca": "Salamanca",
                   "León": "León",
                   "Burgos": "Burgos",
                   "Soria": "Soria",
                   "Huesca": "Huesca",
                   "Teruel": "Teruel",
                   "Cuenca": "Cuenca",
                   "Guadalajara": "Guadalajara",
                   "Ávila": "Ávila",
                   "Segovia": "Segovia",
                   "Palencia": "Palencia",
                   "Zamora": "Zamora",
                   "Ourense": "Ourense",
                   "Lugo": "Lugo",
                   "Pontevedra": "Pontevedra",
                   "Vitoria": "Vitoria",
                   "Donostia": "Donostia",
                   "Huelva": "Huelva",
                   "Cádiz": "Cádiz",
                   "Jaén": "Jaén",
                   "Almería": "Almería",
                   "Albacete": "Albacete",
                   "Ciudad Real": "Ciudad Real",
                   "Castellón": "Castellón",
                   "Tarragona": "Tarragona",
                   "Lleida": "Lleida",
                   "Girona": "Girona",
                   "Tortosa": "Tortosa",
                   "Palma": "Palma",
                   "Ceuta": "Ceuta",
                   "Melilla": "Melilla"
                 }
                 
                 const nombreNormalizado = mapeoNombres[provinciaNombre] || provinciaNombre
                 const datosProvincia = datos.find(d => 
                   d.provincia.toLowerCase() === nombreNormalizado.toLowerCase() ||
                   d.provincia.toLowerCase().includes(nombreNormalizado.toLowerCase()) ||
                   nombreNormalizado.toLowerCase().includes(d.provincia.toLowerCase())
                 )
                 const cantidad = datosProvincia?.cantidad || 0
                
                return (
                  <g key={index}>
                    {/* Provincia */}
                    <path
                      d={geoJSONToSVG(feature.geometry.coordinates)}
                      fill={cantidad > 0 ? getIntensidadColor(cantidad) : getColorDefault()}
                      stroke={getStrokeColor(cantidad)}
                      strokeWidth={getStrokeWidth(cantidad)}
                      className="transition-all duration-200 hover:fill-opacity-80 cursor-pointer"
                      onClick={() => setProvinciaSeleccionada(provinciaNombre)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.fill = getColorHover()
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.fill = cantidad > 0 ? getIntensidadColor(cantidad) : getColorDefault()
                      }}
                    />
                    
                                         {/* Etiqueta de cantidad si hay ventas */}
                     {cantidad > 0 && (() => {
                       const centro = calcularCentroProvincia(feature.geometry.coordinates)
                       
                       // Verificar que las coordenadas sean válidas antes de renderizar el texto
                       if (!isNaN(centro.x) && !isNaN(centro.y) && 
                           centro.x >= 0 && centro.x <= 800 && 
                           centro.y >= 0 && centro.y <= 600) {
                         return (
                           <text
                             x={centro.x}
                             y={centro.y}
                             textAnchor="middle"
                             fontSize="10"
                             fill="#1e40af"
                             fontWeight="bold"
                             className="pointer-events-none"
                           >
                             {cantidad}
                           </text>
                         )
                       }
                       return null
                     })()}
                  </g>
                )
              })}
            </svg>

            {/* Leyenda */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border">
              <div className="text-xs font-medium mb-2">Leyenda</div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span>Sin ventas</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-300 rounded"></div>
                  <span>Baja densidad</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Alta densidad</span>
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
