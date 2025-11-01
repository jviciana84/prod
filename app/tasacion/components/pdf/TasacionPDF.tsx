'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { TasacionFormData } from '@/types/tasacion'

// Funciones helper para formato
const capitalize = (text: string): string => {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

const formatFieldName = (fieldName: string): string => {
  const replacements: Record<string, string> = {
    'frontal': 'Frontal',
    'lateral_izquierda': 'Lateral Izquierda',
    'lateral_derecha': 'Lateral Derecha',
    'laterial_derecha': 'Lateral Derecha',
    'trasera': 'Trasera',
    'lateralDelanteroIzq': 'Lateral Delantero Izquierdo',
    'lateralTraseroIzq': 'Lateral Trasero Izquierdo',
    'lateralTraseroDer': 'Lateral Trasero Derecho',
    'lateralDelanteroDer': 'Lateral Delantero Derecho',
    'interiorDelantero': 'Interior Delantero',
    'interiorTrasero': 'Interior Trasero',
    'libro_revisiones': 'Libro de revisiones',
    'facturas_taller': 'Facturas de taller',
    'itv': 'ITV',
    'otros': 'Otros documentos',
    'ninguno': 'Ninguno',
  }
  
  return replacements[fieldName] || fieldName
}

const damageTypeLabel: Record<string, string> = {
  'pulir': 'Pulir',
  'rayado': 'Rayado',
  'golpe': 'Golpe',
  'sustituir': 'Sustituir',
  'arañazo': 'Arañazo',
  'abolladura': 'Abolladura',
}

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  
  // Header
  header: {
    marginBottom: 30,
    borderBottom: '3 solid #8b5cf6',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerLogo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6d28d9',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  watermark: {
    position: 'absolute',
    left: -100,
    top: '50%',
    transform: 'rotate(-90deg)',
    opacity: 0.05,
    width: 400,
    height: 400,
  },
  
  // Secciones
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6d28d9',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '2 solid #e5e7eb',
  },
  
  // Grid de datos
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  dataItem: {
    width: '50%',
    marginBottom: 8,
    paddingRight: 10,
  },
  dataItemFull: {
    width: '100%',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: 'bold',
  },
  
  // Imágenes de documentos
  documentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 20,
  },
  documentImage: {
    width: '48%',
    height: 200,
    objectFit: 'contain',
    border: '1 solid #e5e7eb',
    borderRadius: 4,
  },
  documentLabel: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 5,
  },
  
  // Página de fotos
  photoPage: {
    padding: 30,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItem: {
    width: '48%',
    marginBottom: 15,
  },
  photoImage: {
    width: '100%',
    height: 180,
    objectFit: 'cover',
    border: '1 solid #e5e7eb',
    borderRadius: 4,
  },
  photoLabel: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 5,
  },
  
  // Daños
  damageList: {
    marginTop: 5,
  },
  damageItem: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 3,
    paddingLeft: 10,
  },
  
  // Certificado
  certificatePage: {
    padding: 40,
    backgroundColor: '#f9fafb',
  },
  certificateHeader: {
    textAlign: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#ffffff',
    border: '3 solid #6d28d9',
    borderRadius: 8,
  },
  certificateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6d28d9',
    marginBottom: 10,
  },
  certificateSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  certificateContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    border: '1 solid #e5e7eb',
  },
  certificateText: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  certificateData: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 5,
    paddingLeft: 15,
  },
  certificateFooter: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 15,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLogo: {
    width: 30,
    height: 30,
    objectFit: 'contain',
  },
  pageNumber: {
    fontSize: 7,
    color: '#9ca3af',
  },
})

interface TasacionPDFProps {
  data: TasacionFormData
  metadata?: {
    ip?: string
    geolocalizacion?: {
      latitude: number
      longitude: number
    }
    dispositivo?: {
      userAgent: string
      platform: string
      idioma: string
    }
    timestamp?: string
  }
  tasacionId?: string
}

