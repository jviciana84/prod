"use client"

import React from "react"
import {
  Document as PDFDocument,
  Page,
  Path,
  Rect,
  Svg,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"
import type { EstadisticasVentas, VentaMensual } from "@/types/ventas"
import { pathsProvincias } from "../mapa-final-data"
import { preciseProvinceMapping } from "../precise-mapping"

interface ChartDatum {
  label: string
  value: number
  color?: string
}

interface InformeVentasPDFProps {
  periodoLabel: string
  vista: "mensual" | "semanal"
  estadisticas: EstadisticasVentas
  ventas: VentaMensual[]
  logoBase64?: string
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottom: "1 solid #dbeafe",
    paddingBottom: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1d4ed8",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
    marginBottom: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1d4ed8",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  miniCardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    marginTop: 2,
  },
  miniCard: {
    flexBasis: "48%",
    flexGrow: 1,
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#f8fafc",
    minWidth: 140,
  },
  miniLabel: {
    fontSize: 6,
    color: "#64748b",
    marginBottom: 1,
    textTransform: "uppercase",
  },
  miniValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  },
  miniDescription: {
    fontSize: 6,
    color: "#94a3b8",
    marginTop: 2,
  },
  chartRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  chartBox: {
    flex: 1,
    minHeight: 100,
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#f8fafc",
    alignItems: "stretch",
  },
  chartBoxFull: {
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    alignItems: "stretch",
    width: "100%",
  },
  chartTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 4,
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  listItem: {
    fontSize: 9,
    marginBottom: 4,
    color: "#1f2937",
  },
  muted: {
    color: "#64748b",
  },
  badge: {
    fontSize: 9,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 700,
  },
  legend: {
    marginTop: 4,
    gap: 6,
    alignSelf: "stretch",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "#eef2ff",
  },
  legendBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 7,
    color: "#475569",
  },
  legendValue: {
    fontSize: 7,
    color: "#111827",
    fontWeight: 600,
  },
  mapContainer: {
    width: "100%",
    alignItems: "center",
  },
  mapGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  gradientSwatch: {
    width: 28,
    height: 10,
    borderRadius: 4,
  },
  provinceList: {
    marginTop: 12,
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  provinceHeader: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottom: "1 solid #dbeafe",
  },
  provinceHeaderText: {
    fontSize: 8,
    color: "#1d4ed8",
    fontWeight: 700,
  },
  provinceRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottom: "1 solid #f1f5f9",
    alignItems: "center",
  },
  provinceColRank: {
    width: "10%",
    fontSize: 8,
    color: "#1d4ed8",
    fontWeight: 700,
  },
  provinceColName: {
    width: "45%",
    fontSize: 9,
    color: "#1f2937",
  },
  provinceColQty: {
    width: "20%",
    fontSize: 9,
    color: "#1f2937",
    textAlign: "right",
  },
  provinceColAmount: {
    width: "25%",
    fontSize: 9,
    color: "#1f2937",
    textAlign: "right",
  },
  provinceEmpty: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 8,
    color: "#64748b",
  },
  asesorList: {
    width: "100%",
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  asesorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottom: "1 solid #f1f5f9",
  },
  asesorRowAlt: {
    backgroundColor: "#f8fafc",
  },
  asesorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  asesorRank: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#1d4ed8",
    color: "#ffffff",
    fontSize: 6,
    fontWeight: 700,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  asesorRankAlt: {
    backgroundColor: "#e2e8f0",
  },
  asesorRankLabel: {
    fontSize: 6,
    fontWeight: 700,
    color: "#ffffff",
  },
  asesorRankLabelAlt: {
    color: "#1d4ed8",
  },
  asesorName: {
    fontSize: 9,
    fontWeight: 600,
    color: "#1f2937",
    maxWidth: 140,
  },
  asesorMetrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  asesorSales: {
    fontSize: 7,
    color: "#64748b",
  },
  asesorRevenue: {
    fontSize: 8,
    fontWeight: 600,
    color: "#1f2937",
  },
  discountList: {
    width: "100%",
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  discountItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottom: "1 solid #f1f5f9",
  },
  discountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  discountLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: "#1f2937",
  },
  discountMeta: {
    fontSize: 8,
    color: "#64748b",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
    flexDirection: "row",
  },
  progressFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#1d4ed8",
    flexGrow: 1,
  },
  progressFillAlt: {
    backgroundColor: "#2563eb",
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryBoxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 8,
    border: "1 solid #e2e8f0",
    backgroundColor: "#eef2ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1d4ed8",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: {
    border: "1 solid #e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderBottom: "1 solid #e5e7eb",
  },
  tableHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: 700,
    color: "#1d4ed8",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #f1f5f9",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  tableCell: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    overflow: "hidden",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTop: "1 solid #dbeafe",
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    fontSize: 8,
    color: "#475569",
  },
  footerLeft: {
    width: 90,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerLogo: {
    width: 48,
    height: 32,
  },
  footerCenter: {
    flex: 1,
    textAlign: "center",
  },
  footerRight: {
    width: 90,
    textAlign: "right",
    fontWeight: 600,
  },
})

