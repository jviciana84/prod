// Tipos de incidencia válidos - ACTUALIZADOS con variaciones
export const TIPOS_INCIDENCIA_VALIDOS = [
  "Carrocería",
  "Mecánica",
  "Limpieza",
  "2ª llave",
  "CardKey",
  "Ficha técnica",
  "Permiso circulación",
] as const

// Mapeo para normalizar variaciones de texto
export const MAPEO_TIPOS_INCIDENCIA: Record<string, string> = {
  // Carrocería
  carrocería: "Carrocería",
  Carroceria: "Carrocería",
  carroceria: "Carrocería",

  // Mecánica
  mecánica: "Mecánica",
  Mecanica: "Mecánica",
  mecanica: "Mecánica",

  // Limpieza
  limpieza: "Limpieza",

  // 2ª llave - VARIACIONES IMPORTANTES
  "2ª llave": "2ª llave",
  "2a llave": "2ª llave",
  "segunda llave": "2ª llave",
  "Segunda llave": "2ª llave",
  "2° llave": "2ª llave",
  "2da llave": "2ª llave",
  llave: "2ª llave", // Si aparece solo "llave"

  // CardKey
  cardkey: "CardKey",
  "card key": "CardKey",
  "Card Key": "CardKey",

  // Ficha técnica
  "ficha técnica": "Ficha técnica",
  "ficha tecnica": "Ficha técnica",
  "Ficha tecnica": "Ficha técnica",
  "Ficha Técnica": "Ficha técnica",

  // Permiso circulación
  "permiso circulación": "Permiso circulación",
  "permiso circulacion": "Permiso circulación",
  "Permiso circulacion": "Permiso circulación",
  "Permiso Circulación": "Permiso circulación",
}

// Función para normalizar tipos de incidencia
export function normalizarTipoIncidencia(tipo: string): string {
  const tipoLimpio = tipo.trim()
  return MAPEO_TIPOS_INCIDENCIA[tipoLimpio] || tipoLimpio
}

// Tipo que acepta tanto los nuevos valores como los antiguos para compatibilidad
export type TipoIncidencia =
  | "Carrocería"
  | "Mecánica"
  | "Limpieza"
  | "2ª llave"
  | "CardKey"
  | "Ficha técnica"
  | "Permiso circulación"

export interface Entrega {
  id: string
  fecha_venta?: string | null
  fecha_entrega?: string | null
  matricula: string
  modelo: string
  asesor: string
  or: string
  incidencia: boolean
  tipos_incidencia?: TipoIncidencia[]
  observaciones?: string
  enviado_a_incentivos: boolean
  email_enviado: boolean
  email_enviado_at?: string | null
}
