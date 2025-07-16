"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Database, 
  Type, 
  Key, 
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react"

interface ColumnasExistentesProps {
  nuevasEntradasColumns: any[]
  stockColumns: any[]
}

export default function ColumnasExistentes({ nuevasEntradasColumns, stockColumns }: ColumnasExistentesProps) {
  
  const getTypeIcon = (dataType: string) => {
    switch (dataType?.toLowerCase()) {
      case 'integer':
      case 'bigint':
        return <span className="text-blue-600">🔢</span>
      case 'text':
      case 'varchar':
      case 'character varying':
        return <span className="text-green-600">📝</span>
      case 'boolean':
        return <span className="text-purple-600">✅</span>
      case 'timestamp':
      case 'timestamptz':
      case 'date':
        return <span className="text-orange-600">📅</span>
      case 'numeric':
      case 'decimal':
        return <span className="text-red-600">💰</span>
      default:
        return <span className="text-gray-600">❓</span>
    }
  }

  const getTypeBadge = (dataType: string) => {
    const type = dataType?.toLowerCase() || ''
    if (type.includes('int')) return <Badge variant="outline" className="text-blue-600">Número</Badge>
    if (type.includes('text') || type.includes('varchar') || type.includes('character')) return <Badge variant="outline" className="text-green-600">Texto</Badge>
    if (type.includes('bool')) return <Badge variant="outline" className="text-purple-600">Booleano</Badge>
    if (type.includes('timestamp') || type.includes('date')) return <Badge variant="outline" className="text-orange-600">Fecha</Badge>
    if (type.includes('numeric') || type.includes('decimal')) return <Badge variant="outline" className="text-red-600">Decimal</Badge>
    return <Badge variant="outline" className="text-gray-600">Otro</Badge>
  }

  const getConstraintBadge = (column: any) => {
    const badges = []
    
    if (column.is_nullable === false) {
      badges.push(<Badge key="not-null" variant="destructive" className="text-xs">Requerido</Badge>)
    }
    
    if (column.column_default) {
      badges.push(<Badge key="default" variant="secondary" className="text-xs">Por defecto</Badge>)
    }
    
    if (column.is_primary_key) {
      badges.push(<Badge key="primary" variant="default" className="text-xs">Clave primaria</Badge>)
    }
    
    if (column.is_foreign_key) {
      badges.push(<Badge key="foreign" variant="outline" className="text-xs">Clave foránea</Badge>)
    }
    
    return badges
  }

  return (
    <div className="space-y-6">
      {/* Tabla nuevas_entradas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            Tabla: nuevas_entradas
          </CardTitle>
          <CardDescription>
            Estructura actual de la tabla nuevas_entradas ({nuevasEntradasColumns.length} columnas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Columna</TableHead>
                  <TableHead className="w-[150px]">Tipo</TableHead>
                  <TableHead className="w-[100px]">Requerido</TableHead>
                  <TableHead className="w-[200px]">Valor por defecto</TableHead>
                  <TableHead className="w-[150px]">Restricciones</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nuevasEntradasColumns.map((column, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {column.is_primary_key && <Key className="h-4 w-4 text-yellow-600" />}
                        {column.is_foreign_key && <Database className="h-4 w-4 text-blue-600" />}
                        {column.column_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(column.data_type)}
                        <span className="text-sm">{column.data_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {column.is_nullable === false ? (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          <span className="text-xs text-red-600">Sí</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">No</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {column.column_default ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {column.column_default}
                        </code>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getConstraintBadge(column)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {column.column_name === 'id' && 'Identificador único del registro'}
                        {column.column_name === 'brand' && 'Marca del vehículo'}
                        {column.column_name === 'model' && 'Modelo del vehículo'}
                        {column.column_name === 'license_plate' && 'Matrícula del vehículo'}
                        {column.column_name === 'purchase_date' && 'Fecha de compra del vehículo'}
                        {column.column_name === 'reception_date' && 'Fecha de recepción del vehículo'}
                        {column.column_name === 'origin_location_id' && 'ID de la sede de origen'}
                        {column.column_name === 'expense_type_id' && 'ID del tipo de gasto'}
                        {column.column_name === 'is_received' && 'Indica si el vehículo ha sido recibido'}
                        {column.column_name === 'notes' && 'Notas adicionales sobre el vehículo'}
                        {column.column_name === 'created_at' && 'Fecha de creación del registro'}
                        {column.column_name === 'updated_at' && 'Fecha de última actualización'}
                        {!['id', 'brand', 'model', 'license_plate', 'purchase_date', 'reception_date', 'origin_location_id', 'expense_type_id', 'is_received', 'notes', 'created_at', 'updated_at'].includes(column.column_name) && 'Columna personalizada'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tabla stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Tabla: stock
          </CardTitle>
          <CardDescription>
            Estructura actual de la tabla stock ({stockColumns.length} columnas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Columna</TableHead>
                  <TableHead className="w-[150px]">Tipo</TableHead>
                  <TableHead className="w-[100px]">Requerido</TableHead>
                  <TableHead className="w-[200px]">Valor por defecto</TableHead>
                  <TableHead className="w-[150px]">Restricciones</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockColumns.map((column, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {column.is_primary_key && <Key className="h-4 w-4 text-yellow-600" />}
                        {column.is_foreign_key && <Database className="h-4 w-4 text-blue-600" />}
                        {column.column_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(column.data_type)}
                        <span className="text-sm">{column.data_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {column.is_nullable === false ? (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          <span className="text-xs text-red-600">Sí</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">No</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {column.column_default ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {column.column_default}
                        </code>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getConstraintBadge(column)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {column.column_name === 'id' && 'Identificador único del registro'}
                        {column.column_name === 'vehicle_id' && 'ID del vehículo relacionado'}
                        {column.column_name === 'status' && 'Estado del vehículo en stock'}
                        {column.column_name === 'location_id' && 'ID de la ubicación del vehículo'}
                        {column.column_name === 'price' && 'Precio del vehículo'}
                        {column.column_name === 'created_at' && 'Fecha de creación del registro'}
                        {column.column_name === 'updated_at' && 'Fecha de última actualización'}
                        {!['id', 'vehicle_id', 'status', 'location_id', 'price', 'created_at', 'updated_at'].includes(column.column_name) && 'Columna personalizada'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 