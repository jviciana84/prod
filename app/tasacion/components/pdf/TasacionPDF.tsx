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
    // Vistas exteriores
    'frontal': 'Frontal',
    'lateral_izquierda': 'Lateral Izquierda',
    'lateral_derecha': 'Lateral Derecha',
    'laterial_derecha': 'Lateral Derecha',
    'trasera': 'Trasera',
    'lateralDelanteroIzq': 'Lateral Delantero Izquierdo',
    'lateralTraseroIzq': 'Lateral Trasero Izquierdo',
    'lateralTraseroDer': 'Lateral Trasero Derecho',
    'lateralDelanteroDer': 'Lateral Delantero Derecho',
    // Vistas interiores
    'interiorDelantero': 'Interior Delantero',
    'interiorTrasero': 'Interior Trasero',
    'interior_delantero_izq': 'Interior Delantero Izquierdo',
    'interior_delantero_izquierda': 'Interior Delantero Izquierda',
    'interior_trasero_izq': 'Interior Trasero Izquierdo',
    'interior_trasero': 'Interior Trasero',
    'interior_trasera_izquierda': 'Interior Trasera Izquierda',
    'interior_salpicadero': 'Interior Salpicadero',
    'interior_maletero': 'Interior Maletero',
    // Documentación
    'libro_revisiones': 'Libro de revisiones',
    'facturas_taller': 'Facturas de taller',
    'itv': 'ITV',
    'otros': 'Otros documentos',
    'ninguno': 'Ninguno',
    // Combustibles
    'gasolina': 'Gasolina',
    'diesel': 'Diésel',
    'hibrido': 'Híbrido',
    'electrico': 'Eléctrico',
    'hidrogeno': 'Hidrógeno',
    // Transmisión
    'manual': 'Manual',
    'automatico': 'Automático',
    // Estados
    'bueno': 'Bueno',
    'regular': 'Regular',
    'malo': 'Malo',
    // Colores
    'blanco': 'Blanco',
    'negro': 'Negro',
    'gris': 'Gris',
    'plata': 'Plata',
    'azul': 'Azul',
    'rojo': 'Rojo',
    'verde': 'Verde',
    'amarillo': 'Amarillo',
    'naranja': 'Naranja',
    'marron': 'Marrón',
    'beige': 'Beige',
    'dorado': 'Dorado',
    'rosa': 'Rosa',
    'morado': 'Morado',
    'burdeos': 'Burdeos',
    // Movilidad
    'total': 'Total',
    'solo_rueda': 'Solo rueda',
    'no_rueda': 'No rueda',
    // Etiqueta medioambiental
    'sin_etiqueta': 'Sin etiqueta',
    'eco': 'ECO',
    'c': 'C',
    'b': 'B',
    'cero': 'Cero',
    // Servicio público
    'ambulancia': 'Ambulancia',
    'autoescuela': 'Autoescuela',
    'maquinaria': 'Maquinaria',
    'obra_agricola': 'Obra agrícola',
    'policia': 'Policía',
    'taxi': 'Taxi',
    'alquiler_sc': 'Alquiler sin conductor',
    // Testigos encendidos
    'abs': 'ABS',
    'aceite': 'Aceite',
    'filtro_particulas': 'Filtro de partículas',
    'calentadores': 'Calentadores',
    'gestion_motor': 'Gestión motor',
    'control_traccion': 'Control de tracción',
    '4x4': '4x4',
    'alternador_bateria': 'Alternador/Batería',
    'frenos': 'Frenos',
    'control_estabilidad': 'Control de estabilidad',
    // Otros
    'particular': 'Particular',
    'empresa': 'Empresa',
    'nacional': 'Nacional',
    'importacion': 'Importación',
  }
  
  return replacements[fieldName] || capitalize(fieldName.replace(/_/g, ' '))
}

