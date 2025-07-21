"use client"

import { useState, useEffect, useCallback } from "react"
import { KeyManagementForm } from "@/components/keys/key-management-form"
import { KeyMovementsSearch } from "@/components/keys/key-movements-search"
import { RecentKeyMovements } from "@/components/keys/recent-key-movements"
import { DocuwareRequestsModal } from "@/components/keys/docuware-requests-modal"
import { CirculationPermitModal } from "@/components/keys/circulation-permit-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Loader2, FileText } from "lucide-react"
import { KeyDocumentIncidencesCard } from "@/components/keys/key-document-incidences-card"
import { Key, Search, Clock } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { toast } from "sonner"

// Define SPECIAL_USERS here or import from a shared location
const SPECIAL_USERS = [
  { id: "comerciales", full_name: "COMERCIALES" },
  { id: "taller", full_name: "TALLER" },
  { id: "limpieza", full_name: "LIMPIEZA" },
  { id: "custodia", full_name: "CUSTODIA" },
]

export default function KeysManagementPage() {
  const [loading, setLoading] = useState(true)
  const [recentMovements, setRecentMovements] = useState<any[]>([])
  const [usersForDisplay, setUsersForDisplay] = useState<any[]>([])
  const [vehiclesForDisplay, setVehiclesForDisplay] = useState<any[]>([])
  const [externalVehicles, setExternalVehicles] = useState<any[]>([])
  const [docuwareModalOpen, setDocuwareModalOpen] = useState(false);
  const [pendingDocuwareRequests, setPendingDocuwareRequests] = useState(0);
  const [circulationPermitModalOpen, setCirculationPermitModalOpen] = useState(false);
  const [pendingCirculationPermitRequests, setPendingCirculationPermitRequests] = useState(0);
  const supabase = createClientComponentClient()

  const loadPageData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch profiles (regular users)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, alias")
        .order("full_name")
      if (profilesError) throw profilesError
      const allUsers = [...(profilesData || []), ...SPECIAL_USERS]
      setUsersForDisplay(allUsers)

      // Fetch vehicles from nuevas_entradas
      const { data: nuevasEntradasData, error: nuevasEntradasError } = await supabase
        .from("nuevas_entradas")
        .select("id, license_plate")
      if (nuevasEntradasError) throw nuevasEntradasError

      // Fetch vehicles from sales_vehicles
      const { data: salesVehiclesData, error: salesVehiclesError } = await supabase
        .from("sales_vehicles")
        .select("id, license_plate")
      if (salesVehiclesError) throw salesVehiclesError

      const allVehicles = [
        ...(nuevasEntradasData || []).map((v) => ({ ...v, source: "nuevas_entradas" })),
        ...(salesVehiclesData || []).map((v) => ({ ...v, source: "sales_vehicles" })),
      ].filter((v) => v.license_plate)
      setVehiclesForDisplay(allVehicles)

      // Fetch external material vehicles
      const { data: externalVehiclesData, error: externalVehiclesError } = await supabase
        .from("external_material_vehicles")
        .select("id, license_plate")
      if (externalVehiclesError) throw externalVehiclesError
      setExternalVehicles(externalVehiclesData || [])

      // Fetch key movements
      const { data: keyMovements, error: keyError } = await supabase
        .from("key_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)
      if (keyError) throw keyError

      // Fetch document movements
      const { data: docMovements, error: docError } = await supabase
        .from("document_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)
      if (docError) throw docError

      const combinedMovements = [
        ...(keyMovements || []).map((m) => ({ ...m, movement_type: "key", item_identifier: m.key_type })),
        ...(docMovements || []).map((m) => ({ ...m, movement_type: "document", item_identifier: m.document_type })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)

      setRecentMovements(combinedMovements)
    } catch (error) {
      console.error("Error loading page data:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadPageData()
  }, [loadPageData])

  // Cargar solicitudes de llaves y documentos pendientes
  useEffect(() => {
    const loadPendingRequests = async () => {
      try {
        const { data, error } = await supabase
          .from("key_document_requests")
          .select("id, key_document_materials!inner(id, selected)")
          .eq("status", "pending")
        
        if (error) {
          console.error("Error cargando solicitudes de llaves y documentos:", error)
          return
        }
        
        // Contar solicitudes con materiales no seleccionados
        const pendingCount = data?.filter(request => 
          request.key_document_materials.some(material => !material.selected)
        ).length || 0
        
        setPendingDocuwareRequests(pendingCount)
      } catch (error) {
        console.error("Error:", error)
      }
    }
    
    loadPendingRequests()
  }, [supabase])

  // Cargar solicitudes de permiso de circulación pendientes
  useEffect(() => {
    const loadPendingCirculationPermitRequests = async () => {
      try {
        const { data, error } = await supabase
          .from("circulation_permit_requests")
          .select("id, circulation_permit_materials!inner(id, selected)")
          .eq("status", "pending")
        
        if (error) {
          console.error("Error cargando solicitudes de permiso de circulación:", error)
          return
        }
        
        // Contar solicitudes con materiales no seleccionados
        const pendingCount = data?.filter(request => 
          request.circulation_permit_materials.some(material => !material.selected)
        ).length || 0
        
        setPendingCirculationPermitRequests(pendingCount)
      } catch (error) {
        console.error("Error:", error)
      }
    }
    
    loadPendingCirculationPermitRequests()
  }, [supabase])

  const handleOpenDocuwareModal = async () => {
    setDocuwareModalOpen(true);
  };

  const handleOpenCirculationPermitModal = async () => {
    // Ahora abre el modal directamente sin sincronización manual
    // La sincronización se hace automáticamente con el trigger
    setCirculationPermitModalOpen(true);
  };

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <Key className="h-7 w-7 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Llaves</h1>
            <p className="text-muted-foreground text-lg">Control y seguimiento de llaves y documentación vehicular</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Registration Form */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-green-500" />
                    <CardTitle>Registro de Movimientos</CardTitle>
                  </div>
                  <CardDescription>Registra entregas y recepciones de llaves y documentación</CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 relative"
                    onClick={handleOpenDocuwareModal}
                  >
                    <Key className="h-4 w-4" />
                    Solicitudes de Llaves y Documentos
                    {pendingDocuwareRequests > 0 && (
                      <span className="absolute -top-2 -right-2 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse">
                        <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping"></span>
                      </span>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 relative"
                    onClick={handleOpenCirculationPermitModal}
                  >
                    <FileText className="h-4 w-4" />
                    Permiso de circulación
                    {pendingCirculationPermitRequests > 0 && (
                      <span className="absolute -top-2 -right-2 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse">
                        <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping"></span>
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <KeyManagementForm onMovementRegistered={loadPageData} />
            </CardContent>
          </Card>

          {/* Search Card - Moved below form */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-green-500" />
                <CardTitle>Buscar Movimientos</CardTitle>
              </div>
              <CardDescription>Consulta el historial de movimientos por matrícula</CardDescription>
            </CardHeader>
            <CardContent>
              <KeyMovementsSearch />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">
          {/* Incidents Card */}
          <KeyDocumentIncidencesCard />

          {/* Recent Activity Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <CardTitle>Actividad Reciente</CardTitle>
              </div>
              <CardDescription>Últimos movimientos del sistema</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <RecentKeyMovements movements={recentMovements} users={usersForDisplay} vehicles={[...vehiclesForDisplay, ...externalVehicles]} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Solicitudes Docuware */}
      <DocuwareRequestsModal 
        open={docuwareModalOpen} 
        onOpenChange={setDocuwareModalOpen} 
      />

      {/* Modal de Permisos de Circulación */}
      <CirculationPermitModal 
        open={circulationPermitModalOpen} 
        onOpenChange={setCirculationPermitModalOpen} 
      />
    </div>
  )
}
