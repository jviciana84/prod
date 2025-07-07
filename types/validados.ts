export type PedidoValidado = {
  id: string
  fecha: string
  matricula: string
  vendedor: string
  tipo: string
  formaPago: string
  documento: string
  observaciones: string
}

export type SortState = {
  column: keyof PedidoValidado
  direction: "asc" | "desc"
}

export type FilterState = {
  fecha?: string
  matricula?: string
  vendedor?: string
  tipo?: string
  formaPago?: string
  documento?: string
}
