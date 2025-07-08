"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecogidaForm } from "./recogida-form"
import { RecogidasHistorial } from "./recogidas-historial"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, History } from "lucide-react"

interface RecogidasManagerProps {
  preselectedMatricula?: string
}

export function RecogidasManager({ preselectedMatricula }: RecogidasManagerProps) {
  const [activeTab, setActiveTab] = useState(preselectedMatricula ? "nueva" : "nueva")

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Gestión de Recogidas</CardTitle>
        <CardDescription>Solicitar recogida de documentación y material por mensajería</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nueva" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Nueva Recogida
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="nueva" className="mt-6">
            <RecogidaForm onSuccess={() => setActiveTab("historial")} preselectedMatricula={preselectedMatricula} />
          </TabsContent>
          
          <TabsContent value="historial" className="mt-6">
            <RecogidasHistorial />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 