const CHART_COLORS = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"]

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

const formatCurrency = (value: number) => value.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
const formatPercentage = (value: number) => `${value.toFixed(1)} %`
const truncateText = (value: string | null | undefined, max: number) => {
  if (!value) return "—"
  const clean = value.toString().trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1)}…`
}

const formatTimestamp = () => {
  const now = new Date()
  const fecha = now.toLocaleDateString("es-ES")
  const hora = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  return `${fecha} ${hora}`
}

const Legend = (
  {
    data,
    layout = "column",
    valueFormatter,
  }: {
    data: ChartDatum[]
    layout?: "column" | "row"
    valueFormatter?: (value: number, item: ChartDatum, index: number) => string
  },
) => {
  if (!data.length) return null

  return (
    <View style={[styles.legend, layout === "row" && styles.legendRow]}>
      {data.map((item, index) => (
        <View key={`legend-${item.label}-${index}`} style={styles.legendItem}>
          <View
            style={[
              styles.legendBullet,
              { backgroundColor: item.color ?? CHART_COLORS[index % CHART_COLORS.length] },
            ]}
          />
          <Text style={styles.legendLabel}>{item.label}</Text>
          <Text style={styles.legendValue}>
            {valueFormatter
              ? valueFormatter(item.value, item, index)
              : Number.isInteger(item.value)
              ? item.value.toLocaleString("es-ES")
              : item.value.toFixed(1)}
          </Text>
        </View>
      ))}
    </View>
  )
}

const BarChart = ({
  data,
  maxValue,
  color = "#1d4ed8",
  showLegend = true,
  legendLayout = "row",
  valueFormatter,
}: {
  data: ChartDatum[]
  maxValue?: number
  color?: string
  showLegend?: boolean
  legendLayout?: "row" | "column"
  valueFormatter?: (value: number, item: ChartDatum, index: number) => string
}) => {
  if (!data.length) {
    return <Text style={[styles.muted, { fontSize: 9 }]}>Sin datos disponibles.</Text>
  }
 
  const width = 200
  const height = 100
  const paddingX = 28
  const paddingY = 16
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2
  const barWidth = chartWidth / Math.max(data.length, 1)
  const max = maxValue ?? Math.max(...data.map((item) => item.value), 1)

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
        <Path d={`M ${paddingX} ${paddingY} V ${paddingY + chartHeight}`} stroke="#cbd5f5" strokeWidth={1} />
        <Path
          d={`M ${paddingX} ${paddingY + chartHeight} H ${paddingX + chartWidth}`}
          stroke="#cbd5f5"
          strokeWidth={1}
        />
        {data.map((item, index) => {
          const barHeight = (item.value / max) * chartHeight
          const barX = paddingX + index * barWidth + barWidth * 0.2
          const barY = paddingY + chartHeight - barHeight
          const barColor = item.color ?? color
          return (
            <React.Fragment key={`bar-${item.label}`}>
              <Rect x={barX} y={barY} width={barWidth * 0.6} height={barHeight} fill={barColor} rx={4} />
              <Text
                x={barX + barWidth * 0.3}
                y={paddingY + chartHeight + 12}
                fontSize={8}
                fill="#475569"
                textAnchor="middle"
              >
                {item.label}
              </Text>
              <Text
                x={barX + barWidth * 0.3}
                y={barY - 4}
                fontSize={8}
                fill="#1f2937"
                textAnchor="middle"
              >
                {item.value}
              </Text>
            </React.Fragment>
          )
        })}
      </Svg>
      {showLegend ? <Legend data={data} layout={legendLayout} valueFormatter={valueFormatter} /> : null}
    </View>
  )
}

const HorizontalBarChart = ({
  data,
  showLegend = true,
  legendLayout = "row",
  valueFormatter,
}: {
  data: ChartDatum[]
  showLegend?: boolean
  legendLayout?: "row" | "column"
  valueFormatter?: (value: number, item: ChartDatum, index: number) => string
}) => {
  if (!data.length) {
    return <Text style={[styles.muted, { fontSize: 9 }]}>Sin datos disponibles.</Text>
  }
 
  const width = 210
  const height = 130
  const paddingX = 30
  const paddingY = 14
  const chartWidth = width - paddingX * 2
  const barGap = 10
  const barHeight = (height - paddingY * 2 - barGap * (data.length - 1)) / data.length
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
        <Path d={`M ${paddingX} ${paddingY} V ${height - paddingY}`} stroke="#cbd5f5" strokeWidth={1} />
        <Path d={`M ${paddingX} ${height - paddingY} H ${paddingX + chartWidth}`} stroke="#cbd5f5" strokeWidth={1} />
        {data.map((item, index) => {
          const barLength = (item.value / max) * chartWidth
          const y = paddingY + index * (barHeight + barGap)
          const barColor = item.color ?? "#1d4ed8"
          return (
            <React.Fragment key={`hbar-${item.label}`}>
              <Rect x={paddingX} y={y} width={chartWidth} height={barHeight} fill="#e0e7ff" opacity={0.35} />
              <Rect x={paddingX} y={y} width={barLength} height={barHeight} fill={barColor} rx={4} />
              <Text x={paddingX - 6} y={y + barHeight / 2 + 2} fontSize={8} fill="#475569" textAnchor="end">
                {item.label}
              </Text>
              <Text x={paddingX + barLength + 6} y={y + barHeight / 2 + 2} fontSize={8} fill="#1f2937">
                {item.value}
              </Text>
            </React.Fragment>
          )
        })}
      </Svg>
      {showLegend ? <Legend data={data} layout={legendLayout} valueFormatter={valueFormatter} /> : null}
    </View>
  )
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${x} ${y} Z`
}

