export interface VentaMensual {
  id: string
  license_plate: string
  model: string
  brand?: string
  sale_date: string
  advisor: string
  advisor_name?: string
  price?: number
  payment_method: string
  client_name?: string
  client_postal_code?: string
  client_province?: string
  client_city?: string
  discount?: string
  vehicle_type?: string
  created_at: string
}

export interface EstadisticasVentas {
  totalVentas: number
  totalIngresos: number
  promedioPrecio: number
  ventasFinanciadas: number
  ventasContado: number
  porcentajeFinanciacion: number
  topAsesores: Array<{ advisor: string; ventas: number; ingresos: number }>
  ventasPorMetodoPago: Array<{ metodo: string; cantidad: number; porcentaje: number }>
  ventasPorMarca: Array<{ marca: string; cantidad: number; ingresos: number }>
  ventasPorProvincia: Array<{ provincia: string; cantidad: number; ingresos: number }>
  ventasPorMes: Array<{ mes: string; cantidad: number; ingresos: number }>
  distribucionPrecios: Array<{ rango: string; cantidad: number; porcentaje: number }>
  descuentosAplicados: Array<{ descuento: string; cantidad: number; porcentaje: number }>
  datosGeograficos: Array<{
    provincia: string
    cantidad: number
    ingresos: number
    codigosPostales: Array<{
      codigo: string
      cantidad: number
      ingresos: number
    }>
  }>
}

export interface VentaGeografica {
  provincia: string
  cantidad: number
  ingresos: number
  codigosPostales: Array<{
    codigo: string
    cantidad: number
    ingresos: number
  }>
}

