import { EntregasSimple } from "@/components/entregas/entregas-simple"

export default function EntregasFixPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Entregas - Modo Admin</h1>
        <p className="text-muted-foreground">Gestión simplificada sin problemas de autenticación</p>
      </div>

      <EntregasSimple />
    </div>
  )
}
