"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Mail, CheckCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

interface Extorno {
  id: string
  matricula: string
  cliente: string
  numero_cliente?: string
  concepto: string
  importe: number
  numero_cuenta?: string
  concesion?: string
  observaciones?: string
  created_at: string
  pago_confirmado_at?: string
  pago_confirmado_por?: string
  confirmation_token?: string
  solicitante_nombre?: string
  solicitante_email?: string
  created_by?: string
  profiles?: {
    full_name: string | null
    email: string | null
  } | null
}

export function ExtornosTable() {
  const supabase = createClientComponentClient()
  const [extornos, setExtornos] = useState<Extorno[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadExtornos()
    loadCurrentUser()
  }, [])

  // Suscripción en tiempo real para actualizar automáticamente la tabla
  useEffect(() => {
    console.log("🔔 Configurando suscripción en tiempo real para extornos...")
    
    const channel = supabase
      .channel('extornos_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'extornos'
        },
        async (payload) => {
          console.log('📡 Cambio detectado en extornos:', payload.eventType)
          
          // Recargar los datos cuando hay cambios
          await loadExtornos()
          
          // Mostrar notificación según el tipo de evento
          switch(payload.eventType) {
            case 'INSERT':
              toast.success('Nuevo extorno añadido')
              break
            case 'UPDATE':
              toast.info('Extorno actualizado')
              break
            case 'DELETE':
              toast.info('Extorno eliminado')
              break
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscripción a extornos activa')
        }
      })

    // Cleanup: remover el canal cuando el componente se desmonte
    return () => {
      console.log('🔌 Desconectando suscripción de extornos...')
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profile) {
          setCurrentUser(profile)
        } else {
          setCurrentUser(user)
        }
      }
    } catch (error) {
      console.error("Error cargando usuario:", error)
    }
  }

  const loadExtornos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("extornos")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })

      if (error) throw error

      const extornosConSolicitante = data?.map((extorno) => {
        // Debugging: Log the raw extorno object and its profiles property
        console.log(`Extorno ID: ${extorno.id}, created_by: ${extorno.created_by}`)
        console.log("Profiles data for this extorno:", extorno.profiles)

        return {
          ...extorno,
          solicitante_nombre: (extorno.profiles as any)?.full_name || "N/A",
          solicitante_email: (extorno.profiles as any)?.email || "N/A",
        }
      })

      setExtornos((extornosConSolicitante as Extorno[]) || [])
    } catch (error) {
      console.error("Error cargando extornos:", error)
      toast.error("Error cargando extornos")
    } finally {
      setLoading(false)
    }
  }

  const enviarEmailRegistro = async (extorno: Extorno) => {
    try {
      console.log("📧 Enviando email de registro para extorno:", extorno.id)

      const emailResponse = await fetch("/api/extornos/send-notification-with-attachments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extorno_id: extorno.id,
          tipo: "registro",
          extorno_created_by: extorno.created_by,
        }),
      })

      const emailResult = await emailResponse.json()

      if (emailResponse.ok && emailResult.success) {
        console.log("✅ Email de registro enviado correctamente")
        toast.success("Email de registro enviado correctamente")
      } else {
        console.error("❌ Error enviando email:", emailResult)
        toast.error(`Error enviando email: ${emailResult.message}`)
      }
    } catch (error) {
      console.error("❌ Error crítico enviando email:", error)
      toast.error("Error crítico enviando email")
    }
  }

  const tramitarExtorno = async (extorno: Extorno) => {
    try {
      console.log("🔄 Tramitando extorno:", extorno.id)

      const emailResponse = await fetch("/api/extornos/send-notification-with-attachments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extorno_id: extorno.id,
          tipo: "tramitacion",
          extorno_created_by: extorno.created_by,
          usuario_tramita_nombre: currentUser?.full_name || currentUser?.email, // Pass current user's name
          usuario_tramita_email: currentUser?.email,
        }),
      })

      const emailResult = await emailResponse.json()

      if (emailResponse.ok && emailResult.success) {
        console.log("✅ Email de tramitación enviado correctamente")
        toast.success("Extorno tramitado y notificación enviada al responsable de pagos")
        loadExtornos()
      } else {
        console.error("❌ Error enviando email:", emailResult)
        toast.error(`Error enviando notificación: ${emailResult.message}`)
      }
    } catch (error) {
      console.error("❌ Error tramitando extorno:", error)
      toast.error("Error tramitando extorno")
    }
  }

  const getStatusBadge = (extorno: Extorno) => {
    if (extorno.pago_confirmado_at) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completado
        </Badge>
      )
    }

    if (extorno.confirmation_token) {
      return (
        <Badge variant="secondary" className="bg-blue-500 text-white">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente de Pago
        </Badge>
      )
    }

    return (
      <Badge variant="outline">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Pendiente de Tramitación
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <BMWMSpinner size="md" />
        <span className="ml-2">Cargando extornos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Gestión de Extornos
              </CardTitle>
              <CardDescription>Seguimiento de extornos con notificaciones automáticas</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadExtornos}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {extornos.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No hay extornos registrados.</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extornos.map((extorno) => (
                  <TableRow key={extorno.id}>
                    <TableCell className="font-medium">{extorno.matricula}</TableCell>
                    <TableCell>
                      <div>
                        {/* This line displays the solicitante_nombre, which should be the full name or "N/A" */}
                        <div>{extorno.solicitante_nombre || "N/A"}</div>
                        {extorno.numero_cliente && (
                          <div className="text-sm text-muted-foreground">{extorno.numero_cliente}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{extorno.concepto}</TableCell>
                    <TableCell className="font-medium">{extorno.importe.toFixed(2)} €</TableCell>
                    <TableCell>{getStatusBadge(extorno)}</TableCell>
                    <TableCell>{new Date(extorno.created_at).toLocaleDateString("es-ES")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!extorno.confirmation_token && !extorno.pago_confirmado_at && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => enviarEmailRegistro(extorno)}>
                              <Mail className="h-4 w-4 mr-1" />
                              Enviar Email
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => tramitarExtorno(extorno)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Tramitar
                            </Button>
                          </>
                        )}
                        {extorno.pago_confirmado_at && (
                          <span className="text-sm text-muted-foreground">
                            Completado el {new Date(extorno.pago_confirmado_at).toLocaleDateString("es-ES")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
