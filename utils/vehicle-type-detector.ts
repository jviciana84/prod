/**
 * Detecta automáticamente si un modelo corresponde a una moto, un coche BMW, un coche MINI o otro
 * @param model Nombre del modelo del vehículo
 * @param brand Nombre de la marca del vehículo
 * @returns "BMW", "MINI", "Motorrad" o "Other"
 */
export function getVehicleType(model: string | null, brand: string | null): "BMW" | "MINI" | "Motorrad" | "Other" {
  const lowerModel = model?.toLowerCase() || ""
  const lowerBrand = brand?.toLowerCase() || ""

  // Priorizar la detección de Motorrad si la marca es "Motorrad" o el modelo contiene "motorrad"
  if (lowerBrand.includes("motorrad") || lowerModel.includes("motorrad")) {
    return "Motorrad"
  }
  // Luego, verificar si es un coche BMW
  if (lowerBrand.includes("bmw")) {
    return "BMW"
  }
  // Luego, verificar si es un coche MINI
  if (lowerBrand.includes("mini")) {
    return "MINI"
  }
  return "Other"
}

/**
 * Detecta automáticamente si un modelo corresponde a una moto o un coche
 * @param model Nombre del modelo del vehículo
 * @returns "Moto" o "Coche"
 */
export function detectVehicleType(model: string | null): "Moto" | "Coche" {
  if (!model) return "Coche" // Por defecto, si no hay modelo, asumimos que es un coche

  const modelLower = model.toLowerCase()

  // Lista de palabras clave que indican que es una moto
  const motorcycleKeywords = [
    // Modelos específicos de motos BMW
    "r1200",
    "r1250",
    "r1300",
    "r nine t",
    "r ninet",
    "rninet",
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

    // Términos genéricos para motos
    "moto",
    "motocicleta",
    "scooter",
    "gs ",
    "rt ",
    "gtl",
    "xr ",
    "rs ",
    "rr ",

    // Modelos específicos con nomenclatura de moto
    "adventure",
    "rallye",
    "sport",
    "urban",
  ]

  // Comprobar si el modelo contiene alguna palabra clave de moto
  for (const keyword of motorcycleKeywords) {
    if (modelLower.includes(keyword)) {
      return "Moto"
    }
  }

  // Si no coincide con ninguna palabra clave de moto, asumimos que es un coche
  return "Coche"
}

/**
 * Actualiza el tipo de vehículo basado en el modelo y la marca
 * @param model Nombre del modelo del vehículo
 * @param brand Nombre de la marca del vehículo
 * @param currentType Tipo actual del vehículo (opcional)
 * @returns Tipo de vehículo actualizado o el actual si no se puede determinar
 */
export function updateVehicleType(model: string | null, brand: string | null, currentType?: string): string {
  if (!model && !brand) return currentType || "Coche"

  // Si ya está establecido como "Motorrad", mantenerlo
  if (currentType === "Motorrad") return "Motorrad"

  const vehicleType = getVehicleType(model, brand)
  if (vehicleType === "BMW" || vehicleType === "MINI") {
    return vehicleType
  }

  return detectVehicleType(model)
}
