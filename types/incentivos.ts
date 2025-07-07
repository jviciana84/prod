export interface Incentivo {
  id: number
  fecha_entrega: string | null
  matricula: string | null
  modelo: string | null
  asesor: string | null
  forma_pago: string | null
  precio_venta: number | null
  precio_compra: number | null
  dias_stock: number | null
  gastos_estructura: number | null
  garantia: number | null
  gastos_360: number | null
  antiguedad: boolean | null
  financiado: boolean | null
  otros: number | null
  importe_minimo: number | null
  margen: number | null // Campo calculado, no directo de DB
  importe_total: number | null // Campo calculado, no directo de DB
  tramitado: boolean | null
  otros_observaciones: string | null
  porcentaje_margen_config_usado: number | null
  or: string | null
}
