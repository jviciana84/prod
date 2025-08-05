import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { getUserRoles } from "@/lib/auth/permissions"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Car, ShoppingCart, TrendingUp, Building2, Bike } from "lucide-react"
import { MotivationalQuote } from "@/components/dashboard/motivational-quote"
import { DigitalClock } from "@/components/dashboard/digital-clock"
import { PendingMovementsCard } from "@/components/dashboard/pending-movements-card"
import { ObjetivosCard } from "@/components/dashboard/objetivos-card"
import { RealActivityFeed } from "@/components/dashboard/real-activity-feed"
import { FinancingRanking } from "@/components/dashboard/financing-ranking"
import { SalesRanking } from "@/components/dashboard/sales-ranking"
import { WorkshopDaysCard } from "@/components/dashboard/workshop-days-card"
import { BMWLogo, MINILogo } from "@/components/ui/brand-logos"
import { differenceInDays, parseISO } from "date-fns"
import { 
  getFirstDayOfCurrentMonth, 
  getFirstDayOfPreviousMonth, 
  getLastDayOfPreviousMonth,
  getDateDebugInfo 
} from "@/lib/date-utils"

// Helper function to calculate percentage change
const calculatePercentageChange = (current: number, previous: number): string => {
  if (previous === 0) {
    if (current === 0) return "0%" // No change from zero to zero
    return "N/A" // Or "Nuevo"
  }
  const change = ((current - previous) / previous) * 100
  const sign = change >= 0 ? "+" : ""
  return `${sign}${change.toFixed(0)}%`
}

// Función mejorada para detectar motos
const isMotorcycle = (
  vehicleType: string | null,
  licensePlate: string | null,
  brand: string | null,
  model: string | null,
): boolean => {
  if (!vehicleType && !licensePlate && !brand && !model) return false

  // Detectar por matrícula (formato de moto español)
  if (licensePlate) {
    const platePattern = /^\d{4}[A-Z]{3}$/ // Formato 8383MLG
    if (platePattern.test(licensePlate.replace(/\s/g, ""))) {
      console.log(`🏍️ Moto detectada por matrícula: ${licensePlate}`)
      return true
    }
  }

  // Detectar por vehicle_type
  if (vehicleType) {
    const type = vehicleType.trim().toLowerCase()
    const motorcycleKeywords = [
      "moto",
      "motorcycle",
      "motocicleta",
      "scooter",
      "ciclomotor",
      "quad",
      "bmw motorrad",
      "motorrad",
      "enduro",
      "trail",
      "naked",
      "sport",
      "touring",
      "cruiser",
      "chopper",
      "custom",
      "adventure",
      "supermoto",
    ]

    const isMotorcycleType = motorcycleKeywords.some(
      (keyword) => type.includes(keyword) || type.startsWith(keyword) || type.endsWith(keyword),
    )

    if (isMotorcycleType) {
      console.log(`🏍️ Moto detectada por tipo: ${vehicleType}`)
      return true
    }
  }

  // Detectar por marca
  if (brand) {
    const brandLower = brand.toLowerCase()
    if (brandLower.includes("motorrad") || brandLower.includes("bmw motorrad")) {
      console.log(`🏍️ Moto detectada por marca: ${brand}`)
      return true
    }
  }

  // Detectar por modelo
  if (model) {
    const modelLower = model.toLowerCase()
    const motorcycleModels = [
      "r1200",
      "r1250",
      "r1300",
      "f650",
      "f700",
      "f750",
      "f800",
      "f850",
      "f900",
      "s1000",
      "k1200",
      "k1300",
      "k1600",
      "c400",
      "c600",
      "c650",
      "g310",
      "g450",
      "gs",
      "rt",
      "gtl",
      "xr",
      "rs",
      "rr",
      "adventure",
      "rallye",
    ]

    const isMotorcycleModel = motorcycleModels.some((keyword) => modelLower.includes(keyword))

    if (isMotorcycleModel) {
      console.log(`🏍️ Moto detectada por modelo: ${model}`)
      return true
    }
  }

  return false
}

