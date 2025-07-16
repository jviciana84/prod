"use client"

import { useState, useEffect } from "react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Key, CreditCard, FileCheck, Printer, Plus, Loader2, ChevronDown, Search, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { createClientComponentClient } from "@/lib/supabase/client"

// Importar la función de resolución automática de forma segura
let autoResolveIncident: any = null
try {
  const autoResolveModule = require("@/lib/auto-resolve-incidents")
  autoResolveIncident = autoResolveModule.autoResolveIncident
} catch (error) {
  console.warn("No se pudo cargar el módulo de resolución automática:", error)
}

// Eliminar la constante SPECIAL_USERS y toda referencia a ella
// const SPECIAL_USERS = [
//   { id: "comerciales", full_name: "COMERCIALES" },
//   { id: "taller", full_name: "TALLER" },
//   { id: "limpieza", full_name: "LIMPIEZA" },
//   { id: "custodia", full_name: "CUSTODIA" },
// ]

interface DocuwareRequest {
  id: string
  email_subject: string
  email_body: string
  license_plate: string
  requester: string
  request_date: string
  status: "pending" | "confirmed" | "completed"
  observations?: string
  receiver_alias?: string // Nuevo campo para el alias del receptor
  docuware_request_materials: Array<{
    id: string
    material_type: string
    material_label: string
    selected: boolean
    observations?: string
  }>
}

interface DocuwareRequestsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MATERIAL_OPTIONS = [
  { type: "second_key", label: "2ª Llave", icon: Key, default: true },
  { type: "technical_sheet", label: "Ficha Técnica", icon: FileText, default: true },
  { type: "first_key", label: "1ª Llave", icon: Key, default: false },
  { type: "card_key", label: "Card Key", icon: CreditCard, default: false },
  { type: "circulation_permit", label: "Permiso Circulación", icon: FileCheck, default: false },
]

