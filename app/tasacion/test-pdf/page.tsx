'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { pdf } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Test simple del PDF
const TestDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>TEST PDF</Text>
        <Text>Este es un test simple del PDF</Text>
      </View>
    </Page>
  </Document>
)

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#E4E4E4'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20
  }
})

export default function TestPDFPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTestPDF = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      console.log('Iniciando test de PDF...')
      
      // Test 1: Crear el documento
      console.log('Creando documento...')
      const doc = TestDocument()
      console.log('Documento creado:', doc)
      
      // Test 2: Generar blob
      console.log('Generando blob...')
      const blob = await pdf(doc).toBlob()
      console.log('Blob generado:', blob)
      console.log('Tamaño del blob:', blob.size)
      
      // Test 3: Crear descarga
      console.log('Creando descarga...')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'test.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('Test completado exitosamente')
      
    } catch (error) {
      console.error('Error en test:', error)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Generación de PDF</h1>
      
      <Button 
        onClick={handleTestPDF}
        disabled={isGenerating}
        className="mb-4"
      >
        {isGenerating ? 'Generando...' : 'Test PDF Simple'}
      </Button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Este test verifica si @react-pdf/renderer funciona correctamente.</p>
        <p>Revisa la consola del navegador para ver los logs detallados.</p>
      </div>
    </div>
  )
}






