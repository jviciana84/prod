"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Car, ShoppingCart, TrendingUp, Building2, Bike } from "lucide-react"
import { MotivationalQuote } from "@/components/dashboard/motivational-quote"
import { DigitalClock } from "@/components/dashboard/digital-clock"
import { PendingMovementsCard } from "@/components/dashboard/pending-movements-card"
import { ObjetivosCard } from "@/components/dashboard/objetivos-card"
import { RealActivityFeed } from "@/components/dashboard/real-activity-feed"
import { FinancingRanking } from "@/components/dashboard/financing-ranking"
import { SalesRanking } from "@/components/dashboard/sales-ranking"
import { WorkshopDaysCard } from "@/components/dashboard/workshop-days-card"
import { SearchWithModal } from "@/components/dashboard/search-with-modal"
import { BMWLogo, MINILogo, BMWMotorradLogo } from "@/components/ui/brand-logos"

interface DashboardContentProps {
  displayName: string
  randomPhrase: string
  currentAverage: number
  last15Average: number
  previous15Average: number
  totalAverage: number
  trendDirection: string
  trendPercentage: string
  soldPendingCount: number
  carsInWorkshop: number
  maxCapacity: number
  saturationPercentage: number
  averagePaintDays: string
  averageMechanicalDays: string
  workshopDaysData: any[]
  incidentPercentage: string
  stats: {
    vehiclesInStock: number
    carsInStock: number
    motorcyclesInStock: number
    bmwStockCount: number
    miniStockCount: number
    salesThisMonth: number
    salesCarsCount: number
    salesMotorcyclesCount: number
    bmwSalesCount: number
    miniSalesCount: number
    revenue: number
    revenueCars: number
    revenueMotorcycles: number
    revenueBMW: number
    revenueMINI: number
    financedVehicles: number
    financedCars: number
    financedMotorcycles: number
    bmwFinancedCount: number
    miniFinancedCount: number
    salesChange: string
    revenueChange: string
    financedVehiclesChange: string
    stockChange: string
  }
}