const TasacionPDF = ({ data, metadata, tasacionId }: TasacionPDFProps) => {
  // Función para formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Document>
      {/* PÁGINA 1: DATOS PRINCIPALES + DOCUMENTOS */}
      <Page size="A4" style={styles.page}>
        {/* Filigrana de fondo */}
        <Image src="/svg/filigrana informe.png" style={styles.watermark} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>INFORME DE TASACIÓN</Text>
            <Text style={styles.subtitle}>
              Fecha: {formatDate(metadata?.timestamp)}
            </Text>
          </View>
          <Image src="/svg/logo_tasaciones.png" style={styles.headerLogo} />
        </View>

        {/* Datos Básicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS BÁSICOS DEL VEHÍCULO</Text>
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Matrícula</Text>
              <Text style={styles.dataValue}>{data.matricula || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Kilómetros</Text>
              <Text style={styles.dataValue}>{data.kmActuales?.toLocaleString() || 'N/A'} km</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Procedencia</Text>
              <Text style={styles.dataValue}>
                {data.procedencia === 'particular' ? 'Particular' : 'Empresa'}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Fecha de Matriculación</Text>
              <Text style={styles.dataValue}>{data.fechaMatriculacion || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Marca, Modelo y Versión */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MARCA, MODELO Y VERSIÓN</Text>
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Marca</Text>
              <Text style={styles.dataValue}>{data.marca || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Combustible</Text>
              <Text style={styles.dataValue}>{capitalize(data.combustible) || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Modelo</Text>
              <Text style={styles.dataValue}>{data.modelo || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Transmisión</Text>
              <Text style={styles.dataValue}>{capitalize(data.transmision) || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Versión</Text>
              <Text style={styles.dataValue}>{data.version || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Segunda Llave</Text>
              <Text style={styles.dataValue}>{data.segundaLlave ? 'Sí' : 'No'}</Text>
            </View>
          </View>
          {data.elementosDestacables && (
            <View style={styles.dataItemFull}>
              <Text style={styles.dataLabel}>Elementos Destacables</Text>
              <Text style={styles.dataValue}>{data.elementosDestacables}</Text>
            </View>
          )}
        </View>

        {/* Estado Mecánico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESTADO MECÁNICO</Text>
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Motor</Text>
              <Text style={[styles.dataValue, data.estadoMotor === 'malo' && { color: '#dc2626' }]}>
                {capitalize(data.estadoMotor) || 'N/A'}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Dirección</Text>
              <Text style={[styles.dataValue, data.estadoDireccion === 'malo' && { color: '#dc2626' }]}>
                {capitalize(data.estadoDireccion) || 'N/A'}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Frenos</Text>
              <Text style={[styles.dataValue, data.estadoFrenos === 'malo' && { color: '#dc2626' }]}>
                {capitalize(data.estadoFrenos) || 'N/A'}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Caja de Cambios</Text>
              <Text style={[styles.dataValue, data.estadoCajaCambios === 'malo' && { color: '#dc2626' }]}>
                {capitalize(data.estadoCajaCambios) || 'N/A'}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Transmisión</Text>
              <Text style={[styles.dataValue, data.estadoTransmision === 'malo' && { color: '#dc2626' }]}>
                {capitalize(data.estadoTransmision) || 'N/A'}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Embrague</Text>
              <Text style={[styles.dataValue, data.estadoEmbrague === 'malo' && { color: '#dc2626' }]}>
                {capitalize(data.estadoEmbrague) || 'N/A'}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Estado General</Text>
              <Text style={[styles.dataValue, data.estadoGeneral === 'malo' && { color: '#dc2626' }]}>
                {capitalize(data.estadoGeneral) || 'N/A'}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Daño Estructural</Text>
              <Text style={[styles.dataValue, data.danoEstructural && { color: '#dc2626' }]}>
                {data.danoEstructural ? 'Sí' : 'No'}
              </Text>
            </View>
          </View>
          {data.danoEstructural && data.danoEstructuralDetalle && (
            <View style={styles.dataItemFull}>
              <Text style={styles.dataLabel}>Detalle Daño Estructural</Text>
              <Text style={[styles.dataValue, { color: '#dc2626' }]}>{data.danoEstructuralDetalle}</Text>
            </View>
          )}
        </View>

        {/* Documentos */}
        {(data.fotoPermisoCirculacion || data.fotoFichaTecnicaFrente) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DOCUMENTACIÓN</Text>
            <View style={styles.documentSection}>
              {data.fotoPermisoCirculacion && (
                <View style={{ width: '48%' }}>
                  <Image 
                    src={data.fotoPermisoCirculacion} 
                    style={styles.documentImage}
                  />
                  <Text style={styles.documentLabel}>Permiso de Circulación</Text>
                </View>
              )}
              {data.fotoFichaTecnicaFrente && (
                <View style={{ width: '48%' }}>
                  <Image 
                    src={data.fotoFichaTecnicaFrente} 
                    style={styles.documentImage}
                  />
                  <Text style={styles.documentLabel}>Ficha Técnica (Anverso)</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerLeft}>
              <Text style={{ fontSize: 7 }}>ID de Tasación: {tasacionId || 'Generando...'}</Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>
                Fecha de registro: {formatDate(metadata?.timestamp)}
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Image src="/svg/logo_tasaciones.png" style={styles.footerLogo} />
              <Text style={styles.pageNumber}>Página 1 de {getTotalPages(data)}</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* PÁGINA 2: MÁS DATOS */}
      <Page size="A4" style={styles.page}>
        {/* Filigrana de fondo */}
        <Image src="/svg/filigrana informe.png" style={styles.watermark} />
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>DATOS ADICIONALES</Text>
          </View>
          <Image src="/svg/logo_tasaciones.png" style={styles.headerLogo} />
        </View>

        {/* Datos del Vehículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL VEHÍCULO</Text>
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Origen</Text>
              <Text style={styles.dataValue}>
                {data.origenVehiculo === 'nacional' ? 'Nacional' : 'Importación'}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Comprado Nuevo</Text>
              <Text style={styles.dataValue}>{data.comproNuevo ? 'Sí' : 'No'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Color</Text>
              <Text style={styles.dataValue}>{capitalize(data.color) || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Movilidad</Text>
              <Text style={styles.dataValue}>{capitalize(data.movilidad?.replace('_', ' ')) || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Servicio Público</Text>
              <Text style={styles.dataValue}>{capitalize(data.servicioPublico?.replace('_', ' ')) || 'Ninguno'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Etiqueta Ambiental</Text>
              <Text style={styles.dataValue}>{data.etiquetaMedioambiental?.toUpperCase() || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>ITV en Vigor</Text>
              <Text style={styles.dataValue}>{data.itvEnVigor ? 'Sí' : 'No'}</Text>
            </View>
            {data.proximaITV && (
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Próxima ITV</Text>
                <Text style={styles.dataValue}>{data.proximaITV}</Text>
              </View>
            )}
          </View>
          {data.documentosKm && (
            <View style={styles.dataItemFull}>
              <Text style={styles.dataLabel}>Documentos que acreditan KM</Text>
              <Text style={styles.dataValue}>{formatFieldName(data.documentosKm)}</Text>
            </View>
          )}
        </View>

        {/* Estado Estético - Daños Exteriores */}
        {data.danosExteriores && data.danosExteriores.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DAÑOS EXTERIORES</Text>
            <View style={styles.damageList}>
              {data.danosExteriores.map((dano, index) => (
                <View key={index} style={{ marginBottom: 6 }}>
                  <Text style={styles.damageItem}>
                    • {dano.parte} - {damageTypeLabel[dano.tipo] || capitalize(dano.tipo)}
                  </Text>
                  <Text style={{ fontSize: 8, color: '#9ca3af', marginLeft: 12 }}>
                    Vista: {formatFieldName(dano.vista || '')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Daños Interiores */}
        {data.danosInteriores && data.danosInteriores.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DAÑOS INTERIORES</Text>
            <View style={styles.damageList}>
              {data.danosInteriores.map((dano, index) => (
                <View key={index} style={{ marginBottom: 6 }}>
                  <Text style={styles.damageItem}>
                    • {dano.parte} - {damageTypeLabel[dano.tipo] || capitalize(dano.tipo)}
                  </Text>
                  <Text style={{ fontSize: 8, color: '#9ca3af', marginLeft: 12 }}>
                    Vista: {formatFieldName(dano.vista || '')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Testigos Encendidos */}
        {data.testigosEncendidos && data.testigosEncendidos.length > 0 && data.testigosEncendidos[0] !== 'ninguno' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TESTIGOS ENCENDIDOS</Text>
            <View style={styles.damageList}>
              {data.testigosEncendidos.map((testigo, index) => (
                <Text key={index} style={[styles.damageItem, { color: '#dc2626' }]}>
                  • {capitalize(testigo.replace('_', ' '))}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Observaciones */}
        {data.observaciones && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
            <Text style={styles.dataValue}>{data.observaciones}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerLeft}>
              <Text style={{ fontSize: 7 }}>ID de Tasación: {tasacionId || 'Generando...'}</Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>
                Fecha de registro: {formatDate(metadata?.timestamp)}
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Image src="/svg/logo_tasaciones.png" style={styles.footerLogo} />
              <Text style={styles.pageNumber}>Página 2 de {getTotalPages(data)}</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* PÁGINAS DE FOTOGRAFÍAS */}
      {renderPhotoPages(data, tasacionId, metadata)}

      {/* PÁGINA FINAL: CERTIFICADO */}
      <Page size="A4" style={styles.certificatePage}>
        {/* Filigrana de fondo */}
        <Image src="/svg/filigrana informe.png" style={styles.watermark} />
        <View style={styles.certificateHeader}>
          <Text style={styles.certificateTitle}>CERTIFICADO DE AUTENTICIDAD</Text>
          <Text style={styles.certificateSubtitle}>Datos de Verificación</Text>
        </View>

        <View style={styles.certificateContent}>
          <Text style={{ fontSize: 9, color: '#374151', lineHeight: 1.4 }}>
            Este documento certifica que la información ha sido proporcionada por el cliente 
            a través del Portal de Tasaciones.
          </Text>

          <Text style={[styles.certificateText, { marginTop: 12, fontWeight: 'bold', fontSize: 10 }]}>
            Datos de Registro:
          </Text>
          <Text style={[styles.certificateData, { fontSize: 8 }]}>
            • Fecha: {formatDate(metadata?.timestamp)}
          </Text>
          {metadata?.ip && (
            <Text style={[styles.certificateData, { fontSize: 8 }]}>
              • IP: {metadata.ip}
            </Text>
          )}

          <View style={{ 
            marginTop: 15, 
            padding: 10, 
            backgroundColor: '#f3f4f6',
            borderRadius: 4,
            border: '1 solid #6d28d9'
          }}>
            <Text style={{ fontSize: 9, color: '#6d28d9', textAlign: 'center', fontWeight: 'bold' }}>
              DOCUMENTO VERIFICADO DIGITALMENTE
            </Text>
            <Text style={{ fontSize: 7, color: '#6b7280', textAlign: 'center', marginTop: 3 }}>
              ID de Tasación: {tasacionId || 'Generando...'}
            </Text>
          </View>
        </View>

        {/* Cláusula de Descargo de Responsabilidad - COMPACTA */}
        <View style={{ 
          marginTop: 15, 
          padding: 12, 
          backgroundColor: '#fef3c7',
          borderRadius: 4,
          border: '1 solid #f59e0b'
        }}>
          <Text style={{ 
            fontSize: 10, 
            fontWeight: 'bold', 
            color: '#92400e', 
            marginBottom: 6,
            textAlign: 'center'
          }}>
            Protección de Datos y Descargo de Responsabilidad (CVO)
          </Text>
          
          <Text style={{ fontSize: 7, color: '#78350f', lineHeight: 1.3, marginBottom: 4 }}>
            El tratamiento de los datos se ha realizado por CVO con la finalidad de elaborar esta tasación, 
            basándose en su consentimiento y en los datos facilitados.
          </Text>
          
          <Text style={{ fontSize: 7, color: '#78350f', lineHeight: 1.3, marginBottom: 4 }}>
            Sus datos personales y documentación serán eliminados automáticamente al cumplirse 
            <Text style={{ fontWeight: 'bold' }}> tres (3) meses</Text> desde la emisión de este informe.
          </Text>
          
          <Text style={{ fontSize: 7, color: '#78350f', lineHeight: 1.3 }}>
            Puede ejercer sus derechos contactando con CVO en 
            <Text style={{ fontWeight: 'bold' }}> hola@controlvo.ovh</Text>.
          </Text>
        </View>

        <View style={styles.certificateFooter}>
          <Text>Portal de Tasaciones © 2025</Text>
          <Text style={{ marginTop: 5 }}>
            Este documento ha sido generado automáticamente
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// Función auxiliar para obtener total de páginas
function getTotalPages(data: TasacionFormData): number {
  let pages = 3 // Página 1 (datos), Página 2 (más datos), Página final (certificado)
  
  // Contar páginas de fotos
  const photoSections = [
    data.fotosVehiculo,
    data.fotosCuentakm,
    data.fotosInteriorDelantero,
    data.fotosInteriorTrasero,
    data.fotosOtras
  ].filter(Boolean)
  
  // Cada 4 fotos = 1 página
  pages += Math.ceil(photoSections.length / 4)
  
  return pages
}

// Función para renderizar páginas de fotografías
function renderPhotoPages(data: TasacionFormData, tasacionId?: string, metadata?: any) {
  const photos: { src: string; label: string }[] = []
  
  // Fotos del vehículo
  if (data.fotosVehiculo) {
    Object.entries(data.fotosVehiculo).forEach(([key, value]) => {
      if (value) {
        photos.push({ src: value, label: `Vehículo - ${formatFieldName(key)}` })
      }
    })
  }
  
  // Cuentakm
  if (data.fotosCuentakm) {
    photos.push({ src: data.fotosCuentakm, label: 'Cuentakilómetros' })
  }
  
  // Interior delantero
  if (data.fotosInteriorDelantero) {
    photos.push({ src: data.fotosInteriorDelantero, label: 'Interior Delantero' })
  }
  
  // Interior trasero
  if (data.fotosInteriorTrasero) {
    photos.push({ src: data.fotosInteriorTrasero, label: 'Interior Trasero' })
  }
  
  // Fotos de documentación
  if (data.fotosDocumentacion) {
    if (data.fotosDocumentacion.permisoCirculacionFrente) {
      photos.push({ src: data.fotosDocumentacion.permisoCirculacionFrente, label: 'Permiso de Circulación (Frente)' })
    }
    if (data.fotosDocumentacion.permisoCirculacionDorso) {
      photos.push({ src: data.fotosDocumentacion.permisoCirculacionDorso, label: 'Permiso de Circulación (Dorso)' })
    }
    if (data.fotosDocumentacion.fichaTecnicaFrente) {
      photos.push({ src: data.fotosDocumentacion.fichaTecnicaFrente, label: 'Ficha Técnica (Frente)' })
    }
    if (data.fotosDocumentacion.fichaTecnicaDorso) {
      photos.push({ src: data.fotosDocumentacion.fichaTecnicaDorso, label: 'Ficha Técnica (Dorso)' })
    }
  }
  
  // Otras fotos
  if (data.fotosOtras && data.fotosOtras.length > 0) {
    data.fotosOtras.forEach((foto, index) => {
      photos.push({ src: foto, label: `Foto Adicional ${index + 1}` })
    })
  }
  
  // Dividir fotos en páginas de 4
  const pages = []
  for (let i = 0; i < photos.length; i += 4) {
    const pagePhotos = photos.slice(i, i + 4)
    pages.push(
      <Page key={`photo-page-${i}`} size="A4" style={styles.photoPage}>
        {/* Filigrana de fondo */}
        <Image src="/svg/filigrana informe.png" style={styles.watermark} />
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>FOTOGRAFÍAS</Text>
            <Text style={styles.subtitle}>Página {Math.floor(i / 4) + 3}</Text>
          </View>
          <Image src="/svg/logo_tasaciones.png" style={styles.headerLogo} />
        </View>
        
        <View style={styles.photoGrid}>
          {pagePhotos.map((photo, idx) => (
            <View key={idx} style={styles.photoItem}>
              <Image src={photo.src} style={styles.photoImage} />
              <Text style={styles.photoLabel}>{photo.label}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerLeft}>
              <Text style={{ fontSize: 7 }}>ID de Tasación: {tasacionId || 'Generando...'}</Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>
                Fecha de registro: {metadata?.timestamp ? new Date(metadata.timestamp).toLocaleDateString('es-ES') : 'N/A'}
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Image src="/svg/logo_tasaciones.png" style={styles.footerLogo} />
              <Text style={styles.pageNumber}>Página {Math.floor(i / 4) + 3} de {getTotalPages(data)}</Text>
            </View>
          </View>
        </View>
      </Page>
    )
  }
  
  return pages
}

export default TasacionPDF


