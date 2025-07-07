import { TableDiagnostic } from "@/components/photos/table-diagnostic"

export default function DiagnosticPage() {
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Diagnóstico de Tablas</h1>
      <TableDiagnostic />
    </div>
  )
}
