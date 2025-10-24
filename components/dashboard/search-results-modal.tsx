"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Car, Calendar, Euro, User, Phone, Mail, MapPin, Clock, CheckCircle, AlertCircle, Camera, Wrench, FileText, Key, Package, Truck, Tag, BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  type: 'vehicle' | 'sale' | 'delivery' | 'stock' | 'photo' | 'key' | 'document'
  license_plate: string
  model?: string
  brand?: string
  status?: string
  data: Record<string, any>
}

interface SearchResultsModalProps {
  isOpen: boolean
  onClose: () => void
  results: SearchResult[]
  query: string
  isLoading?: boolean
  ducDetails?: any
}

export function SearchResultsModal({ 
  isOpen, 
  onClose, 
  results, 
  query, 
  isLoading = false,
  ducDetails
}: SearchResultsModalProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vehicle': return <Car className="h-4 w-4" />
      case 'sale': return <Euro className="h-4 w-4" />
      case 'delivery': return <Truck className="h-4 w-4" />
      case 'stock': return <Package className="h-4 w-4" />
      case 'photo': return <Camera className="h-4 w-4" />
      case 'key': return <Key className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      default: return <Car className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vehicle': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600'
      case 'sale': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600'
      case 'delivery': return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-600'
      case 'stock': return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600'
      case 'photo': return 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-600'
      case 'key': return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600'
      case 'document': return 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-600'
      default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const getTypeBorderColor = (type: string) => {
    switch (type) {
      case 'vehicle': return 'border-l-blue-500'
      case 'sale': return 'border-l-green-500'
      case 'delivery': return 'border-l-purple-500'
      case 'stock': return 'border-l-orange-500'
      case 'photo': return 'border-l-pink-500'
      case 'key': return 'border-l-yellow-500'
      case 'document': return 'border-l-indigo-500'
      default: return 'border-l-gray-500'
    }
  }

  const getTypeTranslation = (type: string) => {
    switch (type) {
      case 'vehicle': return 'VEHÍCULO'
      case 'sale': return 'VENTA'
      case 'delivery': return 'ENTREGA'
      case 'stock': return 'STOCK'
      case 'photo': return 'FOTO'
      case 'key': return 'LLAVE'
      case 'document': return 'DOCUMENTO'
      default: return type.toUpperCase()
    }
  }

  const getStatusTranslation = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'Completado'
      case 'pending': return 'Pendiente'
      case 'in_progress': return 'En Proceso'
      case 'delivered': return 'Entregado'
      case 'sold': return 'Vendido'
      case 'available': return 'Disponible'
      case 'reserved': return 'Reservado'
      case 'in_workshop': return 'En Taller'
      case 'validated': return 'Validado'
      case 'photos_taken': return 'Fotos Tomadas'
      case 'financed': return 'Financiado'
      case 'cash': return 'Efectivo'
      default: return status
    }
  }

  const getFieldIcon = (fieldKey: string) => {
    const key = fieldKey.toLowerCase()
    if (key.includes('fecha') || key.includes('date')) return <Calendar className="h-3 w-3 text-blue-500" />
    if (key.includes('precio') || key.includes('price') || key.includes('euro')) return <Euro className="h-3 w-3 text-green-500" />
    if (key.includes('cliente') || key.includes('client') || key.includes('nombre')) return <User className="h-3 w-3 text-purple-500" />
    if (key.includes('teléfono') || key.includes('phone')) return <Phone className="h-3 w-3 text-orange-500" />
    if (key.includes('email') || key.includes('mail')) return <Mail className="h-3 w-3 text-cyan-500" />
    if (key.includes('días') || key.includes('days')) return <Clock className="h-3 w-3 text-yellow-500" />
    if (key.includes('mecánica') || key.includes('mechanical')) return <Wrench className="h-3 w-3 text-red-500" />
    if (key.includes('pintura') || key.includes('paint')) return <Wrench className="h-3 w-3 text-pink-500" />
    if (key.includes('foto') || key.includes('photo')) return <Camera className="h-3 w-3 text-indigo-500" />
    if (key.includes('estado') || key.includes('status')) return <CheckCircle className="h-3 w-3 text-emerald-500" />
    if (key.includes('comercial') || key.includes('commercial')) return <User className="h-3 w-3 text-violet-500" />
    if (key.includes('descuento') || key.includes('discount')) return <Euro className="h-3 w-3 text-lime-500" />
    if (key.includes('financiado') || key.includes('financed')) return <Euro className="h-3 w-3 text-teal-500" />
    if (key.includes('dirección') || key.includes('address')) return <MapPin className="h-3 w-3 text-amber-500" />
    if (key.includes('modelo') || key.includes('model')) return <Car className="h-3 w-3 text-slate-500" />
    if (key.includes('marca') || key.includes('brand')) return <Car className="h-3 w-3 text-gray-500" />
    if (key.includes('asesor') || key.includes('advisor')) return <User className="h-3 w-3 text-rose-500" />
    return <FileText className="h-3 w-3 text-gray-400" />
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completado':
      case 'entregado':
      case 'finalizado':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pendiente':
      case 'en proceso':
      case 'en progreso':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'error':
      case 'incidencia':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'N/A'
    
    // Formatear fechas en formato español
    if (key.toLowerCase().includes('fecha') || key.toLowerCase().includes('date') || key.toLowerCase().includes('_at') || key.toLowerCase().includes('created') || key.toLowerCase().includes('updated') || key.toLowerCase().includes('time')) {
      try {
        let date: Date
        
        if (typeof value === 'string') {
          // Limpiar string y parsear
          const cleanValue = value.trim()
          date = new Date(cleanValue)
        } else if (value instanceof Date) {
          date = value
        } else if (typeof value === 'number') {
          // Timestamp
          date = new Date(value)
        } else {
          return String(value)
        }
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
          return String(value)
        }
        
        // Formato español: DD/MM/YYYY
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch (error) {
        return String(value)
      }
    }
    
    // Formatear precios
    if (key.includes('precio') || key.includes('price') || key.includes('total')) {
      if (typeof value === 'number') {
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR'
        }).format(value)
      }
    }
    
    // Formatear arrays
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    
    return String(value)
  }

  const getDisplayFields = (result: SearchResult) => {
    const fields = []
    const data = result.data
    
    // Campos comunes
    if (data.model) fields.push({ key: 'Modelo', value: data.model })
    if (data.brand) fields.push({ key: 'Marca', value: data.brand })
    if (data.advisor || data.asesor) fields.push({ key: 'Asesor', value: data.advisor || data.asesor })
    if (data.price || data.precio) fields.push({ key: 'Precio', value: data.price || data.precio })
    if (data.sale_date || data.fecha_venta) fields.push({ key: 'Fecha Venta', value: data.sale_date || data.fecha_venta })
    if (data.delivery_date || data.fecha_entrega) fields.push({ key: 'Fecha Entrega', value: data.delivery_date || data.fecha_entrega })
    
    // Campos específicos por tipo
    switch (result.type) {
      case 'sale':
        if (data.payment_method) fields.push({ key: 'Forma Pago', value: data.payment_method })
        if (data.discount || data.descuento) fields.push({ key: 'Descuento', value: data.discount || data.descuento })
        if (data.cyp_status) fields.push({ key: 'Estado Mecánica', value: data.cyp_status })
        if (data.photo_360_status) fields.push({ key: 'Estado Fotos', value: data.photo_360_status })
        break
      case 'delivery':
        if (data.incidencia) fields.push({ key: 'Incidencia', value: data.incidencia ? 'Sí' : 'No' })
        if (data.tipos_incidencia) fields.push({ key: 'Tipos Incidencia', value: data.tipos_incidencia })
        break
      case 'stock':
        if (data.paint_status) fields.push({ key: 'Estado Pintura', value: data.paint_status })
        if (data.mechanical_status) fields.push({ key: 'Estado Mecánica', value: data.mechanical_status })
        if (data.body_status) fields.push({ key: 'Estado Carrocería', value: data.body_status })
        break
      case 'photo':
        if (data.photos_completed) fields.push({ key: 'Fotos Completadas', value: data.photos_completed ? 'Sí' : 'No' })
        if (data.estado_pintura) fields.push({ key: 'Estado Pintura', value: data.estado_pintura })
        break
    }
    
    // Datos del cliente
    if (data.client_name || data.nombre_cliente) fields.push({ key: 'Cliente', value: data.client_name || data.nombre_cliente })
    if (data.client_email || data.email_cliente) fields.push({ key: 'Email', value: data.client_email || data.email_cliente })
    if (data.client_phone || data.telefono_cliente) fields.push({ key: 'Teléfono', value: data.client_phone || data.telefono_cliente })
    
    return fields
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="text-xl font-bold">
            Resultados de búsqueda
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Búsqueda: <span className="font-medium text-foreground">"{query}"</span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
              <span className="ml-3 text-muted-foreground">Buscando...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-sm text-muted-foreground">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}</span>
              </div>
              
              {/* CARD DE DUC - PRIMERO */}
              {ducDetails ? (
                <Card className="border-l-4 border-l-cyan-500 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full border-2 bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-0.5">
                            <Badge 
                              variant="secondary" 
                              className="text-xs border-l-4 border-l-cyan-500 px-1.5 py-0.5"
                            >
                              DUC
                            </Badge>
                            {ducDetails.Disponibilidad && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground lowercase">
                                  {ducDetails.Disponibilidad}
                                </span>
                              </div>
                            )}
                          </div>
                          <CardTitle className="text-base">
                            {ducDetails.Matrícula || results[0]?.license_plate || "N/A"}
                          </CardTitle>
                        </div>
                      </div>
                      {ducDetails.Precio && (
                        <div className="text-base font-normal flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <span className="font-bold">Precio:</span> {(() => {
                            const precio = ducDetails.Precio.toString().replace(/[^\d,.-]/g, '')
                            const numero = parseFloat(precio.replace(',', '.'))
                            return isNaN(numero) ? ducDetails.Precio : new Intl.NumberFormat('es-ES', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }).format(numero) + ' €'
                          })()}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      {/* 60% - SUBCARD CON DOS COLUMNAS DE DATOS */}
                      <div className="w-[60%]">
                        <Card className="border border-border/50">
                          <CardHeader className="pb-2 pt-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-cyan-500" />
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Información completa DUC
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="px-3 pt-2 pb-3">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {/* Columna 1 - Siguiendo orden de imagen */}
                        <div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Creado DUC:</span>
                            <span className="ml-1 font-normal">{ducDetails["Fecha creación"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Modificado DUC:</span>
                            <span className="ml-1 font-normal">{ducDetails["Fecha modificación"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Días creado:</span>
                            <span className="ml-1 font-normal">{ducDetails["Días creado"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Primera publicación:</span>
                            <span className="ml-1 font-normal">{ducDetails["Fecha primera publicación"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Días publicado:</span>
                            <span className="ml-1 font-normal">{ducDetails["Días publicado"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Referencia:</span>
                            <span className="ml-1 font-normal text-[10px]">{ducDetails["Referencia"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Referencia cliente:</span>
                            <span className="ml-1 font-normal text-[10px]">{ducDetails["Referencia interna"] || ducDetails["Chasis"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Creado con:</span>
                            <span className="ml-1 font-normal text-[10px]">{ducDetails["Creado con"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Compra DMS:</span>
                            <span className="ml-1 font-normal">{ducDetails["Fecha compra DMS"] || "-"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Días stock:</span>
                            <span className="ml-1 font-normal">{ducDetails["Días stock"] || "N/A"}</span>
                          </div>
                        </div>
                        
                        {/* Columna 2 - Siguiendo orden de imagen */}
                        <div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Fecha fabricación:</span>
                            <span className="ml-1 font-normal">{ducDetails["Fecha fabricación"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">1ª matriculación:</span>
                            <span className="ml-1 font-normal">{ducDetails["Fecha primera matriculación"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Km:</span>
                            <span className="ml-1 font-normal">{ducDetails["KM"] ? new Intl.NumberFormat('es-ES').format(parseFloat(String(ducDetails["KM"]).replace(/[^\d]/g, ''))) : "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Matrícula:</span>
                            <span className="ml-1 font-normal">{ducDetails["Matrícula"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Chasis:</span>
                            <span className="ml-1 font-normal text-[10px]">{ducDetails["Chasis"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Color:</span>
                            <span className="ml-1 font-normal">{ducDetails["Color Carrocería"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Combustible:</span>
                            <span className="ml-1 font-normal">{ducDetails["Combustible"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Tipo motor:</span>
                            <span className="ml-1 font-normal text-[10px]">{ducDetails["Tipo motor"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Distintivo ambiental:</span>
                            <span className="ml-1 font-normal text-[10px]">{ducDetails["Distintivo ambiental"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Cambio:</span>
                            <span className="ml-1 font-normal">{ducDetails["Cambio"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Régimen fiscal:</span>
                            <span className="ml-1 font-normal text-[10px]">{ducDetails["Regimen fiscal"] || "N/A"}</span>
                          </div>
                          <div className="mb-0.5">
                            <span className="font-bold text-cyan-500">Precio nuevo:</span>
                            <span className="ml-1 font-normal">
                              {ducDetails["Precio vehículo nuevo"] ? 
                                new Intl.NumberFormat('es-ES').format(parseFloat(String(ducDetails["Precio vehículo nuevo"]).replace(/[^\d,.-]/g, '').replace(',', '.'))) + ' €' 
                                : "N/A"
                              }
                            </span>
                          </div>
                        </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* 40% - IMAGEN */}
                      <div className="w-[40%] flex items-stretch">
                        {ducDetails["URL foto 1"] ? (
                          <img 
                            src={ducDetails["URL foto 1"]} 
                            alt="Vehículo" 
                            className="w-full h-full rounded-lg border border-border object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESin imagen%3C/text%3E%3C/svg%3E'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground border border-border">
                            <Camera className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                results.length > 0 && (
                  <Card className="border-l-4 border-l-gray-400">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full border-2 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-0.5">
                            <Badge 
                              variant="secondary" 
                              className="text-xs border-l-4 border-l-gray-500 px-1.5 py-0.5"
                            >
                              DUC
                            </Badge>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-xs text-red-500">
                                No está en DUC
                              </span>
                            </div>
                          </div>
                          <CardTitle className="text-base">
                            {results[0]?.license_plate || "N/A"}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )
              )}
              
              <div className="space-y-2">
                {results.map((result, index) => {
                  if (index === 0) {
                    // Primer resultado - ancho completo
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={cn(
                          "hover:shadow-lg transition-all duration-300 border-l-4",
                          getTypeBorderColor(result.type)
                        )}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "p-1.5 rounded-full border-2",
                                  getTypeColor(result.type)
                                )}>
                                  {getTypeIcon(result.type)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "text-xs border-l-4 px-1.5 py-0.5",
                                        getTypeBorderColor(result.type)
                                      )}
                                    >
                                      {getTypeTranslation(result.type)}
                                    </Badge>
                                    {result.status && (
                                      <div className="flex items-center gap-1">
                                        {getStatusIcon(result.status)}
                                        <span className="text-xs text-muted-foreground">
                                          {getStatusTranslation(result.status)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <CardTitle className="text-base">
                                    {result.license_plate}
                                  </CardTitle>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            <div className="space-y-1.5">
                              {(() => {
                                const fields = getDisplayFields(result)
                                if (fields.length === 0) return null
                                
                                const firstField = fields[0]
                                const secondField = fields[1]
                                const remainingFields = fields.slice(2)
                                
                                return (
                                  <>
                                    {/* Todos los campos organizados en filas */}
                                    <div className="flex flex-wrap gap-2">
                                      {/* Primer campo */}
                                      <div className="bg-muted/30 rounded-md p-3 border border-border/30 hover:bg-muted/50 transition-colors min-w-[140px] max-w-[200px] flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          {getFieldIcon(firstField.key)}
                                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            {firstField.key}
                                          </span>
                                        </div>
                                        <div className="text-sm font-bold text-foreground break-words" title={String(firstField.value)}>
                                          {formatValue(firstField.key, firstField.value)}
                                        </div>
                                      </div>
                                      
                                      {/* Segundo campo */}
                                      {secondField && (
                                        <div className="bg-muted/30 rounded-md p-3 border border-border/30 hover:bg-muted/50 transition-colors min-w-[140px] max-w-[200px] flex-1">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            {getFieldIcon(secondField.key)}
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                              {secondField.key}
                                            </span>
                                          </div>
                                          <div className="text-sm font-bold text-foreground break-words" title={String(secondField.value)}>
                                            {formatValue(secondField.key, secondField.value)}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Resto de campos */}
                                      {remainingFields.map((field, index) => (
                                        <div key={index + 2} className="bg-muted/30 rounded-md p-3 border border-border/30 hover:bg-muted/50 transition-colors min-w-[140px] max-w-[200px] flex-1">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            {getFieldIcon(field.key)}
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                              {field.key}
                                            </span>
                                          </div>
                                          <div className="text-sm font-bold text-foreground break-words" title={String(field.value)}>
                                            {formatValue(field.key, field.value)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )
                              })()}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  } else {
                    // Resto de resultados - de dos en dos
                    const remainingResults = results.slice(1)
                    if (index === 1) {
                      return (
                        <div key="remaining-results" className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                          {remainingResults.map((remainingResult, remainingIndex) => (
                            <motion.div
                              key={remainingResult.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (remainingIndex + 1) * 0.1 }}
                            >
                              <Card className={cn(
                                "hover:shadow-lg transition-all duration-300 border-l-4 h-full",
                                getTypeBorderColor(remainingResult.type)
                              )}>
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={cn(
                                        "p-1.5 rounded-full border-2",
                                        getTypeColor(remainingResult.type)
                                      )}>
                                        {getTypeIcon(remainingResult.type)}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1 mb-0.5">
                                          <Badge 
                                            variant="secondary" 
                                            className={cn(
                                              "text-xs border-l-4 px-1.5 py-0.5",
                                              getTypeBorderColor(remainingResult.type)
                                            )}
                                          >
                                            {getTypeTranslation(remainingResult.type)}
                                          </Badge>
                                          {remainingResult.status && (
                                            <div className="flex items-center gap-1">
                                              {getStatusIcon(remainingResult.status)}
                                              <span className="text-xs text-muted-foreground">
                                                {getStatusTranslation(remainingResult.status)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <CardTitle className="text-base">
                                          {remainingResult.license_plate}
                                        </CardTitle>
                                      </div>
                                    </div>
                                  </div>
                                </CardHeader>
                                
                                <CardContent className="pt-0">
                                  <div className="space-y-1.5">
                                    {(() => {
                                      const fields = getDisplayFields(remainingResult)
                                      if (fields.length === 0) return null
                                      
                                      const firstField = fields[0]
                                      const secondField = fields[1]
                                      const remainingFields = fields.slice(2)
                                      
                                      return (
                                        <>
                                          {/* Todos los campos organizados en filas */}
                                          <div className="flex flex-wrap gap-2">
                                            {/* Primer campo */}
                                            <div className="bg-muted/30 rounded-md p-3 border border-border/30 hover:bg-muted/50 transition-colors min-w-[140px] max-w-[200px] flex-1">
                                              <div className="flex items-center gap-1.5 mb-1">
                                                {getFieldIcon(firstField.key)}
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                  {firstField.key}
                                                </span>
                                              </div>
                                              <div className="text-sm font-bold text-foreground break-words" title={String(firstField.value)}>
                                                {formatValue(firstField.key, firstField.value)}
                                              </div>
                                            </div>
                                            
                                            {/* Segundo campo */}
                                            {secondField && (
                                              <div className="bg-muted/30 rounded-md p-3 border border-border/30 hover:bg-muted/50 transition-colors min-w-[140px] max-w-[200px] flex-1">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                  {getFieldIcon(secondField.key)}
                                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                    {secondField.key}
                                                  </span>
                                                </div>
                                                <div className="text-sm font-bold text-foreground break-words" title={String(secondField.value)}>
                                                  {formatValue(secondField.key, secondField.value)}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* Resto de campos */}
                                            {remainingFields.map((field, index) => (
                                              <div key={index + 2} className="bg-muted/30 rounded-md p-3 border border-border/30 hover:bg-muted/50 transition-colors min-w-[140px] max-w-[200px] flex-1">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                  {getFieldIcon(field.key)}
                                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                    {field.key}
                                                  </span>
                                                </div>
                                                <div className="text-sm font-bold text-foreground break-words" title={String(field.value)}>
                                                  {formatValue(field.key, field.value)}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </>
                                      )
                                    })()}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