export function DashboardContent({
  displayName,
  randomPhrase,
  currentAverage,
  last15Average,
  previous15Average,
  totalAverage,
  trendDirection,
  trendPercentage,
  soldPendingCount,
  carsInWorkshop,
  maxCapacity,
  saturationPercentage,
  averagePaintDays,
  averageMechanicalDays,
  workshopDaysData,
  incidentPercentage,
  stats
}: DashboardContentProps) {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h1 style={{ marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 700, fontSize: '2.2rem', lineHeight: 1.1 }}>
            Dashboard
          </h1>
          <DigitalClock />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground truncate">
            Bienvenido, <span className="font-medium text-foreground">{displayName}</span>
          </p>
          <MotivationalQuote quote={randomPhrase} />
        </div>
      </div>

      {/* Buscador moderno - posicionado correctamente */}
      <div className="fixed top-20 z-50" style={{ left: 'calc(100% - 27rem)', right: '1rem' }}>
        <SearchWithModal 
          placeholder="Buscar vehículos, clientes, ventas..."
          className="max-w-sm"
        />
      </div>

      {/* Panel Promedio de Días en Taller */}
      <WorkshopDaysCard
        currentAverage={currentAverage}
        last15Average={last15Average}
        previous15Average={previous15Average}
        totalAverage={totalAverage}
        trendDirection={trendDirection}
        trendPercentage={trendPercentage}
        soldPending={soldPendingCount}
        carsInWorkshop={carsInWorkshop}
        maxCapacity={maxCapacity}
        saturationPercentage={saturationPercentage}
        averagePaintDays={averagePaintDays}
        averageWorkshopDays={averageMechanicalDays}
        chartData={workshopDaysData}
        incidentPercentage={incidentPercentage}
      />

      {/* Cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Vehículos en Stock</p>
                <h3 className="text-2xl font-bold mt-1">{stats.vehiclesInStock}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">{stats.carsInStock}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bike className="h-3 w-3 text-red-500" />
                    <span className="text-xs">{stats.motorcyclesInStock}</span>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {stats.stockChange === "N/A" ? (
                <span className="text-muted-foreground">N/A desde el mes pasado</span>
              ) : (
                <>
                  <TrendingUp
                    className={`h-3 w-3 mr-1 ${stats.stockChange.startsWith("+") ? "text-green-500" : "text-red-500"}`}
                  />
                  <span
                    className={`${stats.stockChange.startsWith("+") ? "text-green-500" : "text-red-500"} font-medium`}
                  >
                    {stats.stockChange}
                  </span>
                  <span className="ml-1 truncate">desde el mes pasado</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <BMWLogo className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">{stats.bmwStockCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MINILogo className="h-4 w-4 text-gray-800" />
                <span className="text-xs font-medium">{stats.miniStockCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <BMWMotorradLogo className="h-8 w-8 text-red-600" />
                <span className="text-xs font-medium">{stats.motorcyclesInStock}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Ventas este Mes</p>
                <h3 className="text-2xl font-bold mt-1">{stats.salesThisMonth}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">{stats.salesCarsCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bike className="h-3 w-3 text-red-500" />
                    <span className="text-xs">{stats.salesMotorcyclesCount}</span>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
                <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {stats.salesChange === "N/A" ? (
                <span className="text-muted-foreground">N/A desde el mes pasado</span>
              ) : (
                <>
                  <TrendingUp
                    className={`h-3 w-3 mr-1 ${stats.salesChange.startsWith("+") ? "text-green-500" : "text-red-500"}`}
                  />
                  <span
                    className={`${stats.salesChange.startsWith("+") ? "text-green-500" : "text-red-500"} font-medium`}
                  >
                    {stats.salesChange}
                  </span>
                  <span className="ml-1 truncate">desde el mes pasado</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <BMWLogo className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">{stats.bmwSalesCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MINILogo className="h-4 w-4 text-gray-800" />
                <span className="text-xs font-medium">{stats.miniSalesCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <BMWMotorradLogo className="h-8 w-8 text-red-600" />
                <span className="text-xs font-medium">{stats.salesMotorcyclesCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Ingresos (€)</p>
                <h3 className="text-2xl font-bold mt-1">{stats.revenue.toLocaleString()}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">{stats.revenueCars.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bike className="h-3 w-3 text-red-500" />
                    <span className="text-xs">{stats.revenueMotorcycles.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {stats.revenueChange === "N/A" ? (
                <span className="text-muted-foreground">N/A desde el mes pasado</span>
              ) : (
                <>
                  <TrendingUp
                    className={`h-3 w-3 mr-1 ${stats.revenueChange.startsWith("+") ? "text-green-500" : "text-red-500"}`}
                  />
                  <span
                    className={`${stats.revenueChange.startsWith("+") ? "text-green-500" : "text-red-500"} font-medium`}
                  >
                    {stats.revenueChange}
                  </span>
                  <span className="ml-1 truncate">desde el mes pasado</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <BMWLogo className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">{stats.revenueBMW.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MINILogo className="h-4 w-4 text-gray-800" />
                <span className="text-xs font-medium">{stats.revenueMINI.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <BMWMotorradLogo className="h-8 w-8 text-red-600" />
                <span className="text-xs font-medium">{stats.revenueMotorcycles.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Vehículos Financiados</p>
                <h3 className="text-2xl font-bold mt-1">{stats.financedVehicles}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">{stats.financedCars}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bike className="h-3 w-3 text-red-500" />
                    <span className="text-xs">{stats.financedMotorcycles}</span>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full border border-orange-200 dark:border-orange-800">
                <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {stats.financedVehiclesChange === "N/A" ? (
                <span className="text-muted-foreground">N/A desde el mes pasado</span>
              ) : (
                <>
                  <TrendingUp
                    className={`h-3 w-3 mr-1 ${stats.financedVehiclesChange.startsWith("+") ? "text-green-500" : "text-red-500"}`}
                  />
                  <span
                    className={`${stats.financedVehiclesChange.startsWith("+") ? "text-green-500" : "text-red-500"} font-medium`}
                  >
                    {stats.financedVehiclesChange}
                  </span>
                  <span className="ml-1 truncate">desde el mes pasado</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <BMWLogo className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">{stats.bmwFinancedCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MINILogo className="h-4 w-4 text-gray-800" />
                <span className="text-xs font-medium">{stats.miniFinancedCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <BMWMotorradLogo className="h-8 w-8 text-red-600" />
                <span className="text-xs font-medium">{stats.financedMotorcycles}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila con movimientos pendientes y objetivos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PendingMovementsCard />
        <div className="md:col-span-2">
          <ObjetivosCard />
        </div>
      </div>

      {/* Tercera fila con Actividad Reciente y los dos Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RealActivityFeed />
        <SalesRanking />
        <FinancingRanking />
      </div>
    </div>
  )
}