export default async function Dashboard() {
  const cookieStore = await cookies()
  const supabase = await createServerClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  const motivationalPhrases = [
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "La excelencia no es un acto, sino un hábito.",
    "El único lugar donde el éxito viene antes que el trabajo es en el diccionario.",
    "Los desafíos son lo que hacen la vida interesante, superarlos es lo que hace la vida significativa.",
    "No cuentes los días, haz que los días cuenten.",
    "La mejor manera de predecir el futuro es crearlo.",
    "El camino hacia el éxito está siempre en construcción.",
    "La persistencia puede cambiar el fracaso en un logro extraordinario.",
    "Cada día es una nueva oportunidad para cambiar tu vida.",
    "La actitud determina la dirección.",
  ]

  const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)]

  const roles = await getUserRoles()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
  const displayName = profile?.full_name || session.user.user_metadata.full_name || session.user.email

  // Fetch sales vehicles data for workshop days calculations
  const { data: salesVehiclesData, error: salesVehiclesError } = await supabase
    .from("sales_vehicles")
    .select("id, sale_date, cyp_date, photo_360_date, cyp_status, photo_360_status, license_plate")
    .not("sale_date", "is", null) // Only consider vehicles with a sale date
    .order("sale_date", { ascending: false }) // Order by sale date for "last N units"

  if (salesVehiclesError) {
    console.error("Error fetching sales vehicles data:", salesVehiclesError)
    // Handle error appropriately, e.g., return default values or throw
  }

  // --- Workshop Days Calculations ---
  const completedVehicles =
    salesVehiclesData?.filter(
      (v) => v.cyp_status === "completado" && v.photo_360_status === "completado" && v.sale_date,
    ) || []

  const calculateDays = (saleDate: string, cypDate: string | null, photo360Date: string | null) => {
    const sale = parseISO(saleDate)
    let completionDate: Date | null = null

    if (cypDate && photo360Date) {
      const cyp = parseISO(cypDate)
      const photo = parseISO(photo360Date)
      completionDate = cyp > photo ? cyp : photo
    } else if (cypDate) {
      completionDate = parseISO(cypDate)
    } else if (photo360Date) {
      completionDate = parseISO(photo360Date)
    }

    if (completionDate) {
      return differenceInDays(completionDate, sale)
    }
    return null
  }

  // Procesar TODOS los vehículos completados para cálculos correctos
  const allWorkshopDaysData = completedVehicles
    .map((v, index) => {
      const days = calculateDays(v.sale_date!, v.cyp_date, v.photo_360_date)
      
      console.log(`Dashboard - Vehículo ${v.license_plate}: venta=${v.sale_date}, cyp=${v.cyp_date}, 360=${v.photo_360_date}, días=${days}`)

      return {
        unit: `${index + 1}`,
        days: days,
        saturation: 0,
        matricula: v.license_plate || v.id,
      }
    })
    .filter((item) => item.days !== null) as { unit: string; days: number; saturation: number; matricula: string }[]

  // Calcular promedios correctos
  const totalDays = allWorkshopDaysData.reduce((sum, item) => sum + item.days, 0)
  const totalAverage = allWorkshopDaysData.length > 0 ? Math.round(totalDays / allWorkshopDaysData.length) : 0

  const last15Units = allWorkshopDaysData.slice(0, 15)
  const last15Average =
    last15Units.length > 0 ? Math.round(last15Units.reduce((sum, item) => sum + item.days, 0) / last15Units.length) : 0

  const last20Units = allWorkshopDaysData.slice(0, 20)
  const last20Average =
    last20Units.length > 0 ? Math.round(last20Units.reduce((sum, item) => sum + item.days, 0) / last20Units.length) : 0

  const currentAverage = last15Average // Usar últimos 15 como promedio actual

  // Datos para el gráfico (solo últimos 15 para visualización)
  const workshopDaysData = allWorkshopDaysData.slice(0, 15)

  console.log('=== DEBUG DASHBOARD DÍAS PREPARACIÓN ===')
  console.log('Total vehículos completados procesados:', completedVehicles.length)
  console.log('Todos los días de preparación:', allWorkshopDaysData.map(item => item.days))
  console.log('Últimos 15 días:', last15Units.map(item => item.days))
  console.log('Últimos 20 días:', last20Units.map(item => item.days))
  console.log('Promedio total (todos):', totalAverage)
  console.log('Promedio últimos 15:', last15Average)
  console.log('Promedio últimos 20:', last20Average)
  console.log('Promedio actual (círculo):', currentAverage)
  console.log('==============================')

  // Calculate trend (less days is better, so a decrease is positive trend)
  const trendDirection = last15Average < last20Average ? "down" : "up"
  const trendValue = Math.abs(last15Average - last20Average)
  const trendPercentage = last20Average > 0 ? ((trendValue / last20Average) * 100).toFixed(1) : "0.0"

  // Sold Pending (vehicles in sales_vehicles not yet completed)
  const soldPendingCount =
    salesVehiclesData?.filter((v) => v.cyp_status !== "completado" || v.photo_360_status !== "completado").length || 0

  // Cars in Workshop (vehicles in sales_vehicles that are not yet CYP or Photo 360 completed)
  const carsInWorkshop =
    salesVehiclesData?.filter((v) => v.cyp_status !== "completado" || v.photo_360_status !== "completado").length || 0

  const maxCapacity = 30 // Define your max workshop capacity
  const saturationPercentage = maxCapacity > 0 ? Math.round((carsInWorkshop / maxCapacity) * 100) : 0

  // Average Paint Days (using photo_360_date as proxy for paint completion)
  const paintCompletedVehicles =
    salesVehiclesData?.filter((v) => v.photo_360_status === "completado" && v.sale_date && v.photo_360_date) || []
  const totalPaintDays = paintCompletedVehicles.reduce((sum, v) => {
    const sale = parseISO(v.sale_date!)
    const photoCompletion = parseISO(v.photo_360_date!)
    return sum + differenceInDays(photoCompletion, sale)
  }, 0)
  const averagePaintDays =
    paintCompletedVehicles.length > 0 ? (totalPaintDays / paintCompletedVehicles.length).toFixed(2) : "0.00"

  // Average Mechanical Days (using cyp_date as proxy for mechanical completion)
  const mechanicalCompletedVehicles =
    salesVehiclesData?.filter((v) => v.cyp_status === "completado" && v.sale_date && v.cyp_date) || []
  const totalMechanicalDays = mechanicalCompletedVehicles.reduce((sum, v) => {
    const sale = parseISO(v.sale_date!)
    const cypCompletion = parseISO(v.cyp_date!)
    return sum + differenceInDays(cypCompletion, sale)
  }, 0)
  const averageMechanicalDays =
    mechanicalCompletedVehicles.length > 0
      ? (totalMechanicalDays / mechanicalCompletedVehicles.length).toFixed(2)
      : "0.00"

  // --- Incident Percentage Calculation ---
  // Total deliveries: count rows in 'entregas' where 'fecha_entrega' is not null
  const { data: totalDeliveriesData, error: totalDeliveriesError } = await supabase
    .from("entregas")
    .select("id")
    .not("fecha_entrega", "is", null)

  if (totalDeliveriesError) {
    console.error("Error fetching total deliveries:", totalDeliveriesError)
  }
  const totalDeliveriesCount = totalDeliveriesData?.length || 0

  // Deliveries with incidents: count distinct vehicles where 'tipos_incidencia' is not null
  // Assuming 'entregas' table has a 'vehicle_id' or similar to identify unique vehicles
  // If 'tipos_incidencia' is directly on 'entregas' and each row is a unique delivery,
  // then counting rows where 'tipos_incidencia' is not null is sufficient.
  // Based on the user's clarification "si la columan tipos_incidencia tiene valor no Null tiene incidencia"
  // and "es como si fuera 1 porque es coche afectado", we count distinct deliveries with incidents.
  const { data: deliveriesWithIncidentsData, error: incidentsError } = await supabase
    .from("entregas")
    .select("id") // Select 'id' to count distinct deliveries
    .not("tipos_incidencia", "is", null) // Filter where tipos_incidencia is not null

  if (incidentsError) {
    console.error("Error fetching deliveries with incidents:", incidentsError)
  }
  const deliveriesWithIncidentsCount = deliveriesWithIncidentsData?.length || 0

  const incidentPercentage =
    totalDeliveriesCount > 0 ? ((deliveriesWithIncidentsCount / totalDeliveriesCount) * 100).toFixed(1) : "0.0"

  // Fechas para el mes actual - USANDO FUNCIONES UTILITARIAS (mover al principio)
  const dateDebugInfo = getDateDebugInfo()
  const firstDayOfMonth = getFirstDayOfCurrentMonth()
  const firstDayOfPreviousMonth = getFirstDayOfPreviousMonth()
  const lastDayOfPreviousMonth = getLastDayOfPreviousMonth()

  console.log("🔍 DEBUG: Información de fechas:", dateDebugInfo)

  // Obtener estadísticas reales de la base de datos con mejor filtrado
  console.log("🔍 Intentando obtener datos de stock...")
  
  let stockData = null
  let stockError = null
  
  try {
    // Obtener solo vehículos disponibles (no vendidos)
    const result = await supabase
      .from("stock")
      .select("*")
      .eq("is_sold", false) // Solo vehículos no vendidos
    
    stockData = result.data
    stockError = result.error
    
    if (stockError) {
      console.error("❌ Error fetching stock data:", stockError)
      console.error("❌ Error details:", JSON.stringify(stockError, null, 2))
    } else {
      console.log("✅ Stock data obtenida correctamente")
    }
  } catch (error) {
    console.error("❌ Exception fetching stock data:", error)
    stockError = error as any
  }

  console.log("Raw stock data:", stockData) // Añadido para depuración
  console.log("Number of items in stockData:", stockData?.length) // Añadido para depuración

  // Si hay error, usar valores por defecto
  const stockCount = stockError ? 0 : (stockData?.length || 0)
  const carsCount = stockError ? 0 : 
    stockData?.filter((item) => {
      const type = item.vehicle_type?.trim().toLowerCase() // Añadido .trim()
      console.log(`Processing stock item: ID=${item.id}, vehicle_type='${item.vehicle_type}', trimmed_lower='${type}'`) // Debugging individual items
      return type === "coche" || type === "car" || type === "turismo"
    }).length || 0

  const motorcyclesCount = stockError ? 0 :
    stockData?.filter((item) => {
      const type = item.vehicle_type?.trim().toLowerCase() // Añadido .trim()
      return type === "moto" || type === "motorcycle"
    }).length || 0

  // Obtener datos de stock del mes anterior para comparación
  console.log("🔍 Obteniendo datos de stock del mes anterior...")
  let previousStockData = null
  let previousStockError = null
  
  try {
    const previousResult = await supabase
      .from("stock")
      .select("*")
      .eq("is_sold", false)
      .gte("created_at", firstDayOfPreviousMonth)
      .lt("created_at", firstDayOfMonth)
    
    previousStockData = previousResult.data
    previousStockError = previousResult.error
    
    if (previousStockError) {
      console.error("❌ Error fetching previous stock data:", previousStockError)
    } else {
      console.log("✅ Previous stock data obtenida correctamente")
    }
  } catch (error) {
    console.error("❌ Exception fetching previous stock data:", error)
    previousStockError = error as any
  }

  console.log("Calculated stockCount:", stockCount) // Añadido para depuración
  console.log("Calculated carsCount:", carsCount) // Añadido para depuración
  console.log("Calculated motorcyclesCount:", motorcyclesCount) // Añadido para depuración
  
  // Calcular contadores de marca para stock disponible (usando el campo model)
  const bmwStockCount = stockError ? 0 : 
    stockData?.filter((item) => {
      const model = item.model?.toLowerCase() || ""
      // Identificar BMW por prefijos comunes: i, X, M, Serie, etc.
      const isBMW = model.startsWith("i") || 
                    model.startsWith("x") || 
                    model.startsWith("m") ||
                    model.includes("serie") ||
                    model.includes("series") ||
                    model.includes("xdrive") ||
                    model.includes("edrive") ||
                    (model.includes("bmw") && !model.includes("motorrad"))
      
      console.log(`🔍 Checking BMW: "${item.model}" -> isBMW: ${isBMW}`)
      return isBMW && !model.includes("motorrad") // Excluir motos BMW
    }).length || 0
  const miniStockCount = stockError ? 0 :
    stockData?.filter((item) => {
      const model = item.model?.toLowerCase() || ""
      console.log(`🔍 Checking MINI: "${item.model}" -> includes("mini"): ${model.includes("mini")}`)
      return model.includes("mini")
    }).length || 0
  
  // Calcular contadores del mes anterior
  const previousBmwStockCount = previousStockError ? 0 : 
    previousStockData?.filter((item) => {
      const model = item.model?.toLowerCase() || ""
      const isBMW = model.startsWith("i") || 
                    model.startsWith("x") || 
                    model.startsWith("m") ||
                    model.includes("serie") ||
                    model.includes("series") ||
                    model.includes("xdrive") ||
                    model.includes("edrive") ||
                    (model.includes("bmw") && !model.includes("motorrad"))
      return isBMW && !model.includes("motorrad")
    }).length || 0

  const previousMiniStockCount = previousStockError ? 0 :
    previousStockData?.filter((item) => {
      const model = item.model?.toLowerCase() || ""
      return model.includes("mini")
    }).length || 0

  // Calcular total correcto (solo BMW + MINI disponibles)
  // Los datos ya están filtrados por is_sold = false, así que son los disponibles
  const totalStockCount = bmwStockCount + miniStockCount
  const previousTotalStockCount = previousBmwStockCount + previousMiniStockCount

  console.log("BMW stock count:", bmwStockCount)
  console.log("MINI stock count:", miniStockCount)
  console.log("Total stock count (BMW + MINI):", totalStockCount)
  console.log("Previous BMW stock count:", previousBmwStockCount)
  console.log("Previous MINI stock count:", previousMiniStockCount)
  console.log("Previous total stock count:", previousTotalStockCount)
  
  // Debug: mostrar algunos modelos para verificar
  if (stockData && stockData.length > 0) {
    console.log("🔍 Primeros 10 modelos en stock:", stockData.slice(0, 10).map(item => item.model))
    
    // Mostrar todos los modelos únicos
    const allModels = stockData.map(item => item.model).filter(Boolean)
    console.log("🔍 Todos los modelos únicos:", [...new Set(allModels)])
    
    // Mostrar todos los modelos únicos que contengan "bmw" o "mini"
    const bmwModels = stockData.filter(item => item.model?.toLowerCase().includes("bmw")).map(item => item.model)
    const miniModels = stockData.filter(item => item.model?.toLowerCase().includes("mini")).map(item => item.model)
    
    console.log("🔍 Modelos BMW encontrados:", [...new Set(bmwModels)])
    console.log("🔍 Modelos MINI encontrados:", [...new Set(miniModels)])
  }

  // const bmwStockCount = stockData?.filter((item) => item.brand && item.brand.toLowerCase().includes("bmw")).length || 0

  // const miniStockCount =
  //   stockData?.filter((item) => item.brand && item.brand.toLowerCase().includes("mini")).length || 0

  // Obtener ventas del mes actual - INCLUIR TODAS LAS VENTAS (coches y motos)
  const { data: salesData } = await supabase
    .from("sales_vehicles")
    .select("id, price, brand, payment_method, vehicle_type, license_plate, model, order_date") // Added order_date
    .gte("order_date", firstDayOfMonth)

  console.log("🚗 DEBUG: Raw sales data del mes actual:", salesData) // Debug para ver las ventas

  const salesThisMonth = salesData?.length || 0

  // Filtrar coches - LÓGICA ORIGINAL QUE FUNCIONABA
  const salesCarsCount =
    salesData?.filter((item) => {
      const type = item.vehicle_type?.trim().toLowerCase()
      const isCar = type === "coche" || type === "car" || type === "turismo" || type === "automóvil" || type === "auto"
      console.log(`🚗 DEBUG: Checking car: ID=${item.id}, Type='${item.vehicle_type}', IsCar=${isCar}`)
      return isCar
    }).length || 0

  // Filtrar motos - LÓGICA ORIGINAL QUE FUNCIONABA
  const salesMotorcyclesCount =
    salesData?.filter((item) => {
      if (!item.vehicle_type) {
        console.log(`🏍️ DEBUG: Skipping item ${item.id} due to null vehicle_type.`)
        return false
      }
      const type = item.vehicle_type.trim().toLowerCase()
      const isMoto =
        type === "moto" ||
        type === "motorcycle" ||
        type === "motocicleta" ||
        type === "scooter" ||
        type === "ciclomotor" ||
        type === "quad" ||
        type.includes("moto") ||
        type.includes("motorcycle") ||
        type.includes("motocicleta") ||
        type.includes("scooter") ||
        type.includes("ciclomotor") ||
        type.includes("quad") ||
        type.startsWith("moto") ||
        type.endsWith("moto") ||
        type.includes("bmw motorrad") ||
        type.includes("motorrad")
      console.log(`🏍️ DEBUG: Checking moto: ID=${item.id}, Type='${item.vehicle_type}', IsMoto=${isMoto}`)
      return isMoto
    }).length || 0

  console.log("🏍️ DEBUG: Ventas de motos encontradas:", salesMotorcyclesCount)

  const bmwSalesCount =
    salesData?.filter((item) => {
      const isBMW = item.brand && item.brand.toLowerCase().includes("bmw")
      console.log(`⚙️ DEBUG: Checking BMW: ID=${item.id}, Brand='${item.brand}', IsBMW=${isBMW}`)
      return isBMW
    }).length || 0

  const miniSalesCount =
    salesData?.filter((item) => {
      const isMINI = item.brand && item.brand.toLowerCase().includes("mini")
      console.log(`🚗 DEBUG: Checking MINI: ID=${item.id}, Brand='${item.brand}', IsMINI=${isMINI}`)
      return isMINI
    }).length || 0

  // Calcular ingresos totales
  const revenue = salesData?.reduce((total, sale) => total + (sale.price || 0), 0) || 0

  const revenueCars =
    salesData
      ?.filter((item) => {
        const type = item.vehicle_type?.trim().toLowerCase()
        return type === "coche" || type === "car" || type === "turismo" || type === "automóvil" || type === "auto"
      })
      .reduce((total, sale) => total + (sale.price || 0), 0) || 0

  const revenueMotorcycles =
    salesData
      ?.filter((item) => {
        if (!item.vehicle_type) return false
        const type = item.vehicle_type.trim().toLowerCase()
        return (
          type === "moto" ||
          type === "motorcycle" ||
          type === "motocicleta" ||
          type === "scooter" ||
          type === "ciclomotor" ||
          type === "quad" ||
          type.includes("moto") ||
          type.includes("motorcycle") ||
          type.includes("motocicleta") ||
          type.includes("scooter") ||
          type.includes("ciclomotor") ||
          type.includes("quad") ||
          type.startsWith("moto") ||
          type.endsWith("moto") ||
          type.includes("bmw motorrad") ||
          type.includes("motorrad")
        )
      })
      .reduce((total, sale) => total + (sale.price || 0), 0) || 0

  const revenueBMW =
    salesData
      ?.filter((item) => item.brand && item.brand.toLowerCase().includes("bmw"))
      .reduce((total, sale) => total + (sale.price || 0), 0) || 0

  const revenueMINI =
    salesData
      ?.filter((item) => item.brand && item.brand.toLowerCase().includes("mini"))
      .reduce((total, sale) => total + (sale.price || 0), 0) || 0

  // Obtener vehículos financiados
  const financedVehicles =
    salesData?.filter((item) => item.payment_method && item.payment_method.toLowerCase().includes("financiad"))
      .length || 0

  const financedCars =
    salesData?.filter((item) => {
      const isFinanced = item.payment_method && item.payment_method.toLowerCase().includes("financiad")
      const type = item.vehicle_type?.trim().toLowerCase()
      const isCar = type === "coche" || type === "car" || type === "turismo" || type === "automóvil" || type === "auto"
      return isFinanced && isCar
    }).length || 0

  const financedMotorcycles =
    salesData?.filter((item) => {
      const isFinanced = item.payment_method && item.payment_method.toLowerCase().includes("financiad")
      if (!item.vehicle_type) return false
      const type = item.vehicle_type.trim().toLowerCase()
      const isMoto =
        type === "moto" ||
        type === "motorcycle" ||
        type === "motocicleta" ||
        type === "scooter" ||
        type === "ciclomotor" ||
        type === "quad" ||
        type.includes("moto") ||
        type.includes("motorcycle") ||
        type.includes("motocicleta") ||
        type.includes("scooter") ||
        type.includes("ciclomotor") ||
        type.includes("quad") ||
        type.startsWith("moto") ||
        type.endsWith("moto") ||
        type.includes("bmw motorrad") ||
        type.includes("motorrad")
      return isFinanced && isMoto
    }).length || 0

  const bmwFinancedCount =
    salesData?.filter(
      (item) =>
        item.brand &&
        item.brand.toLowerCase().includes("bmw") &&
        item.payment_method &&
        item.payment_method.toLowerCase().includes("financiad"),
    ).length || 0

  const miniFinancedCount =
    salesData?.filter(
      (item) =>
        item.brand &&
        item.brand.toLowerCase().includes("mini") &&
        item.payment_method &&
        item.payment_method.toLowerCase().includes("financiad"),
    ).length || 0

  // Obtener ventas del mes anterior
  const { data: previousMonthSalesData } = await supabase
    .from("sales_vehicles")
    .select("id, price, payment_method, vehicle_type, order_date") // Added order_date
    .gte("order_date", firstDayOfPreviousMonth)
    .lt("order_date", firstDayOfMonth) // Ensure it's only previous month

  const previousSalesThisMonth = previousMonthSalesData?.length || 0
  const previousRevenue = previousMonthSalesData?.reduce((total, sale) => total + (sale.price || 0), 0) || 0
  const previousFinancedVehicles =
    previousMonthSalesData?.filter(
      (item) => item.payment_method && item.payment_method.toLowerCase().includes("financiad"),
    ).length || 0

  // Calcular los cambios porcentuales
  const salesChange = calculatePercentageChange(salesThisMonth, previousSalesThisMonth)
  const revenueChange = calculatePercentageChange(revenue, previousRevenue)
  const financedVehiclesChange = calculatePercentageChange(financedVehicles, previousFinancedVehicles)

  // Calcular cambio de stock
  const stockChange = calculatePercentageChange(totalStockCount, previousTotalStockCount)

  // Estadísticas reales o valores de respaldo si no se pueden obtener
  const stats = {
    vehiclesInStock: totalStockCount, // Usar el total real (BMW + MINI disponibles)
    carsInStock: carsCount,
    motorcyclesInStock: motorcyclesCount,
    bmwStockCount: bmwStockCount, // Usar el valor real
    miniStockCount: miniStockCount, // Usar el valor real
    salesThisMonth: salesThisMonth,
    salesCarsCount: salesCarsCount,
    salesMotorcyclesCount: salesMotorcyclesCount,
    bmwSalesCount: bmwSalesCount,
    miniSalesCount: miniSalesCount,
    revenue: revenue,
    revenueCars: revenueCars,
    revenueMotorcycles: revenueMotorcycles,
    revenueBMW: revenueBMW,
    revenueMINI: revenueMINI,
    financedVehicles: financedVehicles,
    financedCars: financedCars,
    financedMotorcycles: financedMotorcycles,
    bmwFinancedCount: bmwFinancedCount,
    miniFinancedCount: miniFinancedCount,
    // Cambios dinámicos
    salesChange: salesChange,
    revenueChange: revenueChange,
    financedVehiclesChange: financedVehiclesChange,
    stockChange: stockChange, // Ahora calculado correctamente
  }

  console.log("DEBUG: Final stats object before rendering:", stats)

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h1 style={{ marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 700, fontSize: '2.2rem', lineHeight: 1.1 }}>
            Dashboard
          </h1>
          <DigitalClock />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground truncate">
            Bienvenido, <span className="font-medium text-foreground">{displayName}</span>
          </p>
          <MotivationalQuote quote={randomPhrase} />
        </div>
      </div>

      {/* Panel Promedio de Días en Taller */}
      <WorkshopDaysCard
        currentAverage={currentAverage}
        last15Average={last15Average}
        last20Average={last20Average}
        totalAverage={totalAverage}
        trendDirection={trendDirection}
        trendPercentage={trendPercentage}
        soldPending={soldPendingCount}
        carsInWorkshop={carsInWorkshop}
        maxCapacity={maxCapacity}
        saturationPercentage={saturationPercentage}
        averagePaintDays={averagePaintDays}
        averageWorkshopDays={averageMechanicalDays} // Using mechanical as workshop average
        chartData={workshopDaysData}
        incidentPercentage={incidentPercentage} // Pass incident percentage
      />

      {/* Cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Vehículos en Stock</p>
                <h3 className="text-2xl font-bold mt-1">{stats.vehiclesInStock}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">{stats.carsInStock}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bike className="h-3 w-3 text-red-500" />
                    <span className="text-xs">{stats.motorcyclesInStock}</span>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-white/10 rounded-full border border-white/50">
                <Car className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {stats.stockChange === "N/A" ? (
                <span className="text-muted-foreground">N/A desde el mes pasado</span>
              ) : (
                <>
                  <TrendingUp
                    className={`h-3 w-3 mr-1 ${stats.stockChange.startsWith("+") ? "text-green-500" : "text-red-500"}`}
                  />
                  <span
                    className={`${stats.stockChange.startsWith("+") ? "text-green-500" : "text-red-500"} font-medium`}
                  >
                    {stats.stockChange}
                  </span>
                  <span className="ml-1 truncate">desde el mes pasado</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <BMWLogo className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">{stats.bmwStockCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MINILogo className="h-4 w-4 text-gray-800" />
                <span className="text-xs font-medium">{stats.miniStockCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Ventas este Mes</p>
                <h3 className="text-2xl font-bold mt-1">{stats.salesThisMonth}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">{stats.salesCarsCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bike className="h-3 w-3 text-red-500" />
                    <span className="text-xs">{stats.salesMotorcyclesCount}</span>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-white/10 rounded-full border border-white/50">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {stats.salesChange === "N/A" ? (
                <span className="text-muted-foreground">N/A desde el mes pasado</span>
              ) : (
                <>
                  <TrendingUp
                    className={`h-3 w-3 mr-1 ${stats.salesChange.startsWith("+") ? "text-green-500" : "text-red-500"}`}
                  />
                  <span
                    className={`${stats.salesChange.startsWith("+") ? "text-green-500" : "text-red-500"} font-medium`}
                  >
                    {stats.salesChange}
                  </span>
                  <span className="ml-1 truncate">desde el mes pasado</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <BMWLogo className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">{stats.bmwSalesCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MINILogo className="h-4 w-4 text-gray-800" />
                <span className="text-xs font-medium">{stats.miniSalesCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Ingresos (€)</p>
                <h3 className="text-2xl font-bold mt-1">{stats.revenue.toLocaleString()}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">{stats.revenueCars.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bike className="h-3 w-3 text-red-500" />
                    <span className="text-xs">{stats.revenueMotorcycles.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-white/10 rounded-full border border-white/50">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {stats.revenueChange === "N/A" ? (
                <span className="text-muted-foreground">N/A desde el mes pasado</span>
              ) : (
                <>
                  <TrendingUp
                    className={`h-3 w-3 mr-1 ${stats.revenueChange.startsWith("+") ? "text-green-500" : "text-red-500"}`}
                  />
                  <span
                    className={`${stats.revenueChange.startsWith("+") ? "text-green-500" : "text-red-500"} font-medium`}
                  >
                    {stats.revenueChange}
                  </span>
                  <span className="ml-1 truncate">desde el mes pasado</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <BMWLogo className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">{stats.revenueBMW.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MINILogo className="h-4 w-4 text-gray-800" />
                <span className="text-xs font-medium">{stats.revenueMINI.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Vehículos Financiados</p>
                <h3 className="text-2xl font-bold mt-1">{stats.financedVehicles}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">{stats.financedCars}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bike className="h-3 w-3 text-red-500" />
                    <span className="text-xs">{stats.financedMotorcycles}</span>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-white/10 rounded-full border border-white/50">
                <Building2 className="h-5 w-5 text-white" /> {/* Changed icon to Building2 */}
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {stats.financedVehiclesChange === "N/A" ? (
                <span className="text-muted-foreground">N/A desde el mes pasado</span>
              ) : (
                <>
                  <TrendingUp
                    className={`h-3 w-3 mr-1 ${stats.financedVehiclesChange.startsWith("+") ? "text-green-500" : "text-red-500"}`}
                  />
                  <span
                    className={`${stats.financedVehiclesChange.startsWith("+") ? "text-green-500" : "text-red-500"} font-medium`}
                  >
                    {stats.financedVehiclesChange}
                  </span>
                  <span className="ml-1 truncate">desde el mes pasado</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <BMWLogo className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">{stats.bmwFinancedCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MINILogo className="h-4 w-4 text-gray-800" />
                <span className="text-xs font-medium">{stats.miniFinancedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila con movimientos pendientes y objetivos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PendingMovementsCard />
        <div className="md:col-span-2">
          <ObjetivosCard />
        </div>
      </div>

      {/* Tercera fila con Actividad Reciente y los dos Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RealActivityFeed />
        <SalesRanking />
        <FinancingRanking />
      </div>
    </div>
  )
}
