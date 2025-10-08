"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BMWLogo, MINILogo } from "@/components/ui/brand-logos"
import { Save } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

// New interfaces for the new table structures
interface SalesQuarterlyObjective {
  id?: string
  concesionario: string
  marca: string
  periodo_label: string // e.g., "Q1 (Ene-Mar)"
  año: number
  objetivo: number
}

interface FinancialPenetrationObjective {
  id?: string
  concesionario: string
  año: number
  objetivo_porcentaje: number
}

// Data structure for the component's state
interface ConcesionarioObjectives {
  [key: string]: {
    sales: SalesQuarterlyObjective[]
    financial: FinancialPenetrationObjective | null
  }
}

export function ObjetivosSimpleManager() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [data, setData] = useState<ConcesionarioObjectives>({
    "Quadis Munich": { sales: [], financial: null },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const concesionarios = ["Quadis Munich"]
  const marcas = ["BMW", "MINI"]
  const basePeriodos = [
    { label: "Q1 (Ene-Mar)", months: [0, 1, 2] },
    { label: "Q2 (Abr-Jun)", months: [3, 4, 5] },
    { label: "Q3 (Jul-Sep)", months: [6, 7, 8] },
    { label: "Q4 (Oct-Dic)", months: [9, 10, 11] },
    { label: "S1 (Ene-Jun)", months: [0, 1, 2, 3, 4, 5] },
    { label: "S2 (Jul-Dic)", months: [6, 7, 8, 9, 10, 11] },
  ]

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i) // Current year +/- 2
  }, [])

  useEffect(() => {
    loadData()
  }, [selectedYear]) // Reload data when year changes

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: salesData, error: salesError } = await supabase
        .from("sales_quarterly_objectives")
        .select("*")
        .eq("año", selectedYear)

      console.log("DEBUG: sales_quarterly_objectives load result:", { salesData, salesError })
      if (salesError) throw salesError

      const { data: financialData, error: financialError } = await supabase
        .from("financial_penetration_objectives")
        .select("*")
        .eq("año", selectedYear)

      console.log("DEBUG: financial_penetration_objectives load result:", { financialData, financialError })
      if (financialError) throw financialError

      const initialData: ConcesionarioObjectives = {
        "Quadis Munich": { sales: [], financial: null },
      }

      concesionarios.forEach((concesionario) => {
        basePeriodos.forEach((periodo) => {
          marcas.forEach((marca) => {
            const existingObjective = salesData.find(
              (obj) =>
                obj.concesionario === concesionario &&
                obj.marca === marca &&
                obj.periodo_label === periodo.label &&
                obj.año === selectedYear,
            )
            initialData[concesionario].sales.push(
              existingObjective || {
                concesionario,
                marca,
                periodo_label: periodo.label,
                año: selectedYear,
                objetivo: 0,
              },
            )
          })
        })

        const existingFinancial = financialData.find(
          (obj) => obj.concesionario === concesionario && obj.año === selectedYear,
        )
        initialData[concesionario].financial = existingFinancial || {
          concesionario,
          año: selectedYear,
          objetivo_porcentaje: 0,
        }
      })

      setData(initialData)
    } catch (error) {
      console.error("Error cargando objetivos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los objetivos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSalesObjective = (concesionario: string, periodoLabel: string, marca: string, value: number) => {
    setData((prev) => {
      const newData = { ...prev }
      const salesArray = newData[concesionario].sales
      const index = salesArray.findIndex((obj) => obj.periodo_label === periodoLabel && obj.marca === marca)
      if (index !== -1) {
        salesArray[index] = { ...salesArray[index], objetivo: value }
      }
      return newData
    })
  }

  const updateFinancialObjective = (concesionario: string, value: number) => {
    setData((prev) => {
      const newData = { ...prev }
      if (newData[concesionario].financial) {
        newData[concesionario].financial = { ...newData[concesionario].financial!, objetivo_porcentaje: value }
      }
      return newData
    })
  }

  const saveData = async () => {
    setSaving(true)
    try {
      const salesToUpsert: SalesQuarterlyObjective[] = []
      const financialToUpsert: FinancialPenetrationObjective[] = []

      concesionarios.forEach((concesionario) => {
        data[concesionario].sales.forEach((obj) => {
          // Solo incluir el ID si existe y no es undefined
          const salesObj: SalesQuarterlyObjective = {
            concesionario: obj.concesionario,
            marca: obj.marca,
            periodo_label: obj.periodo_label,
            año: obj.año,
            objetivo: obj.objetivo,
          }

          // Solo añadir el ID si existe
          if (obj.id) {
            salesObj.id = obj.id
          }

          salesToUpsert.push(salesObj)
        })

        if (data[concesionario].financial) {
          const financialObj: FinancialPenetrationObjective = {
            concesionario: data[concesionario].financial!.concesionario,
            año: data[concesionario].financial!.año,
            objetivo_porcentaje: data[concesionario].financial!.objetivo_porcentaje,
          }

          // Solo añadir el ID si existe
          if (data[concesionario].financial!.id) {
            financialObj.id = data[concesionario].financial!.id
          }

          financialToUpsert.push(financialObj)
        }
      })

      console.log("Sales to upsert:", salesToUpsert)
      console.log("Financial to upsert:", financialToUpsert)

      const { error: salesError } = await supabase
        .from("sales_quarterly_objectives")
        .upsert(salesToUpsert, { onConflict: "concesionario, marca, periodo_label, año" })

      if (salesError) {
        console.error("Supabase sales upsert error:", salesError) // AÑADIDO
        throw salesError
      }

      const { error: financialError } = await supabase
        .from("financial_penetration_objectives")
        .upsert(financialToUpsert, { onConflict: "concesionario, año" })

      if (financialError) {
        console.error("Supabase financial upsert error:", financialError) // AÑADIDO
        throw financialError
      }

      toast({
        title: "Éxito",
        description: "Objetivos guardados correctamente",
      })
      loadData() // Reload to get updated IDs and ensure consistency
    } catch (error) {
      console.error("Error guardando objetivos:", error)
      toast({
        title: "Error",
        description: `No se pudieron guardar los objetivos: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Cargando objetivos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Label htmlFor="year-select" className="text-lg font-semibold">
          Año:
        </Label>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
          <SelectTrigger className="w-[120px] bg-background">
            <SelectValue placeholder="Selecciona año" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {concesionarios.map((concesionario) => (
          <Card key={concesionario} className="h-fit">
            <CardHeader>
              <CardTitle className="text-xl">{concesionario}</CardTitle>
              <CardDescription>Objetivos de ventas y penetración financiera para {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Financial Penetration Objective */}
              <div className="mb-6 space-y-2">
                <Label htmlFor={`financial-penetration-${concesionario}`}>Objetivo Penetración Financiera (%)</Label>
                <Input
                  id={`financial-penetration-${concesionario}`}
                  type="number"
                  value={data[concesionario].financial?.objetivo_porcentaje || 0}
                  onChange={(e) => updateFinancialObjective(concesionario, Number.parseFloat(e.target.value) || 0)}
                  className="text-center bg-background"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              {/* Sales Objectives Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 bg-green-600 text-white font-medium">PERÍODO</th>
                      <th className="text-center p-3 bg-blue-600 text-white font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <BMWLogo className="h-4 w-4" />
                          BMW
                        </div>
                      </th>
                      <th className="text-center p-3 bg-gray-600 text-white font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <MINILogo className="h-4 w-4" />
                          MINI
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {basePeriodos.map((periodo, index) => (
                      <tr key={periodo.label} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium bg-muted/20">{periodo.label}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={
                              data[concesionario].sales.find(
                                (obj) => obj.periodo_label === periodo.label && obj.marca === "BMW",
                              )?.objetivo || 0
                            }
                            onChange={(e) =>
                              updateSalesObjective(
                                concesionario,
                                periodo.label,
                                "BMW",
                                Number.parseInt(e.target.value) || 0,
                              )
                            }
                            className="text-center border-0 bg-background focus:bg-background"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={
                              data[concesionario].sales.find(
                                (obj) => obj.periodo_label === periodo.label && obj.marca === "MINI",
                              )?.objetivo || 0
                            }
                            onChange={(e) =>
                              updateSalesObjective(
                                concesionario,
                                periodo.label,
                                "MINI",
                                Number.parseInt(e.target.value) || 0,
                              )
                            }
                            className="text-center border-0 bg-background focus:bg-background"
                            min="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button onClick={saveData} disabled={saving} size="lg" className="px-8">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Objetivos"}
        </Button>
      </div>
    </div>
  )
}
