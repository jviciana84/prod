"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Tag, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ExpenseType {
  id: number
  name: string
  description: string
  is_active: boolean
}

interface StockWithExpenseType {
  id: string
  license_plate: string
  model: string
  expense_type_id: number
  expense_charge: string | null
  expense_type: ExpenseType | null
}

export default function ExpenseTypeDisplay() {
  const [stockItems, setStockItems] = useState<StockWithExpenseType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchStockWithExpenseTypes() {
      setIsLoading(true)
      try {
        // Obtener vehículos en stock con sus tipos de gastos
        const { data, error } = await supabase
          .from("stock")
          .select(`
            id,
            license_plate,
            model,
            expense_type_id,
            expense_charge,
            expense_type:expense_type_id(id, name, description, is_active)
          `)
          .order("reception_date", { ascending: false })

        if (error) {
          throw new Error(`Error al cargar datos: ${error.message}`)
        }

        setStockItems(data || [])
      } catch (err: any) {
        console.error("Error:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStockWithExpenseTypes()
  }, [supabase])

  // Agrupar vehículos por tipo de gasto
  const groupedByExpenseType: Record<string, StockWithExpenseType[]> = {}

  stockItems.forEach((item) => {
    const typeName = item.expense_type?.name || "Sin asignar"
    if (!groupedByExpenseType[typeName]) {
      groupedByExpenseType[typeName] = []
    }
    groupedByExpenseType[typeName].push(item)
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Vehículos por Tipo de Gasto</h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedByExpenseType).map(([typeName, items]) => (
            <Card key={typeName} className="overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-800">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-blue-600" />
                    <span>{typeName}</span>
                  </div>
                  <Badge variant="outline">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {items.map((item) => (
                    <li key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.license_plate}</p>
                          <p className="text-sm text-gray-500">{item.model}</p>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center text-emerald-600">
                                <DollarSign className="h-4 w-4 mr-1" />
                                <span>{item.expense_charge || "-"}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cargo de gastos</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