const PieChart = ({
  data,
  size = 130,
  showLegend = true,
  legendLayout = "column",
  valueFormatter,
}: {
  data: ChartDatum[]
  size?: number
  showLegend?: boolean
  legendLayout?: "row" | "column"
  valueFormatter?: (value: number, item: ChartDatum, index: number) => string
}) => {
  if (!data.length) {
    return <Text style={[styles.muted, { fontSize: 9 }]}>Sin datos disponibles.</Text>
  }
 
   const total = data.reduce((sum, item) => sum + item.value, 0)
   if (!total) {
     return <Text style={[styles.muted, { fontSize: 9 }]}>Sin datos disponibles.</Text>
   }
 
  const adjustedSize = size
  const radius = adjustedSize / 2
  let startAngle = 0

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Svg width={adjustedSize} height={adjustedSize}>
        {data.map((item, index) => {
          const valueAngle = (item.value / total) * 360
          const endAngle = startAngle + valueAngle
          const path = describeArc(radius, radius, radius - 8, startAngle, endAngle)
          startAngle = endAngle
          return <Path key={item.label} d={path} fill={item.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
        })}
      </Svg>
      {showLegend ? (
        <Legend
          data={data}
          layout={legendLayout}
          valueFormatter={(value, item, index) =>
            valueFormatter ? valueFormatter(value, item, index) : `${value} (${formatPercentage((value / total) * 100)})`
          }
        />
      ) : null}
    </View>
  );
}

