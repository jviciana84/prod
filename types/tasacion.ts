// Tipos para el sistema de tasaciones

export type DamageType = 'pulir' | 'rayado' | 'golpe' | 'sustituir'
export type InteriorDamageType = 'reparar' | 'sustituir'

export interface VehicleDamage {
  part: string
  damageType: DamageType
}

export interface InteriorDamage {
  part: string
  damageType: InteriorDamageType
}

export type Procedencia = 'particular' | 'empresa'
export type Combustible = 'gasolina' | 'diesel' | 'hibrido' | 'electrico' | 'hidrogeno'
export type Transmision = 'automatico' | 'manual'
export type EstadoMecanico = 'bueno' | 'regular' | 'malo'
export type ColorVehiculo = 'blanco' | 'amarillo' | 'dorado' | 'rosa' | 'naranja' | 'rojo' | 'beige' | 'plata' | 'marron' | 'burdeos' | 'gris' | 'morado' | 'verde' | 'azul' | 'negro'
export type MovilidadTransporte = 'total' | 'solo_rueda' | 'no_rueda'
export type ServicioPublico = 'ninguno' | 'ambulancia' | 'autoescuela' | 'maquinaria' | 'obra_agricola' | 'policia' | 'taxi' | 'alquiler_sc'
export type EtiquetaMedioambiental = 'sin_etiqueta' | 'b' | 'c' | 'eco' | 'cero'
export type TestigoEncendido = 'ninguno' | 'abs' | 'aceite' | 'filtro_particulas' | 'calentadores' | 'gestion_motor' | 'control_traccion' | '4x4' | 'alternador_bateria' | 'frenos' | 'control_estabilidad'
export type DocumentosKm = 'ninguno' | 'facturas_taller' | 'itv' | 'libro_revisiones' | 'otros'
export type OrigenVehiculo = 'nacional' | 'importacion'

export interface TasacionMetadata {
  ip: string
  geolocalizacion?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  dispositivo: {
    userAgent: string
    platform: string
    idioma: string
  }
  timestamp: string
}

export interface TasacionFormData {
  // Paso 1: Inicio
  recaptchaToken: string
  permisosAceptados: boolean

  // Paso 2: Datos básicos
  matricula: string
  kmActuales: number
  procedencia: Procedencia
  fechaMatriculacion: string
  fechaMatriculacionConfirmada: boolean

  // Paso 3: Marca/Modelo/Versión
  marca: string
  modelo: string
  version: string
  combustible: Combustible
  transmision: Transmision
  segundaLlave: boolean
  elementosDestacables?: string

  // Paso 4: Estado estético exterior
  danosExteriores: VehicleDamage[]

  // Paso 5: Estado estético interior
  danosInteriores: InteriorDamage[]

  // Paso 6: Estado mecánico
  estadoMotor: EstadoMecanico
  estadoDireccion: EstadoMecanico
  estadoFrenos: EstadoMecanico
  estadoCajaCambios: EstadoMecanico
  estadoTransmision: EstadoMecanico
  estadoEmbrague: EstadoMecanico
  estadoGeneral: EstadoMecanico
  danoEstructural: boolean
  danoEstructuralDetalle?: string

  // Paso 7: Testigos encendidos
  testigosEncendidos: TestigoEncendido[]

  // Paso 8: Datos adicionales
  origenVehiculo: OrigenVehiculo
  documentosKm: DocumentosKm
  comproNuevo: boolean
  color: ColorVehiculo
  movilidad: MovilidadTransporte
  servicioPublico: ServicioPublico
  etiquetaMedioambiental: EtiquetaMedioambiental
  itvEnVigor: boolean
  proximaITV?: string
  observaciones?: string

  // Paso 9: Fotografías vehículo
  fotosVehiculo: {
    frontal?: string
    lateralDelanteroIzq?: string
    lateralTraseroIzq?: string
    trasera?: string
    lateralTraseroDer?: string
    lateralDelanteroDer?: string
    interiorDelantero?: string
    interiorTrasero?: string
  }

  // Paso 10: Fotografías documentación
  fotosDocumentacion: {
    permisoCirculacionFrente?: string
    permisoCirculacionDorso?: string
    fichaTecnicaFrente?: string
    fichaTecnicaDorso?: string
  }
  fotosOtras: string[]

  // Metadata
  metadata: TasacionMetadata
}

export interface Tasacion {
  id: string
  advisorId: string
  formData: TasacionFormData
  createdAt: string
  status: 'pendiente' | 'revisada' | 'valorada'
  pdfUrl?: string
}

export interface AdvisorTasacionLink {
  advisorId: string
  advisorName: string
  slug: string
  shortUrl: string
  createdAt: string
}


