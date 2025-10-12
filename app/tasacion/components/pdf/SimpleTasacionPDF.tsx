'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { TasacionFormData } from '@/types/tasacion'

// Estilos simples para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '3 solid #8b5cf6',
    paddingBottom: 15,
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
  dataRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    width: 120,
  },
  value: {
    fontSize: 10,
    color: '#6b7280',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
})

interface SimpleTasacionPDFProps {
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

export default function SimpleTasacionPDF({ data, metadata }: SimpleTasacionPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INFORME DE TASACIÓN DE VEHÍCULO</Text>
          <Text style={styles.subtitle}>
            Portal de Tasaciones - {new Date().toLocaleDateString('es-ES')}
          </Text>
        </View>

        {/* Datos Básicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS BÁSICOS DEL VEHÍCULO</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Matrícula:</Text>
            <Text style={styles.value}>{data.matricula || 'No especificada'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Kilómetros:</Text>
            <Text style={styles.value}>{data.kmActuales?.toLocaleString() || 'No especificados'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Procedencia:</Text>
            <Text style={styles.value}>{data.procedencia || 'No especificada'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Fecha matriculación:</Text>
            <Text style={styles.value}>{data.fechaMatriculacion || 'No especificada'}</Text>
          </View>
        </View>

        {/* Marca y Modelo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MARCA, MODELO Y VERSIÓN</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Marca:</Text>
            <Text style={styles.value}>{data.marca || 'No especificada'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Modelo:</Text>
            <Text style={styles.value}>{data.modelo || 'No especificado'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Versión:</Text>
            <Text style={styles.value}>{data.version || 'No especificada'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Combustible:</Text>
            <Text style={styles.value}>{data.combustible || 'No especificado'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Transmisión:</Text>
            <Text style={styles.value}>{data.transmision || 'No especificada'}</Text>
          </View>
        </View>

        {/* Estado Mecánico */}
        {data.estadoMotor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ESTADO MECÁNICO</Text>
            
            <View style={styles.dataRow}>
              <Text style={styles.label}>Motor:</Text>
              <Text style={styles.value}>{data.estadoMotor}</Text>
            </View>
            
            <View style={styles.dataRow}>
              <Text style={styles.label}>Dirección:</Text>
              <Text style={styles.value}>{data.estadoDireccion || 'No especificado'}</Text>
            </View>
            
            <View style={styles.dataRow}>
              <Text style={styles.label}>Frenos:</Text>
              <Text style={styles.value}>{data.estadoFrenos || 'No especificado'}</Text>
            </View>
            
            <View style={styles.dataRow}>
              <Text style={styles.label}>Caja de cambios:</Text>
              <Text style={styles.value}>{data.estadoCaja || 'No especificado'}</Text>
            </View>
          </View>
        )}

        {/* Datos Adicionales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS ADICIONALES</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Origen:</Text>
            <Text style={styles.value}>{data.origenVehiculo || 'No especificado'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Color:</Text>
            <Text style={styles.value}>{data.color || 'No especificado'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>Etiqueta ambiental:</Text>
            <Text style={styles.value}>{data.etiquetaMedioambiental || 'No especificada'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>ITV en vigor:</Text>
            <Text style={styles.value}>{data.itvEnVigor ? 'Sí' : 'No'}</Text>
          </View>
          
          {data.proximaITV && (
            <View style={styles.dataRow}>
              <Text style={styles.label}>Próxima ITV:</Text>
              <Text style={styles.value}>{data.proximaITV}</Text>
            </View>
          )}
        </View>

        {/* Metadata si está disponible */}
        {metadata && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMACIÓN DE VERIFICACIÓN</Text>
            
            {metadata.timestamp && (
              <View style={styles.dataRow}>
                <Text style={styles.label}>Fecha de envío:</Text>
                <Text style={styles.value}>{new Date(metadata.timestamp).toLocaleString('es-ES')}</Text>
              </View>
            )}
            
            {metadata.ip && (
              <View style={styles.dataRow}>
                <Text style={styles.label}>Dirección IP:</Text>
                <Text style={styles.value}>{metadata.ip}</Text>
              </View>
            )}
            
            {metadata.geolocalizacion && (
              <View style={styles.dataRow}>
                <Text style={styles.label}>Ubicación:</Text>
                <Text style={styles.value}>
                  {metadata.geolocalizacion.latitude}, {metadata.geolocalizacion.longitude}
                </Text>
              </View>
            )}
            
            {metadata.dispositivo && (
              <View style={styles.dataRow}>
                <Text style={styles.label}>Dispositivo:</Text>
                <Text style={styles.value}>{metadata.dispositivo.platform}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Este documento ha sido generado automáticamente por el Portal de Tasaciones
          </Text>
        </View>
      </Page>
    </Document>
  )
}
