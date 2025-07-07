"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Settings } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface IncentivosConfig {
  id?: number
  gastos_estructura: number
  porcentaje_margen: number
  importe_antiguedad: number
  importe_financiado: number
  importe_minimo: number
  created_at?: string
  updated_at?: string
}

export default function IncentivosConfigPage() {
  const [config, setConfig] = useState<IncentivosConfig>({
    gastos_estructura: 0,
    porcentaje_margen: 5.0,
    importe_antiguedad: 0,
    importe_financiado: 0,
    importe_minimo: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("incentivos_config")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching config:", error)
        throw error
      }

      if (data) {
        setConfig(data)
      }
    } catch (error) {
      console.error("Error fetching config:", error)
      toast.error("Error al cargar la configuración")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const supabase = createClient()

      const configData = {
        gastos_estructura: config.gastos_estructura,
        porcentaje_margen: config.porcentaje_margen,
        importe_antiguedad: config.importe_antiguedad,
        importe_financiado: config.importe_financiado,
        importe_minimo: config.importe_minimo,
        updated_at: new Date().toISOString(),
      }

      let result
      if (config.id) {
        result = await supabase.from("incentivos_config").update(configData).eq("id", config.id)
      } else {
        result = await supabase.from("incentivos_config").insert({
          ...configData,
          created_at: new Date().toISOString(),
        })
      }

      if (result.error) {
        throw result.error
      }

      toast.success("Configuración guardada correctamente")
      await fetchConfig()
    } catch (error) {
      console.error("Error saving config:", error)
      toast.error("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof IncentivosConfig, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setConfig((prev) => ({
      ...prev,
      [field]: numValue,
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Cargando configuración...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/incentivos">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Configuración de Incentivos</h1>
          <p className="text-muted-foreground">Configura los parámetros para el cálculo de incentivos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Parámetros de Cálculo
          </CardTitle>
          <CardDescription>Configura los valores para el cálculo automático de incentivos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="importe_minimo">Importe Mínimo (€)</Label>
              <Input
                id="importe_minimo"
                type="number"
                step="0.01"
                value={config.importe_minimo}
                onChange={(e) => handleInputChange("importe_minimo", e.target.value)}
                placeholder="150"
              />
              <p className="text-sm text-muted-foreground">Importe base mínimo garantizado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="porcentaje_margen">Porcentaje sobre Margen (%)</Label>
              <Input
                id="porcentaje_margen"
                type="number"
                step="0.1"
                value={config.porcentaje_margen}
                onChange={(e) => handleInputChange("porcentaje_margen", e.target.value)}
                placeholder="5.0"
              />
              <p className="text-sm text-muted-foreground">Porcentaje aplicado al margen</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="importe_antiguedad">Importe por Antigüedad (€)</Label>
              <Input
                id="importe_antiguedad"
                type="number"
                step="0.01"
                value={config.importe_antiguedad}
                onChange={(e) => handleInputChange("importe_antiguedad", e.target.value)}
                placeholder="50"
              />
              <p className="text-sm text-muted-foreground">Importe adicional por antigüedad</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="importe_financiado">Importe por Financiación (€)</Label>
              <Input
                id="importe_financiado"
                type="number"
                step="0.01"
                value={config.importe_financiado}
                onChange={(e) => handleInputChange("importe_financiado", e.target.value)}
                placeholder="50"
              />
              <p className="text-sm text-muted-foreground">Importe adicional por financiación</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gastos_estructura">Gastos Estructura (€)</Label>
              <Input
                id="gastos_estructura"
                type="number"
                step="0.01"
                value={config.gastos_estructura}
                onChange={(e) => handleInputChange("gastos_estructura", e.target.value)}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">Gastos fijos de estructura</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Link href="/dashboard/incentivos">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