const MapChart = ({ data }: { data?: { provincia: string; cantidad: number; ingresos: number }[] }) => {
  const safeData = Array.isArray(data) ? data : []
  const safePaths = Array.isArray(pathsProvincias) ? pathsProvincias : []

  if (!safeData.length || !safePaths.length) {
    return <Text style={[styles.muted, { fontSize: 9 }]}>Sin datos geográficos disponibles.</Text>
  }

  const provinciaMap = new Map<string, { cantidad: number; ingresos: number }>()
  safeData.forEach((item) => {
    provinciaMap.set(item.provincia, { cantidad: item.cantidad, ingresos: item.ingresos })
  })

  const max = safeData.length ? Math.max(...safeData.map((item) => item.cantidad), 0) : 0

  const interpolateColor = (intensity: number) => {
    const startColor = [219, 234, 254]
    const endColor = [29, 78, 216]
    const color = startColor.map((start, idx) => Math.round(start + (endColor[idx] - start) * intensity))
    return `rgb(${color.join(",")})`
  }

  const getFill = (provincia?: string) => {
    if (!provincia) return "#e2e8f0"
    const stats = provinciaMap.get(provincia)
    if (!stats || max === 0) return "#e2e8f0"
    const intensity = stats.cantidad / max
    return interpolateColor(intensity)
  }

  const gradientSteps = 6
  const gradientColors = Array.from({ length: gradientSteps }).map((_, index) =>
    interpolateColor(index / (gradientSteps - 1))
  )

  return (
    <View style={styles.mapContainer}>
      <Svg width={520} height={320} viewBox="0 0 800 507">
        {safePaths.map((path) => {
          const provincia = preciseProvinceMapping[String(path.id)]
          return <Path key={path.id} d={path.d} fill={getFill(provincia)} stroke="#94a3b8" strokeWidth={0.8} />
        })}
      </Svg>
      <View style={styles.mapGradient}>
        <Text style={styles.legendLabel}>Menos ventas</Text>
        {gradientColors.map((color, index) => (
          <View
            key={`gradient-${index}`}
            style={[styles.gradientSwatch, { backgroundColor: color }]}
          />
        ))}
        <Text style={styles.legendLabel}>Más ventas</Text>
      </View>
    </View>
  );
}

const renderFooter = (page: number, total: number, logoBase64?: string, timestamp?: string) => {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerLeft}>
        <Text style={{ fontWeight: 700 }}>CVO</Text>
      </View>
      <Text style={styles.footerCenter}>Fichero generado por CVO: {timestamp ?? formatTimestamp()}</Text>
      <Text style={styles.footerRight}>Pág. {page} / {total}</Text>
    </View>
  )
}

