"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export function VisitStatistics() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    setLoading(true)

    // Obtener todas las asignaciones del mes actual
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const { data: assignments } = await supabase
      .from('visit_assignments')
      .select('advisor_name, visit_type')
      .gte('assigned_at', firstDayOfMonth.toISOString())

    if (assignments) {
      // Agrupar por asesor
      const grouped = assignments.reduce((acc: any, curr) => {
        if (!acc[curr.advisor_name]) {
          acc[curr.advisor_name] = {
            name: curr.advisor_name,
            COCHE_VN: 0,
            COCHE_VO: 0,
            MOTO_VN: 0,
            MOTO_VO: 0,
            total: 0
          }
        }
        acc[curr.advisor_name][curr.visit_type]++
        acc[curr.advisor_name].total++
        return acc
      }, {})

      setData(Object.values(grouped))
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Visitas por Asesor (Este Mes)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="COCHE_VN" fill="#3b82f6" name="Coche VN" />
            <Bar dataKey="COCHE_VO" fill="#10b981" name="Coche VO" />
            <Bar dataKey="MOTO_VN" fill="#8b5cf6" name="Moto VN" />
            <Bar dataKey="MOTO_VO" fill="#f97316" name="Moto VO" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

