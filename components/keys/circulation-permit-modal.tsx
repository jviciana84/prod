"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileCheck, Search, ChevronDown, Car, User, RefreshCw, Printer } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Logo } from "@/components/ui/logo"

interface CirculationPermitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CirculationPermitRequest {
  id: string
  entrega_id: string
  license_plate: string
  model: string
  asesor_alias: string
  request_date: string
  status: "pending" | "confirmed" | "completed"
  observations?: string
  circulation_permit_materials: Array<{
    id: string
    material_type: string
    material_label: string
    selected: boolean
    observations?: string
  }>
}

export function CirculationPermitModal({ open, onOpenChange }: CirculationPermitModalProps) {
  const { user, profile } = useAuth();
  const supabase = createClientComponentClient();
  const [requests, setRequests] = useState<CirculationPermitRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("pending")
  const [receiverProfiles, setReceiverProfiles] = useState<Record<string, { id: string, full_name: string, avatar_url: string, email: string }>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchSuggestions, setSearchSuggestions] = useState<CirculationPermitRequest[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // Implementar debounce para la búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadRequests()
    } else {
      setRequests([]);
      setSelectedMaterials([]);
      setSearchTerm("");
    }
  }, [open])

  // Generar sugerencias de búsqueda con debounce
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    const pendingRequests = requests.filter(r => 
      r.circulation_permit_materials?.some(m => !m.selected)
    )

    const filtered = pendingRequests.filter(request => {
      const searchLower = debouncedSearchTerm.toLowerCase()
      return (
        request.license_plate.toLowerCase().includes(searchLower) ||
        request.model.toLowerCase().includes(searchLower) ||
        request.asesor_alias.toLowerCase().includes(searchLower)
      )
    })

    setSearchSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }, [debouncedSearchTerm, requests])

  // Función para seleccionar solicitud con Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchSuggestions.length > 0) {
      e.preventDefault()
      const firstSuggestion = searchSuggestions[0]
      const mainMaterial = firstSuggestion.circulation_permit_materials?.find(m => m.material_type === "circulation_permit")
      
      if (mainMaterial && !mainMaterial.selected) {
        // Seleccionar el material
        setSelectedMaterials(prev => 
          prev.includes(mainMaterial.id) 
            ? prev.filter(id => id !== mainMaterial.id)
            : [...prev, mainMaterial.id]
        )
        
        // Limpiar búsqueda
        setSearchTerm("")
        setShowSuggestions(false)
        
        // Mostrar confirmación
        toast.success(`Solicitud ${firstSuggestion.license_plate} ${selectedMaterials.includes(mainMaterial.id) ? 'deseleccionada' : 'seleccionada'}`)
      } else if (mainMaterial?.selected) {
        toast.info(`La solicitud ${firstSuggestion.license_plate} ya está completada`)
        setSearchTerm("")
        setShowSuggestions(false)
      }
    }
  }

  // Función para seleccionar sugerencia con clic
  const handleSuggestionClick = (request: CirculationPermitRequest) => {
    const mainMaterial = request.circulation_permit_materials?.find(m => m.material_type === "circulation_permit")
    
    if (mainMaterial && !mainMaterial.selected) {
      setSelectedMaterials(prev => 
        prev.includes(mainMaterial.id) 
          ? prev.filter(id => id !== mainMaterial.id)
          : [...prev, mainMaterial.id]
      )
      
      setSearchTerm("")
      setShowSuggestions(false)
      
      toast.success(`Solicitud ${request.license_plate} ${selectedMaterials.includes(mainMaterial.id) ? 'deseleccionada' : 'seleccionada'}`)
    } else if (mainMaterial?.selected) {
      toast.info(`La solicitud ${request.license_plate} ya está completada`)
      setSearchTerm("")
      setShowSuggestions(false)
    }
  }

  // Buscar perfiles de los alias de asesor
  useEffect(() => {
    async function fetchReceiverProfiles() {
      if (!open || requests.length === 0) return;
      
      const aliasSet = new Set<string>();
      requests.forEach(r => {
        if (r.asesor_alias) aliasSet.add(r.asesor_alias.trim().toLowerCase());
      });
      
      if (aliasSet.size === 0) return;

      const profilesMap: Record<string, { id: string, full_name: string, avatar_url: string, email: string }> = {};

      for (const alias of aliasSet) {
        // Buscar por alias exacto (case-insensitive)
        const { data, error } = await supabase
          .from("profiles")
          .select("id, alias, full_name, avatar_url, email")
          .ilike("alias", alias);

        if (!error && data && data.length > 0) {
          profilesMap[alias] = {
            id: data[0].id,
            full_name: data[0].full_name,
            avatar_url: data[0].avatar_url,
            email: data[0].email
          };
          continue;
        }

        // Buscar por similitud en alias
        const { data: similarData, error: similarError } = await supabase
          .from("profiles")
          .select("id, alias, full_name, avatar_url, email")
          .ilike("alias", `%${alias}%`);

        if (!similarError && similarData && similarData.length > 0) {
          profilesMap[alias] = {
            id: similarData[0].id,
            full_name: similarData[0].full_name,
            avatar_url: similarData[0].avatar_url,
            email: similarData[0].email
          };
          continue;
        }

        // Buscar por nombre completo que contenga el alias
        const { data: nameData, error: nameError } = await supabase
          .from("profiles")
          .select("id, alias, full_name, avatar_url, email")
          .ilike("full_name", `%${alias}%`);

        if (!nameError && nameData && nameData.length > 0) {
          profilesMap[alias] = {
            id: nameData[0].id,
            full_name: nameData[0].full_name,
            avatar_url: nameData[0].avatar_url,
            email: nameData[0].email
          };
          continue;
        }
      }
      
      setReceiverProfiles(profilesMap);
    }

    fetchReceiverProfiles();
  }, [open, requests])

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("circulation_permit_requests")
        .select(`
          *,
          circulation_permit_materials (*)
        `)
        .order("request_date", { ascending: false });

      if (error) {
        console.error("❌ Error cargando solicitudes:", error);
        toast.error("Error cargando solicitudes");
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error("❌ Error en loadRequests:", error);
      console.error("❌ Tipo de error:", typeof error);
      console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      toast.error("Error cargando solicitudes");
    } finally {
      setLoading(false);
    }
  }

  const handleMaterialToggle = (materialId: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  }

  const handleConfirmSelected = async () => {
    if (selectedMaterials.length === 0) {
      toast.error("Selecciona al menos un material");
      return;
    }

    setConfirming(true);
    try {
      // Obtener datos de los materiales seleccionados
      const selectedMaterialsData = [];
      for (const materialId of selectedMaterials) {
        for (const request of requests) {
          const material = request.circulation_permit_materials?.find(m => m.id === materialId);
          if (material) {
            selectedMaterialsData.push({ request, material });
            break;
          }
        }
      }

      if (selectedMaterialsData.length === 0) {
        toast.error("No se encontraron materiales seleccionados");
        return;
      }

      // Obtener información de vehículos
      const vehicleMap = new Map();
      const notFoundVehicles = [];
      
      for (const { request } of selectedMaterialsData) {
        const licensePlate = request.license_plate.toUpperCase();
        
        // Buscar en sales_vehicles primero (datos reales)
        let { data: salesVehicleData, error: salesError } = await supabase
          .from("sales_vehicles")
          .select("id, license_plate")
          .eq("license_plate", licensePlate)
          .single();

        if (salesVehicleData) {
          vehicleMap.set(licensePlate, {
            id: salesVehicleData.id,
            isExternal: false, // Los vehículos de sales_vehicles no son externos
            source: 'sales_vehicles'
          });
          continue;
        }

        // Si hay error, probar sin .single() para ver si el vehículo existe
        if (salesError) {
          console.warn(`⚠️ Error buscando vehículo ${licensePlate} en sales_vehicles:`, salesError);
          
          // Probar con LIMIT 1 en lugar de .single()
          let { data: salesVehicleDataAlt } = await supabase
            .from("sales_vehicles")
            .select("id, license_plate")
            .eq("license_plate", licensePlate)
            .limit(1);

          if (salesVehicleDataAlt && salesVehicleDataAlt.length > 0) {
            vehicleMap.set(licensePlate, {
              id: salesVehicleDataAlt[0].id,
              isExternal: false,
              source: 'sales_vehicles'
            });
            continue;
          }
        }

        // Si no está en sales_vehicles, buscar en external_material_vehicles
        let { data: externalVehicleData, error: externalError } = await supabase
          .from("external_material_vehicles")
          .select("id, license_plate")
          .eq("license_plate", licensePlate)
          .single();

        if (externalVehicleData) {
          vehicleMap.set(licensePlate, {
            id: externalVehicleData.id,
            isExternal: true,
            source: 'external_material_vehicles'
          });
          continue;
        }

        // Si hay error, probar sin .single() para ver si el vehículo existe
        if (externalError) {
          console.warn(`⚠️ Error buscando vehículo ${licensePlate} en external_material_vehicles:`, externalError);
          
          // Probar con LIMIT 1 en lugar de .single()
          let { data: externalVehicleDataAlt } = await supabase
            .from("external_material_vehicles")
            .select("id, license_plate")
            .eq("license_plate", licensePlate)
            .limit(1);

          if (externalVehicleDataAlt && externalVehicleDataAlt.length > 0) {
            vehicleMap.set(licensePlate, {
              id: externalVehicleDataAlt[0].id,
              isExternal: true,
              source: 'external_material_vehicles'
            });
            continue;
          }
        }

        // Si no se encuentra en ninguna tabla de vehículos
        notFoundVehicles.push(licensePlate);
        console.warn(`⚠️ Vehículo no encontrado en sales_vehicles ni external_material_vehicles: ${licensePlate}`);
      }

      // Mostrar advertencia si hay vehículos no encontrados pero continuar
      if (notFoundVehicles.length > 0) {
        console.warn(`⚠️ Vehículos no encontrados: ${notFoundVehicles.join(', ')}`);
        toast.warning(`⚠️ ${notFoundVehicles.length} vehículos no encontrados, continuando con el registro...`);
        
        // Filtrar solo los materiales de vehículos encontrados
        selectedMaterialsData = selectedMaterialsData.filter(({ request }) => {
          const licensePlate = request.license_plate.toUpperCase();
          return !notFoundVehicles.includes(licensePlate);
        });
        
        if (selectedMaterialsData.length === 0) {
          toast.error("No quedan materiales válidos para procesar");
          setConfirming(false);
          return;
        }
      }

      // Procesar cada material seleccionado
      const processedMaterials = [];
      const consolidatedMovementData = {
        fecha: new Date().toLocaleDateString('es-ES'),
        usuario_entrega: profile?.full_name || user?.user_metadata?.full_name || user?.email || "",
        email_entrega: profile?.email || user?.email || null,
        movimientos: []
      };
      
      const movimientosPorUsuario = new Map();
      
      // Mostrar progreso
      toast.info(`Procesando ${selectedMaterialsData.length} materiales...`);
      
      for (const { request, material } of selectedMaterialsData) {
        
        // Obtener el ID del vehículo del mapa
        const vehicleInfo = vehicleMap.get(request.license_plate.toUpperCase());
        if (!vehicleInfo) {
          console.error("❌ Vehículo no encontrado:", request.license_plate);
          continue;
        }
        
        const { id: vehicleId, isExternal: isExternalVehicle, source } = vehicleInfo;

        // Obtener el usuario que recibe (desde el alias)
        let toUserId = null;
        let receiverProfile = null;
        if (request.asesor_alias) {
          const aliasKey = request.asesor_alias.trim().toLowerCase();
          receiverProfile = receiverProfiles[aliasKey] || null;
          if (receiverProfile) {
            toUserId = receiverProfile.id;
          }
        }

        // Calcular la fecha límite para la confirmación (24 horas)
        const confirmationDeadline = new Date();
        confirmationDeadline.setHours(confirmationDeadline.getHours() + 24);

        // Obtener el usuario que entrega
        const from_user_id_to_insert = profile?.id;
        
        // Obtener observaciones
        const userObservaciones = (material.observations || request.observations || "").trim();

        // Crear movimiento de documento
        const movementData = {
          vehicle_id: vehicleId,
          document_type: material.material_type,
          from_user_id: from_user_id_to_insert,
          to_user_id: toUserId,
          reason: `Entrega de ${material.material_label} - ${request.license_plate}`,
          confirmation_deadline: confirmationDeadline.toISOString(),
          notes: userObservaciones || undefined,
        };

        const { data: movementResult, error: movementError } = await supabase
          .from("document_movements")
          .insert(movementData)
          .select()
          .single();

        if (movementError) {
          console.error("❌ Error creando movimiento:", movementError);
          toast.error(`Error procesando ${material.material_label} para ${request.license_plate}`);
          continue;
        }

        console.log("✅ Movimiento creado:", movementResult);

        // Marcar material como seleccionado
        const { error: updateError } = await supabase
          .from("circulation_permit_materials")
          .update({ selected: true })
          .eq("id", material.id);

        if (updateError) {
          console.error("❌ Error actualizando material:", updateError);
        }

        // Procesar vehículo externo si es necesario
        if (isExternalVehicle) {
          try {
            const logEntry = {
              fecha: new Date().toISOString(),
              tipo: "documento",
              material_type: material.material_type,
              material_label: material.material_label,
              usuario_entrega: profile?.full_name || user?.user_metadata?.full_name || user?.email || "",
              usuario_recibe: receiverProfile?.full_name || request.asesor_alias || "",
              to_user_id: receiverProfile?.id || null,
              from_user_id: from_user_id_to_insert,
              observaciones: userObservaciones || undefined,
            };
            
            const { data: extVeh } = await supabase
              .from("external_material_vehicles")
              .select("movements_log")
              .eq("id", vehicleId)
              .single();
              
            let logArr = [];
            if (extVeh && extVeh.movements_log) {
              try { 
                logArr = JSON.parse(extVeh.movements_log); 
              } catch (parseError) { 
                logArr = []; 
              }
            }
            logArr.push(logEntry);
            
            await supabase
              .from("external_material_vehicles")
              .update({ movements_log: JSON.stringify(logArr) })
              .eq("id", vehicleId);
              
          } catch (error) {
            // Error silencioso en movimiento externo
          }
        }

        // Preparar datos para email
        const aliasKey = request.asesor_alias?.trim().toLowerCase();
        const receiverProfileForEmail = aliasKey ? receiverProfiles[aliasKey] : null;
        
        const toUserIdForEmail = receiverProfileForEmail?.id || null;
        const toUserName = receiverProfileForEmail?.full_name || request.asesor_alias || "Usuario";
        const toUserEmail = receiverProfileForEmail?.email || null;

        // Agrupar movimientos por usuario destinatario
        if (!movimientosPorUsuario.has(toUserIdForEmail)) {
          movimientosPorUsuario.set(toUserIdForEmail, {
            to_user_id: toUserIdForEmail,
            to_user_name: toUserName,
            to_user_email: toUserEmail,
            movimientos: []
          });
        }

        movimientosPorUsuario.get(toUserIdForEmail).movimientos.push({
          license_plate: request.license_plate,
          model: request.model,
          material_type: material.material_type,
          material_label: material.material_label,
          observations: userObservaciones
        });

        processedMaterials.push({
          license_plate: request.license_plate,
          material: material.material_label,
          receiver: toUserName
        });
      }

      // Enviar emails de movimientos
      console.log("📧 Preparando envío de emails...");
      console.log("📧 Movimientos por usuario:", movimientosPorUsuario);
      console.log("📧 Total de usuarios a procesar:", movimientosPorUsuario.size);
      
      let emailsEnviados = 0;
      let emailsFallidos = 0;
      
      for (const [userId, userData] of movimientosPorUsuario) {
        console.log("📧 Procesando usuario:", userData);
        if (userData.to_user_email) {
          try {
            // Formatear datos según el formato esperado por el API
            const emailData = {
              fecha: new Date().toLocaleDateString('es-ES'),
              usuario_entrega: profile?.full_name || user?.user_metadata?.full_name || user?.email || "",
              email_entrega: profile?.email || user?.email || "",
              movimientos: [{
                usuario_recibe: userData.to_user_name,
                email_recibe: userData.to_user_email,
                items: userData.movimientos.map(mov => ({
                  matricula: mov.license_plate,
                  material: mov.material_label,
                  observaciones: mov.observations || undefined
                }))
              }]
            };

            console.log("📧 Enviando email con datos:", emailData);

            const response = await fetch("/api/send-movement-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(emailData)
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ Error enviando email:", response.status, response.statusText, errorText);
              emailsFallidos++;
            } else {
              const result = await response.json();
              console.log("✅ Email enviado a:", userData.to_user_email, result);
              emailsEnviados++;
            }
          } catch (error) {
            console.error("❌ Error enviando email:", error);
          }
        }
      }

      // Resumen del envío de emails
      console.log(`📧 Resumen de emails: ${emailsEnviados} enviados, ${emailsFallidos} fallidos`);
      if (emailsEnviados > 0) {
        toast.success(`📧 ${emailsEnviados} emails enviados correctamente`);
      }
      if (emailsFallidos > 0) {
        toast.error(`❌ ${emailsFallidos} emails fallaron al enviar`);
      }

      // Actualizar estado de solicitudes
      const requestIds = [...new Set(selectedMaterialsData.map(item => item.request.id))];
      for (const requestId of requestIds) {
        const { error: updateError } = await supabase
          .from("circulation_permit_requests")
          .update({ status: "completed" })
          .eq("id", requestId);

        if (updateError) {
          console.error("❌ Error actualizando solicitud:", updateError);
        }
      }

      toast.success(`✅ ${processedMaterials.length} materiales procesados correctamente`);
      
      // Limpiar selección y recargar datos
      setSelectedMaterials([]);
      await loadRequests();

    } catch (error) {
      console.error("❌ Error procesando materiales:", error);
      toast.error("Error procesando materiales");
    } finally {
      setConfirming(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }

  const handleObservationsChange = async (requestId: string, observations: string) => {
    try {
      const { error } = await supabase
        .from("circulation_permit_requests")
        .update({ observations })
        .eq("id", requestId);

      if (error) {
        console.error("Error actualizando observaciones:", error);
        toast.error("Error actualizando observaciones");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error actualizando observaciones");
    }
  }

  const handleMaterialObservationsChange = async (requestId: string, materialId: string, observations: string) => {
    try {
      // Actualizar estado local inmediatamente
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === requestId 
            ? {
                ...request,
                circulation_permit_materials: request.circulation_permit_materials?.map(material =>
                  material.id === materialId 
                    ? { ...material, observations }
                    : material
                ) || []
              }
            : request
        )
      );

      // Actualizar en la base de datos
      const { error } = await supabase
        .from("circulation_permit_materials")
        .update({ observations })
        .eq("id", materialId);

      if (error) {
        console.error("Error actualizando observaciones del material:", error);
        toast.error("Error actualizando observaciones del material");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error actualizando observaciones del material");
    }
  }

  const handlePrintPending = () => {
    // Obtener solicitudes pendientes
    const pendingRequests = requests.filter(r => 
      r.circulation_permit_materials?.some(m => !m.selected)
    )
    
    if (pendingRequests.length === 0) {
      toast.error("No hay solicitudes de permisos de circulación pendientes para imprimir")
      return
    }

    // Generar HTML para imprimir
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Solicitudes Permisos de Circulación</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 15px; font-size: 12px; }
          .header { margin-bottom: 20px; position: relative; min-height: 120px; }
          .logo-cvo { width: 180px; height: auto; display: block; margin-bottom: 2px; margin-left: 0; }
          .cvo-line { width: 180px; height: 3px; background: #222; margin: 4px 0 16px 0; border: none; }
          .header-title { font-size: 1.7em; font-weight: bold; margin: 0 0 0 0; text-align: center; width: 100%; }
          .header-content { text-align: center; padding-top: 0; }
          .request { border: 1px solid #ccc; margin: 10px 0; padding: 10px; page-break-inside: avoid; }
          .request h3 { margin: 0 0 8px 0; color: #333; font-size: 14px; }
          .info { margin: 3px 0; display: inline-block; margin-right: 20px; }
          .materials { margin: 8px 0; }
          .material { display: inline-block; margin: 2px 5px 2px 0; padding: 3px 8px; background: #f5f5f5; border-radius: 3px; }
          .material-main { background: #39e639; color: #000; font-weight: bold; }
          .observations { margin: 8px 0; font-style: italic; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cvo-KUNh8rXJGJ38lK00MJ9JTEci2nGA5o.png" alt="CVO Logo" class="logo-cvo" style="width: auto; height: auto;" />
          <hr class="cvo-line" />
          <div class="header-title">SOLICITUDES PERMISOS DE CIRCULACIÓN</div>
          <div class="header-content">
            <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
            <p>Total: ${pendingRequests.length} solicitudes pendientes</p>
          </div>
        </div>
    `

    pendingRequests.forEach((request, index) => {
      const materials = request.circulation_permit_materials || []
      const mainMaterial = materials.find(m => m.material_type === "circulation_permit")
      
      htmlContent += `
        <div class="request">
          <h3>Solicitud ${index + 1}: ${request.license_plate}</h3>
          <div class="info"><strong>Matrícula:</strong> ${request.license_plate}</div>
          <div class="info"><strong>Modelo:</strong> ${request.model}</div>
          <div class="info"><strong>Asesor:</strong> ${request.asesor_alias}</div>
          <div class="info"><strong>Fecha Solicitud:</strong> ${new Date(request.request_date).toLocaleDateString('es-ES')}</div>
          <div class="info"><strong>Estado:</strong> ${mainMaterial?.selected ? 'Completado' : 'Pendiente'}</div>
          
          <div class="materials">
            <strong>Materiales solicitados:</strong>
            ${materials.map(material => `
              <div class="material${material.material_type === 'circulation_permit' ? ' material-main' : ''}">
                📋 ${material.material_label}
                ${material.selected ? ' (Completado)' : ' (Pendiente)'}
              </div>
            `).join('')}
          </div>
          
          ${request.observations ? `
            <div class="observations">
              <strong>Observaciones:</strong> ${request.observations}
            </div>
          ` : ''}
        </div>
      `
    })

    htmlContent += `
      </body>
      </html>
    `

    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      
      // Esperar un poco y luego imprimir
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
      
      toast.success(`Abriendo impresora con ${pendingRequests.length} solicitudes`)
    } else {
      toast.error("No se pudo abrir la ventana de impresión")
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Filtrar solicitudes
  const pendingRequests = requests.filter(request => 
    request.circulation_permit_materials?.some(m => !m.selected) || false
  )

  const completedRequests = requests.filter(request => 
    request.circulation_permit_materials?.every(m => m.selected) || false
  )

  // Filtrar por búsqueda
  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true;
    return (
      request.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.asesor_alias.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const renderRequestCard = (request: CirculationPermitRequest) => {
    const materials = request.circulation_permit_materials || []
    const mainMaterial = materials.find(m => m.material_type === "circulation_permit")
    
    if (!mainMaterial) return null;

    const aliasKey = request.asesor_alias?.trim().toLowerCase();
    const receiverProfile = aliasKey ? receiverProfiles[aliasKey] : null;

    return (
      <Card key={request.id} className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Checkbox por material individual */}
              <Checkbox
                checked={selectedMaterials.includes(mainMaterial.id)}
                onCheckedChange={() => handleMaterialToggle(mainMaterial.id)}
                disabled={mainMaterial.selected}
                className="h-5 w-5"
              />
              
              {/* Matrícula y avatares */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="font-bold text-lg">{request.license_plate}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(request.request_date).toLocaleDateString('es-ES')}
                  </div>
                </div>
                
                {/* Avatar entrega: SIEMPRE usuario logado */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs bg-green-100 text-green-700">
                      {getInitials(profile?.full_name || user?.user_metadata?.full_name || user?.email || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <div className="font-medium">Entrega</div>
                    <div className="text-muted-foreground">{profile?.full_name || user?.user_metadata?.full_name || user?.email || "Usuario"}</div>
                  </div>
                </div>
                
                {/* Flecha */}
                <div className="text-muted-foreground">→</div>
                
                {/* Avatar recibe */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={receiverProfile?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                      {getInitials(receiverProfile?.full_name || request.asesor_alias || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <div className="font-medium">Recibe</div>
                    <div className="text-muted-foreground">{receiverProfile?.full_name || request.asesor_alias}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Badge variant={mainMaterial.selected ? "default" : "secondary"}>
              {mainMaterial.selected ? "Completado" : "Pendiente"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 pb-3">
          {/* Una línea compacta */}
          <div className="flex items-center gap-3">
            {/* Material principal */}
            <div className="flex items-center gap-2 min-w-[120px]">
              <FileCheck className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Permiso de Circulación</span>
            </div>
            
            {/* Observaciones */}
            <Input
              placeholder="Observaciones..."
              value={mainMaterial.observations || ""}
              onChange={(e) => handleMaterialObservationsChange(request.id, mainMaterial.id, e.target.value)}
              className="h-7 text-sm flex-1 ml-2 min-w-0"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-green-500" />
            Permisos de Circulación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header con botones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {pendingRequests.length} solicitudes pendientes
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 w-8 p-0"
              >
                {refreshing ? (
                  <BMWMSpinner size={16} />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handlePrintPending}
                className="h-8 w-8 p-0"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleConfirmSelected}
                disabled={selectedMaterials.length === 0 || confirming}
                className="flex items-center gap-2"
              >
                {confirming ? (
                  <>
                    <BMWMSpinner size={16} />
                    Registrando...
                  </>
                ) : (
                  "Registrar Movimientos"
                )}
              </Button>
            </div>
          </div>

          {/* Buscador y pestañas en la misma línea */}
          <div className="flex items-center justify-between">
            <Card className="p-3">
              <div className="flex items-center gap-2 relative">
                <Search className="h-4 w-4 text-muted-foreground" />
                <div className="relative">
                  <Input
                    placeholder="Buscar por matrícula, modelo o asesor... (Enter para seleccionar)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-80"
                  />
                  
                  {/* Sugerencias de autocompletado */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                      {searchSuggestions.map((request) => {
                        const mainMaterial = request.circulation_permit_materials?.find(m => m.material_type === "circulation_permit")
                        const isSelected = mainMaterial ? selectedMaterials.includes(mainMaterial.id) : false
                        
                        return (
                          <div
                            key={request.id}
                            onClick={() => handleSuggestionClick(request)}
                            className={`p-2 cursor-pointer hover:bg-accent transition-colors ${
                              isSelected ? 'bg-green-50 dark:bg-green-950' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{request.license_plate}</div>
                                <div className="text-sm text-muted-foreground">
                                  {request.model} • {request.asesor_alias}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isSelected && (
                                  <Badge variant="outline" className="text-xs">
                                    Seleccionada
                                  </Badge>
                                )}
                                <Badge variant={mainMaterial?.selected ? "default" : "secondary"} className="text-xs">
                                  {mainMaterial?.selected ? "Completada" : "Pendiente"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">
                  Pendientes ({pendingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completados ({completedRequests.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="pending" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <BMWMSpinner size={32} />
                </div>
              ) : filteredRequests.filter(r => 
                r.circulation_permit_materials?.some(m => !m.selected)
              ).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay solicitudes pendientes
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests
                    .filter(r => r.circulation_permit_materials?.some(m => !m.selected))
                    .map(renderRequestCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <BMWMSpinner size={32} />
                </div>
              ) : filteredRequests.filter(r => 
                r.circulation_permit_materials?.every(m => m.selected)
              ).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay solicitudes completadas
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests
                    .filter(r => r.circulation_permit_materials?.every(m => m.selected))
                    .map(renderRequestCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
} 