export const InformeVentasPDF = ({ periodoLabel, vista, estadisticas, ventas, logoBase64 }: InformeVentasPDFProps) => {
  const ventasChunks = chunkArray(ventas, 18)
  const timestampLabel = formatTimestamp()

  const generalChartData = (estadisticas.ventasPorMes ?? []).map((item) => ({
    label: item.mes,
    value: item.cantidad,
  }))

  const marcasChartData = (estadisticas.ventasPorMarca ?? []).map((item, index) => ({
    label: item.marca,
    value: item.cantidad,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))

  const provinciasChartData = (estadisticas.ventasPorProvincia ?? []).slice(0, 10).map((item) => ({
    label: item.provincia,
    value: item.cantidad,
  }))

  const preciosChartData = (estadisticas.distribucionPrecios ?? []).map((item) => ({
    label: item.rango,
    value: item.cantidad,
  }))

  const metodosChartData = (estadisticas.ventasPorMetodoPago ?? []).map((item) => ({
    label: item.metodo,
    value: item.cantidad,
  }))

  const descuentosChartData = (estadisticas.descuentosAplicados ?? []).slice(0, 8).map((item) => ({
    label: item.descuento,
    value: item.cantidad,
  }))

  const financiacionChartData = [
    { label: "Financiadas", value: estadisticas.ventasFinanciadas ?? 0, color: "#1d4ed8" },
    { label: "Contado", value: estadisticas.ventasContado ?? 0, color: "#60a5fa" },
  ]

  const provinciasDetalle = (estadisticas.ventasPorProvincia ?? []).slice(0, 12)
  const topAsesores = (estadisticas.topAsesores ?? []).slice(0, 10)
  const basePages = 3
  const totalPaginas = basePages + ventasChunks.length

  return (
    <PDFDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Informe de Ventas</Text>
          <Text style={styles.subtitle}>
            Periodo analizado: {periodoLabel} · Vista {vista === "mensual" ? "mensual" : "semanal"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen general</Text>
          <View style={styles.miniCardRow}>
            <View style={styles.miniCard}>
              <Text style={styles.miniLabel}>Total ventas</Text>
              <Text style={styles.miniValue}>{(estadisticas.totalVentas ?? 0).toLocaleString("es-ES")}</Text>
              <Text style={styles.miniDescription}>Unidades registradas</Text>
            </View>
            <View style={styles.miniCard}>
              <Text style={styles.miniLabel}>Ingresos totales</Text>
              <Text style={styles.miniValue}>{formatCurrency(estadisticas.totalIngresos ?? 0)}</Text>
              <Text style={styles.miniDescription}>Ticket medio: {formatCurrency(estadisticas.promedioPrecio ?? 0)}</Text>
            </View>
            <View style={styles.miniCard}>
              <Text style={styles.miniLabel}>Financiadas</Text>
              <Text style={styles.miniValue}>{estadisticas.ventasFinanciadas ?? 0}</Text>
              <Text style={styles.miniDescription}>Peso: {formatPercentage(estadisticas.porcentajeFinanciacion ?? 0)}</Text>
            </View>
            <View style={styles.miniCard}>
              <Text style={styles.miniLabel}>Top asesor</Text>
              <Text style={styles.miniValue}>{estadisticas.topAsesores?.[0]?.ventas ?? 0}</Text>
              <Text style={styles.miniDescription}>{estadisticas.topAsesores?.[0]?.advisor ?? "Sin datos"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.chartRow}>
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>Evolución de ventas</Text>
              <BarChart data={generalChartData} showLegend={false} />
            </View>
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>Ventas por marca</Text>
              <PieChart data={marcasChartData} legendLayout="column" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top asesores</Text>
          {topAsesores.length ? (
            <View style={styles.asesorList}>
              {topAsesores.map((asesor, index) => (
                <View
                  key={`asesor-${asesor.advisor ?? index}`}
                  style={[styles.asesorRow, index % 2 === 1 ? styles.asesorRowAlt : null]}
                >
                  <View style={styles.asesorLeft}>
                    <View
                      style={[
                        styles.asesorRank,
                        index === 0 ? null : styles.asesorRankAlt,
                      ]}
                    >
                      <Text
                        style={[
                          styles.asesorRankLabel,
                          index === 0 ? null : styles.asesorRankLabelAlt,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.asesorName}>{truncateText(asesor.advisor ?? "Sin datos", 24)}</Text>
                      <Text style={styles.asesorSales}>
                        Ventas: {(asesor.ventas ?? 0).toLocaleString("es-ES")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.asesorMetrics}>
                    <Text style={styles.asesorRevenue}>
                      {formatCurrency(asesor.ingresos ?? 0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.muted, { fontSize: 9 }]}>No hay datos de asesores disponibles.</Text>
          )}
        </View>

        {renderFooter(1, totalPaginas, logoBase64, timestampLabel)}
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Asesores y Financiación</Text>
          <Text style={styles.subtitle}>Rendimiento comercial y formas de pago</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métodos de pago y descuentos</Text>
          <View style={styles.chartRow}>
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>Métodos de pago</Text>
              <HorizontalBarChart data={metodosChartData} showLegend={false} legendLayout="column" />
            </View>
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>Descuentos aplicados</Text>
              <BarChart data={descuentosChartData} showLegend={false} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financiación vs contado</Text>
          <View style={styles.chartRow}>
            <View style={styles.chartBox}>
              <PieChart data={financiacionChartData} legendLayout="column" />
            </View>
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>Distribución de precios</Text>
              <BarChart data={preciosChartData} showLegend={false} />
            </View>
          </View>
        </View>

        {renderFooter(2, totalPaginas, logoBase64, timestampLabel)}
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Geografía y detalle</Text>
          <Text style={styles.subtitle}>Distribución territorial de ventas</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mapa de provincias</Text>
          <View style={styles.chartBoxFull}>
            <MapChart
              data={provinciasDetalle.map((provincia) => ({
                provincia: provincia.provincia,
                cantidad: provincia.cantidad,
                ingresos: provincia.ingresos,
              }))}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle por provincia</Text>
          <View style={styles.provinceList}>
            <View style={styles.provinceHeader}>
              <Text style={[styles.provinceColRank, styles.provinceHeaderText]}>#</Text>
              <Text style={[styles.provinceColName, styles.provinceHeaderText]}>Provincia</Text>
              <Text style={[styles.provinceColQty, styles.provinceHeaderText]}>Ventas</Text>
              <Text style={[styles.provinceColAmount, styles.provinceHeaderText]}>Ingresos</Text>
            </View>
            {provinciasDetalle.length ? (
              provinciasDetalle.map((provincia, index) => (
                <View
                  key={`provincia-${provincia.provincia}`}
                  style={[
                    styles.provinceRow,
                    index === provinciasDetalle.length - 1 ? { borderBottom: "none" } : null,
                    index % 2 === 1 ? { backgroundColor: "#f8fafc" } : null,
                  ]}
                >
                  <Text style={styles.provinceColRank}>{`#${index + 1}`}</Text>
                  <Text style={styles.provinceColName}>{provincia.provincia}</Text>
                  <Text style={styles.provinceColQty}>{provincia.cantidad.toLocaleString("es-ES")}</Text>
                  <Text style={styles.provinceColAmount}>{formatCurrency(provincia.ingresos)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.provinceEmpty}>No hay datos de provincias para el periodo seleccionado.</Text>
            )}
          </View>
        </View>

        {renderFooter(3, totalPaginas, logoBase64, timestampLabel)}
      </Page>

      {ventasChunks.map((chunk, chunkIndex) => (
        <Page key={`ventas-${chunkIndex}`} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Detalle de ventas</Text>
            <Text style={styles.subtitle}>
              Periodo: {periodoLabel} · Página {chunkIndex + 1} de {ventasChunks.length}
            </Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: "15%" }]}>Matrícula</Text>
              <Text style={[styles.tableHeaderCell, { width: "24%" }]}>Modelo</Text>
              <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Asesor</Text>
              <Text style={[styles.tableHeaderCell, { width: "12%", textAlign: "right" }]}>Precio</Text>
              <Text style={[styles.tableHeaderCell, { width: "14%" }]}>Método pago</Text>
              <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Provincia</Text>
              <Text style={[styles.tableHeaderCell, { width: "5%", textAlign: "right" }]}>Dto.</Text>
            </View>
            {chunk.map((venta, rowIndex) => {
              const descuentoLabel = typeof venta.discount === "number"
                ? `${venta.discount.toFixed(1)}%`
                : venta.discount
                ? `${venta.discount}`
                : "—"
              const matricula = truncateText(venta.license_plate, 12)
              const modelo = truncateText(venta.model || venta.brand, 18)
              const asesor = truncateText(venta.advisor_name || venta.advisor, 16)
              const metodo = truncateText(venta.payment_method, 18)
              const provincia = truncateText(venta.client_province, 12)
              const descuento = truncateText(descuentoLabel, 6)

              return (
                <View
                  key={venta.id}
                  style={[
                    styles.tableRow,
                    rowIndex % 2 === 0 ? styles.tableRowAlt : null,
                    rowIndex === chunk.length - 1 ? { borderBottom: "none" } : null,
                  ]}
                >
                  <Text style={[styles.tableCell, { width: "15%" }]} wrap={false}>
                    {matricula}
                  </Text>
                  <Text style={[styles.tableCell, { width: "24%" }]} wrap={false}>
                    {modelo}
                  </Text>
                  <Text style={[styles.tableCell, { width: "20%" }]} wrap={false}>
                    {asesor}
                  </Text>
                  <Text style={[styles.tableCell, { width: "12%", textAlign: "right" }]} wrap={false}>
                    {venta.price ? formatCurrency(venta.price) : "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "14%" }]} wrap={false}>
                    {metodo}
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%" }]} wrap={false}>
                    {provincia}
                  </Text>
                  <Text style={[styles.tableCell, { width: "5%", textAlign: "right" }]} wrap={false}>
                    {descuento}
                  </Text>
                </View>
              )
            })}
          </View>

          <View style={{ marginTop: 20, fontSize: 8, color: "#64748b" }}>
            <Text>Este informe recoge todas las ventas registradas en el periodo indicado.</Text>
          </View>

          {renderFooter(basePages + chunkIndex + 1, totalPaginas, logoBase64, timestampLabel)}
        </Page>
      ))}
    </PDFDocument>
  )
}

export default InformeVentasPDF