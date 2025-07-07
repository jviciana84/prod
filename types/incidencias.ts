// Manteniendo la interfaz original y añadiendo la nueva específica
export interface InformeIncidencias {
  tipo: string
  total_incidencias: number
  resueltas: number
  pendientes: number
  entregas_con_esta_incidencia: number
  tiempo_medio_resolucion: number | null
  total_entregas_unicas_con_incidencias: number
}

// Nueva interfaz para la tabla de incidencias de llaves/documentos
export interface IncidenciaHistorialConDetalles {
  id: string // o number, según tu schema
  id_entrega: string // o number
  tipo_incidencia: string
  descripcion: string | null
  resuelta: boolean
  fecha_resolucion: string | null // ISO date string
  created_at: string // ISO date string
  updated_at: string | null // ISO date string
  usuario_registro: string | null // UUID del usuario
  usuario_resolucion: string | null // UUID del usuario

  // Campos añadidos desde la tabla 'entregas' o 'usuarios'
  matricula: string
  fecha_entrega: string | null // ISO date string
  nombre_asesor: string | null
}
