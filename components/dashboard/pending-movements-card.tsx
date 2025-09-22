"use client"

import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

// Replicating the Movement type from app/dashboard/movimientos-pendientes/page.tsx
type Movement = {
  id: string
  vehicle_id: string
  key_type?: string
  document_type?: string
  from_user_id: string | null
  to_user_id: string
  reason: string
  confirmed: boolean
  rejected?: boolean
  confirmation_deadline: string | null
  confirmed_at: string | null
  rejected_at?: string | null
  notes: string | null
  created_at: string
  license_plate?: string // Not directly from DB, but added by page logic
  from_user_name?: string // Not directly from DB, but added by page logic
  to_user_name?: string // Not directly from DB, but added by page logic
  type: "key" | "document"
}

interface PendingStats {
  total: number
  docs: number
  keys: number
}

// Replicating isAutoAccepted from app/dashboard/movimientos-pendientes/page.tsx
const isAutoAccepted = (createdAt: string, confirmationDeadline: string | null): boolean => {
  if (!confirmationDeadline) return false

  const now = new Date()
  const deadline = new Date(confirmationDeadline)

  // Si ya pasó la fecha límite, se considera auto-aceptado
  return now > deadline
}

// Replicating getMovementStatus from app/dashboard/movimientos-pendientes/page.tsx
const getMovementStatus = (movement: Movement) => {
  if (movement.rejected) return "rejected"
  if (movement.confirmed) return "confirmed"
  if (movement.confirmation_deadline && isAutoAccepted(movement.created_at, movement.confirmation_deadline)) {
    return "auto_accepted"
  }
  return "pending"
}

export function PendingMovementsCard() {
  const { user, loading: authLoading } = useAuth()
  const [pendingStats, setPendingStats] = useState<PendingStats>({ total: 0, docs: 0, keys: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClientComponentClient(), [])

  useEffect(() => {
    const fetchAndFilterMovements = async () => {
      if (!user?.id || authLoading) {
        console.log("🔍 [PendingMovementsCard] No user ID or auth still loading, skipping fetch.")
        setLoading(true)
        return
      }

      try {
        setLoading(true)
        setError(null)
        console.log(`🔍 [PendingMovementsCard] Fetching all movements for user ID: ${user.id}`)

        // Fetch all document movements for the user
        const { data: rawDocMovements, error: docError } = await supabase
          .from("document_movements")
          .select("*")
          .eq("to_user_id", user.id)
          .order("created_at", { ascending: false }) // Order to match page logic if needed

        console.log("DEBUG: Raw Document movements query result:", { data: rawDocMovements, error: docError })

        if (docError) {
          console.error("❌ [PendingMovementsCard] Error fetching raw document movements:", docError)
          throw new Error("Error al cargar movimientos de documentos.")
        }

        // Fetch all key movements for the user
        const { data: rawKeyMovements, error: keyError } = await supabase
          .from("key_movements")
          .select("*")
          .eq("to_user_id", user.id)
          .order("created_at", { ascending: false }) // Order to match page logic if needed

        console.log("DEBUG: Raw Key movements query result:", { data: rawKeyMovements, error: keyError })

        if (keyError) {
          console.error("❌ [PendingMovementsCard] Error fetching raw key movements:", keyError)
          throw new Error("Error al cargar movimientos de llaves.")
        }

        // Process and filter movements using the same logic as the main page
        const processedDocMovements: Movement[] = rawDocMovements?.map((m) => ({ ...m, type: "document" })) || []
        const processedKeyMovements: Movement[] = rawKeyMovements?.map((m) => ({ ...m, type: "key" })) || []

        const pendingDocs = processedDocMovements.filter((m) => getMovementStatus(m) === "pending")
        const pendingKeys = processedKeyMovements.filter((m) => getMovementStatus(m) === "pending")

        const totalDocs = pendingDocs.length
        const totalKeys = pendingKeys.length
        const total = totalDocs + totalKeys

        setPendingStats({
          total: total,
          docs: totalDocs,
          keys: totalKeys,
        })
        console.log(`📊 [PendingMovementsCard] Calculated pending: ${total}, Docs: ${totalDocs}, Keys: ${totalKeys}`)
      } catch (err) {
        console.error("❌ [PendingMovementsCard] Error fetching and filtering movements:", err)
        setError(err instanceof Error ? err.message : "Error desconocido al cargar movimientos.")
        setPendingStats({ total: 0, docs: 0, keys: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchAndFilterMovements()
  }, [user?.id, authLoading, supabase])

  if (authLoading || loading) {
    return (
      <Card className="h-full bg-card flex flex-col justify-between">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg font-medium text-foreground">Movimientos Pendientes</CardTitle>
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Cargando tus movimientos pendientes...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
        <CardFooter className="pt-0 pb-4 px-6 text-left">
          <Skeleton className="h-3 w-48" />
        </CardFooter>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="h-full bg-card flex flex-col justify-between">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg font-medium text-foreground">Movimientos Pendientes</CardTitle>
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Inicia sesión para ver tus movimientos pendientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No autenticado</p>
        </CardContent>
        <CardFooter className="pt-0 pb-4 px-6 text-left">
          <p className="text-xs text-muted-foreground font-mono">Pendientes: Docs: 0, Llaves: 0</p>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Link href="/dashboard/movimientos-pendientes" className="block h-full">
      <Card className="h-full bg-card flex flex-col justify-between">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg font-medium text-foreground">Movimientos Pendientes</CardTitle>
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Movimientos de material pendientes de aceptar por tu parte
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center space-y-4">
          {error ? (
            <div className="text-center text-muted-foreground py-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <p>Error al cargar movimientos</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <>
              {pendingStats.total === 0 ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                  <span className="text-lg font-semibold text-muted-foreground">¡Todo al día!</span>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">{pendingStats.total}</span>
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-white">!</span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="pt-0 pb-4 px-6 text-left">
          {error ? (
            <p className="text-xs text-red-500 font-mono">Error: {error}</p>
          ) : (
            <p className="text-xs text-muted-foreground font-mono">
              Pendientes: Docs: {pendingStats.docs}, Llaves: {pendingStats.keys}
            </p>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