const damageTypeLabel: Record<string, string> = {
  'pulir': 'Pulir',
  'rayado': 'Rayado',
  'golpe': 'Golpe',
  'sustituir': 'Sustituir',
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
    marginBottom: 20,
    borderBottom: '3 solid #8b5cf6',
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerLogo: {
    width: 50,
    height: 50,
    objectFit: 'contain',
  },
  headerLeft: {
    flex: 1,
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6d28d9',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '2 solid #e5e7eb',
  },
  
  // Grid de datos
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dataItem: {
    width: '50%',
    marginBottom: 6,
    paddingRight: 10,
  },
  dataItemFull: {
    width: '100%',
    marginBottom: 6,
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
    gap: 10,
  },
  photoItem: {
    width: '48%',
    marginBottom: 15,
  },
  photoImage: {
    width: '100%',
    height: 160,
    objectFit: 'cover',
    border: '1 solid #e5e7eb',
    borderRadius: 4,
  },
  photoLabel: {
    fontSize: 7,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 3,
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
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  certificateHeader: {
    textAlign: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
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
    paddingTop: 8,
    fontSize: 7,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  footerLogo: {
    width: 20,
    height: 20,
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
  logoBase64?: string
  watermarkBase64?: string
  damageSVGs?: Record<string, string>
}

const TasacionPDF = ({ data, metadata, tasacionId, logoBase64, watermarkBase64, damageSVGs }: TasacionPDFProps) => {
  // Usar SOLO base64, NO usar fallback a rutas
  const logoSrc = logoBase64
  const watermarkSrc = watermarkBase64
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
        {watermarkSrc && (
          <Image 
            src={watermarkSrc} 
            style={styles.watermark}
          />
        )}
        
        {/* Header */}
        <View style={styles.header}>
          {logoSrc && (
            <Image 
              src={logoSrc} 
              style={styles.headerLogo}
            />
          )}
          <View style={styles.headerLeft}>
            <Text style={styles.title}>INFORME DE TASACIÓN</Text>
            <Text style={styles.subtitle}>
              Fecha: {formatDate(metadata?.timestamp)}
            </Text>
          </View>
        </View>

        {/* Secciones en 2 columnas con estilo original */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Columna izquierda */}
          <View style={{ width: '48%' }}>
            {/* Datos del Vehículo - Integrado */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DATOS DEL VEHÍCULO</Text>
              <View style={styles.dataGrid}>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Matrícula</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>{data.matricula || 'N/A'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Kilómetros</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>{data.kmActuales?.toLocaleString() || 'N/A'} km</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Procedencia</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>
                    {data.procedencia === 'particular' ? 'Particular' : (
                      <>
                        Empresa <Text style={{ fontSize: 7, color: '#3b82f6', fontWeight: 'bold' }}>(21% IVA incluido)</Text>
                      </>
                    )}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>F. Matriculación</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>{data.fechaMatriculacion || 'N/A'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Origen</Text>
                  <Text style={[
                    styles.dataValue, 
                    { fontSize: 8 },
                    data.origenVehiculo === 'importacion' && { color: '#f59e0b', fontWeight: 'bold' }
                  ]}>
                    {formatFieldName(data.origenVehiculo || '')}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Comprado Nuevo</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>{data.comproNuevo ? 'Sí' : 'No'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Color</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>{formatFieldName(data.color) || 'N/A'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Movilidad</Text>
                  <Text style={[
                    styles.dataValue, 
                    { fontSize: 8 },
                    data.movilidad === 'solo_rueda' && { color: '#dc2626', fontWeight: 'bold' },
                    data.movilidad === 'no_rueda' && { color: '#dc2626', fontWeight: 'bold' }
                  ]}>
                    {formatFieldName(data.movilidad || '') || 'N/A'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Servicio Público</Text>
                  <Text style={[
                    styles.dataValue, 
                    { fontSize: 8 },
                    (data.servicioPublico && data.servicioPublico !== 'ninguno') && { color: '#f59e0b', fontWeight: 'bold' }
                  ]}>
                    {formatFieldName(data.servicioPublico || '') || 'Ninguno'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Etiqueta Ambiental</Text>
                  <Text style={[
                    styles.dataValue, 
                    { fontSize: 8 },
                    data.etiquetaMedioambiental === 'sin_etiqueta' && { color: '#dc2626', fontWeight: 'bold' }
                  ]}>
                    {data.etiquetaMedioambiental?.toUpperCase() || 'N/A'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>ITV en Vigor</Text>
                  <Text style={[
                    styles.dataValue, 
                    { fontSize: 8 },
                    !data.itvEnVigor && { color: '#dc2626', fontWeight: 'bold' }
                  ]}>
                    {data.itvEnVigor ? 'Sí' : 'No'}
                  </Text>
                </View>
                {data.proximaITV && (
                  <View style={styles.dataItem}>
                    <Text style={[styles.dataLabel, { fontSize: 7 }]}>Próxima ITV</Text>
                    <Text style={[styles.dataValue, { fontSize: 8 }]}>{data.proximaITV}</Text>
                  </View>
                )}
              </View>
              {Array.isArray(data.documentosKm) && data.documentosKm.length > 0 && (
                <View style={styles.dataItemFull}>
                  <Text style={[styles.dataLabel, { fontSize: 7, color: '#8b5cf6' }]}>Documentos que acreditan KM</Text>
                  {data.documentosKm.map((doc, idx) => (
                    <Text key={idx} style={[
                      styles.dataValue, 
                      { fontSize: 7, marginBottom: 2 },
                      (data.documentosKm.length === 1 && data.documentosKm[0] === 'ninguno') && { color: '#dc2626', fontWeight: 'bold' }
                    ]}>
                      • {formatFieldName(doc)}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Testigos Encendidos en la misma columna */}
            {data.testigosEncendidos && data.testigosEncendidos.length > 0 && data.testigosEncendidos[0] !== 'ninguno' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TESTIGOS ENCENDIDOS</Text>
                <View style={styles.damageList}>
                  {data.testigosEncendidos.map((testigo, index) => (
                    <Text key={index} style={[styles.damageItem, { color: '#dc2626', fontSize: 8 }]}>
                      • {formatFieldName(testigo)}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Columna derecha */}
          <View style={{ width: '48%' }}>
            {/* Marca, Modelo y Versión */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MARCA, MODELO Y VERSIÓN</Text>
              <View style={styles.dataGrid}>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Marca</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>{data.marca || 'N/A'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Combustible</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>{formatFieldName(data.combustible) || 'N/A'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Modelo</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>{data.modelo || 'N/A'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Transmisión</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>{formatFieldName(data.transmision) || 'N/A'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Versión</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }]}>{data.version || 'N/A'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Segunda Llave</Text>
                  <Text style={[
                    styles.dataValue, 
                    { fontSize: 8 },
                    !data.segundaLlave && { color: '#dc2626', fontWeight: 'bold' }
                  ]}>
                    {data.segundaLlave ? 'Sí' : 'No'}
                  </Text>
                </View>
              </View>
              <View style={styles.dataItemFull}>
                <Text style={[styles.dataLabel, { fontSize: 7, color: '#8b5cf6' }]}>Elementos Destacables</Text>
                {data.elementosDestacables ? (
                  <Text style={[styles.dataValue, { fontSize: 7 }]}>{data.elementosDestacables}</Text>
                ) : (
                  <Text style={[styles.dataValue, { fontSize: 7, fontStyle: 'italic', color: '#9ca3af' }]}>Vacío</Text>
                )}
              </View>
            </View>

            {/* Estado Mecánico */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ESTADO MECÁNICO</Text>
              <View style={styles.dataGrid}>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Motor</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }, data.estadoMotor === 'regular' && { color: '#f59e0b', fontWeight: 'bold' }, data.estadoMotor === 'malo' && { color: '#dc2626', fontWeight: 'bold' }]}>
                    {formatFieldName(data.estadoMotor) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Dirección</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }, data.estadoDireccion === 'regular' && { color: '#f59e0b', fontWeight: 'bold' }, data.estadoDireccion === 'malo' && { color: '#dc2626', fontWeight: 'bold' }]}>
                    {formatFieldName(data.estadoDireccion) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Frenos</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }, data.estadoFrenos === 'regular' && { color: '#f59e0b', fontWeight: 'bold' }, data.estadoFrenos === 'malo' && { color: '#dc2626', fontWeight: 'bold' }]}>
                    {formatFieldName(data.estadoFrenos) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Caja de Cambios</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }, data.estadoCajaCambios === 'regular' && { color: '#f59e0b', fontWeight: 'bold' }, data.estadoCajaCambios === 'malo' && { color: '#dc2626', fontWeight: 'bold' }]}>
                    {formatFieldName(data.estadoCajaCambios) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Transmisión</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }, data.estadoTransmision === 'regular' && { color: '#f59e0b', fontWeight: 'bold' }, data.estadoTransmision === 'malo' && { color: '#dc2626', fontWeight: 'bold' }]}>
                    {formatFieldName(data.estadoTransmision) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Embrague</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }, data.estadoEmbrague === 'regular' && { color: '#f59e0b', fontWeight: 'bold' }, data.estadoEmbrague === 'malo' && { color: '#dc2626', fontWeight: 'bold' }]}>
                    {formatFieldName(data.estadoEmbrague) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Estado General</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }, data.estadoGeneral === 'regular' && { color: '#f59e0b', fontWeight: 'bold' }, data.estadoGeneral === 'malo' && { color: '#dc2626', fontWeight: 'bold' }]}>
                    {formatFieldName(data.estadoGeneral) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Daño Estructural</Text>
                  <Text style={[styles.dataValue, { fontSize: 8 }, data.danoEstructural && { color: '#dc2626' }]}>
                    {data.danoEstructural ? 'Sí' : 'No'}
                  </Text>
                </View>
              </View>
              {data.danoEstructural && data.danoEstructuralDetalle && (
                <View style={styles.dataItemFull}>
                  <Text style={[styles.dataLabel, { fontSize: 7 }]}>Detalle Daño Estructural</Text>
                  <Text style={[styles.dataValue, { fontSize: 7, color: '#dc2626' }]}>{data.danoEstructuralDetalle}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Observaciones - Ancho completo - SIEMPRE se muestra */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
          {data.observaciones ? (
            <Text style={[styles.dataValue, { fontSize: 8 }]}>{data.observaciones}</Text>
          ) : (
            <Text style={[styles.dataValue, { fontSize: 8, fontStyle: 'italic', color: '#9ca3af' }]}>Vacío</Text>
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
              {logoSrc && (
                <Image 
                  src={logoSrc} 
                  style={styles.footerLogo}
                />
              )}
              <View>
                <Text style={{ fontSize: 7 }}>ID de Tasación: {tasacionId || 'Generando...'}</Text>
                <Text style={{ fontSize: 7, marginTop: 2 }}>
                  Fecha de registro: {formatDate(metadata?.timestamp)}
                </Text>
              </View>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.pageNumber}>Pág. 1 de {getTotalPages(data)}</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* PÁGINA 2: DAÑOS EXTERIORES - SIEMPRE se muestra */}
      <Page size="A4" style={styles.page}>
        {/* Filigrana de fondo */}
        {watermarkSrc && (
          <Image 
            src={watermarkSrc} 
            style={styles.watermark}
          />
        )}
        
        <View style={styles.header}>
          {logoSrc && (
            <Image 
              src={logoSrc} 
              style={styles.headerLogo}
            />
          )}
          <View style={styles.headerLeft}>
            <Text style={styles.title}>DAÑOS EXTERIORES</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DAÑOS EXTERIORES</Text>
          
          {/* Leyenda de colores */}
          <View style={{ 
            flexDirection: 'row', 
            gap: 12, 
            marginBottom: 12,
            padding: 8,
            backgroundColor: '#f9fafb',
            borderRadius: 4,
            border: '1 solid #e5e7eb'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 14, height: 14, backgroundColor: '#22c55e', borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: '#374151', fontWeight: 'bold' }}>Pulir</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 14, height: 14, backgroundColor: '#eab308', borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: '#374151', fontWeight: 'bold' }}>Rayado</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 14, height: 14, backgroundColor: '#f97316', borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: '#374151', fontWeight: 'bold' }}>Golpe</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 14, height: 14, backgroundColor: '#ef4444', borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: '#374151', fontWeight: 'bold' }}>Sustituir</Text>
            </View>
          </View>
          
          {/* Daños agrupados por vista - 2 columnas por fila - TODAS las vistas exteriores */}
          {(() => {
            // Todas las vistas exteriores posibles
            const allExteriorViews = ['frontal', 'lateral_izquierda', 'laterial_derecha', 'trasera']
            
            // Agrupar daños por vista
            const damagesByView: Record<string, typeof data.danosExteriores> = {}
            if (data.danosExteriores) {
              data.danosExteriores.forEach(dano => {
                const vista = dano.vista || 'sin_vista'
                if (!damagesByView[vista]) {
                  damagesByView[vista] = []
                }
                damagesByView[vista].push(dano)
              })
            }
            
            // Asegurar que todas las vistas estén presentes
            allExteriorViews.forEach(vista => {
              if (!damagesByView[vista]) {
                damagesByView[vista] = []
              }
            })
            
            const entries = Object.entries(damagesByView).filter(([vista]) => allExteriorViews.includes(vista))
            const rows = []
            
            // Dividir en filas de 2 columnas
            for (let i = 0; i < entries.length; i += 2) {
              const pair = entries.slice(i, i + 2)
              rows.push(
                <View key={`row-${i}`} style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  {pair.map(([vista, danos]) => (
                    <View key={vista} style={{ 
                      width: '49.5%',
                      padding: 10,
                      backgroundColor: '#f9fafb',
                      borderRadius: 4,
                      border: '1 solid #e5e7eb'
                    }}>
                      {/* Título de la vista */}
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 6 }}>
                        {formatFieldName(vista)}
                      </Text>
                      
                      {/* Lista de daños o mensaje "Sin daños registrados" */}
                      <View style={{ marginBottom: 8 }}>
                        {danos.length > 0 ? (
                          danos.map((dano, index) => (
                            <Text key={index} style={{ fontSize: 8, color: '#374151', marginBottom: 3 }}>
                              • {dano.parte} - {damageTypeLabel[dano.tipo] || capitalize(dano.tipo)}
                            </Text>
                          ))
                        ) : (
                          <Text style={{ fontSize: 8, color: '#9ca3af', fontStyle: 'italic' }}>
                            Sin daños registrados
                          </Text>
                        )}
                      </View>
                      
                      {/* Imagen SVG debajo */}
                      <View style={{ alignItems: 'center' }}>
                        {damageSVGs && damageSVGs[vista] ? (
                          <Image 
                            src={damageSVGs[vista]} 
                            style={{ 
                              width: '100%', 
                              height: 90, 
                              objectFit: 'contain'
                            }}
                          />
                        ) : (
                          <Text style={{ fontSize: 8, color: '#9ca3af', fontStyle: 'italic' }}>
                            Sin imagen
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )
            }
            
            return rows
          })()}
        </View>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <View style={styles.footerLeft}>
                {logoSrc && (
                  <Image 
                    src={logoSrc} 
                    style={styles.footerLogo}
                  />
                )}
                <View>
                  <Text style={{ fontSize: 7 }}>ID de Tasación: {tasacionId || 'Generando...'}</Text>
                  <Text style={{ fontSize: 7, marginTop: 2 }}>
                    Fecha de registro: {formatDate(metadata?.timestamp)}
                  </Text>
                </View>
              </View>
              <View style={styles.footerRight}>
                <Text style={styles.pageNumber}>Pág. 2 de {getTotalPages(data)}</Text>
              </View>
            </View>
          </View>
        </Page>

      {/* PÁGINA 3: DAÑOS INTERIORES - SIEMPRE se muestra */}
      <Page size="A4" style={styles.page}>
        {/* Filigrana de fondo */}
        {watermarkSrc && (
          <Image 
            src={watermarkSrc} 
            style={styles.watermark}
          />
        )}
        
        <View style={styles.header}>
          {logoSrc && (
            <Image 
              src={logoSrc} 
              style={styles.headerLogo}
            />
          )}
          <View style={styles.headerLeft}>
            <Text style={styles.title}>DAÑOS INTERIORES Y OTROS</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DAÑOS INTERIORES</Text>
          
          {/* Leyenda de colores */}
          <View style={{ 
            flexDirection: 'row', 
            gap: 12, 
            marginBottom: 12,
            padding: 8,
            backgroundColor: '#f9fafb',
            borderRadius: 4,
            border: '1 solid #e5e7eb'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 14, height: 14, backgroundColor: '#22c55e', borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: '#374151', fontWeight: 'bold' }}>Pulir</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 14, height: 14, backgroundColor: '#eab308', borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: '#374151', fontWeight: 'bold' }}>Rayado</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 14, height: 14, backgroundColor: '#f97316', borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: '#374151', fontWeight: 'bold' }}>Golpe</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 14, height: 14, backgroundColor: '#ef4444', borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: '#374151', fontWeight: 'bold' }}>Sustituir</Text>
            </View>
          </View>
          
          {/* Daños agrupados por vista - 2 columnas por fila - TODAS las vistas interiores */}
          {(() => {
            // Todas las vistas interiores posibles
            const allInteriorViews = ['interior_salpicadero', 'interior_delantero_izquierda', 'interior_trasera_izquierda', 'interior_maletero']
            
            // Agrupar daños por vista
            const damagesByView: Record<string, typeof data.danosInteriores> = {}
            if (data.danosInteriores) {
              data.danosInteriores.forEach(dano => {
                const vista = dano.vista || 'sin_vista'
                if (!damagesByView[vista]) {
                  damagesByView[vista] = []
                }
                damagesByView[vista].push(dano)
              })
            }
            
            // Asegurar que todas las vistas estén presentes
            allInteriorViews.forEach(vista => {
              if (!damagesByView[vista]) {
                damagesByView[vista] = []
              }
            })
            
            const entries = Object.entries(damagesByView).filter(([vista]) => allInteriorViews.includes(vista))
            const rows = []
            
            // Dividir en filas de 2 columnas
            for (let i = 0; i < entries.length; i += 2) {
              const pair = entries.slice(i, i + 2)
              rows.push(
                <View key={`row-${i}`} style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  {pair.map(([vista, danos]) => (
                    <View key={vista} style={{ 
                      width: '49.5%',
                      padding: 10,
                      backgroundColor: '#f9fafb',
                      borderRadius: 4,
                      border: '1 solid #e5e7eb'
                    }}>
                      {/* Título de la vista */}
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 6 }}>
                        {formatFieldName(vista)}
                      </Text>
                      
                      {/* Lista de daños o mensaje "Sin daños registrados" */}
                      <View style={{ marginBottom: 8 }}>
                        {danos.length > 0 ? (
                          danos.map((dano, index) => (
                            <Text key={index} style={{ fontSize: 8, color: '#374151', marginBottom: 3 }}>
                              • {dano.parte} - {damageTypeLabel[dano.tipo] || capitalize(dano.tipo)}
                            </Text>
                          ))
                        ) : (
                          <Text style={{ fontSize: 8, color: '#9ca3af', fontStyle: 'italic' }}>
                            Sin daños registrados
                          </Text>
                        )}
                      </View>
                      
                      {/* Imagen SVG debajo */}
                      <View style={{ alignItems: 'center' }}>
                        {damageSVGs && damageSVGs[vista] ? (
                          <Image 
                            src={damageSVGs[vista]} 
                            style={{ 
                              width: '100%', 
                              height: 90, 
                              objectFit: 'contain'
                            }}
                          />
                        ) : (
                          <Text style={{ fontSize: 8, color: '#9ca3af', fontStyle: 'italic' }}>
                            Sin imagen
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )
            }
            
            return rows
          })()}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerLeft}>
              {logoSrc && (
                <Image 
                  src={logoSrc} 
                  style={styles.footerLogo}
                />
              )}
              <View>
                <Text style={{ fontSize: 7 }}>ID de Tasación: {tasacionId || 'Sin ID'}</Text>
                <Text style={{ fontSize: 7, marginTop: 2 }}>
                  Fecha de registro: {formatDate(metadata?.timestamp)}
                </Text>
              </View>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.pageNumber}>Pág. 3 de {getTotalPages(data)}</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* PÁGINAS DE FOTOGRAFÍAS */}
      {renderPhotoPages(data, tasacionId, metadata, logoSrc)}

      {/* PÁGINA FINAL: CERTIFICADO */}
      <Page size="A4" style={styles.certificatePage}>
        {/* Fondo decorativo con formas geométricas */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
        }}>
          {/* Círculo superior derecho */}
          <View style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: '#e0e7ff',
            opacity: 0.3,
          }} />
          
          {/* Círculo inferior izquierdo */}
          <View style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 250,
            height: 250,
            borderRadius: 125,
            backgroundColor: '#fce7f3',
            opacity: 0.3,
          }} />
          
          {/* Círculo inferior derecho */}
          <View style={{
            position: 'absolute',
            bottom: 100,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: '#ddd6fe',
            opacity: 0.25,
          }} />
          
          {/* Círculo superior izquierdo */}
          <View style={{
            position: 'absolute',
            top: 150,
            left: -40,
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: '#e0e7ff',
            opacity: 0.2,
          }} />
          
          {/* Línea decorativa superior */}
          <View style={{
            position: 'absolute',
            top: 250,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: '#c7d2fe',
            opacity: 0.2,
          }} />
          
          {/* Línea decorativa inferior */}
          <View style={{
            position: 'absolute',
            bottom: 250,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: '#fbcfe8',
            opacity: 0.2,
          }} />
        </View>
        
        {/* Filigrana de fondo */}
        {watermarkSrc && (
          <Image 
            src={watermarkSrc} 
            style={styles.watermark}
          />
        )}
        
        <View style={styles.certificateHeader}>
          <Text style={styles.certificateTitle}>CERTIFICADO DE AUTENTICIDAD</Text>
          <Text style={styles.certificateSubtitle}>Datos de Verificación del Cliente</Text>
        </View>

        <View style={styles.certificateContent}>
          <Text style={{ fontSize: 9, color: '#374151', lineHeight: 1.5, marginBottom: 12 }}>
            Este documento certifica que la información contenida en el presente informe de tasación ha sido 
            proporcionada directamente por el cliente a través del Portal de Tasaciones, con los siguientes 
            datos de verificación:
          </Text>

          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 6 }}>
            Datos de Registro:
          </Text>
          <Text style={{ fontSize: 8, color: '#374151', marginBottom: 3 }}>
            • Fecha y hora: {formatDate(metadata?.timestamp)}
          </Text>
          {metadata?.ip && (
            <Text style={{ fontSize: 8, color: '#374151', marginBottom: 3 }}>
              • Dirección IP: {metadata.ip}
            </Text>
          )}
          {metadata?.geolocalizacion && (
            <Text style={{ fontSize: 8, color: '#374151', marginBottom: 3 }}>
              • Geolocalización: Lat {metadata.geolocalizacion.latitude.toFixed(6)}, Lon {metadata.geolocalizacion.longitude.toFixed(6)}
            </Text>
          )}

          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginTop: 12, marginBottom: 6 }}>
            Información del Dispositivo:
          </Text>
          {metadata?.dispositivo?.platform && (
            <Text style={{ fontSize: 8, color: '#374151', marginBottom: 3 }}>
              • Plataforma: {metadata.dispositivo.platform}
            </Text>
          )}
          {metadata?.dispositivo?.idioma && (
            <Text style={{ fontSize: 8, color: '#374151', marginBottom: 3 }}>
              • Idioma: {metadata.dispositivo.idioma}
            </Text>
          )}
          {metadata?.dispositivo?.userAgent && (
            <Text style={{ fontSize: 7, color: '#374151', marginBottom: 3 }}>
              • User Agent: {metadata.dispositivo.userAgent}
            </Text>
          )}

          <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 12, lineHeight: 1.4, fontStyle: 'italic' }}>
            Los datos registrados en este documento son responsabilidad del cliente y han sido capturados 
            mediante sistemas automatizados de verificación para garantizar su autenticidad e integridad.
          </Text>

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
              ID de Tasación: {tasacionId || 'Sin ID'}
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
          
          <Text style={{ fontSize: 7, color: '#78350f', lineHeight: 1.4, marginBottom: 4 }}>
            El tratamiento de los datos (nombre del titular y documentación del vehículo) se ha realizado por CVO con la única 
            y exclusiva finalidad de elaborar esta tasación, basándose en su consentimiento y en los datos facilitados de forma 
            voluntaria.
          </Text>
          
          <Text style={{ fontSize: 7, color: '#78350f', lineHeight: 1.4, marginBottom: 4 }}>
            Le recordamos que, de acuerdo con nuestra Política de Privacidad, sus datos personales y la documentación del 
            vehículo serán borrados y eliminados automáticamente de nuestros sistemas al cumplirse tres (3) meses desde la 
            fecha de emisión de este informe.
          </Text>
          
          <Text style={{ fontSize: 7, color: '#78350f', lineHeight: 1.4 }}>
            Usted puede ejercer sus derechos de Acceso, Rectificación, Supresión, Oposición y Limitación del tratamiento, así como 
            solicitar la baja de sus datos, contactando con CVO en el correo electrónico hola@controlvo.ovh.
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
  let pages = 1 // Página 1 (datos compactos en 2 columnas)
  
  // Página 2: Daños exteriores (SIEMPRE existe)
  pages += 1
  
  // Página 3: Daños interiores (SIEMPRE existe)
  pages += 1
  
  // Contar fotos reales
  let totalPhotos = 0
  
  // Fotos del vehículo
  if (data.fotosVehiculo) {
    totalPhotos += Object.values(data.fotosVehiculo).filter(Boolean).length
  }
  
  // Cuentakm
  if (data.fotosCuentakm) totalPhotos++
  
  // Interior delantero
  if (data.fotosInteriorDelantero) totalPhotos++
  
  // Interior trasero
  if (data.fotosInteriorTrasero) totalPhotos++
  
  // Fotos de documentación
  if (data.fotosDocumentacion) {
    if (data.fotosDocumentacion.permisoCirculacionFrente) totalPhotos++
    if (data.fotosDocumentacion.permisoCirculacionDorso) totalPhotos++
    if (data.fotosDocumentacion.fichaTecnicaFrente) totalPhotos++
    if (data.fotosDocumentacion.fichaTecnicaDorso) totalPhotos++
  }
  
  // Otras fotos
  if (data.fotosOtras && data.fotosOtras.length > 0) {
    totalPhotos += data.fotosOtras.length
  }
  
  // Página de fotos (SIEMPRE existe, aunque sea con placeholder)
  // Si hay fotos: cada 6 fotos = 1 página
  // Si NO hay fotos: 1 página con placeholder
  if (totalPhotos > 0) {
    pages += Math.ceil(totalPhotos / 6)
  } else {
    pages += 1 // Página con placeholder "Sin fotografías"
  }
  
  // Página final (certificado)
  pages += 1
  
  return pages
}

