'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { processFilterConfig, ProcessingResult } from '@/server-actions/filter-processing'

type FilterConfig = {
  id?: string
  name: string
  description?: string
  is_active: boolean
  disponibilidad_filter: string[]
  marca_filter: string[]
  precio_min?: number
  precio_max?: number
  km_min?: number
  km_max?: number
  libre_siniestros?: boolean
  concesionario_filter: string[]
  combustible_filter: string[]
  año_min?: number
  año_max?: number
  dias_stock_min?: number
  dias_stock_max?: number
  max_vehicles_per_batch: number
  auto_process: boolean
}

export default function FilterConfigPage() {
  const [configs, setConfigs] = useState<FilterConfig[]>([])
  const [currentConfig, setCurrentConfig] = useState<FilterConfig>({
    name: '',
    description: '',
    is_active: true,
    disponibilidad_filter: [],
    marca_filter: [],
    precio_min: undefined,
    precio_max: undefined,
    km_min: undefined,
    km_max: undefined,
    libre_siniestros: undefined,
    concesionario_filter: [],
    combustible_filter: [],
    año_min: undefined,
    año_max: undefined,
    dias_stock_min: undefined,
    dias_stock_max: undefined,
    max_vehicles_per_batch: 100,
    auto_process: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewCount, setPreviewCount] = useState(0)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [availableOptions, setAvailableOptions] = useState({
    disponibilidad: [],
    marcas: [],
    concesionarios: [],
    combustibles: []
  })
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()

  // Cargar configuraciones existentes
  useEffect(() => {
    loadConfigs()
    loadAvailableOptions()
  }, [])

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('filter_configs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setConfigs(data || [])
    } catch (error) {
      console.error('Error loading configs:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive"
      })
    }
  }

  const loadAvailableOptions = async () => {
    try {
      // Cargar opciones disponibles desde duc_scraper
      const { data: disponibilidad } = await supabase
        .from('duc_scraper')
        .select('Disponibilidad')
        .not('Disponibilidad', 'is', null)
        .limit(1000)

      const { data: marcas } = await supabase
        .from('duc_scraper')
        .select('Marca')
        .not('Marca', 'is', null)
        .limit(1000)

      const { data: concesionarios } = await supabase
        .from('duc_scraper')
        .select('Concesionario')
        .not('Concesionario', 'is', null)
        .limit(1000)

      const { data: combustibles } = await supabase
        .from('duc_scraper')
        .select('Combustible')
        .not('Combustible', 'is', null)
        .limit(1000)

      setAvailableOptions({
        disponibilidad: [...new Set(disponibilidad?.map(d => d.Disponibilidad) || [])],
        marcas: [...new Set(marcas?.map(m => m.Marca) || [])],
        concesionarios: [...new Set(concesionarios?.map(c => c.Concesionario) || [])],
        combustibles: [...new Set(combustibles?.map(c => c.Combustible) || [])]
      })
    } catch (error) {
      console.error('Error loading options:', error)
    }
  }

  const saveConfig = async () => {
    if (!currentConfig.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('filter_configs')
        .upsert(currentConfig)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Configuración guardada correctamente"
      })

      loadConfigs()
      setCurrentConfig({
        name: '',
        description: '',
        is_active: true,
        disponibilidad_filter: [],
        marca_filter: [],
        precio_min: undefined,
        precio_max: undefined,
        km_min: undefined,
        km_max: undefined,
        libre_siniestros: undefined,
        concesionario_filter: [],
        combustible_filter: [],
        año_min: undefined,
        año_max: undefined,
        dias_stock_min: undefined,
        dias_stock_max: undefined,
        max_vehicles_per_batch: 100,
        auto_process: false
      })
    } catch (error) {
      console.error('Error saving config:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const previewFilter = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('duc_scraper')
        .select('*', { count: 'exact' })

      // Aplicar filtros
      if (currentConfig.disponibilidad_filter.length > 0) {
        query = query.in('Disponibilidad', currentConfig.disponibilidad_filter)
      }

      if (currentConfig.marca_filter.length > 0) {
        query = query.in('Marca', currentConfig.marca_filter)
      }

      if (currentConfig.precio_min) {
        query = query.gte('Precio', currentConfig.precio_min.toString())
      }

      if (currentConfig.precio_max) {
        query = query.lte('Precio', currentConfig.precio_max.toString())
      }

      if (currentConfig.km_min) {
        query = query.gte('KM', currentConfig.km_min.toString())
      }

      if (currentConfig.km_max) {
        query = query.lte('KM', currentConfig.km_max.toString())
      }

      if (currentConfig.libre_siniestros) {
        query = query.eq('Libre de siniestros', 'Sí')
      }

      if (currentConfig.concesionario_filter.length > 0) {
        query = query.in('Concesionario', currentConfig.concesionario_filter)
      }

      if (currentConfig.combustible_filter.length > 0) {
        query = query.in('Combustible', currentConfig.combustible_filter)
      }

      const { count, error } = await query

      if (error) throw error

      setPreviewCount(count || 0)
      toast({
        title: "Vista previa",
        description: `Se encontraron ${count} vehículos con estos filtros`
      })
    } catch (error) {
      console.error('Error previewing filter:', error)
      toast({
        title: "Error",
        description: "No se pudo generar la vista previa",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const processConfig = async (configId: string) => {
    setIsProcessing(true)
    try {
      const result = await processFilterConfig(configId)
      
      if (result.success) {
        toast({
          title: "Procesamiento completado",
          description: `Se procesaron ${result.processed} vehículos. ${result.added} añadidos, ${result.skipped} omitidos, ${result.errors} errores.`
        })
        setProcessingResult(result)
      } else {
        toast({
          title: "Error en el procesamiento",
          description: result.errorMessage || "Error desconocido",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error processing config:', error)
      toast({
        title: "Error",
        description: "No se pudo procesar la configuración",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item)
    } else {
      return [...array, item]
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Filtros</h1>
          <p className="text-muted-foreground">
            Configura filtros para procesar vehículos de duc_scraper a nuevas_entradas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={previewFilter} disabled={isLoading}>
            {isLoading ? 'Procesando...' : 'Vista Previa'}
          </Button>
          {currentConfig.id && (
            <Button 
              onClick={() => processConfig(currentConfig.id!)} 
              disabled={isProcessing}
              variant="default"
            >
              {isProcessing ? 'Procesando...' : 'Procesar Vehículos'}
            </Button>
          )}
        </div>
      </div>

      {previewCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Vista Previa</Badge>
              <span className="text-sm text-muted-foreground">
                Se encontraron {previewCount} vehículos con estos filtros
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {processingResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant={processingResult.success ? "default" : "destructive"}>
                  {processingResult.success ? "Completado" : "Error"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Resultado del procesamiento
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total encontrados:</span>
                  <div className="text-lg font-bold">{processingResult.totalFound}</div>
                </div>
                <div>
                  <span className="font-medium">Procesados:</span>
                  <div className="text-lg font-bold text-blue-600">{processingResult.processed}</div>
                </div>
                <div>
                  <span className="font-medium">Añadidos:</span>
                  <div className="text-lg font-bold text-green-600">{processingResult.added}</div>
                </div>
                <div>
                  <span className="font-medium">Omitidos:</span>
                  <div className="text-lg font-bold text-yellow-600">{processingResult.skipped}</div>
                </div>
              </div>
              {processingResult.errors > 0 && (
                <div className="text-sm text-red-600">
                  Errores: {processingResult.errors}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de configuración */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Configuración</CardTitle>
              <CardDescription>
                Define los filtros para seleccionar vehículos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={currentConfig.name}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        name: e.target.value
                      })}
                      placeholder="Ej: BMW Disponibles"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={currentConfig.description || ''}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        description: e.target.value
                      })}
                      placeholder="Descripción opcional"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={currentConfig.is_active}
                    onCheckedChange={(checked) => setCurrentConfig({
                      ...currentConfig,
                      is_active: checked
                    })}
                  />
                  <Label htmlFor="is_active">Configuración activa</Label>
                </div>
              </div>

              <Separator />

              {/* Filtros principales */}
              <Tabs defaultValue="disponibilidad" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="disponibilidad">Disponibilidad</TabsTrigger>
                  <TabsTrigger value="marca">Marca</TabsTrigger>
                  <TabsTrigger value="precio">Precio/KM</TabsTrigger>
                  <TabsTrigger value="otros">Otros</TabsTrigger>
                </TabsList>

                <TabsContent value="disponibilidad" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Disponibilidad</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableOptions.disponibilidad.map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox
                            id={`disponibilidad-${item}`}
                            checked={currentConfig.disponibilidad_filter.includes(item)}
                            onCheckedChange={() => setCurrentConfig({
                              ...currentConfig,
                              disponibilidad_filter: toggleArrayItem(
                                currentConfig.disponibilidad_filter,
                                item
                              )
                            })}
                          />
                          <Label htmlFor={`disponibilidad-${item}`}>{item}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="marca" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Marcas</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {availableOptions.marcas.map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox
                            id={`marca-${item}`}
                            checked={currentConfig.marca_filter.includes(item)}
                            onCheckedChange={() => setCurrentConfig({
                              ...currentConfig,
                              marca_filter: toggleArrayItem(
                                currentConfig.marca_filter,
                                item
                              )
                            })}
                          />
                          <Label htmlFor={`marca-${item}`}>{item}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="precio" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="precio_min">Precio mínimo (€)</Label>
                      <Input
                        id="precio_min"
                        type="number"
                        value={currentConfig.precio_min || ''}
                        onChange={(e) => setCurrentConfig({
                          ...currentConfig,
                          precio_min: e.target.value ? Number(e.target.value) : undefined
                        })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precio_max">Precio máximo (€)</Label>
                      <Input
                        id="precio_max"
                        type="number"
                        value={currentConfig.precio_max || ''}
                        onChange={(e) => setCurrentConfig({
                          ...currentConfig,
                          precio_max: e.target.value ? Number(e.target.value) : undefined
                        })}
                        placeholder="100000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="km_min">KM mínimo</Label>
                      <Input
                        id="km_min"
                        type="number"
                        value={currentConfig.km_min || ''}
                        onChange={(e) => setCurrentConfig({
                          ...currentConfig,
                          km_min: e.target.value ? Number(e.target.value) : undefined
                        })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="km_max">KM máximo</Label>
                      <Input
                        id="km_max"
                        type="number"
                        value={currentConfig.km_max || ''}
                        onChange={(e) => setCurrentConfig({
                          ...currentConfig,
                          km_max: e.target.value ? Number(e.target.value) : undefined
                        })}
                        placeholder="200000"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="otros" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="libre_siniestros"
                        checked={currentConfig.libre_siniestros || false}
                        onCheckedChange={(checked) => setCurrentConfig({
                          ...currentConfig,
                          libre_siniestros: checked
                        })}
                      />
                      <Label htmlFor="libre_siniestros">Solo libre de siniestros</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Concesionarios</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {availableOptions.concesionarios.map((item) => (
                          <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                              id={`concesionario-${item}`}
                              checked={currentConfig.concesionario_filter.includes(item)}
                              onCheckedChange={() => setCurrentConfig({
                                ...currentConfig,
                                concesionario_filter: toggleArrayItem(
                                  currentConfig.concesionario_filter,
                                  item
                                )
                              })}
                            />
                            <Label htmlFor={`concesionario-${item}`}>{item}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Combustible</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableOptions.combustibles.map((item) => (
                          <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                              id={`combustible-${item}`}
                              checked={currentConfig.combustible_filter.includes(item)}
                              onCheckedChange={() => setCurrentConfig({
                                ...currentConfig,
                                combustible_filter: toggleArrayItem(
                                  currentConfig.combustible_filter,
                                  item
                                )
                              })}
                            />
                            <Label htmlFor={`combustible-${item}`}>{item}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Configuración de procesamiento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuración de Procesamiento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_vehicles">Máximo vehículos por lote</Label>
                    <Input
                      id="max_vehicles"
                      type="number"
                      value={currentConfig.max_vehicles_per_batch}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        max_vehicles_per_batch: Number(e.target.value)
                      })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_process"
                      checked={currentConfig.auto_process}
                      onCheckedChange={(checked) => setCurrentConfig({
                        ...currentConfig,
                        auto_process: checked
                      })}
                    />
                    <Label htmlFor="auto_process">Procesar automáticamente</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCurrentConfig({
                  name: '',
                  description: '',
                  is_active: true,
                  disponibilidad_filter: [],
                  marca_filter: [],
                  precio_min: undefined,
                  precio_max: undefined,
                  km_min: undefined,
                  km_max: undefined,
                  libre_siniestros: undefined,
                  concesionario_filter: [],
                  combustible_filter: [],
                  año_min: undefined,
                  año_max: undefined,
                  dias_stock_min: undefined,
                  dias_stock_max: undefined,
                  max_vehicles_per_batch: 100,
                  auto_process: false
                })}>
                  Limpiar
                </Button>
                <Button onClick={saveConfig} disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de configuraciones guardadas */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Configuraciones Guardadas</CardTitle>
              <CardDescription>
                Configuraciones existentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => setCurrentConfig(config)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {config.description || 'Sin descripción'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge variant={config.is_active ? "default" : "secondary"}>
                          {config.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            processConfig(config.id!)
                          }}
                          disabled={isProcessing}
                        >
                          {isProcessing ? '...' : 'Procesar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {configs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay configuraciones guardadas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 