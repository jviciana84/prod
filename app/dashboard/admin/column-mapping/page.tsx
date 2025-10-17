'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type ColumnMapping = {
  id?: string
  name: string
  duc_scraper_column: string
  nuevas_entradas_column: string
  is_active: boolean
  transformation_rule?: string
  created_at?: string
  updated_at?: string
}

type TableColumn = {
  column_name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
  is_primary_key: boolean
  is_foreign_key: boolean
}

export default function ColumnMappingPage() {
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [currentMapping, setCurrentMapping] = useState<ColumnMapping>({
    name: '',
    duc_scraper_column: '',
    nuevas_entradas_column: '',
    is_active: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [ducScraperColumns, setDucScraperColumns] = useState<string[]>([])
  const [nuevasEntradasColumns, setNuevasEntradasColumns] = useState<TableColumn[]>([])
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()

  // Cargar datos al montar el componente
  useEffect(() => {
    loadMappings()
    loadDucScraperColumns()
    loadNuevasEntradasColumns()
  }, [])

  const loadMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('column_mappings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMappings(data || [])
    } catch (error) {
      console.error('Error loading mappings:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los mapeos",
        variant: "destructive"
      })
    }
  }

  const loadDucScraperColumns = async () => {
    try {
      // Obtener columnas de duc_scraper usando la función get_table_structure
      const { data, error } = await supabase
        .rpc('get_table_structure', { table_name: 'duc_scraper' })

      if (error) throw error
      setDucScraperColumns(data?.map(col => col.column_name) || [])
    } catch (error) {
      console.error('Error loading duc_scraper columns:', error)
      // Fallback: cargar columnas conocidas
      setDucScraperColumns([
        'Matrícula', 'Marca', 'Modelo', 'Combustible', 'Concesionario',
        'Precio', 'KM', 'Fecha fabricación', 'Libre de siniestros',
        'Disponibilidad', 'Días stock', 'Color Carrocería', 'Potencia Cv',
        'Cambio', 'Garantía', 'ID Anuncio', 'URL', 'Fecha compra DMS',
        'Fecha entrada VO', 'Fecha primera matriculación'
      ])
    }
  }

  const loadNuevasEntradasColumns = async () => {
    try {
      // Obtener columnas de nuevas_entradas usando la función get_table_structure
      const { data, error } = await supabase
        .rpc('get_table_structure', { table_name: 'nuevas_entradas' })

      if (error) throw error
      setNuevasEntradasColumns(data || [])
    } catch (error) {
      console.error('Error loading nuevas_entradas columns:', error)
      // Fallback: columnas conocidas
      setNuevasEntradasColumns([
        { column_name: 'license_plate', data_type: 'character varying', is_nullable: false, column_default: null, is_primary_key: false, is_foreign_key: false },
        { column_name: 'model', data_type: 'character varying', is_nullable: false, column_default: null, is_primary_key: false, is_foreign_key: false },
        { column_name: 'vehicle_type', data_type: 'character varying', is_nullable: true, column_default: "'Coche'", is_primary_key: false, is_foreign_key: false },
        { column_name: 'entry_date', data_type: 'timestamp with time zone', is_nullable: true, column_default: 'now()', is_primary_key: false, is_foreign_key: false },
        { column_name: 'reception_date', data_type: 'timestamp with time zone', is_nullable: true, column_default: null, is_primary_key: false, is_foreign_key: false },
        { column_name: 'is_received', data_type: 'boolean', is_nullable: true, column_default: 'false', is_primary_key: false, is_foreign_key: false },
        { column_name: 'status', data_type: 'character varying', is_nullable: true, column_default: "'pendiente'", is_primary_key: false, is_foreign_key: false },
        { column_name: 'expense_charge', data_type: 'character varying', is_nullable: true, column_default: null, is_primary_key: false, is_foreign_key: false },
        { column_name: 'expense_type_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false, is_foreign_key: true },
        { column_name: 'location_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false, is_foreign_key: true },
        { column_name: 'notes', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false, is_foreign_key: false }
      ])
    }
  }

  const saveMapping = async () => {
    if (!currentMapping.name.trim() || !currentMapping.duc_scraper_column || !currentMapping.nuevas_entradas_column) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('column_mappings')
        .upsert(currentMapping)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Mapeo guardado correctamente"
      })

      loadMappings()
      setCurrentMapping({
        name: '',
        duc_scraper_column: '',
        nuevas_entradas_column: '',
        is_active: true
      })
    } catch (error) {
      console.error('Error saving mapping:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el mapeo",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMapping = async (id: string) => {
    try {
      const { error } = await supabase
        .from('column_mappings')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Mapeo eliminado correctamente"
      })

      loadMappings()
    } catch (error) {
      console.error('Error deleting mapping:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el mapeo",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mapeo de Columnas</h1>
        <p className="text-muted-foreground">
          Configura el mapeo de columnas de duc_scraper a nuevas_entradas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Mapeo</CardTitle>
            <CardDescription>
              Define el mapeo entre columnas de duc_scraper y nuevas_entradas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del mapeo *</Label>
              <Input
                id="name"
                value={currentMapping.name}
                onChange={(e) => setCurrentMapping({
                  ...currentMapping,
                  name: e.target.value
                })}
                placeholder="Ej: Matrícula → license_plate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duc_column">Columna de duc_scraper *</Label>
              <Select
                value={currentMapping.duc_scraper_column}
                onValueChange={(value) => setCurrentMapping({
                  ...currentMapping,
                  duc_scraper_column: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una columna de duc_scraper" />
                </SelectTrigger>
                <SelectContent>
                  {ducScraperColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nuevas_column">Columna de nuevas_entradas *</Label>
              <Select
                value={currentMapping.nuevas_entradas_column}
                onValueChange={(value) => setCurrentMapping({
                  ...currentMapping,
                  nuevas_entradas_column: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una columna de nuevas_entradas" />
                </SelectTrigger>
                <SelectContent>
                  {nuevasEntradasColumns.map((column) => (
                    <SelectItem key={column.column_name} value={column.column_name}>
                      <div className="flex items-center space-x-2">
                        <span>{column.column_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {column.data_type}
                        </Badge>
                        {column.is_primary_key && (
                          <Badge variant="default" className="text-xs">PK</Badge>
                        )}
                        {column.is_foreign_key && (
                          <Badge variant="secondary" className="text-xs">FK</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transformation">Regla de transformación (opcional)</Label>
              <Input
                id="transformation"
                value={currentMapping.transformation_rule || ''}
                onChange={(e) => setCurrentMapping({
                  ...currentMapping,
                  transformation_rule: e.target.value
                })}
                placeholder="Ej: CONCAT(marca, ' ', modelo)"
              />
              <p className="text-xs text-muted-foreground">
                Regla SQL para transformar el valor antes de insertarlo
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCurrentMapping({
                name: '',
                duc_scraper_column: '',
                nuevas_entradas_column: '',
                is_active: true
              })}>
                Limpiar
              </Button>
              <Button onClick={saveMapping} disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Mapeo'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Panel de mapeos guardados */}
        <Card>
          <CardHeader>
            <CardTitle>Mapeos Guardados</CardTitle>
            <CardDescription>
              Mapeos de columnas existentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{mapping.name}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">De:</span>
                          <Badge variant="outline">{mapping.duc_scraper_column}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">A:</span>
                          <Badge variant="outline">{mapping.nuevas_entradas_column}</Badge>
                        </div>
                        {mapping.transformation_rule && (
                          <div className="text-xs bg-muted p-1 rounded">
                            <span className="font-medium">Transformación:</span> {mapping.transformation_rule}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant={mapping.is_active ? "default" : "secondary"}>
                        {mapping.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMapping(mapping.id!)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {mappings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay mapeos guardados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información de las tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Columnas de duc_scraper</CardTitle>
            <CardDescription>
              Columnas disponibles en la tabla duc_scraper
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {ducScraperColumns.map((column) => (
                <div key={column} className="text-sm p-1 rounded bg-muted/50">
                  {column}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Columnas de nuevas_entradas</CardTitle>
            <CardDescription>
              Columnas disponibles en la tabla nuevas_entradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {nuevasEntradasColumns.map((column) => (
                <div key={column.column_name} className="text-sm p-1 rounded bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <span>{column.column_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {column.data_type}
                    </Badge>
                    {column.is_primary_key && (
                      <Badge variant="default" className="text-xs">PK</Badge>
                    )}
                    {column.is_foreign_key && (
                      <Badge variant="secondary" className="text-xs">FK</Badge>
                    )}
                    {!column.is_nullable && (
                      <Badge variant="destructive" className="text-xs">NOT NULL</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 