// Función auxiliar para calcular el número de página de inicio de fotos
function getPhotoStartPage(data: TasacionFormData): number {
  // Página 1 siempre existe
  // Página 2 siempre existe (daños exteriores)
  // Página 3 siempre existe (daños interiores)
  // Las fotos empiezan en página 4 (después de página 3)
  return 3
}

// Función para renderizar páginas de fotografías
function renderPhotoPages(data: TasacionFormData, tasacionId?: string, metadata?: any, logoSrc?: string) {
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
  
  // Si no hay fotos, generar UNA página con placeholders
  if (photos.length === 0) {
    const photoStartPage = getPhotoStartPage(data)
    return (
      <Page size="A4" style={styles.photoPage}>
        <View style={styles.header}>
          {logoSrc && (
            <Image 
              src={logoSrc} 
              style={styles.headerLogo}
            />
          )}
          <View style={styles.headerLeft}>
            <Text style={styles.title}>FOTOGRAFÍAS</Text>
          </View>
        </View>
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ 
            padding: 40, 
            backgroundColor: '#f9fafb', 
            borderRadius: 8, 
            border: '2 dashed #d1d5db',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 48, color: '#d1d5db', marginBottom: 10 }}>📷</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
              Sin fotografías
            </Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerLeft}>
              {logoSrc && (
                <Image 
                  src={logoSrc} 
                  style={styles.footerLogo}
                />
              )}
              <View>
                <Text style={{ fontSize: 7 }}>ID de Tasación: {tasacionId || 'Generando...'}</Text>
                <Text style={{ fontSize: 7, marginTop: 2 }}>
                  Fecha de registro: {metadata?.timestamp ? new Date(metadata.timestamp).toLocaleDateString('es-ES') : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.pageNumber}>Pág. {photoStartPage + 1} de {getTotalPages(data)}</Text>
            </View>
          </View>
        </View>
      </Page>
    )
  }
  
  // Calcular número de página inicial para fotos
  const photoStartPage = getPhotoStartPage(data)
  
  // Dividir fotos en páginas de 6
  const pages = []
  for (let i = 0; i < photos.length; i += 6) {
    const pagePhotos = photos.slice(i, i + 6)
    const currentPhotoPage = Math.floor(i / 6)
    const absolutePageNumber = photoStartPage + currentPhotoPage + 1
    
    pages.push(
      <Page key={`photo-page-${i}`} size="A4" style={styles.photoPage}>
        <View style={styles.header}>
          {logoSrc && (
            <Image 
              src={logoSrc} 
              style={styles.headerLogo}
            />
          )}
          <View style={styles.headerLeft}>
            <Text style={styles.title}>FOTOGRAFÍAS</Text>
          </View>
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
              {logoSrc && (
                <Image 
                  src={logoSrc} 
                  style={styles.footerLogo}
                />
              )}
              <View>
                <Text style={{ fontSize: 7 }}>ID de Tasación: {tasacionId || 'Generando...'}</Text>
                <Text style={{ fontSize: 7, marginTop: 2 }}>
                  Fecha de registro: {metadata?.timestamp ? new Date(metadata.timestamp).toLocaleDateString('es-ES') : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.pageNumber}>Pág. {absolutePageNumber} de {getTotalPages(data)}</Text>
            </View>
          </View>
        </View>
      </Page>
    )
  }
  
  return pages
}

export default TasacionPDF


