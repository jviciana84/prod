'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { TasacionFormData } from '@/types/tasacion'

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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6d28d9',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
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
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 8,
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
}

const TasacionPDF = ({ data, metadata }: TasacionPDFProps) => {
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Informe de Tasación</Text>
          <Text style={styles.subtitle}>
            Fecha: {formatDate(metadata?.timestamp)}
          </Text>
        </View>

        {/* Datos Básicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Básicos del Vehículo</Text>
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Matrícula</Text>
              <Text style={styles.dataValue}>{data.matricula || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Kilómetros</Text>
              <Text style={styles.dataValue}>{data.kilometros || 'N/A'} km</Text>
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
          <Text style={styles.sectionTitle}>Marca, Modelo y Versión</Text>
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Marca</Text>
              <Text style={styles.dataValue}>{data.marca || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Combustible</Text>
              <Text style={styles.dataValue}>{data.combustible || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Modelo</Text>
              <Text style={styles.dataValue}>{data.modelo || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Transmisión</Text>
              <Text style={styles.dataValue}>{data.transmision || 'N/A'}</Text>
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
          <Text style={styles.sectionTitle}>Estado Mecánico</Text>
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Motor</Text>
              <Text style={styles.dataValue}>{data.estadoMotor || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Dirección</Text>
              <Text style={styles.dataValue}>{data.estadoDireccion || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Frenos</Text>
              <Text style={styles.dataValue}>{data.estadoFrenos || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Caja de Cambios</Text>
              <Text style={styles.dataValue}>{data.estadoCajaCambios || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Transmisión</Text>
              <Text style={styles.dataValue}>{data.estadoTransmision || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Embrague</Text>
              <Text style={styles.dataValue}>{data.estadoEmbrague || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Daño Estructural</Text>
              <Text style={styles.dataValue}>{data.danoEstructural ? 'Sí' : 'No'}</Text>
            </View>
          </View>
        </View>

        {/* Documentos */}
        {(data.fotoPermisoCirculacion || data.fotoFichaTecnicaFrente) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documentación</Text>
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
          <Text>Portal de Tasaciones - Informe Generado Automáticamente</Text>
        </View>
      </Page>

      {/* PÁGINA 2: MÁS DATOS */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Datos Adicionales</Text>
        </View>

        {/* Datos del Vehículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Vehículo</Text>
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Origen</Text>
              <Text style={styles.dataValue}>
                {data.origenVehiculo === 'nacional' ? 'Nacional' : 'Importación'}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Comprado Nuevo</Text>
              <Text style={styles.dataValue}>{data.compradoNuevo ? 'Sí' : 'No'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Color</Text>
              <Text style={styles.dataValue}>{data.color || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Movilidad</Text>
              <Text style={styles.dataValue}>{data.movilidadTransporte || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Servicio Público</Text>
              <Text style={styles.dataValue}>{data.servicioPublico || 'Ninguno'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Etiqueta Ambiental</Text>
              <Text style={styles.dataValue}>{data.etiquetaMedioambiental || 'N/A'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>ITV en Vigor</Text>
              <Text style={styles.dataValue}>{data.itvVigente ? 'Sí' : 'No'}</Text>
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
              <Text style={styles.dataValue}>{data.documentosKm}</Text>
            </View>
          )}
        </View>

        {/* Estado Estético - Daños Exteriores */}
        {data.danosExteriores && data.danosExteriores.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daños Exteriores</Text>
            <View style={styles.damageList}>
              {data.danosExteriores.map((dano, index) => (
                <Text key={index} style={styles.damageItem}>
                  • {dano.vista.toUpperCase()} - {dano.tipo} (X: {Math.round(dano.x)}, Y: {Math.round(dano.y)})
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Testigos Encendidos */}
        {data.testigosEncendidos && data.testigosEncendidos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Testigos Encendidos</Text>
            <View style={styles.damageList}>
              {data.testigosEncendidos.map((testigo, index) => (
                <Text key={index} style={styles.damageItem}>• {testigo}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Observaciones */}
        {data.observaciones && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text style={styles.dataValue}>{data.observaciones}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Portal de Tasaciones - Página 2 de {getTotalPages(data)}</Text>
        </View>
      </Page>

      {/* PÁGINAS DE FOTOGRAFÍAS */}
      {renderPhotoPages(data)}

      {/* PÁGINA FINAL: CERTIFICADO */}
      <Page size="A4" style={styles.certificatePage}>
        <View style={styles.certificateHeader}>
          <Text style={styles.certificateTitle}>CERTIFICADO DE AUTENTICIDAD</Text>
          <Text style={styles.certificateSubtitle}>
            Datos de Verificación del Cliente
          </Text>
        </View>

        <View style={styles.certificateContent}>
          <Text style={styles.certificateText}>
            Este documento certifica que la información contenida en el presente informe
            de tasación ha sido proporcionada directamente por el cliente a través del
            Portal de Tasaciones, con los siguientes datos de verificación:
          </Text>

          <Text style={[styles.certificateText, { marginTop: 20, fontWeight: 'bold' }]}>
            Datos de Registro:
          </Text>
          <Text style={styles.certificateData}>
            • Fecha y hora: {formatDate(metadata?.timestamp)}
          </Text>
          {metadata?.ip && (
            <Text style={styles.certificateData}>
              • Dirección IP: {metadata.ip}
            </Text>
          )}
          {metadata?.geolocalizacion && (
            <Text style={styles.certificateData}>
              • Geolocalización: Lat {metadata.geolocalizacion.latitude.toFixed(6)}, 
              Lon {metadata.geolocalizacion.longitude.toFixed(6)}
            </Text>
          )}

          {metadata?.dispositivo && (
            <>
              <Text style={[styles.certificateText, { marginTop: 15, fontWeight: 'bold' }]}>
                Información del Dispositivo:
              </Text>
              <Text style={styles.certificateData}>
                • Plataforma: {metadata.dispositivo.platform}
              </Text>
              <Text style={styles.certificateData}>
                • Idioma: {metadata.dispositivo.idioma}
              </Text>
              <Text style={styles.certificateData}>
                • User Agent: {metadata.dispositivo.userAgent}
              </Text>
            </>
          )}

          <Text style={[styles.certificateText, { marginTop: 20 }]}>
            Los datos registrados en este documento son responsabilidad del cliente
            y han sido capturados mediante sistemas automatizados de verificación
            para garantizar su autenticidad e integridad.
          </Text>

          <View style={{ 
            marginTop: 30, 
            padding: 15, 
            backgroundColor: '#f3f4f6',
            borderRadius: 4,
            border: '2 solid #6d28d9'
          }}>
            <Text style={{ fontSize: 10, color: '#6d28d9', textAlign: 'center', fontWeight: 'bold' }}>
              DOCUMENTO VERIFICADO DIGITALMENTE
            </Text>
            <Text style={{ fontSize: 8, color: '#6b7280', textAlign: 'center', marginTop: 5 }}>
              ID de Verificación: {metadata?.timestamp ? 
                Buffer.from(metadata.timestamp).toString('base64').substring(0, 16) : 
                'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.certificateFooter}>
          <Text>Portal de Tasaciones © 2025</Text>
          <Text style={{ marginTop: 5 }}>
            Este documento ha sido generado automáticamente y tiene validez legal
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
function renderPhotoPages(data: TasacionFormData) {
  const photos: { src: string; label: string }[] = []
  
  // Fotos del vehículo
  if (data.fotosVehiculo) {
    Object.entries(data.fotosVehiculo).forEach(([key, value]) => {
      if (value) {
        photos.push({ src: value, label: `Vehículo - ${key}` })
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
  
  // Ficha técnica dorso
  if (data.fotoFichaTecnicaDorso) {
    photos.push({ src: data.fotoFichaTecnicaDorso, label: 'Ficha Técnica (Dorso)' })
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
        <View style={styles.header}>
          <Text style={styles.title}>Fotografías</Text>
          <Text style={styles.subtitle}>Página {Math.floor(i / 4) + 3}</Text>
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
          <Text>Portal de Tasaciones - Fotografías</Text>
        </View>
      </Page>
    )
  }
  
  return pages
}

export default TasacionPDF

