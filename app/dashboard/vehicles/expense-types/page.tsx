import { Suspense } from "react"
import ExpenseTypeDisplay from "@/components/vehicles/expense-type-display"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export const metadata = {
  title: "Tipos de Gastos de Vehículos | CVO",
  description: "Visualización de vehículos por tipo de gasto",
}

export default function ExpenseTypesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Vehículos", href: "/dashboard/vehicles" },
          { label: "Tipos de Gastos", href: "/dashboard/vehicles/expense-types" },
        ]}
      />

      <Suspense fallback={<div>Cargando...</div>}>
        <ExpenseTypeDisplay />
      </Suspense>
    </div>
  )
}
