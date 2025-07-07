import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import TransportDashboard from "@/components/transport/transport-dashboard"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { getUserRoles } from "@/lib/auth/permissions"
import { Truck } from "lucide-react"

export default async function TransportPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error al obtener la sesión:", sessionError)
      redirect("/")
    }

    if (!session) {
      redirect("/")
    }

    // Obtener sedes para el formulario
    const { data: locations, error: locationsError } = await supabase.from("locations").select("*").order("name")

    if (locationsError) {
      console.error("Error al cargar sedes:", locationsError)
    }

    // Cambiar la consulta a la base de datos
    const { data: transports, error: transportsError } = await supabase
      .from("nuevas_entradas")
      .select("*")
      .order("purchase_date", { ascending: false })

    if (transportsError) {
      console.error("Error al cargar datos de transporte:", transportsError)
    }

    // Si tenemos transportes, cargar los datos relacionados
    let transportesConRelaciones = []
    if (transports && transports.length > 0) {
      // Crear un mapa de ubicaciones para búsqueda rápida
      const locationMap = locations
        ? locations.reduce((map, loc) => {
            map[loc.id] = loc
            return map
          }, {})
        : {}

      // Obtener tipos de gastos
      const { data: expenseTypes } = await supabase.from("expense_types").select("*")

      // Crear un mapa de tipos de gastos para búsqueda rápida
      const expenseTypeMap = expenseTypes
        ? expenseTypes.reduce((map, type) => {
            map[type.id] = type
            return map
          }, {})
        : {}

      // Combinar los datos manualmente
      transportesConRelaciones = transports.map((transport) => ({
        ...transport,
        origin_location: locationMap[transport.origin_location_id] || null,
        expense_type: expenseTypeMap[transport.expense_type_id] || null,
      }))
    }

    // Obtener roles del usuario
    const userRoles = await getUserRoles()
    console.log("Roles del usuario (servidor):", userRoles)

    return (
      <div className="p-4 md:p-5 space-y-4 pb-20">
        <div className="space-y-2">
          <Breadcrumbs />
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Nuevas Entradas</h1>
              <p className="text-muted-foreground">Control y seguimiento de vehículos recién adquiridos</p>
            </div>
          </div>
        </div>

        <TransportDashboard
          initialTransports={transportesConRelaciones || []}
          locations={locations || []}
          userRoles={userRoles}
        />
      </div>
    )
  } catch (error) {
    console.error("Error en la página de transporte:", error)
    redirect("/")
  }
}
