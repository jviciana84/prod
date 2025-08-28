"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MapaSimpleTest() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const cargarGeoJSON = async () => {
      try {
        setLoading(true)
        console.log("🔍 Intentando cargar GeoJSON...")
        
        const response = await fetch('/data/spain-provinces-simple.geojson')
        console.log("📡 Respuesta:", response.status, response.ok)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const geoJSONData = await response.json()
        console.log("📊 Datos cargados:", geoJSONData)
        setData(geoJSONData)
        
      } catch (err) {
        console.error("❌ Error cargando GeoJSON:", err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    cargarGeoJSON()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Mapa Simple</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Mapa Simple - Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 font-medium">Error al cargar el mapa</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Mapa Simple - Sin Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">No se pudieron cargar los datos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Mapa Simple - Éxito</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800">✅ GeoJSON Cargado Correctamente</h3>
            <p className="text-sm text-green-700 mt-1">
              Tipo: {data.type} | Provincias: {data.features?.length || 0}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Provincias Disponibles:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {data.features?.slice(0, 6).map((feature: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  {feature.properties.name}
                </div>
              ))}
            </div>
            {data.features?.length > 6 && (
              <p className="text-sm text-muted-foreground mt-2">
                ... y {data.features.length - 6} más
              </p>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">Primera Provincia (Barcelona):</h4>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <p><strong>Nombre:</strong> {data.features[0]?.properties.name}</p>
              <p><strong>Tipo:</strong> {data.features[0]?.geometry.type}</p>
              <p><strong>Coordenadas:</strong> {data.features[0]?.geometry.coordinates[0]?.length} puntos</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
