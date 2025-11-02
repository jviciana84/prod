"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { ImageLightbox } from "@/components/tasaciones/image-lightbox"
import { DamageDisplayByView } from "@/components/tasaciones/damage-display-by-view"
import { useToast } from "@/hooks/use-toast"
import { 
  Search, 
  MapPin, 
  Image as ImageIcon,
  Download,
  ExternalLink,
  ClipboardList,
  Copy,
  Check,
  FileText,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { generateAndDownloadPDF } from "@/app/tasacion/utils/generatePDF"
import type { TasacionFormData } from "@/types/tasacion"

export default function TasacionesPage() {
  const { toast } = useToast()
  const [tasaciones, setTasaciones] = useState<any[]>([])
  const [selectedTasacion, setSelectedTasacion] = useState<any>(null)
  const [fotos, setFotos] = useState<any>(null)
  const [advisorLink, setAdvisorLink] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [copied, setCopied] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<any[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [downloadingPhotos, setDownloadingPhotos] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [activeTab, setActiveTab] = useState("sin_tramitar")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Seleccionar automáticamente la última tasación al cargar
    if (tasaciones.length > 0 && !selectedTasacion) {
      loadDetails(tasaciones[0].id)
    }
  }, [tasaciones])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/tasaciones/list")
      if (!response.ok) throw new Error("Error")
      const { data } = await response.json()
      
      console.log('📋 Tasaciones cargadas:', data.tasaciones?.length || 0)
      console.log('📋 Ejemplo primera tasación:', data.tasaciones?.[0] ? {
        matricula: data.tasaciones[0].matricula,
        tramitada: data.tasaciones[0].tramitada
      } : 'No hay tasaciones')
      console.log('📋 Tramitadas:', data.tasaciones?.filter((t: any) => t.tramitada).length || 0)
      console.log('📋 Sin tramitar:', data.tasaciones?.filter((t: any) => !t.tramitada).length || 0)
      
      setTasaciones(data.tasaciones || [])
      setAdvisorLink(data.advisorLink)
      setIsAdmin(data.isAdmin || false)
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las tasaciones", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadDetails = async (tasacionId: string) => {
    setLoadingDetails(true)
    try {
      const response = await fetch(`/api/tasaciones/details/${tasacionId}`)
      if (!response.ok) throw new Error("Error")
      const data = await response.json()
      
      console.log('🔍 Detalles cargados para:', data.tasacion?.matricula, 'tramitada:', data.tasacion?.tramitada)
      
      setSelectedTasacion(data.tasacion)
      setFotos(data.fotos)
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los detalles", variant: "destructive" })
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast({ title: "✓ Copiado", description: "Enlace copiado al portapapeles" })
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredTasaciones = tasaciones.filter(t => {
    const matchesSearch = 
      t.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = 
      (activeTab === "sin_tramitar" && !t.tramitada) ||
      (activeTab === "tramitadas" && t.tramitada)
    
    return matchesSearch && matchesTab
  })

  const getGoogleMapsLink = (geo: any) => {
    if (!geo?.latitude || !geo?.longitude) return null
    return `https://www.google.com/maps?q=${geo.latitude},${geo.longitude}`
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      vehiculo: "Vehículo",
      cuentakm: "Cuentakilómetros",
      interior_delantero: "Interior Delantero",
      interior_trasero: "Interior Trasero",
      documentacion: "Documentación",
      otras: "Otras",
    }
    return labels[category] || category
  }

  const handleOpenLightbox = (allImages: any[], startIndex: number) => {
    setLightboxImages(allImages)
    setLightboxIndex(startIndex)
    setLightboxOpen(true)
  }

  const handleDownloadPhotos = async () => {
    if (!selectedTasacion || !fotos) return
    
    setDownloadingPhotos(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      const allPhotos = Object.values(fotos).flat() as any[]
      
      if (allPhotos.length === 0) {
        toast({ title: "Sin fotos", description: "No hay fotos para descargar" })
        return
      }
      
      toast({ title: "📥 Preparando ZIP...", description: `Descargando ${allPhotos.length} foto(s)` })
      
      // Descargar todas las fotos y agregarlas al ZIP
      for (let i = 0; i < allPhotos.length; i++) {
        const foto = allPhotos[i]
        try {
          const response = await fetch(foto.url)
          const blob = await response.blob()
          
          // Nombre del archivo con categoría
          const filename = `${foto.categoria}/${selectedTasacion.matricula}_${foto.categoria}_${i + 1}.jpg`
          zip.file(filename, blob)
        } catch (err) {
          console.error("Error descargando foto:", err)
        }
      }
      
      toast({ title: "📦 Generando ZIP...", description: "Comprimiendo fotos" })
      
      // Generar el ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" })
      
      // Descargar el ZIP
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fotos_${selectedTasacion.matricula}_${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({ title: "✓ Completado", description: `ZIP con ${allPhotos.length} foto(s) descargado` })
    } catch (error) {
      console.error("Error en handleDownloadPhotos:", error)
      toast({ title: "Error", description: "Error al descargar las fotos", variant: "destructive" })
    } finally {
      setDownloadingPhotos(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedTasacion || !fotos) return
    
    setDownloadingPDF(true)
    try {
      // Convertir datos de Supabase al formato TasacionFormData
      const fotosVehiculo: Record<string, string> = {}
      const fotosDocumentacion: Record<string, string> = {}
      const fotosOtras: string[] = []
      
      // Mapear fotos por categoría
      if (fotos.vehiculo) {
        fotos.vehiculo.forEach((foto: any, idx: number) => {
          fotosVehiculo[`foto${idx + 1}`] = foto.url
        })
      }
      
      if (fotos.documentacion) {
        fotos.documentacion.forEach((foto: any, idx: number) => {
          fotosDocumentacion[`doc${idx + 1}`] = foto.url
        })
      }
      
      if (fotos.otras) {
        fotos.otras.forEach((foto: any) => {
          fotosOtras.push(foto.url)
        })
      }
      
      const tasacionData: TasacionFormData = {
        // Campos requeridos del formulario
        recaptchaToken: '',
        permisosAceptados: true,
        
        // Datos básicos
        matricula: selectedTasacion.matricula || '',
        kmActuales: selectedTasacion.kilometraje || 0,
        procedencia: 'particular' as const,
        fechaMatriculacion: selectedTasacion.ano ? `01/01/${selectedTasacion.ano}` : '',
        fechaMatriculacionConfirmada: true,
        
        // Marca/Modelo
        marca: selectedTasacion.marca || '',
        modelo: selectedTasacion.modelo || '',
        version: selectedTasacion.version || '',
        combustible: (selectedTasacion.combustible || 'gasolina') as any,
        transmision: (selectedTasacion.tipo_cambio || 'manual') as any,
        segundaLlave: false,
        elementosDestacables: selectedTasacion.elementos_destacables,
        
        // Estado estético
        danosExteriores: selectedTasacion.danos_exteriores || [],
        danosInteriores: selectedTasacion.danos_interiores || [],
        
        // Estado mecánico
        estadoMotor: 'bueno' as const,
        estadoDireccion: 'bueno' as const,
        estadoFrenos: 'bueno' as const,
        estadoCajaCambios: 'bueno' as const,
        estadoTransmision: 'bueno' as const,
        estadoEmbrague: 'bueno' as const,
        estadoGeneral: (selectedTasacion.estado_general || 'bueno') as any,
        danoEstructural: selectedTasacion.dano_estructural || false,
        danoEstructuralDetalle: selectedTasacion.dano_estructural ? 'Daño estructural detectado' : undefined,
        
        // Testigos
        testigosEncendidos: (selectedTasacion.testigos_encendidos || []) as any,
        
        // Datos adicionales
        origenVehiculo: (selectedTasacion.origen_vehiculo || 'nacional') as any,
        documentosKm: (selectedTasacion.documentos_km || ['ninguno']) as any,
        comproNuevo: selectedTasacion.comprado_nuevo || false,
        color: 'gris' as const,
        movilidad: (selectedTasacion.movilidad_transporte || 'total') as any,
        servicioPublico: (selectedTasacion.servicio_publico || 'ninguno') as any,
        etiquetaMedioambiental: 'c' as const,
        itvEnVigor: true,
        observaciones: selectedTasacion.observaciones,
        
        // Fotos vehículo
        fotosVehiculo: {
          frontal: fotosVehiculo['foto1'],
          lateralDelanteroIzq: fotosVehiculo['foto2'],
          lateralTraseroIzq: fotosVehiculo['foto3'],
          trasera: fotosVehiculo['foto4'],
          lateralTraseroDer: fotosVehiculo['foto5'],
          lateralDelanteroDer: fotosVehiculo['foto6'],
          interiorDelantero: fotos.interior_delantero?.[0]?.url,
          interiorTrasero: fotos.interior_trasero?.[0]?.url,
        },
        
        // Fotos documentación
        fotosDocumentacion: {
          permisoCirculacionFrente: fotosDocumentacion['doc1'],
          permisoCirculacionDorso: fotosDocumentacion['doc2'],
          fichaTecnicaFrente: fotosDocumentacion['doc3'],
          fichaTecnicaDorso: fotosDocumentacion['doc4'],
        },
        fotosOtras,
        
        // Metadata
        metadata: {
          ip: selectedTasacion.metadata?.ip || '',
          geolocalizacion: selectedTasacion.metadata?.geolocalizacion,
          dispositivo: selectedTasacion.metadata?.dispositivo || {
            userAgent: '',
            platform: '',
            idioma: 'es'
          },
          timestamp: selectedTasacion.created_at
        }
      }
      
      toast({ 
        title: "📄 Generando PDF...", 
        description: "Esto puede tardar unos segundos" 
      })
      
      const result = await generateAndDownloadPDF({
        data: tasacionData,
        metadata: tasacionData.metadata,
        tasacionId: selectedTasacion.id,
        filename: `tasacion_${selectedTasacion.matricula}_${Date.now()}.pdf`
      })
      
      if (result.success) {
        toast({ 
          title: "✓ PDF descargado", 
          description: "El informe se ha descargado correctamente" 
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error generando PDF:", error)
      toast({ 
        title: "Error", 
        description: "No se pudo generar el PDF", 
        variant: "destructive" 
      })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleToggleTramitada = async (tasacionId: string, tramitada: boolean) => {
    try {
      console.log('🔄 Actualizando tasación:', tasacionId, 'tramitada:', tramitada)
      
      const response = await fetch("/api/tasaciones/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasacion_id: tasacionId, tramitada })
      })

      const result = await response.json()
      console.log('📥 Respuesta del servidor:', result)

      if (!response.ok) {
        console.error('❌ Error en la respuesta:', result)
        throw new Error(result.error || "Error")
      }

      console.log('✅ Tasación actualizada correctamente')
      
      toast({ 
        title: "✓ Actualizado", 
        description: tramitada ? "Tasación marcada como tramitada" : "Tasación marcada como pendiente" 
      })

      // Recargar datos
      console.log('🔄 Recargando lista de tasaciones...')
      await loadData()
      if (selectedTasacion?.id === tasacionId) {
        console.log('🔄 Recargando detalles de tasación seleccionada...')
        await loadDetails(tasacionId)
      }
      console.log('✅ Datos recargados')
    } catch (error) {
      console.error('❌ Error en handleToggleTramitada:', error)
      toast({ title: "Error", description: "No se pudo actualizar el estado", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <BMWMSpinner size={40} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-blue-500" />
        <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isAdmin ? "Todas las Tasaciones" : "Mis Tasaciones"}
          </h1>
              <p className="text-muted-foreground text-lg">
                {isAdmin ? "Vista completa de todas las tasaciones" : "Tasaciones recibidas a través de tu enlace"}
          </p>
        </div>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Enlace personal (solo para usuarios no-admin) */}
      {!isAdmin && advisorLink && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Tu enlace personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={advisorLink.full_url}
                  readOnly
                className="font-mono text-xs"
                />
                <Button
                  onClick={() => handleCopyLink(advisorLink.full_url)}
                  variant="outline"
                size="sm"
                >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-3">
            {advisorLink?.slug ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Enlace de Tasación</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    https://controlvo.ovh/tasacion/{advisorLink.slug}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleCopyLink(`https://controlvo.ovh/tasacion/${advisorLink.slug}`)}
                  >
                    <Copy className={`h-4 w-4 ${copied ? 'text-green-600' : ''}`} />
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sin enlace configurado</p>
                <p className="text-[10px] text-red-600">Contacta al administrador para crear tu enlace de tasación</p>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 xl:col-span-2">
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Sin Tramitar</p>
                  <p className="text-xl font-bold">{tasaciones.filter(t => !t.tramitada).length}</p>
                </div>
                <ClipboardList className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Tramitadas</p>
                  <p className="text-xl font-bold">{tasaciones.filter(t => t.tramitada).length}</p>
                </div>
                <ClipboardList className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{tasaciones.length}</p>
                </div>
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Lista */}
        <div className="xl:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                      </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sin_tramitar">
                      Sin Tramitar ({tasaciones.filter(t => !t.tramitada).length})
                    </TabsTrigger>
                    <TabsTrigger value="tramitadas">
                      Tramitadas ({tasaciones.filter(t => t.tramitada).length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                        </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead className="text-right">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasaciones.map((t) => (
                      <TableRow 
                        key={t.id} 
                        className={`cursor-pointer ${selectedTasacion?.id === t.id ? 'border-l-4 border-l-blue-500 bg-muted/50' : ''}`}
                      >
                        <TableCell onClick={() => loadDetails(t.id)}>
                          <div>
                            <p className="font-mono font-bold text-sm">{t.matricula}</p>
                            <p className="text-xs text-gray-500">{t.marca} {t.modelo}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-5 text-xs px-2 border-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleTramitada(t.id, !t.tramitada)
                                }}
                              >
                                {t.tramitada ? "✓" : "Tramitar"}
                              </Button>
                              {t.metadata?.geolocalizacion && <Badge variant="outline" className="border-green-600 text-green-600 text-xs">GPS</Badge>}
                              {t.total_fotos > 0 && <Badge variant="outline" className="text-xs">{t.total_fotos} fotos</Badge>}
                        </div>
                      </div>
                        </TableCell>
                        <TableCell className="text-right text-xs" onClick={() => loadDetails(t.id)}>
                          <div className="text-gray-400">
                            {format(new Date(t.created_at), "dd/MM/yy HH:mm", { locale: es })}
                          </div>
                          {t.tramitada && t.tramitada_at && (
                            <div className="text-foreground font-bold mt-0.5">
                              {format(new Date(t.tramitada_at), "dd/MM/yy HH:mm", { locale: es })}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTasaciones.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No hay tasaciones</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalle */}
        <div className="xl:col-span-2">
          {loadingDetails ? (
            <Card className="shadow-sm"><CardContent className="p-12 flex justify-center"><BMWMSpinner size={32} /></CardContent></Card>
          ) : selectedTasacion ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTasacion.tramitada || false}
                      onCheckedChange={(checked) => handleToggleTramitada(selectedTasacion.id, !!checked)}
                      className="h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <span className="font-bold text-base">{selectedTasacion.matricula}</span>
                  </div>
                  <span className="font-bold text-base">{selectedTasacion.marca} {selectedTasacion.modelo}</span>
                  {selectedTasacion.metadata?.geolocalizacion && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-green-600 hover:text-green-700"
                      onClick={() => {
                        const link = getGoogleMapsLink(selectedTasacion.metadata.geolocalizacion)
                        if (link) window.open(link, '_blank')
                      }}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedTasacion.metadata.geolocalizacion.latitude.toFixed(4)}, {selectedTasacion.metadata.geolocalizacion.longitude.toFixed(4)}
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{format(new Date(selectedTasacion.created_at), "dd/MM/yy HH:mm", { locale: es })}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                    size="sm"
                        variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF || !fotos}
                  >
                    {downloadingPDF ? (
                      <>
                        <BMWMSpinner size={12} className="mr-1" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-3 w-3 mr-1" />
                        Descargar Informe PDF
                      </>
                    )}
                      </Button>
                      <Button
                    size="sm"
                        variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={handleDownloadPhotos}
                    disabled={downloadingPhotos || !fotos || Object.values(fotos).flat().length === 0}
                  >
                    {downloadingPhotos ? (
                      <>
                        <BMWMSpinner size={12} className="mr-1" />
                        Descargando...
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 mr-1" />
                        Descargar Fotos ({fotos ? Object.values(fotos).flat().length : 0})
                      </>
                    )}
                      </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {/* Datos del Vehículo */}
                <h3 className="font-bold text-xs text-blue-600 mb-0.5 mt-1">DATOS DEL VEHÍCULO</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-0 text-[11px] mb-1">
                  <div><span className="text-muted-foreground">Marca:</span> <span className="font-bold ml-1">{selectedTasacion.marca || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Modelo:</span> <span className="font-bold ml-1">{selectedTasacion.modelo || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Km:</span> <span className="font-bold ml-1">{selectedTasacion.kilometros?.toLocaleString() || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Versión:</span> <span className="font-medium ml-1">{selectedTasacion.version || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Combustible:</span> <span className="font-medium capitalize ml-1">{selectedTasacion.combustible || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Transmisión:</span> <span className="font-medium capitalize ml-1">{selectedTasacion.transmision || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Color:</span> <span className="font-medium capitalize ml-1">{selectedTasacion.color || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Procedencia:</span> <span className="font-medium capitalize ml-1">{selectedTasacion.procedencia || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">2ª Llave:</span> <span className="font-medium ml-1">{selectedTasacion.segunda_llave !== undefined ? (selectedTasacion.segunda_llave ? 'Sí' : 'No') : 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Matriculación:</span> <span className="font-medium ml-1">{selectedTasacion.fecha_matriculacion || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Origen:</span> <span className="font-medium capitalize ml-1">{selectedTasacion.origen_vehiculo || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Movilidad:</span> <span className="font-medium capitalize ml-1">{selectedTasacion.movilidad_transporte?.replace('_', ' ') || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Servicio público:</span> <span className="font-medium capitalize ml-1">{(selectedTasacion.servicio_publico && selectedTasacion.servicio_publico !== 'ninguno') ? selectedTasacion.servicio_publico.replace('_', ' ') : 'Ninguno'}</span></div>
                  <div className="col-span-2 md:col-span-4"><span className="text-blue-600 font-medium">Elementos destacables:</span> <span className="font-medium ml-1">{selectedTasacion.elementos_destacables || 'Vacío'}</span></div>
                </div>

                {/* Estado Mecánico */}
                <h3 className="font-bold text-xs text-blue-600 mb-0.5 mt-1">ESTADO MECÁNICO</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-0 text-[11px] mb-1">
                  <div><span className="text-muted-foreground">Motor:</span> <span className={`font-medium capitalize ml-1 ${selectedTasacion.estado_motor === 'malo' ? 'text-red-600' : selectedTasacion.estado_motor === 'regular' ? 'text-yellow-600' : selectedTasacion.estado_motor ? 'text-green-600' : ''}`}>{selectedTasacion.estado_motor || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Frenos:</span> <span className={`font-medium capitalize ml-1 ${selectedTasacion.estado_frenos === 'malo' ? 'text-red-600' : selectedTasacion.estado_frenos === 'regular' ? 'text-yellow-600' : selectedTasacion.estado_frenos ? 'text-green-600' : ''}`}>{selectedTasacion.estado_frenos || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Dirección:</span> <span className={`font-medium capitalize ml-1 ${selectedTasacion.estado_direccion === 'malo' ? 'text-red-600' : selectedTasacion.estado_direccion === 'regular' ? 'text-yellow-600' : selectedTasacion.estado_direccion ? 'text-green-600' : ''}`}>{selectedTasacion.estado_direccion || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Caja:</span> <span className={`font-medium capitalize ml-1 ${selectedTasacion.estado_caja_cambios === 'malo' ? 'text-red-600' : selectedTasacion.estado_caja_cambios === 'regular' ? 'text-yellow-600' : selectedTasacion.estado_caja_cambios ? 'text-green-600' : ''}`}>{selectedTasacion.estado_caja_cambios || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Transmisión:</span> <span className={`font-medium capitalize ml-1 ${selectedTasacion.estado_transmision === 'malo' ? 'text-red-600' : selectedTasacion.estado_transmision === 'regular' ? 'text-yellow-600' : selectedTasacion.estado_transmision ? 'text-green-600' : ''}`}>{selectedTasacion.estado_transmision || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Embrague:</span> <span className={`font-medium capitalize ml-1 ${selectedTasacion.estado_embrague === 'malo' ? 'text-red-600' : selectedTasacion.estado_embrague === 'regular' ? 'text-yellow-600' : selectedTasacion.estado_embrague ? 'text-green-600' : ''}`}>{selectedTasacion.estado_embrague || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">General:</span> <span className={`font-medium capitalize ml-1 ${selectedTasacion.estado_general === 'malo' ? 'text-red-600' : selectedTasacion.estado_general === 'regular' ? 'text-yellow-600' : selectedTasacion.estado_general ? 'text-green-600' : ''}`}>{selectedTasacion.estado_general || 'Vacío'}</span></div>
                </div>

                {/* ITV */}
                <h3 className="font-bold text-xs text-blue-600 mb-0.5 mt-1">ITV Y DOCUMENTACIÓN</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-0 text-[11px] mb-1">
                  <div><span className="text-muted-foreground">ITV vigente:</span> <span className={`font-bold ml-1 ${selectedTasacion.itv_vigente ? 'text-green-600' : selectedTasacion.itv_vigente === false ? 'text-red-600' : ''}`}>{selectedTasacion.itv_vigente !== undefined ? (selectedTasacion.itv_vigente ? 'SÍ' : 'NO') : 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Próxima ITV:</span> <span className="font-medium ml-1">{selectedTasacion.proxima_itv || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Etiqueta:</span> <span className="font-medium uppercase ml-1">{selectedTasacion.etiqueta_medioambiental?.replace('_', ' ') || 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Comprado nuevo:</span> <span className="font-medium ml-1">{selectedTasacion.comprado_nuevo !== undefined ? (selectedTasacion.comprado_nuevo ? 'Sí' : 'No') : 'Vacío'}</span></div>
                  <div><span className="text-muted-foreground">Docs. KM:</span> <span className="font-medium capitalize ml-1">{selectedTasacion.documentos_km?.replace('_', ' ') || 'Vacío'}</span></div>
                </div>

                {/* Testigos y Observaciones en dos columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1 mt-1">
                  {/* Testigos */}
                  {selectedTasacion.testigos_encendidos && Array.isArray(selectedTasacion.testigos_encendidos) && selectedTasacion.testigos_encendidos.length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs text-blue-600 mb-0.5">TESTIGOS ENCENDIDOS</h3>
                      <div className="flex flex-wrap gap-0.5">
                        {selectedTasacion.testigos_encendidos.map((testigo: string, idx: number) => (
                          <Badge key={idx} className="bg-yellow-100 text-yellow-800 text-[10px] border-0 px-1.5 py-0">
                            {testigo.replace('_', ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observaciones */}
                  {selectedTasacion.observaciones && (
                    <div>
                      <h3 className="font-bold text-xs text-blue-600 mb-0.5">OBSERVACIONES</h3>
                      <p className="text-[11px]">{selectedTasacion.observaciones}</p>
                    </div>
                  )}
                </div>

                {/* Daño estructural */}
                {selectedTasacion.dano_estructural && (
                  <>
                    <h3 className="font-bold text-xs text-blue-600 mb-0.5 mt-1">🚨 DAÑO ESTRUCTURAL</h3>
                    {selectedTasacion.dano_estructural_detalle && <p className="text-[11px] mb-1">{selectedTasacion.dano_estructural_detalle}</p>}
                  </>
                )}

                {/* Daños Exteriores */}
                <h3 className="font-bold text-xs text-blue-600 mb-0.5 mt-1">
                  DAÑOS EXTERIORES ({selectedTasacion.danos_exteriores?.length || 0})
                </h3>
                <DamageDisplayByView 
                  damages={selectedTasacion.danos_exteriores || []} 
                  type="exterior"
                />

                {/* Daños Interiores */}
                <h3 className="font-bold text-xs text-blue-600 mb-0.5 mt-1">
                  DAÑOS INTERIORES ({selectedTasacion.danos_interiores?.length || 0})
                </h3>
                <DamageDisplayByView 
                  damages={selectedTasacion.danos_interiores || []} 
                  type="interior"
                />

                {/* Fotos */}
                {fotos && Object.values(fotos).some((f: any) => f.length > 0) && (
                  <div className="mt-1">
                    <h3 className="font-bold text-xs text-blue-600 mb-0.5 mt-1">FOTOGRAFÍAS</h3>
                    {Object.entries(fotos).map(([cat, imgs]: [string, any]) => {
                      if (imgs.length === 0) return null
                      
                      // Calcular índice global para este grupo de fotos
                      const allPhotos = Object.values(fotos).flat() as any[]
                      const startIdx = allPhotos.findIndex((p: any) => p.id === imgs[0].id)
                      
                      return (
                        <div key={cat} className="mb-1">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{getCategoryLabel(cat)} ({imgs.length})</p>
                          <div className="grid grid-cols-6 gap-0.5">
                            {imgs.map((foto: any, idx: number) => (
                              <button
                                key={foto.id}
                                onClick={() => handleOpenLightbox(allPhotos.map((p: any) => ({ url: p.url, alt: p.foto_key })), startIdx + idx)}
                                className="aspect-square rounded border overflow-hidden hover:border-blue-500 transition-colors cursor-pointer"
                              >
                                <img src={foto.url} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Datos del Cliente */}
                {(selectedTasacion.nombre_cliente || selectedTasacion.telefono_cliente || selectedTasacion.email_cliente) && (
                  <>
                    <h3 className="font-bold text-xs text-blue-600 mb-0.5 mt-1">DATOS DEL CLIENTE</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-0 text-[11px] mb-1">
                      {selectedTasacion.nombre_cliente && <div><span className="text-muted-foreground">Nombre:</span> <span className="font-medium ml-1">{selectedTasacion.nombre_cliente}</span></div>}
                      {selectedTasacion.telefono_cliente && <div><span className="text-muted-foreground">Teléfono:</span> <span className="font-medium ml-1">{selectedTasacion.telefono_cliente}</span></div>}
                      {selectedTasacion.email_cliente && <div><span className="text-muted-foreground">Email:</span> <span className="font-medium ml-1">{selectedTasacion.email_cliente}</span></div>}
                      {selectedTasacion.provincia_cliente && <div><span className="text-muted-foreground">Provincia:</span> <span className="font-medium ml-1">{selectedTasacion.provincia_cliente}</span></div>}
            </div>
                  </>
          )}
        </CardContent>
      </Card>
          ) : (
            <Card className="shadow-sm"><CardContent className="p-12 text-center text-gray-500"><FileText className="h-12 w-12 mx-auto mb-2 opacity-30" /><p className="text-sm">Selecciona una tasación</p></CardContent></Card>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />
    </div>
  )
}
