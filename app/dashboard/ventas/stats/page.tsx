import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

export default async function VentasStatsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Obtener fechas para filtros
  const today = new Date()
  const currentMonthStart = startOfMonth(today)
  const currentMonthEnd = endOfMonth(today)

  // Obtener todas las ventas
  const { data: salesData, error: salesError } = await supabase
    .from("sales_vehicles")
    .select("*")
    .order("sale_date", { ascending: false })

  if (salesError) {
    console.error("Error al cargar ventas:", salesError)
    return <div>Error al cargar los datos de ventas</div>
  }

  // Calcular estadísticas generales
  const totalSales = salesData.length
  const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.price || 0), 0)
  const averagePrice = totalSales > 0 ? totalRevenue / totalSales : 0

  // Ventas por asesor
  const salesByAdvisor = salesData.reduce(
    (acc, sale) => {
      const advisorName = sale.advisor || "No especificado"
      if (!acc[advisorName]) {
        acc[advisorName] = {
          count: 0,
          revenue: 0,
          advisor: advisorName,
          advisorId: sale.advisor_id,
          advisorName: sale.advisor_name || advisorName,
        }
      }
      acc[advisorName].count += 1
      acc[advisorName].revenue += sale.price || 0
      return acc
    },
    {} as Record<string, { count: number; revenue: number; advisor: string; advisorId?: string; advisorName?: string }>,
  )

  const advisorStatsArray = Object.values(salesByAdvisor).sort((a, b) => b.count - a.count)

  // Ventas por tipo de vehículo
  const salesByVehicleType = salesData.reduce(
    (acc, sale) => {
      const type = sale.vehicle_type || "No especificado"
      if (!acc[type]) {
        acc[type] = { name: type, value: 0 }
      }
      acc[type].value += 1
      return acc
    },
    {} as Record<string, { name: string; value: number }>,
  )

  const vehicleTypeData = Object.values(salesByVehicleType)

  // Ventas por método de pago
  const salesByPaymentMethod = salesData.reduce(
    (acc, sale) => {
      const method = sale.payment_method || "No especificado"
      if (!acc[method]) {
        acc[method] = { name: method, value: 0 }
      }
      acc[method].value += 1
      return acc
    },
    {} as Record<string, { name: string; value: number }>,
  )

  const paymentMethodData = Object.values(salesByPaymentMethod)

  // Ventas del mes actual por asesor
  const currentMonthSales = salesData.filter((sale) => {
    if (!sale.sale_date) return false
    const saleDate = new Date(sale.sale_date)
    return saleDate >= currentMonthStart && saleDate <= currentMonthEnd
  })

  const currentMonthSalesByAdvisor = currentMonthSales.reduce(
    (acc, sale) => {
      const advisorName = sale.advisor || "No especificado"
      if (!acc[advisorName]) {
        acc[advisorName] = {
          name: sale.advisor_name || advisorName,
          count: 0,
          revenue: 0,
        }
      }
      acc[advisorName].count += 1
      acc[advisorName].revenue += sale.price || 0
      return acc
    },
    {} as Record<string, { name: string; count: number; revenue: number }>,
  )

  const currentMonthAdvisorData = Object.values(currentMonthSalesByAdvisor).sort((a, b) => b.count - a.count)

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Ventas</h1>
        <p className="text-muted-foreground">Análisis y estadísticas de ventas de vehículos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">Vehículos vendidos en total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Ingresos totales por ventas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio Medio</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(averagePrice)}
            </div>
            <p className="text-xs text-muted-foreground">Precio medio por vehículo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Este Mes</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthSales.length}</div>
            <p className="text-xs text-muted-foreground">Ventas en {format(today, "MMMM yyyy", { locale: es })}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="advisors">Asesores</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Ventas por Tipo de Vehículo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicleTypeData.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 rounded-full mr-2 bg-primary-${index % 6}`}
                        style={{ backgroundColor: index % 2 === 0 ? "#8884d8" : "#82ca9d" }}
                      />
                      <span>{type.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{type.value}</span>
                      <span className="text-muted-foreground">({((type.value / totalSales) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Ventas por Método de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethodData.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 rounded-full mr-2`}
                        style={{ backgroundColor: index % 2 === 0 ? "#ff8042" : "#ffbb28" }}
                      />
                      <span>{method.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{method.value}</span>
                      <span className="text-muted-foreground">({((method.value / totalSales) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advisors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Ventas por Asesor</CardTitle>
              <CardDescription>Listado completo de asesores y sus ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 font-medium">
                      <th className="py-3 px-4 text-left">Asesor</th>
                      <th className="py-3 px-4 text-left">ID</th>
                      <th className="py-3 px-4 text-right">Ventas</th>
                      <th className="py-3 px-4 text-right">Ingresos</th>
                      <th className="py-3 px-4 text-right">Precio Medio</th>
                      <th className="py-3 px-4 text-right">% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisorStatsArray.map((advisor, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4 font-medium">{advisor.advisorName || advisor.advisor}</td>
                        <td className="py-3 px-4 text-muted-foreground">{advisor.advisorId || "N/A"}</td>
                        <td className="py-3 px-4 text-right">{advisor.count}</td>
                        <td className="py-3 px-4 text-right">
                          {new Intl.NumberFormat("es-ES", {
                            style: "currency",
                            currency: "EUR",
                            maximumFractionDigits: 0,
                          }).format(advisor.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {new Intl.NumberFormat("es-ES", {
                            style: "currency",
                            currency: "EUR",
                            maximumFractionDigits: 0,
                          }).format(advisor.revenue / advisor.count)}
                        </td>
                        <td className="py-3 px-4 text-right">{((advisor.count / totalSales) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Asesores - Mes Actual</CardTitle>
              <CardDescription>Ventas por asesor en {format(today, "MMMM yyyy", { locale: es })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentMonthAdvisorData.map((advisor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-[35px] text-center">
                        <span className="font-medium text-sm">{index + 1}</span>
                      </div>
                      <div className="ml-2">
                        <p className="text-sm font-medium leading-none">{advisor.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium">{advisor.count} ventas</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {new Intl.NumberFormat("es-ES", {
                            style: "currency",
                            currency: "EUR",
                            maximumFractionDigits: 0,
                          }).format(advisor.revenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Avanzadas</CardTitle>
              <CardDescription>Métricas detalladas de rendimiento de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Métricas Generales</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Ventas Totales</p>
                      <p className="text-lg font-medium">{totalSales}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Ingresos Totales</p>
                      <p className="text-lg font-medium">
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0,
                        }).format(totalRevenue)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Precio Medio</p>
                      <p className="text-lg font-medium">
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0,
                        }).format(averagePrice)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Ventas Este Mes</p>
                      <p className="text-lg font-medium">{currentMonthSales.length}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Métricas por Asesor</h3>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Número de Asesores Activos</p>
                      <p className="text-lg font-medium">{advisorStatsArray.length}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Ventas por Asesor (Media)</p>
                      <p className="text-lg font-medium">{(totalSales / (advisorStatsArray.length || 1)).toFixed(1)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Ingresos por Asesor (Media)</p>
                      <p className="text-lg font-medium">
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0,
                        }).format(totalRevenue / (advisorStatsArray.length || 1))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
