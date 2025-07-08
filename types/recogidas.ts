export interface Recogida {
  id: number
  matricula: string
  mensajeria: string
  centro_recogida: string
  materiales: string[]
  nombre_cliente?: string
  direccion_cliente?: string
  codigo_postal?: string
  ciudad?: string
  provincia?: string
  telefono?: string
  email?: string
  observaciones_envio?: string
  usuario_solicitante: string
  usuario_solicitante_id: string
  seguimiento?: string
  estado: 'solicitada' | 'en_transito' | 'entregada' | 'cancelada'
  fecha_solicitud: string
  fecha_envio?: string
  fecha_entrega?: string
  created_at: string
  updated_at: string
}

export interface MensajeriaConfig {
  id: number
  nombre: string
  email_contacto?: string
  activa: boolean
  created_at: string
  updated_at: string
}

export interface CentroRecogidaConfig {
  id: number
  nombre: string
  direccion?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface RecogidaFormData {
  matricula: string
  mensajeria: string
  centro_recogida: string
  materiales: string[]
  nombre_cliente: string
  direccion_cliente: string
  codigo_postal: string
  ciudad: string
  provincia: string
  telefono: string
  email: string
  observaciones_envio?: string
}

export type MaterialTipo = 
  | '2ª Llave'
  | 'CardKey'
  | 'Ficha técnica'
  | 'Permiso circulación'
  | 'COC'
  | 'Pegatina Medioambiental'
  | 'Otros'

export interface RecogidaEmailConfig {
  enabled: boolean
  email_agencia: string
  cc_emails: string[]
} 