export function DocuwareRequestsModal({ open, onOpenChange }: DocuwareRequestsModalProps) {
  const { user, profile } = useAuth();
  const supabase = createClientComponentClient();
  const [requests, setRequests] = useState<DocuwareRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]) // Cambio: seleccionar materiales, no solicitudes
  const [activeTab, setActiveTab] = useState("second_keys")
  const [receiverProfiles, setReceiverProfiles] = useState<Record<string, any>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchSuggestions, setSearchSuggestions] = useState<DocuwareRequest[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

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

  // Generar sugerencias de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    const currentRequests = activeTab === "second_keys" ? secondKeyRequests : technicalSheetRequests
    const filtered = currentRequests.filter(request => {
      const searchLower = searchTerm.toLowerCase()
      return (
        request.license_plate.toLowerCase().includes(searchLower) ||
        request.requester.toLowerCase().includes(searchLower) ||
        (request.receiver_alias && request.receiver_alias.toLowerCase().includes(searchLower))
      )
    })

    setSearchSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }, [searchTerm, activeTab, requests])

  // Función para seleccionar solicitud con Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchSuggestions.length > 0) {
      e.preventDefault()
      const firstSuggestion = searchSuggestions[0]
      const mainMaterial = firstSuggestion.docuware_request_materials?.find(m => 
        m.material_type === (activeTab === "second_keys" ? "second_key" : "technical_sheet")
      )
      
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
  const handleSuggestionClick = (request: DocuwareRequest) => {
    const mainMaterial = request.docuware_request_materials?.find(m => 
      m.material_type === (activeTab === "second_keys" ? "second_key" : "technical_sheet")
    )
    
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

  // Buscar perfiles de los alias de recibe (case-insensitive, sin espacios, robusto)
  useEffect(() => {
    async function fetchReceiverProfiles() {
      if (!open || requests.length === 0) return;
      
      const aliasSet = new Set<string>();
      requests.forEach(r => {
        if (r.receiver_alias) aliasSet.add(r.receiver_alias.trim().toLowerCase());
      });
      
      console.log("[DEBUG] Alias de destinatarios encontrados:", Array.from(aliasSet));
      
      if (aliasSet.size === 0) return;

      const profilesMap: Record<string, { id: string, full_name: string, avatar_url: string }> = {};

      for (const alias of aliasSet) {
        console.log(`[DEBUG] Buscando perfil para alias: "${alias}"`);
        
        // Primero: buscar por alias exacto (case-insensitive)
        const { data, error } = await supabase
          .from("profiles")
          .select("id, alias, full_name, avatar_url")
          .ilike("alias", alias);

        if (!error && data && data.length > 0) {
          console.log(`[DEBUG] Perfil encontrado para "${alias}":`, data[0]);
          profilesMap[alias] = {
            id: data[0].id,
            full_name: data[0].full_name,
            avatar_url: data[0].avatar_url
          };
          continue;
        }

        // Segundo: buscar por similitud en alias
        console.log(`[DEBUG] No se encontró perfil exacto para "${alias}", buscando por similitud...`);
        const { data: similarData, error: similarError } = await supabase
          .from("profiles")
          .select("id, alias, full_name, avatar_url")
          .ilike("alias", `%${alias}%`);

        if (!similarError && similarData && similarData.length > 0) {
          console.log(`[DEBUG] Perfil encontrado por similitud para "${alias}":`, similarData[0]);
          profilesMap[alias] = {
            id: similarData[0].id,
            full_name: similarData[0].full_name,
            avatar_url: similarData[0].avatar_url
          };
          continue;
        }

        // Tercero: buscar por nombre completo que contenga el alias
        console.log(`[DEBUG] Buscando por nombre completo que contenga "${alias}"...`);
        const { data: nameData, error: nameError } = await supabase
          .from("profiles")
          .select("id, alias, full_name, avatar_url")
          .ilike("full_name", `%${alias}%`);

        if (!nameError && nameData && nameData.length > 0) {
          console.log(`[DEBUG] Perfil encontrado por nombre para "${alias}":`, nameData[0]);
          profilesMap[alias] = {
            id: nameData[0].id,
            full_name: nameData[0].full_name,
            avatar_url: nameData[0].avatar_url
          };
          continue;
        }

        // Cuarto: buscar por email que contenga el alias
        console.log(`[DEBUG] Buscando por email que contenga "${alias}"...`);
        const { data: emailData, error: emailError } = await supabase
          .from("profiles")
          .select("id, alias, full_name, avatar_url")
          .ilike("email", `%${alias}%`);

        if (!emailError && emailData && emailData.length > 0) {
          console.log(`[DEBUG] Perfil encontrado por email para "${alias}":`, emailData[0]);
          profilesMap[alias] = {
            id: emailData[0].id,
            full_name: emailData[0].full_name,
            avatar_url: emailData[0].avatar_url
          };
          continue;
        }

        console.log(`[DEBUG] No se encontró ningún perfil para "${alias}"`);
      }
      
      console.log("[DEBUG] Mapa final de perfiles:", profilesMap);
      setReceiverProfiles(profilesMap);
    }
    
    fetchReceiverProfiles();
  }, [open, requests.length]); // Solo depende de open y requests.length, no de supabase

  const loadRequests = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    try {
      const response = await fetch("/api/docuware/requests")
      const data = await response.json()

      if (data.success) {
        setRequests(data.requests)
        console.log("📋 Solicitudes cargadas:", data.requests.length)
      } else {
        toast.error("Error cargando solicitudes")
      }
    } catch (error) {
      console.error("❌ Error cargando solicitudes")
      toast.error("Error cargando solicitudes")
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  // Función para actualizar el estado local después de registrar movimientos
  const updateRequestsAfterRegistration = (registeredMaterialIds: string[]) => {
    console.log("[DEBUG] Actualizando estado local con materiales registrados:", registeredMaterialIds);
    
    setRequests(prev => {
      const updatedRequests = prev.map(request => ({
        ...request,
        docuware_request_materials: request.docuware_request_materials?.map(material => 
          registeredMaterialIds.includes(material.id)
            ? { ...material, selected: true }
            : material
        ) || []
      }));
      
      console.log("[DEBUG] Requests actualizados:", updatedRequests);
      return updatedRequests;
    })
    
    // Limpiar materiales seleccionados
    setSelectedMaterials([])
    
    // Log para verificar que se actualizó correctamente
    setTimeout(() => {
      console.log("[DEBUG] Estado actualizado - Materiales pendientes:", {
        secondKeys: pendingSecondKeyMaterials.length,
        technicalSheets: pendingTechnicalSheetMaterials.length
      });
    }, 100);
  }

  // Esta función ya no se usa, se eliminó la selección de solicitudes completas
  // const handleRequestToggle = (requestId: string) => {
  //   setSelectedRequests(prev => 
  //     prev.includes(requestId) 
  //       ? prev.filter(id => id !== requestId)
  //       : [...prev, requestId]
  //   )
  // }

  const handleMaterialToggle = (materialId: string) => {
    console.log("[DEBUG] Toggle material:", materialId);
    setSelectedMaterials(prev => {
      const newSelection = prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId];
      console.log("[DEBUG] Nueva selección:", newSelection);
      return newSelection;
    })
  }

  const handleObservationsChange = (requestId: string, observations: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { ...request, observations }
        : request
    ))
  }

  const handleMaterialObservationsChange = (requestId: string, materialId: string, observations: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? {
            ...request,
            docuware_request_materials: request.docuware_request_materials.map(material =>
              material.id === materialId 
                ? { ...material, observations }
                : material
            )
          }
        : request
    ))
  }

  const handleDeleteMaterial = async (requestId: string, materialId: string) => {
    try {
      const response = await fetch("/api/docuware/requests/delete-material", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          materialId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Material eliminado correctamente")
        loadRequests() // Recargar datos
      } else {
        toast.error("Error eliminando material")
      }
    } catch (error) {
      console.error("Error eliminando material:", error)
      toast.error("Error eliminando material")
    }
  }

  // Función para obtener el ID del vehículo a partir de la matrícula (igual que en el formulario)


  // Función para intentar resolver incidencias automáticamente (igual que en el formulario)
  const tryAutoResolveIncident = async (entry: any) => {
    if (!autoResolveIncident) {
      console.log("⚠️ Función de resolución automática no disponible")
      return
    }

    try {
      console.log(`🔄 Intentando resolver incidencias para ${entry.item_type}...`)
      const resolveResult = await autoResolveIncident(
        entry.license_plate,
        entry.item_type,
        entry.to_user_id,
        entry.reason || "Entrega registrada automáticamente",
      )

      if (resolveResult.success && resolveResult.resolvedCount > 0) {
        console.log(`✅ Resueltas ${resolveResult.resolvedCount} incidencias automáticamente`)
        toast.success(`🎉 Se resolvieron ${resolveResult.resolvedCount} incidencias automáticamente`)
      } else if (resolveResult.success) {
        console.log("ℹ️ No había incidencias pendientes de este tipo")
      } else {
        console.log("⚠️ Error en resolución automática:", resolveResult.error)
      }
    } catch (resolveError) {
      console.error("💥 Error inesperado en resolución automática:", resolveError)
      // No fallar el proceso principal por esto
    }
  }

  const handleConfirmSelected = async () => {
    if (selectedMaterials.length === 0) {
      toast.error("Selecciona al menos un material para registrar movimientos");
      return;
    }

    setConfirming(true);
    
    // Timeout de seguridad para evitar que se quede pillado
    const timeoutId = setTimeout(() => {
      console.error("⏰ TIMEOUT: Proceso tardó más de 60 segundos");
      setConfirming(false);
      toast.error("El proceso tardó demasiado tiempo. Inténtalo de nuevo.");
    }, 60000);

    try {
      // Obtener los materiales seleccionados con sus solicitudes
      const selectedMaterialsData = [];
      
      for (const request of requests) {
        for (const material of request.docuware_request_materials) {
          if (selectedMaterials.includes(material.id)) {
            // Añadir el material principal
            selectedMaterialsData.push({
              request,
              material
            });
            
            // Añadir automáticamente Card Key si se selecciona una 2ª llave
            if (material.material_type === "second_key") {
              // Buscar Card Key (seleccionado o no) para añadir automáticamente
              const cardKeyMaterial = request.docuware_request_materials.find(m => 
                m.material_type === "card_key"
              );
              
              if (cardKeyMaterial) {
                console.log("🔑 Card Key encontrado y añadido automáticamente para 2ª llave");
                selectedMaterialsData.push({
                  request,
                  material: cardKeyMaterial
                });
              }
            }
          }
        }
      }
      
      // Optimización: Obtener todos los vehículos necesarios de una vez
      const licensePlates = [...new Set(selectedMaterialsData.map(item => item.request.license_plate.toUpperCase()))];
      
      // Buscar todos los vehículos en paralelo (optimizado)
      const vehicleMap = new Map<string, { id: string, isExternal: boolean }>();
      
      // Buscar en todas las tablas de una vez con consultas optimizadas
      const [salesResult, stockResult, externalResult] = await Promise.all([
        supabase.from("sales_vehicles").select("id, license_plate").in("license_plate", licensePlates),
        supabase.from("nuevas_entradas").select("id, license_plate").in("license_plate", licensePlates),
        supabase.from("external_material_vehicles").select("id, license_plate").in("license_plate", licensePlates)
      ]);
      
      // Procesar resultados
      if (salesResult.data) {
        salesResult.data.forEach(v => vehicleMap.set(v.license_plate, { id: v.id, isExternal: false }));
      }
      
      if (stockResult.data) {
        stockResult.data.forEach(v => {
          if (!vehicleMap.has(v.license_plate)) {
            vehicleMap.set(v.license_plate, { id: v.id, isExternal: false });
          }
        });
      }
      
      if (externalResult.data) {
        externalResult.data.forEach(v => {
          if (!vehicleMap.has(v.license_plate)) {
            vehicleMap.set(v.license_plate, { id: v.id, isExternal: true });
          }
        });
      }
      
      // Crear vehículos externos que no existen
      const missingPlates = licensePlates.filter(plate => !vehicleMap.has(plate));
      if (missingPlates.length > 0) {
        
        const newVehicles = missingPlates.map(plate => ({ license_plate: plate }));
        const { data: createdVehicles, error: createError } = await supabase
          .from("external_material_vehicles")
          .insert(newVehicles)
          .select("id, license_plate");
        
        if (createError) {
          console.error("❌ Error creando vehículos:", createError.message);
          throw new Error(`Error al crear registros externos: ${createError.message}`);
        }
        
        if (createdVehicles) {
          createdVehicles.forEach(v => vehicleMap.set(v.license_plate, { id: v.id, isExternal: true }));
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
        
        const { id: vehicleId, isExternal: isExternalVehicle } = vehicleInfo;

        // Obtener el usuario que recibe (desde el alias)
        let toUserId = null;
        let receiverProfile = null;
        if (request.receiver_alias) {
          const aliasKey = request.receiver_alias.trim().toLowerCase();
          receiverProfile = receiverProfiles[aliasKey] || null;
          if (receiverProfile) {
            toUserId = receiverProfile.id;
          }
        }

        // Determinar si es un movimiento de llave o documento
        const isKeyMovement = ["first_key", "second_key", "card_key"].includes(material.material_type);

        // Calcular la fecha límite para la confirmación (24 horas)
        const confirmationDeadline = new Date();
        confirmationDeadline.setHours(confirmationDeadline.getHours() + 24);

        // Obtener el usuario que entrega
        const from_user_id_to_insert = profile?.id;
        
        // Obtener observaciones
        const userObservaciones = (material.observations || request.observations || "").trim();

        if (isKeyMovement) {
          // Registrar el movimiento en la tabla key_movements
          const movementData = {
            vehicle_id: vehicleId,
            key_type: material.material_type,
            from_user_id: from_user_id_to_insert,
            to_user_id: toUserId,
            reason: userObservaciones || "",
            confirmation_deadline: confirmationDeadline.toISOString(),
          };
          
          const { error: movementError } = await supabase.from("key_movements").insert(movementData);

          if (movementError) {
            console.error("❌ Error movimiento:", movementError.message);
            throw new Error(`Error al registrar movimiento: ${movementError.message}`);
          }

          // Actualizar vehicle_keys (opcional, no bloquear si falla)
          try {
            const { data: existingKey } = await supabase
              .from("vehicle_keys")
              .select("id")
              .eq("license_plate", request.license_plate.toUpperCase())
              .maybeSingle();

            const keyUpdateData: Record<string, any> = {
              [`${material.material_type}_status`]: "Entregada",
              [`${material.material_type}_holder`]: toUserId,
              updated_at: new Date().toISOString(),
            };

            if (existingKey) {
              await supabase
                .from("vehicle_keys")
                .update(keyUpdateData)
                .eq("license_plate", request.license_plate.toUpperCase());
            } else {
              const newKeyData: Record<string, any> = {
                vehicle_id: vehicleId,
                license_plate: request.license_plate.toUpperCase(),
                first_key_status: material.material_type === "first_key" ? "Entregada" : "En concesionario",
                second_key_status: material.material_type === "second_key" ? "Entregada" : "En concesionario",
                card_key_status: material.material_type === "card_key" ? "Entregada" : "En concesionario",
              };

              if (material.material_type === "first_key") newKeyData.first_key_holder = toUserId;
              if (material.material_type === "second_key") newKeyData.second_key_holder = toUserId;
              if (material.material_type === "card_key") newKeyData.card_key_holder = toUserId;

              await supabase.from("vehicle_keys").insert(newKeyData);
            }
          } catch (keyError) {
            // Error silencioso al actualizar vehicle_keys
          }

        } else {
          // Es un movimiento de documento
          const movementData = {
            vehicle_id: vehicleId,
            document_type: material.material_type,
            from_user_id: from_user_id_to_insert,
            to_user_id: toUserId,
            reason: userObservaciones || "",
            confirmation_deadline: confirmationDeadline.toISOString(),
          };

          const { error: movementError } = await supabase.from("document_movements").insert(movementData);

          if (movementError) {
            console.error("❌ Error documento:", movementError.message);
            throw new Error(`Error al registrar movimiento: ${movementError.message}`);
          }

        }

        // Intentar resolución automática (no bloquear si falla)
        try {
          await tryAutoResolveIncident({
            license_plate: request.license_plate,
            item_type: material.material_type,
            to_user_id: toUserId,
            reason: userObservaciones || "Entrega registrada automáticamente",
          });
        } catch (resolveError) {
          // Error silencioso en resolución automática
        }

        // Procesar vehículo externo si es necesario
        if (isExternalVehicle) {
          try {
            const logEntry = {
              fecha: new Date().toISOString(),
              tipo: isKeyMovement ? "llave" : "documento",
              material_type: material.material_type,
              material_label: material.material_label,
              usuario_entrega: profile?.full_name || user?.user_metadata?.full_name || user?.email || "",
              usuario_recibe: receiverProfile?.full_name || request.receiver_alias || "",
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
        const aliasKey = request.receiver_alias?.trim().toLowerCase();
        const receiverProfileForEmail = aliasKey ? receiverProfiles[aliasKey] : null;
        
        const toUserIdForEmail = receiverProfileForEmail?.id || null;
        const toUserName = receiverProfileForEmail?.full_name || request.receiver_alias || "Usuario";
        const toUserEmail = receiverProfileForEmail?.email || null;

        if (!movimientosPorUsuario.has(toUserIdForEmail)) {
          movimientosPorUsuario.set(toUserIdForEmail, {
            usuario_recibe: toUserName,
            email_recibe: toUserEmail,
            items: [],
          });
        }

        movimientosPorUsuario.get(toUserIdForEmail)!.items.push({
          matricula: request.license_plate,
          material: material.material_label,
          observaciones: material.observations || request.observations || undefined,
        });

        processedMaterials.push(material.id);
      }

      // Consolidar datos para email
      consolidatedMovementData.movimientos = Array.from(movimientosPorUsuario.values());

      // Enviar email (no bloquear si falla)
      try {
        console.log("📧 Enviando email para movimientos:", processedMaterials.length);
        const emailResponse = await fetch("/api/send-movement-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(consolidatedMovementData),
        });

        const emailResult = await emailResponse.json();

        if (emailResponse.ok && emailResult.success) {
          console.log("✅ Email enviado correctamente para", processedMaterials.length, "materiales");
          toast.success("📧 Email enviado correctamente");
        } else {
          console.log("❌ Error email:", emailResult.message);
          if (emailResult.message !== "Envío de emails deshabilitado") {
            toast.warning("⚠️ Error enviando email, pero movimientos registrados");
          }
        }
      } catch (emailError) {
        toast.warning("⚠️ Error enviando email, pero movimientos registrados");
      }

      // Marcar materiales como procesados en la base de datos
      for (const materialId of processedMaterials) {
        try {
          const response = await fetch("/api/docuware/update-material", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              materialId,
              selected: true
            })
          });

          if (!response.ok) {
            // Error silencioso al marcar procesado
          }
        } catch (error) {
          // Error silencioso al marcar material
        }
      }

      toast.success("Todos los movimientos han sido registrados correctamente");
      
      // Actualizar estado local con materiales procesados
      updateRequestsAfterRegistration(processedMaterials);
      
      // Recargar datos en segundo plano para sincronizar con la base de datos
      setTimeout(() => {
        loadRequests(true);
      }, 1000);
      
    } catch (err: any) {
      console.error("❌ Error general:", err.message);
      toast.error(err.message || "Error al registrar movimientos");
    } finally {
      clearTimeout(timeoutId);
      setConfirming(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRequests(true);
      toast.success("Datos actualizados");
    } catch (error) {
      toast.error("Error al actualizar datos");
    } finally {
      setRefreshing(false);
    }
  };

  const handlePrintPending = () => {
    // Obtener solicitudes según la pestaña actual
    const currentRequests = activeTab === "second_keys" ? secondKeyRequests : technicalSheetRequests
    const pendingRequests = currentRequests.filter(r => r.status === "pending")
    
    if (pendingRequests.length === 0) {
      toast.error(`No hay solicitudes de ${activeTab === "second_keys" ? "2ª llaves" : "fichas técnicas"} pendientes para imprimir`)
      return
    }

    // Función para parsear el asunto
    const parseSubject = (subject: string) => {
      const parts = subject.split(" || ")
      if (parts.length >= 4) {
        return {
          license_plate: parts[0].replace("Nuevo pedido ", ""),
          date: parts[1],
          requester: parts[3]
        }
      }
      return { license_plate: "", date: "", requester: "" }
    }

    // Función para filtrar materiales a imprimir
    const filterMaterialsToPrint = (materials: any[]) => {
      // Material principal según pestaña
      const mainType = activeTab === "second_keys" ? "second_key" : "technical_sheet"
      // Materiales adicionales permitidos
      const allowedExtras = ["card_key", "circulation_permit"]
      return materials.filter(m => m.material_type === mainType || allowedExtras.includes(m.material_type))
    }

    // Generar HTML para imprimir
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Solicitudes Docuware</title>
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
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cvo-KUNh8rXJGJ38lK00MJ9JTEci2nGA5o.png" alt="CVO Logo" class="logo-cvo" />
          <hr class="cvo-line" />
          <div class="header-title">SOLICITUDES DOCUWARE - ${activeTab === "second_keys" ? "2ª LLAVES" : "FICHAS TÉCNICAS"}</div>
          <div class="header-content">
            <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
            <p>Total: ${pendingRequests.length} solicitudes pendientes</p>
          </div>
        </div>
    `

    pendingRequests.forEach((request, index) => {
      const parsed = parseSubject(request.email_subject)
      const materials = filterMaterialsToPrint(request.docuware_request_materials || [])
      const mainType = activeTab === "second_keys" ? "second_key" : "technical_sheet"
      
      htmlContent += `
        <div class="request">
          <h3>Solicitud ${index + 1}: ${parsed.license_plate}</h3>
          <div class="info"><strong>Matrícula:</strong> ${parsed.license_plate}</div>
          <div class="info"><strong>Fecha:</strong> ${parsed.date}</div>
          <div class="info"><strong>Solicitante:</strong> ${parsed.requester}</div>
          <div class="info"><strong>Estado:</strong> ${request.status === 'pending' ? 'Pendiente' : 'Completado'}</div>
          
          <div class="materials">
            <strong>Materiales solicitados:</strong>
            ${materials.map(material => `
              <div class="material${material.material_type === mainType ? ' material-main' : ''}">
                ${material.material_type === 'second_key' ? '🔑' :
                  material.material_type === 'technical_sheet' ? '📄' :
                  material.material_type === 'card_key' ? '💳' :
                  material.material_type === 'circulation_permit' ? '📋' : '📦'} 
                ${material.material_label}
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

  const handleAddMaterial = async (requestId: string, materialType: string, materialLabel: string) => {
    try {
      const response = await fetch("/api/docuware/requests/add-material", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          materialType,
          materialLabel
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${materialLabel} añadido correctamente`)
        loadRequests() // Recargar datos
      } else {
        toast.error(data.message || "Error añadiendo material")
      }
    } catch (error) {
      console.error("Error añadiendo material:", error)
      toast.error("Error añadiendo material")
    }
  }

  const parseSubject = (subject: string) => {
    const parts = subject.split(" || ")
    if (parts.length >= 4) {
      return {
        license_plate: parts[0].replace("Nuevo pedido ", ""),
        date: parts[1],
        requester: parts[3]
      }
    }
    return { license_plate: "", date: "", requester: "" }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Filtrar solicitudes por tipo de material
  const secondKeyRequests = requests.filter(request => 
    request.docuware_request_materials?.some(m => 
      m.material_type === "second_key" && !m.selected
    ) || false
  )
  
  const technicalSheetRequests = requests.filter(request => 
    request.docuware_request_materials?.some(m => 
      m.material_type === "technical_sheet" && !m.selected
    ) || false
  )
  
  // Calcular materiales pendientes de forma más precisa
  const pendingSecondKeyMaterials = requests.flatMap(request => 
    request.docuware_request_materials?.filter(m => 
      m.material_type === "second_key" && !m.selected
    ) || []
  )
  
  const pendingTechnicalSheetMaterials = requests.flatMap(request => 
    request.docuware_request_materials?.filter(m => 
      m.material_type === "technical_sheet" && !m.selected
    ) || []
  )

  // Debug logs
  console.log("🔍 Debug modal - Total requests:", requests.length)
  console.log("🔍 Debug modal - Pending 2ª llaves:", pendingSecondKeyMaterials.length)
  console.log("🔍 Debug modal - Pending fichas técnicas:", pendingTechnicalSheetMaterials.length)
  console.log("🔍 Debug modal - Requests data:", requests.map(r => ({
    id: r.id,
    materials: r.docuware_request_materials?.map(m => ({
      type: m.material_type,
      selected: m.selected
    }))
  })))
  
  // Log detallado de materiales seleccionados
  requests.forEach((request, index) => {
    console.log(`🔍 Request ${index + 1} - Materials:`, request.docuware_request_materials?.map(m => ({
      id: m.id,
      type: m.material_type,
      selected: m.selected
    })))
  })

  // Función para obtener materiales adicionales (solo Card Key en 2ª llaves)
  const getAdditionalMaterials = (materials: any[], currentTab: string) => {
    if (currentTab === "second_keys") {
      return materials.filter(m => m.material_type === "card_key")
    }
    return []
  }

  const renderRequestCard = (request: DocuwareRequest, currentTab: string) => {
    const parsed = parseSubject(request.email_subject)
    const materials = request.docuware_request_materials || []
    
    // Filtrar materiales según la pestaña actual
    const mainMaterial = materials.find(m => 
      currentTab === "second_keys" ? m.material_type === "second_key" : m.material_type === "technical_sheet"
    )
    
    const additionalMaterials = getAdditionalMaterials(materials, currentTab)
    
    const aliasKey = request.receiver_alias?.trim().toLowerCase();
    const receiverProfile = aliasKey ? receiverProfiles[aliasKey] : null;

    // Log de depuración
    console.log(`[DEBUG] Renderizando solicitud ${request.id}:`, {
      receiver_alias: request.receiver_alias,
      aliasKey,
      receiverProfile,
      receiverProfiles: Object.keys(receiverProfiles)
    });

    console.log("[DEBUG] Renderizando solicitud:", request.id, "mainMaterial:", mainMaterial);
    if (!mainMaterial) return null;

    return (
      <Card key={request.id} className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Checkbox por material individual */}
              <Checkbox
                checked={selectedMaterials.includes(mainMaterial.id)}
                onCheckedChange={() => handleMaterialToggle(mainMaterial.id)}
                disabled={mainMaterial.selected} // Solo seleccionable si está pendiente
                className="h-5 w-5"
              />
              
              {/* Matrícula y avatares */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="font-bold text-lg">{parsed.license_plate}</div>
                  <div className="text-xs text-muted-foreground">{parsed.date}</div>
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
                      {getInitials(receiverProfile?.full_name || request.receiver_alias || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <div className="font-medium">Recibe</div>
                    <div className="text-muted-foreground">{receiverProfile?.full_name || request.receiver_alias}</div>
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
              {currentTab === "second_keys" ? (
                <>
                  <Key className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">2ª Llave</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Ficha Técnica</span>
                </>
              )}
            </div>
            {/* Materiales adicionales */}
            {additionalMaterials.map((material, index) => (
              <div key={material.id} className="flex items-center gap-1 group">
                {material.material_type === "card_key" ? (
                  <>
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium">Card Key</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium">Permiso Circulación</span>
                  </>
                )}
                <button
                  onClick={() => handleDeleteMaterial(request.id, material.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 text-xs"
                  title="Eliminar material"
                >
                  ×
                </button>
              </div>
            ))}
            {/* Botón añadir - solo en pestaña de 2ª llaves */}
            {currentTab === "second_keys" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleAddMaterial(request.id, "card_key", "Card Key")}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Card Key
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
            <FileText className="h-5 w-5 text-blue-500" />
            Solicitudes Docuware
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header con botones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {pendingSecondKeyMaterials.length + pendingTechnicalSheetMaterials.length} materiales pendientes
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
                  <Loader2 className="h-4 w-4 animate-spin" />
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Movimientos"
                )}
              </Button>
            </div>
          </div>

          {/* Pestañas principales */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="second_keys">
                2ª Llaves ({pendingSecondKeyMaterials.length})
              </TabsTrigger>
              <TabsTrigger value="technical_sheets">
                Fichas Técnicas ({pendingTechnicalSheetMaterials.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <div className="text-lg font-medium text-muted-foreground">Consultando datos...</div>
            </div>
          ) : refreshing ? (
            <div className="flex items-center justify-center py-4 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">Actualizando datos...</span>
            </div>
          ) : (
            /* Pestañas principales */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="second_keys" className="space-y-3 mt-4">
                {/* Buscador y subpestañas para 2ª Llaves */}
                <div className="flex items-center justify-between gap-4">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 relative">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <div className="relative">
                        <Input
                          placeholder="Buscar por matrícula, solicitante o receptor... (Enter para seleccionar)"
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
                              const mainMaterial = request.docuware_request_materials?.find(m => 
                                m.material_type === (activeTab === "second_keys" ? "second_key" : "technical_sheet")
                              )
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
                                        {request.requester} → {request.receiver_alias || 'Sin receptor'}
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
                  <Tabs defaultValue="pending" className="w-auto">
                    <TabsList className="grid w-auto grid-cols-2">
                      <TabsTrigger value="pending">
                        Pendientes ({secondKeyRequests.filter(r => 
                          r.docuware_request_materials?.some(m => m.material_type === "second_key" && !m.selected)
                        ).length})
                      </TabsTrigger>
                      <TabsTrigger value="completed">
                        Completados ({secondKeyRequests.filter(r => 
                          r.docuware_request_materials?.some(m => m.material_type === "second_key" && m.selected)
                        ).length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                  <TabsContent value="pending" className="space-y-3 mt-4">
                    {secondKeyRequests.filter(r => 
                      r.docuware_request_materials?.some(m => m.material_type === "second_key" && !m.selected)
                    ).length > 0 ? (
                      secondKeyRequests
                        .filter(r => r.docuware_request_materials?.some(m => m.material_type === "second_key" && !m.selected))
                        .map(request => renderRequestCard(request, "second_keys"))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay solicitudes de 2ª llaves pendientes</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-3 mt-4">
                    {secondKeyRequests.filter(r => 
                      r.docuware_request_materials?.some(m => m.material_type === "second_key" && m.selected)
                    ).length > 0 ? (
                      secondKeyRequests
                        .filter(r => r.docuware_request_materials?.some(m => m.material_type === "second_key" && m.selected))
                        .map(request => renderRequestCard(request, "second_keys"))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay solicitudes de 2ª llaves completadas</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="technical_sheets" className="space-y-3 mt-4">
                {/* Buscador y subpestañas para Fichas Técnicas */}
                <div className="flex items-center justify-between gap-4">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 relative">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <div className="relative">
                        <Input
                          placeholder="Buscar por matrícula, solicitante o receptor... (Enter para seleccionar)"
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
                              const mainMaterial = request.docuware_request_materials?.find(m => 
                                m.material_type === (activeTab === "second_keys" ? "second_key" : "technical_sheet")
                              )
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
                                        {request.requester} → {request.receiver_alias || 'Sin receptor'}
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
                  <Tabs defaultValue="pending" className="w-auto">
                    <TabsList className="grid w-auto grid-cols-2">
                      <TabsTrigger value="pending">
                        Pendientes ({technicalSheetRequests.filter(r => 
                          r.docuware_request_materials?.some(m => m.material_type === "technical_sheet" && !m.selected)
                        ).length})
                      </TabsTrigger>
                      <TabsTrigger value="completed">
                        Completados ({technicalSheetRequests.filter(r => 
                          r.docuware_request_materials?.some(m => m.material_type === "technical_sheet" && m.selected)
                        ).length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                  <TabsContent value="pending" className="space-y-3 mt-4">
                    {technicalSheetRequests.filter(r => 
                      r.docuware_request_materials?.some(m => m.material_type === "technical_sheet" && !m.selected)
                    ).length > 0 ? (
                      technicalSheetRequests
                        .filter(r => r.docuware_request_materials?.some(m => m.material_type === "technical_sheet" && !m.selected))
                        .map(request => renderRequestCard(request, "technical_sheets"))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay solicitudes de fichas técnicas pendientes</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-3 mt-4">
                    {technicalSheetRequests.filter(r => 
                      r.docuware_request_materials?.some(m => m.material_type === "technical_sheet" && m.selected)
                    ).length > 0 ? (
                      technicalSheetRequests
                        .filter(r => r.docuware_request_materials?.some(m => m.material_type === "technical_sheet" && m.selected))
                        .map(request => renderRequestCard(request, "technical_sheets"))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay solicitudes de fichas técnicas completadas</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 