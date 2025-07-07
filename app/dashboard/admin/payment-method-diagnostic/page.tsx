"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, RefreshCw, CheckCircle, Info } from "lucide-react"
import { toast } from "sonner"

interface PaymentMethodStats {
  payment_method: string
  count: number
  percentage: number
}

interface BankData {
  bank: string
  payment_method: string
  count: number
}

interface VehicleData {
  id: string
  license_plate: string
  model: string
  bank: string
  payment_method: string
  created_at: string
}

export default function PaymentMethodDiagnosticPage() {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [stats, setStats] = useState<PaymentMethodStats[]>([])
  const [bankData, setBankData] = useState<BankData[]>([])
  const [recentVehicles, setRecentVehicles] = useState<VehicleData[]>([])
  const [totalVehicles, setTotalVehicles] = useState(0)

  const supabase = createClientComponentClient()

  const loadDiagnosticData = async () => {
    setLoading(true)
    try {
      // Obtener estadísticas de métodos de pago
      const { data: paymentStats, error: statsError } = await supabase.from("sales_vehicles").select("payment_method")

      if (statsError) {
        console.error("Error cargando estadísticas:", statsError)
        toast.error("Error cargando estadísticas")
        return
      }

      // Procesar estadísticas
      const methodCounts: Record<string, number> = {}
      const total = paymentStats.length

      paymentStats.forEach((vehicle) => {
        const method = vehicle.payment_method || "Sin especificar"
        methodCounts[method] = (methodCounts[method] || 0) + 1
      })

      const statsArray = Object.entries(methodCounts).map(([method, count]) => ({
        payment_method: method,
        count,
        percentage: (count / total) * 100,
      }))

      setStats(statsArray.sort((a, b) => b.count - a.count))
      setTotalVehicles(total)

      // Obtener datos de bancos
      const { data: bankStats, error: bankError } = await supabase.from("sales_vehicles").select("bank, payment_method")

      if (bankError) {
        console.error("Error cargando datos de bancos:", bankError)
      } else {
        const bankCounts: Record<string, { payment_method: string; count: number }> = {}

        bankStats.forEach((vehicle) => {
          const bank = vehicle.bank || "Sin especificar"
          const method = vehicle.payment_method || "Sin especificar"
          const key = `${bank}|${method}`

          if (!bankCounts[key]) {
            bankCounts[key] = { payment_method: method, count: 0 }
          }
          bankCounts[key].count++
        })

        const bankArray = Object.entries(bankCounts).map(([key, data]) => {
          const [bank] = key.split("|")
          return {
            bank,
            payment_method: data.payment_method,
            count: data.count,
          }
        })

        setBankData(bankArray.sort((a, b) => b.count - a.count))
      }

      // Obtener vehículos recientes
      const { data: recentData, error: recentError } = await supabase
        .from("sales_vehicles")
        .select("id, license_plate, model, bank, payment_method, created_at")
        .order("created_at", { ascending: false })
        .limit(20)

      if (recentError) {
        console.error("Error cargando vehículos recientes:", recentError)
      } else {
        setRecentVehicles(recentData || [])
      }
    } catch (error) {
      console.error("Error en diagnóstico:", error)
      toast.error("Error cargando datos de diagnóstico")
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentMethods = async () => {
    setUpdating(true)
    try {
      // Obtener todos los vehículos con sus bancos
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("sales_vehicles")
        .select("id, bank, payment_method")

      if (vehiclesError) {
        throw new Error(vehiclesError.message)
      }

      let updatedCount = 0
      const updates = []

      for (const vehicle of vehicles) {
        // Función para determinar el método de pago (misma lógica que en el servidor)
        const determinePaymentMethod = (banco: string | null): string => {
          if (!banco || banco.trim() === "") return "Contado"

          const bancoUpper = banco.toUpperCase().trim()

          // Financiación BMW
          const bmwPatterns = ["BMW BANK", "BMW FINANCIAL", "SELECT", "LINEAL", "BALLOON", "TRIPLE 0", "TRIPLE0"]
          if (bmwPatterns.some((pattern) => bancoUpper.includes(pattern))) {
            return "Financiación"
          }

          // Contado
          const contadoPatterns = ["CONTADO", "EFECTIVO", "TRANSFERENCIA", "CASH"]
          if (contadoPatterns.some((pattern) => bancoUpper.includes(pattern))) {
            return "Contado"
          }

          // Financiación externa
          const externalBanks = ["BBVA", "CAIXABANK", "CAIXA", "SANTANDER", "SABADELL", "BANKINTER", "ING"]
          if (externalBanks.some((bank) => bancoUpper.includes(bank))) {
            return "Externa"
          }

          // Palabras clave de financiación
          const financingKeywords = ["FINANCIACIÓN", "FINANCIACION", "CRÉDITO", "CREDITO", "PRÉSTAMO", "PRESTAMO"]
          if (financingKeywords.some((keyword) => bancoUpper.includes(keyword))) {
            return "Financiación"
          }

          return "Contado"
        }

        const newPaymentMethod = determinePaymentMethod(vehicle.bank)

        if (newPaymentMethod !== vehicle.payment_method) {
          updates.push({
            id: vehicle.id,
            payment_method: newPaymentMethod,
          })
          updatedCount++
        }
      }

      // Ejecutar actualizaciones en lotes
      if (updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase
            .from("sales_vehicles")
            .update({ payment_method: update.payment_method })
            .eq("id", update.id)

          if (error) {
            console.error("Error actualizando vehículo:", update.id, error)
          }
        }
      }

      toast.success(`Se actualizaron ${updatedCount} registros`)
      await loadDiagnosticData() // Recargar datos
    } catch (error: any) {
      console.error("Error actualizando métodos de pago:", error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    loadDiagnosticData()
  }, [])

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "financiación":
      case "financiacion":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "contado":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "externa":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando diagnóstico...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnóstico de Métodos de Pago</h1>
          <p className="text-muted-foreground">Análisis de la clasificación de métodos de pago en ventas</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadDiagnosticData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={updatePaymentMethods} disabled={updating}>
            {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Corregir Métodos de Pago
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Información</AlertTitle>
        <AlertDescription>
          Esta herramienta analiza cómo se están clasificando los métodos de pago basándose en el campo "BANCO" de los
          PDFs. Puedes corregir automáticamente las clasificaciones incorrectas.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de Vehículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalVehicles.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métodos Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bancos Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{new Set(bankData.map((b) => b.bank)).size}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="methods" className="space-y-4">
        <TabsList>
          <TabsTrigger value="methods">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="banks">Bancos</TabsTrigger>
          <TabsTrigger value="recent">Vehículos Recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Métodos de Pago</CardTitle>
              <CardDescription>Estadísticas de cómo se clasifican los métodos de pago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.map((stat) => (
                  <div key={stat.payment_method} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getMethodColor(stat.payment_method)}>{stat.payment_method}</Badge>
                      <span className="font-medium">{stat.count} vehículos</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{stat.percentage.toFixed(1)}%</div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stat.percentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banks">
          <Card>
            <CardHeader>
              <CardTitle>Análisis por Banco</CardTitle>
              <CardDescription>Cómo se clasifican los diferentes bancos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banco</TableHead>
                    <TableHead>Método Asignado</TableHead>
                    <TableHead>Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankData.slice(0, 20).map((bank, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{bank.bank}</TableCell>
                      <TableCell>
                        <Badge className={getMethodColor(bank.payment_method)}>{bank.payment_method}</Badge>
                      </TableCell>
                      <TableCell>{bank.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Vehículos Recientes</CardTitle>
              <CardDescription>Últimos 20 vehículos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.license_plate}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.bank || "Sin especificar"}</TableCell>
                      <TableCell>
                        <Badge className={getMethodColor(vehicle.payment_method)}>{vehicle.payment_method}</Badge>
                      </TableCell>
                      <TableCell>{new Date(vehicle.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
