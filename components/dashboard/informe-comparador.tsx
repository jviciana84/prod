"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"
import { 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  Target,
  BarChart3,
  FileText
} from "lucide-react"

interface InformeComparadorProps {
  open: boolean
  onClose: () => void
  vehiculos: any[]
  stats: any
  filter: string
}

export function InformeComparador({ open, onClose, vehiculos, stats, filter }: InformeComparadorProps) {
  
  // Agregar estilos para impresión
  useEffect(() => {
    if (open) {
      const style = document.createElement('style')
      style.id = 'print-styles'
      style.textContent = `
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          [role="dialog"] {
            position: static !important;
            max-width: 100% !important;
            max-height: 100% !important;
            overflow: visible !important;
          }
          [role="dialog"] * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print\\:break-before {
            page-break-before: always;
            break-before: page;
          }
        }
      `
      document.head.appendChild(style)
      
      return () => {
        const existing = document.getElementById('print-styles')
        if (existing) existing.remove()
      }
    }
  }, [open])

  // Función para generar PDF COMPLETO Y PROFESIONAL
  const handlePrint = async () => {
    try {
      // Importaciones dinámicas
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)
      
      const estadisticas = calcularEstadisticas()
      if (!estadisticas) return
      
      // Generar código único CVO
      const ahora = new Date()
      const codigoCVO = `CVO-${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}-${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}${String(ahora.getSeconds()).padStart(2, '0')}`
      const fechaCompleta = ahora.toLocaleString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      // Función auxiliar para añadir marca de agua lateral y footer
      const addWatermarkAndFooter = (pageNum: number, totalPages: number) => {
        // Marca de agua lateral (texto vertical) - OFICIAL
        pdf.setTextColor(180, 180, 180)
        pdf.setFontSize(7)
        pdf.text(`Documento CVO creado ${fechaCompleta} por Jordi Viciana - Ref: ${codigoCVO}`, 5, pageHeight / 2, {
          angle: 90,
          align: 'center'
        })
        
        // Footer OFICIAL
        pdf.setTextColor(80, 80, 80)
        pdf.setFontSize(7)
        pdf.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        pdf.setFontSize(6)
        pdf.text('Datos de Quadis Munich extraídos mediante duc_scraper | Competencia: comparador_scraper', pageWidth / 2, pageHeight - 6, { align: 'center' })
        pdf.setFontSize(5.5)
        pdf.text('© CVO (Comparador de Vehículos de Ocasión) - Propiedad de Jordi Viciana | Análisis desarrollado para Quadis Munich', pageWidth / 2, pageHeight - 3, { align: 'center' })
      }
      
      // ============== PÁGINA 1: PORTADA OFICIAL ==============
      pdf.setFillColor(30, 41, 59)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')
      
      // Logo CVO (simulado - texto grande)
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(52)
      pdf.setFont('helvetica', 'bold')
      pdf.text('CVO', pageWidth / 2, 55, { align: 'center' })
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('COMPARADOR DE VEHÍCULOS DE OCASIÓN', pageWidth / 2, 65, { align: 'center' })
      
      pdf.setFontSize(7)
      pdf.text('Propiedad de Jordi Viciana', pageWidth / 2, 72, { align: 'center' })
      
      // Línea decorativa
      pdf.setDrawColor(255, 255, 255)
      pdf.setLineWidth(0.5)
      pdf.line(40, 80, pageWidth - 40, 80)
      
      // Título principal
      pdf.setFontSize(32)
      pdf.setFont('helvetica', 'bold')
      pdf.text('INFORME EJECUTIVO', pageWidth / 2, 105, { align: 'center' })
      
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Análisis Competitivo de Precios', pageWidth / 2, 120, { align: 'center' })
      
      // Cliente
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('QUADIS MUNICH', pageWidth / 2, 140, { align: 'center' })
      
      // Código y fecha
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Referencia: ${codigoCVO}`, pageWidth / 2, 155, { align: 'center' })
      pdf.setFontSize(9)
      pdf.text(fechaCompleta, pageWidth / 2, 163, { align: 'center' })
      
      // Línea decorativa
      pdf.line(40, 175, pageWidth - 40, 175)
      
      // Info autor y propiedad
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Elaborado por:', pageWidth / 2, 190, { align: 'center' })
      pdf.setFont('helvetica', 'normal')
      pdf.text('Jordi Viciana', pageWidth / 2, 198, { align: 'center' })
      
      pdf.setFontSize(7)
      pdf.text('Análisis desarrollado con Sistema CVO para Quadis Munich', pageWidth / 2, 215, { align: 'center' })
      
      // Copyright en footer portada
      pdf.setFontSize(6)
      pdf.setTextColor(200, 200, 200)
      pdf.text('© CVO - Comparador de Vehículos de Ocasión | Propiedad de Jordi Viciana', pageWidth / 2, pageHeight - 15, { align: 'center' })
      pdf.text('Documento confidencial - Uso exclusivo de Quadis Munich', pageWidth / 2, pageHeight - 10, { align: 'center' })
      
      // ============== PÁGINA 2: RESUMEN EJECUTIVO ==============
      pdf.addPage()
      let yPos = margin
      
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('1. RESUMEN EJECUTIVO', margin, yPos)
      yPos += 12
      
      // KPIs en recuadros
      pdf.setFontSize(10)
      const kpis = [
        ['Vehículos Analizados', vehiculosFiltrados.length.toString()],
        ['Precio Promedio', `${estadisticas.precioPromedio.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€`],
        ['KM Promedio', `${estadisticas.kmPromedio.toLocaleString('es-ES', { maximumFractionDigits: 0 })} km`],
        ['Días Stock Promedio', `${estadisticas.diasStockPromedio.toFixed(0)} días`],
        ['Mejor Opción (más barato)', `${estadisticas.mejorOpcion} (${((estadisticas.mejorOpcion / vehiculosFiltrados.length) * 100).toFixed(1)}%)`],
        ['Opción Media', `${estadisticas.opcionMedia} (${((estadisticas.opcionMedia / vehiculosFiltrados.length) * 100).toFixed(1)}%)`],
        ['Peor Opción (más caro)', `${estadisticas.peorOpcion} (${((estadisticas.peorOpcion / vehiculosFiltrados.length) * 100).toFixed(1)}%)`],
      ]
      
      pdf.setDrawColor(200, 200, 200)
      pdf.setFont('helvetica', 'normal')
      kpis.forEach(([label, value]) => {
        pdf.rect(margin, yPos - 5, contentWidth, 10)
        pdf.setFont('helvetica', 'bold')
        pdf.text(label + ':', margin + 2, yPos)
        pdf.setFont('helvetica', 'normal')
        pdf.text(value, margin + 85, yPos)
        yPos += 12
      })
      
      yPos += 5
      
      // Posicionamiento
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('1.1 Análisis de Posicionamiento', margin, yPos)
      yPos += 10
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const posText = `Posición vs Mercado: ${stats.posicionGeneral > 0 ? `+${stats.posicionGeneral.toFixed(1)}%` : `${stats.posicionGeneral.toFixed(1)}%`} ${stats.posicionGeneral > 3 ? '(ALTO)' : stats.posicionGeneral < -3 ? '(COMPETITIVO)' : '(NEUTRO)'}`
      pdf.text(posText, margin + 3, yPos)
      yPos += 7
      pdf.text(`• Vehículos Competitivos: ${estadisticas.competitivos} (${((estadisticas.competitivos / vehiculosFiltrados.length) * 100).toFixed(0)}%)`, margin + 3, yPos)
      yPos += 7
      pdf.text(`• Vehículos Precio Alto: ${estadisticas.altos} (${((estadisticas.altos / vehiculosFiltrados.length) * 100).toFixed(0)}%)`, margin + 3, yPos)
      yPos += 7
      pdf.text(`• Vehículos +90 días: ${estadisticas.masDe90d}`, margin + 3, yPos)
      yPos += 12
      
      // Objetivos estratégicos
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('1.2 Objetivos Estratégicos', margin, yPos)
      yPos += 10
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      const objetivos = [
        'Maximizar la competitividad de precios manteniendo márgenes rentables',
        'Reducir el tiempo promedio en stock por debajo de 60 días',
        'Posicionar el 80% del inventario como "competitivo" o "mejor opción"',
        'Identificar y ajustar rápidamente vehículos con precio alto',
        'Monitorizar continuamente los precios de la competencia'
      ]
      
      objetivos.forEach((obj, idx) => {
        const lines = pdf.splitTextToSize(`${idx + 1}. ${obj}`, contentWidth - 10)
        lines.forEach((line: string) => {
          pdf.text(line, margin + 3, yPos)
          yPos += 5
        })
        yPos += 2
      })
      
      addWatermarkAndFooter(2, 10) // Placeholder total pages
      
      // ============== PÁGINA 3: RANKINGS TOP ==============
      pdf.addPage()
      yPos = margin
      
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('2. RANKINGS Y ANÁLISIS', margin, yPos)
      yPos += 12
      
      // Top 5 Más Caros
      pdf.setFontSize(12)
      pdf.text('2.1 Top 5 Más Caros', margin, yPos)
      yPos += 8
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      const masCaros = [...vehiculosFiltrados].sort((a, b) => (b.nuestroPrecio || 0) - (a.nuestroPrecio || 0)).slice(0, 5)
      masCaros.forEach((v, idx) => {
        const precio = (v.nuestroPrecio || 0).toLocaleString('es-ES')
        const km = (v.km || 0).toLocaleString('es-ES')
        pdf.text(`${idx + 1}. ${v.matricula || 'N/A'} - ${v.modelo || 'N/A'} - ${precio}€ (${km} km)`, margin + 3, yPos)
        yPos += 5
      })
      yPos += 5
      
      // Top 5 Más Baratos
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('2.2 Top 5 Más Baratos', margin, yPos)
      yPos += 8
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      const masBaratos = [...vehiculosFiltrados].sort((a, b) => (a.nuestroPrecio || 0) - (b.nuestroPrecio || 0)).slice(0, 5)
      masBaratos.forEach((v, idx) => {
        const precio = (v.nuestroPrecio || 0).toLocaleString('es-ES')
        const km = (v.km || 0).toLocaleString('es-ES')
        pdf.text(`${idx + 1}. ${v.matricula || 'N/A'} - ${v.modelo || 'N/A'} - ${precio}€ (${km} km)`, margin + 3, yPos)
        yPos += 5
      })
      yPos += 5
      
      // Top 5 Mejor Posicionados
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('2.3 Top 5 Mejor Posicionados (Mejor Valor)', margin, yPos)
      yPos += 8
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      const mejorPosicionados = [...vehiculosFiltrados].sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 5)
      mejorPosicionados.forEach((v, idx) => {
        const score = (v.score || 0).toFixed(2)
        const precio = (v.nuestroPrecio || 0).toLocaleString('es-ES')
        pdf.text(`${idx + 1}. ${v.matricula || 'N/A'} - ${v.modelo || 'N/A'} - Score: ${score} - ${precio}€`, margin + 3, yPos)
        yPos += 5
      })
      yPos += 5
      
      // Top 5 Más Tiempo en Stock
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('2.4 Top 5 Más Tiempo en Stock', margin, yPos)
      yPos += 8
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      const masTiempoStock = [...vehiculosFiltrados].sort((a, b) => (b.diasEnStock || 0) - (a.diasEnStock || 0)).slice(0, 5)
      masTiempoStock.forEach((v, idx) => {
        const dias = v.diasEnStock || 0
        const precio = (v.nuestroPrecio || 0).toLocaleString('es-ES')
        pdf.text(`${idx + 1}. ${v.matricula || 'N/A'} - ${v.modelo || 'N/A'} - ${dias} días - ${precio}€`, margin + 3, yPos)
        yPos += 5
      })
      
      addWatermarkAndFooter(3, 10)
      
      // ============== PÁGINA 4: METODOLOGÍA ==============
      pdf.addPage()
      yPos = margin
      
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('3. METODOLOGÍA DEL ANÁLISIS', margin, yPos)
      yPos += 12
      
      // Nota de propiedad
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin, yPos - 3, contentWidth, 22, 'F')
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'bold')
      pdf.text('NOTA LEGAL:', margin + 2, yPos + 2)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(6.5)
      const notaLegal = 'Este análisis ha sido desarrollado por CVO (Comparador de Vehículos de Ocasión), sistema propiedad de Jordi Viciana, específicamente para uso de Quadis Munich. Los datos, algoritmos y metodología son propiedad intelectual de CVO. Uso confidencial y exclusivo del cliente autorizado.'
      const notaLines = pdf.splitTextToSize(notaLegal, contentWidth - 6)
      notaLines.forEach((line: string, idx: number) => {
        pdf.text(line, margin + 2, yPos + 7 + (idx * 4))
      })
      yPos += 28
      
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('3.1 Fuentes de Datos', margin, yPos)
      yPos += 8
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      const fuentes = [
        'FUENTE PRINCIPAL - duc_scraper:',
        '  Datos de vehículos de Quadis Munich',
        '  - Campos: Matrícula, modelo, año, kilómetros, precio, fecha publicación',
        '  - Actualización: Automática mediante scraper CVO',
        '  - Frecuencia: Tiempo real',
        '',
        'FUENTE SECUNDARIA - comparador_scraper:',
        '  Datos de mercado competidor',
        '  - Concesionarios monitorizados: 8 principales competidores',
        '  - Campos: Precio, KM, modelo, año, concesionario, fecha',
        '  - Actualización: Diaria automática',
        '  - Cobertura: Mercado de ocasión BMW/MINI región Barcelona'
      ]
      
      fuentes.forEach(linea => {
        pdf.text(linea, margin + 3, yPos)
        yPos += 5
      })
      yPos += 5
      
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('3.2 Algoritmo de Valoración', margin, yPos)
      yPos += 8
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      const algoritmo = [
        'ALGORITMO PROPIETARIO CVO v2.0',
        '',
        '1. Cálculo del Valor Esperado Normalizado:',
        '   Fórmula: Valor = PrecioNuevo × (1 - DepAnual × Años) - (KM × CostePorKm)',
        '   Parámetros configurables:',
        '   - Tasa depreciación anual: 15% (estándar mercado premium)',
        '   - Coste por kilómetro: 0.10€/km (ajustado mercado ocasión)',
        '   - Precio nuevo base: Extraído de histórico CVO',
        '',
        '2. Score de Posicionamiento Competitivo:',
        '   Fórmula: Score = ((PrecioReal - ValorEsperado) / ValorEsperado) × 100',
        '   Interpretación:',
        '   - Score < -10%: Oportunidad excepcional (infravalorado)',
        '   - Score -10% a -3%: Muy competitivo',
        '   - Score -3% a +3%: Competitivo (rango óptimo)',
        '   - Score +3% a +10%: Precio alto (revisar)',
        '   - Score > +10%: Precio muy alto (acción urgente)',
        '',
        '3. Clasificación Multi-dimensional:',
        '   A. Por score normalizado:',
        '      • Competitivo: |Score| < 3%',
        '      • Alto: Score > 3%',
        '   B. Por posición en categoría:',
        '      • Mejor Opción: Precio más bajo en su segmento',
        '      • Opción Media: Rango intermedio de precios',
        '      • Peor Opción: Precio más alto en su segmento',
        '',
        '4. Ajuste Dinámico por Días en Stock:',
        '   Criterios temporales CVO:',
        '   - Stock 0-30 días: Sin ajuste (precio óptimo)',
        '   - Stock 31-60 días: Monitorización activa',
        '   - Stock 61-90 días: Recomendar ajuste -5% si no competitivo',
        '   - Stock >90 días: URGENTE - Ajuste -8% a -10% recomendado',
        '',
        '5. Comparación con Mercado Real:',
        '   - Comparación directa con competidores activos',
        '   - Ajuste por diferencias de kilometraje entre vehículos',
        '   - Análisis de tendencias de precios en tiempo real',
        '   - Identificación de outliers y oportunidades'
      ]
      
      algoritmo.forEach(linea => {
        const lines = pdf.splitTextToSize(linea, contentWidth - 10)
        lines.forEach((line: string) => {
          if (yPos > pageHeight - 30) {
            pdf.addPage()
            addWatermarkAndFooter(4, 10)
            yPos = margin
          }
          pdf.text(line, margin + 3, yPos)
          yPos += 4.5
        })
      })
      
      addWatermarkAndFooter(4, 10)
      
      // ============== PÁGINA 5: RECOMENDACIONES ==============
      pdf.addPage()
      yPos = margin
      
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('4. RECOMENDACIONES ESTRATÉGICAS', margin, yPos)
      yPos += 12
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      
      const recomendaciones: string[] = []
      
      if (estadisticas.altos > 0) {
        recomendaciones.push(`⚠️ URGENTE: ${estadisticas.altos} vehículos con precios altos (${((estadisticas.altos / vehiculosFiltrados.length) * 100).toFixed(0)}% del stock). Acción inmediata necesaria para mejorar competitividad y reducir días en stock.`)
      }
      
      if (estadisticas.masDe90d > 0) {
        recomendaciones.push(`⏰ CRÍTICO: ${estadisticas.masDe90d} vehículos llevan más de 90 días en stock. Riesgo de pérdida de valor. Recomendación: Descuentos del 8-10% o estrategias de marketing agresivas.`)
      }
      
      if (estadisticas.peorOpcion > vehiculosFiltrados.length * 0.15) {
        recomendaciones.push(`🔴 ATENCIÓN: ${estadisticas.peorOpcion} vehículos (${((estadisticas.peorOpcion / vehiculosFiltrados.length) * 100).toFixed(0)}%) son los MÁS CAROS de su categoría en el mercado. Revisión completa de pricing necesaria.`)
      }
      
      if (estadisticas.competitivos > vehiculosFiltrados.length * 0.6) {
        recomendaciones.push(`✅ POSITIVO: ${((estadisticas.competitivos / vehiculosFiltrados.length) * 100).toFixed(0)}% de vehículos tienen precios competitivos. Mantener estrategia actual y monitorizar continuamente.`)
      } else {
        recomendaciones.push(`⚡ OPORTUNIDAD: Solo ${((estadisticas.competitivos / vehiculosFiltrados.length) * 100).toFixed(0)}% son competitivos. Potencial de mejora significativo ajustando precios en base al análisis.`)
      }
      
      if (estadisticas.mejorOpcion > 0) {
        recomendaciones.push(`🏆 FORTALEZA: ${estadisticas.mejorOpcion} vehículos (${((estadisticas.mejorOpcion / vehiculosFiltrados.length) * 100).toFixed(0)}%) son la MEJOR OPCIÓN del mercado. Potenciar su visibilidad en marketing.`)
      }
      
      recomendaciones.push(`📊 Posición General: ${stats.posicionGeneral > 0 ? '+' : ''}${stats.posicionGeneral.toFixed(1)}% vs mercado. ${stats.posicionGeneral > 5 ? 'Necesario reposicionamiento.' : stats.posicionGeneral < -3 ? 'Excelente posicionamiento competitivo.' : 'Posición neutral, monitorizar.'}`)
      
      recomendaciones.forEach((rec, idx) => {
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${idx + 1}.`, margin + 3, yPos)
        pdf.setFont('helvetica', 'normal')
        const lines = pdf.splitTextToSize(rec, contentWidth - 15)
        lines.forEach((line: string, lineIdx: number) => {
          pdf.text(line, margin + (lineIdx === 0 ? 10 : 3), yPos)
          yPos += 5
        })
        yPos += 3
      })
      
      addWatermarkAndFooter(5, 10)
      
      // ============== PÁGINAS FINALES: GRÁFICOS (captura de pantalla) ==============
      // Capturar todos los gráficos
      const chartIds = ['distribucion-precio', 'distribucion-km', 'distribucion-ano', 'distribucion-dias', 'distribucion-mejor-opcion']
      
      for (let i = 0; i < chartIds.length; i++) {
        const chartElement = document.getElementById(chartIds[i])
        if (chartElement) {
          pdf.addPage()
          yPos = margin
          
          pdf.setFontSize(16)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(0, 0, 0)
          const titles = ['Distribución de Precios', 'Distribución de Kilómetros', 'Distribución por Año', 'Distribución Días en Stock', 'Análisis Mejor Opción']
          pdf.text(`5.${i + 1} ${titles[i]}`, margin, yPos)
          yPos += 10
          
          const canvas = await html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2
          })
          
          const imgData = canvas.toDataURL('image/png')
          const imgWidth = contentWidth
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          
          pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight)
          
          addWatermarkAndFooter(6 + i, 10)
        }
      }
      
      // Actualizar número total de páginas en todos los footers
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        if (i > 1) { // Skip portada
          pdf.setPage(i)
          // Re-draw footer with correct total
          pdf.setFillColor(255, 255, 255)
          pdf.rect(0, pageHeight - 17, pageWidth, 17, 'F')
          
          // Marca de agua lateral
          pdf.setTextColor(180, 180, 180)
          pdf.setFontSize(7)
          pdf.text(`Documento CVO creado ${fechaCompleta} por Jordi Viciana - Ref: ${codigoCVO}`, 5, pageHeight / 2, {
            angle: 90,
            align: 'center'
          })
          
          // Footer completo
          pdf.setTextColor(80, 80, 80)
          pdf.setFontSize(7)
          pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
          pdf.setFontSize(6)
          pdf.text('Datos de Quadis Munich extraídos mediante duc_scraper | Competencia: comparador_scraper', pageWidth / 2, pageHeight - 6, { align: 'center' })
          pdf.setFontSize(5.5)
          pdf.text('© CVO (Comparador de Vehículos de Ocasión) - Propiedad de Jordi Viciana | Análisis desarrollado para Quadis Munich', pageWidth / 2, pageHeight - 3, { align: 'center' })
        }
      }
      
      // Guardar PDF
      pdf.save(`Informe_CVO_${codigoCVO}.pdf`)
      
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF completo. Por favor, intenta de nuevo.')
    }
  }

  // Filtrar vehículos según el filtro actual
  const vehiculosFiltrados = filter === 'all' 
    ? vehiculos 
    : vehiculos.filter(v => v.posicion === filter)

  // Calcular estadísticas avanzadas
  const calcularEstadisticas = () => {
    if (vehiculosFiltrados.length === 0) return null

    // Por posición
    const competitivos = vehiculosFiltrados.filter(v => v.posicion === 'competitivo').length
    const justos = vehiculosFiltrados.filter(v => v.posicion === 'justo').length
    const altos = vehiculosFiltrados.filter(v => v.posicion === 'alto').length

    // Calcular cuántos son LA MEJOR OPCIÓN del mercado (el más barato de su categoría)
    const mejorOpcion = vehiculosFiltrados.filter(v => {
      // Si tiene competidores y nuestro precio es el más bajo → Mejor opción
      if (v.competidores > 0 && v.precioMinimoCompetencia) {
        return v.nuestroPrecio < v.precioMinimoCompetencia
      }
      // Si no tiene competidores, por defecto es mejor opción (único en el mercado)
      return v.competidores === 0
    }).length
    
    // Calcular cuántos son LA PEOR OPCIÓN (el más caro de su categoría)
    const peorOpcion = vehiculosFiltrados.filter(v => {
      // Si tiene competidores y nuestro precio es el más alto → Peor opción
      if (v.competidores > 0 && v.precioMaximoCompetencia) {
        return v.nuestroPrecio > v.precioMaximoCompetencia
      }
      return false
    }).length
    
    // Los que están en el medio (ni mejor ni peor)
    const opcionMedia = vehiculosFiltrados.length - mejorOpcion - peorOpcion

    // Por antigüedad
    const año2025 = vehiculosFiltrados.filter(v => parseInt(v.año) === 2025).length
    const año2024 = vehiculosFiltrados.filter(v => parseInt(v.año) === 2024).length
    const año2023 = vehiculosFiltrados.filter(v => parseInt(v.año) === 2023).length
    const añoAntes2023 = vehiculosFiltrados.filter(v => parseInt(v.año) < 2023).length

    // Por rango de KM
    const menosDe30k = vehiculosFiltrados.filter(v => v.km < 30000).length
    const entre30y60k = vehiculosFiltrados.filter(v => v.km >= 30000 && v.km < 60000).length
    const entre60y100k = vehiculosFiltrados.filter(v => v.km >= 60000 && v.km < 100000).length
    const masDe100k = vehiculosFiltrados.filter(v => v.km >= 100000).length

    // Por días en stock
    const menosDe30d = vehiculosFiltrados.filter(v => v.diasEnStock && v.diasEnStock < 30).length
    const entre30y60d = vehiculosFiltrados.filter(v => v.diasEnStock && v.diasEnStock >= 30 && v.diasEnStock < 60).length
    const entre60y90d = vehiculosFiltrados.filter(v => v.diasEnStock && v.diasEnStock >= 60 && v.diasEnStock < 90).length
    const masDe90d = vehiculosFiltrados.filter(v => v.diasEnStock && v.diasEnStock >= 90).length

    // Por rango de precio
    const menosDe30kEur = vehiculosFiltrados.filter(v => v.nuestroPrecio < 30000).length
    const entre30y50k = vehiculosFiltrados.filter(v => v.nuestroPrecio >= 30000 && v.nuestroPrecio < 50000).length
    const entre50y75k = vehiculosFiltrados.filter(v => v.nuestroPrecio >= 50000 && v.nuestroPrecio < 75000).length
    const masDe75k = vehiculosFiltrados.filter(v => v.nuestroPrecio >= 75000).length

    // Promedios (asegurar conversión a número)
    const precioPromedio = vehiculosFiltrados.reduce((sum, v) => sum + (Number(v.nuestroPrecio) || 0), 0) / vehiculosFiltrados.length
    const kmPromedio = vehiculosFiltrados.reduce((sum, v) => sum + (Number(v.km) || 0), 0) / vehiculosFiltrados.length
    const descuentoPromedio = vehiculosFiltrados
      .filter(v => v.descuentoNuestro)
      .reduce((sum, v) => sum + (Number(v.descuentoNuestro) || 0), 0) / vehiculosFiltrados.filter(v => v.descuentoNuestro).length || 0
    const diasStockPromedio = vehiculosFiltrados
      .filter(v => v.diasEnStock)
      .reduce((sum, v) => sum + (Number(v.diasEnStock) || 0), 0) / vehiculosFiltrados.filter(v => v.diasEnStock).length || 0

    // Top 5 más caros y más baratos
    const top5Caros = [...vehiculosFiltrados]
      .filter(v => v.nuestroPrecio)
      .sort((a, b) => (b.nuestroPrecio || 0) - (a.nuestroPrecio || 0))
      .slice(0, 5)
    
    const top5Baratos = [...vehiculosFiltrados]
      .filter(v => v.nuestroPrecio)
      .sort((a, b) => (a.nuestroPrecio || 0) - (b.nuestroPrecio || 0))
      .slice(0, 5)

    // Top 5 más tiempo en stock
    const top5TiempoStock = [...vehiculosFiltrados]
      .filter(v => v.diasEnStock)
      .sort((a, b) => (b.diasEnStock || 0) - (a.diasEnStock || 0))
      .slice(0, 5)

    // Top 5 mejor posicionados
    const top5MejorPosicionados = [...vehiculosFiltrados]
      .filter(v => v.porcentajeDifAjustado !== null)
      .sort((a, b) => (a.porcentajeDifAjustado || 0) - (b.porcentajeDifAjustado || 0))
      .slice(0, 5)

    return {
      competitivos,
      justos,
      altos,
      mejorOpcion,
      peorOpcion,
      opcionMedia,
      año2025,
      año2024,
      año2023,
      añoAntes2023,
      menosDe30k,
      entre30y60k,
      entre60y100k,
      masDe100k,
      menosDe30d,
      entre30y60d,
      entre60y90d,
      masDe90d,
      menosDe30kEur,
      entre30y50k,
      entre50y75k,
      masDe75k,
      precioPromedio,
      kmPromedio,
      descuentoPromedio,
      diasStockPromedio,
      top5Caros,
      top5Baratos,
      top5TiempoStock,
      top5MejorPosicionados
    }
  }

  const estadisticas = calcularEstadisticas()
  if (!estadisticas) return null

  // Preparar datos para gráficos
  const dataPosicion = [
    { name: 'Competitivos', value: estadisticas.competitivos, color: '#22c55e' },
    { name: 'Justos', value: estadisticas.justos, color: '#eab308' },
    { name: 'Altos', value: estadisticas.altos, color: '#ef4444' }
  ]

  const dataAntiguedad = [
    { name: '2025', value: estadisticas.año2025 },
    { name: '2024', value: estadisticas.año2024 },
    { name: '2023', value: estadisticas.año2023 },
    { name: '<2023', value: estadisticas.añoAntes2023 }
  ]

  const dataKilometraje = [
    { name: '<30k', value: estadisticas.menosDe30k },
    { name: '30-60k', value: estadisticas.entre30y60k },
    { name: '60-100k', value: estadisticas.entre60y100k },
    { name: '>100k', value: estadisticas.masDe100k }
  ]

  const dataDiasStock = [
    { name: '<30d', value: estadisticas.menosDe30d, color: '#22c55e' },
    { name: '30-60d', value: estadisticas.entre30y60d, color: '#eab308' },
    { name: '60-90d', value: estadisticas.entre60y90d, color: '#f97316' },
    { name: '>90d', value: estadisticas.masDe90d, color: '#ef4444' }
  ]

  const dataPrecio = [
    { name: '<30k€', value: estadisticas.menosDe30kEur },
    { name: '30-50k€', value: estadisticas.entre30y50k },
    { name: '50-75k€', value: estadisticas.entre50y75k },
    { name: '>75k€', value: estadisticas.masDe75k }
  ]

  const fechaInforme = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto print:max-w-full print:max-h-full">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informe Detallado - Análisis Competitivo de Precios
            </DialogTitle>
            <Button onClick={handlePrint} size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>

        {/* Contenido del Informe */}
        <div className="space-y-6 print:space-y-4">
          
          {/* Cabecera del Informe (para impresión) */}
          <div className="hidden print:block border-b-2 border-primary pb-4 mb-6">
            <h1 className="text-3xl font-bold mb-2">Informe de Análisis Competitivo</h1>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Fecha:</strong> {fechaInforme}</p>
                <p><strong>Total vehículos analizados:</strong> {vehiculosFiltrados.length}</p>
                <p><strong>Filtro aplicado:</strong> {
                  filter === 'all' ? 'Todos los vehículos' :
                  filter === 'competitivo' ? 'Precios Competitivos' :
                  filter === 'justo' ? 'Precios Justos' : 'Precios Altos'
                }</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">Motor Munich - Quadis</p>
                <p className="text-sm text-muted-foreground">Departamento Comercial</p>
              </div>
            </div>
          </div>

          {/* Resumen Ejecutivo */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Resumen Ejecutivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Package className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{vehiculosFiltrados.length}</p>
                  <p className="text-xs text-muted-foreground">Vehículos Analizados</p>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{estadisticas.competitivos}</p>
                  <p className="text-xs text-muted-foreground">Precios Competitivos</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{estadisticas.altos}</p>
                  <p className="text-xs text-muted-foreground">Precios Altos</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{estadisticas.precioPromedio.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                  <p className="text-xs text-muted-foreground">Precio Promedio</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">KM Promedio</p>
                  <p className="text-xl font-bold">{estadisticas.kmPromedio.toLocaleString('es-ES', { maximumFractionDigits: 0 })} km</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Descuento Promedio</p>
                  <p className="text-xl font-bold text-green-500">{estadisticas.descuentoPromedio.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Días en Stock Promedio</p>
                  <p className="text-xl font-bold">{estadisticas.diasStockPromedio.toFixed(0)} días</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráficos de Distribución */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
            
            {/* Distribución por Posición */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Posición Competitiva</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dataPosicion}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataPosicion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por Antigüedad */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Año</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataAntiguedad}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por Kilometraje */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Kilometraje</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataKilometraje}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por Días en Stock */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Días en Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataDiasStock}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {dataDiasStock.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por Rango de Precio */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Rango de Precio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataPrecio}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Análisis de Posición en el Mercado (Nuevo) */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Posición en el Mercado</CardTitle>
                <p className="text-xs text-muted-foreground">Comparativa de precios respecto a la competencia directa</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Mejor Opción', value: estadisticas.mejorOpcion, color: '#22c55e' },
                        { name: 'Opción Media', value: estadisticas.opcionMedia, color: '#f59e0b' },
                        { name: 'Peor Opción', value: estadisticas.peorOpcion, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-green-500">{estadisticas.mejorOpcion}</strong> más baratos del mercado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-orange-500">{estadisticas.opcionMedia}</strong> en rango medio
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-red-500">{estadisticas.peorOpcion}</strong> más caros del mercado
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rankings en Grid 2x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
          {/* Top 5 Más Caros */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                Top 5 - Vehículos Más Caros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estadisticas.top5Caros.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground/50">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold">{v.matricula}</p>
                        <p className="text-xs text-muted-foreground">{v.modelo} • {v.año} • {v.km?.toLocaleString()} km</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                      <Badge variant={v.posicion === 'alto' ? 'destructive' : 'outline'} className="text-xs">
                        {v.posicion === 'competitivo' ? '✓' : v.posicion === 'alto' ? '⚠' : '≈'} {v.posicion}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Más Baratos */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-green-500" />
                Top 5 - Vehículos Más Baratos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estadisticas.top5Baratos.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground/50">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold">{v.matricula}</p>
                        <p className="text-xs text-muted-foreground">{v.modelo} • {v.año} • {v.km?.toLocaleString()} km</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                      <Badge variant={v.posicion === 'competitivo' ? 'default' : 'outline'} className="text-xs">
                        {v.posicion === 'competitivo' ? '✓' : v.posicion === 'alto' ? '⚠' : '≈'} {v.posicion}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Mejor Posicionados */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                Top 5 - Mejor Posicionados (Precio/Calidad)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estadisticas.top5MejorPosicionados.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-green-500">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold">{v.matricula}</p>
                        <p className="text-xs text-muted-foreground">{v.modelo} • {v.año} • {v.km?.toLocaleString()} km</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                      <p className="text-xs text-green-500 font-medium">
                        {v.porcentajeDifAjustado?.toFixed(1)}% mejor que mercado
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Más Tiempo en Stock */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Top 5 - Más Tiempo en Stock (Acción Urgente)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estadisticas.top5TiempoStock.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-red-500">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold">{v.matricula}</p>
                        <p className="text-xs text-muted-foreground">{v.modelo} • {v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">{v.diasEnStock} días</p>
                      <p className="text-xs text-muted-foreground">
                        Recomendado: {v.precioRecomendado?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Tabla Detallada de Todos los Vehículos */}
          <Card className="print:break-before">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Listado Completo - {vehiculosFiltrados.length} Vehículos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr className="border-b">
                      <th className="p-2 text-left">Matrícula</th>
                      <th className="p-2 text-left">Modelo</th>
                      <th className="p-2 text-center">Año</th>
                      <th className="p-2 text-right">KM</th>
                      <th className="p-2 text-right">Precio</th>
                      <th className="p-2 text-right">Desc%</th>
                      <th className="p-2 text-right">Recomendado</th>
                      <th className="p-2 text-center">Posición</th>
                      <th className="p-2 text-center">Días Stock</th>
                      <th className="p-2 text-center">Competidores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculosFiltrados.map((v, idx) => (
                      <tr key={v.id} className={`border-b hover:bg-muted/50 ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="p-2 font-medium">{v.matricula}</td>
                        <td className="p-2 text-muted-foreground">{v.modelo}</td>
                        <td className="p-2 text-center">{v.año}</td>
                        <td className="p-2 text-right">{v.km?.toLocaleString()}</td>
                        <td className="p-2 text-right font-semibold">{v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</td>
                        <td className="p-2 text-right text-green-500">{v.descuentoNuestro?.toFixed(1)}%</td>
                        <td className="p-2 text-right font-medium text-blue-500">{v.precioRecomendado?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={v.posicion === 'competitivo' ? 'default' : 'outline'}
                            className={`text-[10px] ${
                              v.posicion === 'competitivo' ? 'bg-green-500' :
                              v.posicion === 'alto' ? 'bg-red-500 text-white' :
                              'bg-yellow-500 text-white'
                            }`}
                          >
                            {v.posicion === 'competitivo' ? '✓' : v.posicion === 'alto' ? '⚠' : '≈'}
                          </Badge>
                        </td>
                        <td className={`p-2 text-center ${v.diasEnStock > 60 ? 'text-red-500 font-bold' : ''}`}>
                          {v.diasEnStock || '-'}
                        </td>
                        <td className="p-2 text-center">{v.competidores || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Grid: Análisis por Modelo (1 col) + Recomendaciones (1 col) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
          {/* Análisis por Modelo */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Análisis por Modelo</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Agrupar por modelo
                const modelosAgrupados = vehiculosFiltrados.reduce((acc: any, v) => {
                  const modelo = v.modelo || 'Sin modelo'
                  if (!acc[modelo]) {
                    acc[modelo] = {
                      count: 0,
                      precioPromedio: 0,
                      kmPromedio: 0,
                      competitivos: 0,
                      altos: 0,
                      diasPromedio: 0
                    }
                  }
                  acc[modelo].count++
                  acc[modelo].precioPromedio += Number(v.nuestroPrecio) || 0
                  acc[modelo].kmPromedio += Number(v.km) || 0
                  acc[modelo].diasPromedio += Number(v.diasEnStock) || 0
                  if (v.posicion === 'competitivo') acc[modelo].competitivos++
                  if (v.posicion === 'alto') acc[modelo].altos++
                  return acc
                }, {})

                // Calcular promedios y ordenar por cantidad
                const modelosArray = Object.entries(modelosAgrupados).map(([modelo, data]: [string, any]) => ({
                  modelo,
                  count: data.count,
                  precioPromedio: data.precioPromedio / data.count,
                  kmPromedio: data.kmPromedio / data.count,
                  diasPromedio: data.diasPromedio / data.count,
                  competitivos: data.competitivos,
                  altos: data.altos
                })).sort((a, b) => b.count - a.count)

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted">
                        <tr className="border-b">
                          <th className="p-2 text-left">Modelo</th>
                          <th className="p-2 text-center">Unidades</th>
                          <th className="p-2 text-right">Precio Medio</th>
                          <th className="p-2 text-right">KM Medio</th>
                          <th className="p-2 text-center">Competitivos</th>
                          <th className="p-2 text-center">Altos</th>
                          <th className="p-2 text-right">Días Stock Medio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modelosArray.map((m, idx) => (
                          <tr key={m.modelo} className={`border-b ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}>
                            <td className="p-2 font-medium">{m.modelo}</td>
                            <td className="p-2 text-center">{m.count}</td>
                            <td className="p-2 text-right">{m.precioPromedio.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</td>
                            <td className="p-2 text-right">{m.kmPromedio.toLocaleString('es-ES', { maximumFractionDigits: 0 })} km</td>
                            <td className="p-2 text-center text-green-500">{m.competitivos}</td>
                            <td className="p-2 text-center text-red-500">{m.altos}</td>
                            <td className="p-2 text-right">{m.diasPromedio.toFixed(0)}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Recomendaciones Generales */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Recomendaciones Estratégicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {estadisticas.altos > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-red-500 mb-2">⚠️ Acción Urgente</p>
                  <p className="text-xs text-muted-foreground">
                    Tienes <strong>{estadisticas.altos} vehículos con precios altos</strong>. Se recomienda ajustar precios para mejorar competitividad y reducir días en stock.
                  </p>
                </div>
              )}
              
              {estadisticas.masDe90d > 0 && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-orange-500 mb-2">⏰ Stock Prolongado</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>{estadisticas.masDe90d} vehículos</strong> llevan más de 90 días en stock. Considera descuentos adicionales del 5-10% para venta rápida.
                  </p>
                </div>
              )}
              
              {estadisticas.competitivos > vehiculosFiltrados.length * 0.5 && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-green-500 mb-2">✅ Buen Posicionamiento</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>{((estadisticas.competitivos / vehiculosFiltrados.length) * 100).toFixed(0)}% de tus vehículos</strong> tienen precios competitivos. Mantén esta estrategia.
                  </p>
                </div>
              )}

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm font-semibold text-blue-500 mb-2">📊 Conclusión General</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tu posición general es <strong>{stats.posicionGeneral > 0 ? `${stats.posicionGeneral.toFixed(1)}% por encima` : `${Math.abs(stats.posicionGeneral).toFixed(1)}% por debajo`}</strong> del mercado. 
                  {stats.posicionGeneral < 0 ? ' Excelente posicionamiento competitivo.' : ' Considera ajustar precios para mejorar posición.'}
                  {' '}Tienes <strong>{stats.oportunidades} oportunidades</strong> de mejora identificadas.
                </p>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Footer para impresión */}
          <div className="hidden print:block text-center text-xs text-muted-foreground pt-6 border-t mt-6">
            <p>Informe generado el {fechaInforme}</p>
            <p>Sistema de Análisis Competitivo - Motor Munich / Quadis</p>
            <p className="mt-2">Página {'{pageNumber}'} de {'{totalPages}'}</p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}

