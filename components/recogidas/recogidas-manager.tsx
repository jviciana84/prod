"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecogidaForm } from "./recogida-form"
import { RecogidasHistorial } from "./recogidas-historial"
import { VehiculosParaRecoger } from "./vehiculos-para-recoger"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, History, Package } from "lucide-react"

interface RecogidasManagerProps {
  preselectedMatricula?: string
}

export function RecogidasManager({ preselectedMatricula }: RecogidasManagerProps) {
  const [activeTab, setActiveTab] = useState(preselectedMatricula ? "nueva" : "vehiculos")
  const [selectedMatricula, setSelectedMatricula] = useState<string | null>(preselectedMatricula || null)

  return (
    <div className="space-y-4">
      {/* Tabs fuera del card */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vehiculos" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Solicitar Recogidas
          </TabsTrigger>
          <TabsTrigger value="nueva" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Nueva Recogida
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="vehiculos" className="mt-6">
          <VehiculosParaRecoger onSolicitarRecogida={(matricula) => {
            if (matricula) {
              setSelectedMatricula(matricula)
              setActiveTab("nueva")
            } else {
              setActiveTab("historial")
            }
          }} />
        </TabsContent>
        
        <TabsContent value="nueva" className="mt-6">
          <RecogidaForm onSuccess={() => setActiveTab("historial")} preselectedMatricula={selectedMatricula || preselectedMatricula} />
        </TabsContent>
        
        <TabsContent value="historial" className="mt-6">
          <RecogidasHistorial />
        </TabsContent>
      </Tabs>
    </div>
  )
} 