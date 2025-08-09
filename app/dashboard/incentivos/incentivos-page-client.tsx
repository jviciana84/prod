"use client"

import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Trophy, Settings, RefreshCw, Loader2, CheckCircle, Car, Tag, Euro, Calculator, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"
import Link from "next/link"
import { IncentivosTable } from "@/components/incentivos/incentivos-table"
import { ExcelWarrantyUploader } from "@/components/incentivos/excel-warranty-uploader"
import { IncentivePendingRow } from "@/components/incentivos/incentive-pending-row"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type { Incentivo } from "@/types/incentivos"
import { FiltersCard } from "@/components/incentivos/filters-card"

export default function IncentivosPageClient({
  userRole,
  userAdvisorName,
}: {
  userRole: string | null
  userAdvisorName: string | null
}) {
  const isAdminOrManagerOrSupervisor = userRole === "admin" || userRole === "manager" || userRole === "supervisor"
  const [allIncentives, setAllIncentives] = useState<Incentivo[]>([])
  const [pendingIncentivesForCard, setPendingIncentivesForCard] = useState<Incentivo[]>([])
  const [loadingMainTable, setLoadingMainTable] = useState(true)
  const [loadingPendingCard, setLoadingPendingCard] = useState(true)
  const [refreshingPendingCard, setRefreshingPendingCard] = useState(false)

  const [filterMode, setFilterMode] = useState<"pending" | "historical">("pending")
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null)

  // Estado para selección de filas
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const handleRowClick = (incentivoId: string, event: React.MouseEvent) => {
    // No deseleccionar si se hace clic en elementos interactivos
    const target = event.target as Element
    if (target.closest('button') || 
        target.closest('input') || 
        target.closest('[role="combobox"]') || 
        target.closest('span[onClick]') ||
        target.closest('a') ||
        target.closest('[data-interactive]') ||
        target.closest('label')) {
      return
    }
    
    setSelectedRowId(selectedRowId === incentivoId ? null : incentivoId)
  }

  const fetchIncentivesData = useCallback(async () => {
    setLoadingMainTable(true)
    setLoadingPendingCard(true)
    try {
      // Para la tabla principal, cargar todos los datos
      const mainTableResponse = await fetch("/api/incentivos/filtered", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "historical", // Mostrar todos los datos históricos
          isAdmin: isAdminOrManagerOrSupervisor,
          userAdvisorName: userAdvisorName,
        }),
      })

      const mainTableResult = await mainTableResponse.json()

      if (mainTableResult.error) {
        console.error("Error fetching main incentives data:", mainTableResult.error)
        toast.error("Error al cargar los datos de incentivos.")
        setAllIncentives([])
      } else {
        setAllIncentives(mainTableResult.data || [])
      }

      // Para el card de pendientes, aplicar filtros
      const pendingCardResponse = await fetch("/api/incentivos/filtered", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          advisor: selectedAdvisor,
          mode: filterMode,
          isAdmin: isAdminOrManagerOrSupervisor,
          userAdvisorName: userAdvisorName,
        }),
      })

      const pendingCardResult = await pendingCardResponse.json()

      if (pendingCardResult.error) {
        console.error("Error fetching pending incentives for card:", pendingCardResult.error)
        toast.error("Error al cargar la lista de incentivos pendientes.")
        setPendingIncentivesForCard([])
      } else {
        setPendingIncentivesForCard(pendingCardResult.data || [])
      }
    } catch (error) {
      console.error("Unexpected error fetching incentives:", error)
      toast.error("Error inesperado al cargar los datos.")
      setAllIncentives([])
      setPendingIncentivesForCard([])
    } finally {
      setLoadingMainTable(false)
      setLoadingPendingCard(false)
    }
  }, [selectedYear, selectedMonth, selectedAdvisor, filterMode, isAdminOrManagerOrSupervisor, userAdvisorName])

  useEffect(() => {
    fetchIncentivesData()
  }, [fetchIncentivesData])

  const handleRefreshPendingCard = async () => {
    setRefreshingPendingCard(true)
    await fetchIncentivesData()
    setRefreshingPendingCard(false)
  }

  const handleFilterChange = useCallback(
    (filters: {
      year: string | null
      month: string | null
      advisor: string | null
      mode: "pending" | "historical"
    }) => {
      setSelectedYear(filters.year)
      setSelectedMonth(filters.month)
      setSelectedAdvisor(filters.advisor)
      setFilterMode(filters.mode)
    },
    [],
  )

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4"
          segments={[
            {
              title: "Dashboard",
              href: "/dashboard",
            },
            {
              title: "Incentivos",
              href: "/dashboard/incentivos",
            },
          ]}
        />
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Incentivos</h1>
              <p className="text-muted-foreground">Gestión y seguimiento de incentivos de ventas</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdminOrManagerOrSupervisor && (
              <Link href="/dashboard/incentivos/config">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configuración de Incentivos
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="lg:w-[70%] rounded-xl border shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-6 px-8 pt-8">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-foreground">
                <Calculator className="h-6 w-6 text-orange-500" />
                Incentivos Pendientes de Costes
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Vehículos que requieren asignación de costes de garantía y gastos 360º
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isAdminOrManagerOrSupervisor && (
                <>
                  <ExcelWarrantyUploader onUploadComplete={handleRefreshPendingCard} />
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefreshPendingCard}
                disabled={refreshingPendingCard || loadingPendingCard}
                className="h-9 w-9 text-muted-foreground border-input hover:bg-accent"
                title="Actualizar Pendientes"
              >
                {refreshingPendingCard ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="rounded-lg border bg-background shadow-sm">
              <Table>
                <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="p-1 rounded-md bg-orange-500/10">
                          <Calendar className="h-3 w-3 text-orange-500" />
                        </div>
                        ENTREGA
                      </div>
                    </TableHead>
                    <TableHead className="py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Car className="h-3.5 w-3.5 text-primary" />
                        </div>
                        MATRÍCULA
                      </div>
                    </TableHead>
                    <TableHead className="py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="p-1 rounded-md bg-blue-500/10">
                          <Tag className="h-3 w-3 text-blue-500" />
                        </div>
                        OR
                      </div>
                    </TableHead>
                    <TableHead className="py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="p-1 rounded-md bg-green-500/10">
                          <Tag className="h-3 w-3 text-green-500" />
                        </div>
                        ASESOR
                      </div>
                    </TableHead>
                    <TableHead className="py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="p-1 rounded-md bg-yellow-500/10">
                          <Euro className="h-3 w-3 text-yellow-500" />
                        </div>
                        GARANTÍA
                      </div>
                    </TableHead>
                    <TableHead className="py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="p-1 rounded-md bg-purple-500/10">
                          <Euro className="h-3 w-3 text-purple-500" />
                        </div>
                        GASTOS 360º
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPendingCard ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex justify-center items-center text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Cargando incentivos pendientes...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : pendingIncentivesForCard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mb-3 text-green-500" />
                          <p className="text-base font-medium">No hay incentivos pendientes de costes.</p>
                          <p className="text-sm text-muted-foreground/70 mt-1">
                            Todos los incentivos tienen sus costes asignados.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingIncentivesForCard.map((incentivo, index) => (
                      <IncentivePendingRow
                        key={incentivo.id}
                        incentivo={incentivo}
                        onUpdate={handleRefreshPendingCard}
                        index={index}
                        isAdmin={isAdminOrManagerOrSupervisor}
                        selectedRowId={selectedRowId}
                        onRowClick={handleRowClick}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="lg:w-[30%]">
          <FiltersCard
            displayIncentives={pendingIncentivesForCard}
            onFilterChange={handleFilterChange}
            currentFilterMode={filterMode}
            currentSelectedYear={selectedYear}
            currentSelectedMonth={selectedMonth}
            currentSelectedAdvisor={selectedAdvisor}
          />
        </div>
      </div>

      <Card className="rounded-xl border shadow-sm bg-card">
        <CardHeader className="px-8 pt-8 pb-6">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl font-semibold text-foreground">Tabla de Incentivos</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Historial completo de incentivos con detalles de costes y cálculos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <IncentivosTable
            incentivos={allIncentives}
            isAdmin={isAdminOrManagerOrSupervisor}
            userAdvisorName={userAdvisorName}
            loading={loadingMainTable}
            onRefreshRequest={fetchIncentivesData}
          />
        </CardContent>
      </Card>
    </div>
  )
}
