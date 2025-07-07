import { EntregasTableWithMapping } from "@/components/entregas/entregas-table-with-mapping"

export default function DebugEntregasPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Debug - Entregas con Mapeo</h1>
      <EntregasTableWithMapping />
    </div>
  )
}
