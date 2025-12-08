"use client"

import { X, Calculator, TrendingDown, Gauge, Package, Clock, AlertTriangle, Info, BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PricingGuideModalProps {
  open: boolean
  onClose: () => void
}

export function PricingGuideModal({ open, onClose }: PricingGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              Cómo se Calcula el Precio Competitivo
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="metodologia" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metodologia">Metodología</TabsTrigger>
            <TabsTrigger value="formulas">Fórmulas</TabsTrigger>
            <TabsTrigger value="ejemplo">Ejemplo Real</TabsTrigger>
            <TabsTrigger value="segmentos">Segmentos</TabsTrigger>
          </TabsList>

          {/* TAB 1: METODOLOGÍA */}
          <TabsContent value="metodologia" className="space-y-6 mt-4">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-lg p-6 border-2 border-blue-500/30">
              <div className="text-center space-y-3">
                <div className="text-sm font-medium text-muted-foreground">PROCESO COMPLETO</div>
                <div className="text-xl font-bold">
                  Cálculo del Indicador de Precio Competitivo
                </div>
                <div className="text-sm text-muted-foreground">
                  Usando solo: Precio Nuevo, Fecha Matriculación, KM y Modelo
                </div>
              </div>
            </div>

            {/* Flujo paso a paso */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                    Segmentación del Vehículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Cada vehículo se clasifica en uno de 3 segmentos según su modelo:
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-red-500/10 dark:bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                      <div className="font-semibold text-red-700 dark:text-red-300">Premium Luxury</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        X5, X6, X7, Serie 5+, i7, iX
                      </div>
                    </div>
                    <div className="bg-yellow-500/10 dark:bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
                      <div className="font-semibold text-yellow-700 dark:text-yellow-300">Premium Medium</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        X3, X4, Serie 3, Serie 4, i4
                      </div>
                    </div>
                    <div className="bg-green-500/10 dark:bg-green-500/20 rounded-lg p-3 border border-green-500/30">
                      <div className="font-semibold text-green-700 dark:text-green-300">Premium Entry</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        X1, X2, Serie 1, Serie 2, MINI
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                    Valor Teórico Esperado (VTE)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">2.1 Depreciación por Antigüedad</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Se aplica una curva de depreciación acumulada año a año:
                    </p>
                    <div className="bg-slate-900 text-slate-100 rounded-md p-3 text-xs font-mono">
                      <div>factorResidual = 1.0</div>
                      <div className="mt-1">Para cada año: factorResidual ×= (1 - tasa_depreciacion_año)</div>
                      <div className="mt-1">valorPorAntigüedad = precioNuevo × factorResidual</div>
                      <div className="mt-1">valorPorAntigüedad = MAX(valor, precioNuevo × valor_residual_min)</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">2.2 Ajuste por Kilometraje (Contextualizado)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      El impacto del kilometraje se calcula en dos pasos:
                    </p>
                    <div className="space-y-2">
                      <div className="bg-blue-500/10 dark:bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
                        <div className="font-semibold text-sm mb-1">Paso 1: Factor KM Base (según tramos)</div>
                        <div className="text-xs space-y-1">
                          <div>• 0-50k km: depreciación estándar</div>
                          <div>• 50-100k km: depreciación moderada</div>
                          <div>• &gt;100k km: depreciación acelerada</div>
                        </div>
                      </div>
                      <div className="bg-purple-500/10 dark:bg-purple-500/20 rounded-lg p-3 border border-purple-500/30">
                        <div className="font-semibold text-sm mb-1">Paso 2: Contextualización por Uso</div>
                        <div className="text-xs space-y-1">
                          <div>• kmEsperados = 12.000 km/año × antigüedad</div>
                          <div>• ratioUso = km / kmEsperados</div>
                          <div>• Si ratioUso ≤ 0.75: bonificación hasta +7.5%</div>
                          <div>• Si ratioUso &gt; 1.25: penalización hasta -25%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg p-3 border border-emerald-500/30">
                    <div className="font-semibold text-sm mb-1">2.3 Valor Teórico Final</div>
                    <div className="text-xs">
                      valorTeorico = valorPorAntigüedad × factorKmTotal
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                    Búsqueda de Competidores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Mismo modelo base</strong> (X5, Serie 3, etc.)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>±2 años</strong> de antigüedad</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>±30.000 km</strong> de diferencia</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Equipamiento similar</strong> (±10k€ precio nuevo) - opcional</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Excluir</strong> Quadis/Motor Munich (somos nosotros)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                    Métricas de Mercado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <p className="text-muted-foreground mb-3">
                      Se calculan estadísticas de los competidores encontrados:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>• Precio Medio</div>
                      <div>• Precio Mediano</div>
                      <div>• Precio Mínimo</div>
                      <div>• Precio Máximo</div>
                      <div>• Percentil 25</div>
                      <div>• Percentil 75</div>
                      <div>• Desviación Estándar</div>
                    </div>
                    <div className="mt-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg p-3 border border-amber-500/30">
                      <div className="font-semibold text-sm mb-1">Selección del Precio Base:</div>
                      <div className="text-xs space-y-1">
                        <div>• <strong>Gama Alta + Básico:</strong> Usa Percentil 25 (más bajo)</div>
                        <div>• <strong>Resto:</strong> Usa Precio Promedio</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">5</span>
                    Indicador de Competitividad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-3">
                    <div>
                      <h4 className="font-semibold mb-2">5.1 Percentil de Posición</h4>
                      <p className="text-muted-foreground text-xs mb-2">
                        Calcula en qué posición estás respecto al mercado (0 = más barato, 100 = más caro)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">5.2 Nivel de Confianza</h4>
                      <p className="text-muted-foreground text-xs mb-2">
                        Basado en cantidad de competidores y consistencia de precios:
                      </p>
                      <div className="text-xs space-y-1">
                        <div>• <strong>Alta:</strong> ≥15 competidores, CV &lt;10%</div>
                        <div>• <strong>Media:</strong> 8-14 competidores, CV 10-20%</div>
                        <div>• <strong>Baja:</strong> &lt;8 competidores o CV &gt;20%</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">5.3 Score Final (0-100)</h4>
                      <div className="bg-slate-900 text-slate-100 rounded-md p-3 text-xs font-mono mt-2">
                        <div>scoreMercado = 100 - posicionPercentil</div>
                        <div className="mt-1">scoreTeorico = ratioTeorico ≤ 1.0 ? 100 : 100 - (ratio - 1) × 100</div>
                        <div className="mt-1">// Ponderación según confianza:</div>
                        <div className="mt-1">// Alta: 70% mercado + 30% teórico</div>
                        <div>// Media: 60% mercado + 40% teórico</div>
                        <div>// Baja: 40% mercado + 60% teórico</div>
                        <div className="mt-1">scoreFinal = scoreMercado × pesoMercado + scoreTeorico × pesoTeorico</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">6</span>
                    Precio Recomendado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-3">
                    <div className="bg-slate-900 text-slate-100 rounded-md p-3 text-xs font-mono">
                      <div>precioObjetivo = percentil25 × 1.02  // 2% por encima del P25</div>
                      <div className="mt-1">// O si no hay percentil25:</div>
                      <div>precioObjetivo = precioMedio × 0.95  // 5% por debajo de la media</div>
                      <div className="mt-1">precioRecomendado = MAX(precioObjetivo, valorTeorico)</div>
                    </div>
                    <div className="bg-red-500/10 dark:bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                      <div className="font-semibold text-sm mb-1">Ajustes Especiales:</div>
                      <div className="text-xs space-y-1">
                        <div>• <strong>Competidores estancados:</strong> Si hay &gt;60 días + &gt;2 bajadas, aplicar descuento mínimo requerido</div>
                        <div>• <strong>Días en stock:</strong> Si &gt;60 días, aplicar 5% adicional de descuento</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: FÓRMULAS */}
          <TabsContent value="formulas" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Fórmulas Exactas de Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Depreciación por Antigüedad</h3>
                  <pre className="bg-slate-900 text-slate-100 rounded-md p-3 text-xs overflow-x-auto">
{`function calcularDepreciacionAntiguedad(
  precioNuevo, añoMatriculacion, segmento
) {
  antigüedad = añoActual - añoMatriculacion
  factorResidual = 1.0
  
  for (i = 0; i < min(antigüedad, 5); i++) {
    factorResidual *= (1 - tasas[i])
  }
  
  if (antigüedad > 5) {
    factorResidual *= (1 - ultimaTasa) ^ (antigüedad - 5)
  }
  
  valorPorAntigüedad = precioNuevo × factorResidual
  valorMinimo = precioNuevo × valor_residual_min
  
  return MAX(valorPorAntigüedad, valorMinimo)
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2. Ajuste por Kilometraje</h3>
                  <pre className="bg-slate-900 text-slate-100 rounded-md p-3 text-xs overflow-x-auto">
{`function calcularAjusteKilometraje(km, antigüedad, segmento) {
  // Paso 1: Factor KM Base
  if (km <= 50000) {
    factorKmBase = 1 - (km × valor_km / 1000)
  } else if (km <= 100000) {
    factorKmBase = 0.90 - ((km - 50000) × valor_km × 0.8 / 1000)
  } else {
    factorKmBase = 0.82 - ((km - 100000) × valor_km × 1.2 / 1000)
  }
  factorKmBase = MAX(factorKmBase, 0.60)
  
  // Paso 2: Contextualización
  kmEsperados = 12000 × MAX(antigüedad, 1)
  ratioUso = km / kmEsperados
  
  if (ratioUso <= 0.75) {
    factorUso = 1.0 + (0.75 - ratioUso) × 0.1
  } else if (ratioUso <= 1.25) {
    factorUso = 1.0
  } else {
    factorUso = 1.0 - MIN((ratioUso - 1.25) × 0.15, 0.25)
  }
  
  return CLAMP(factorKmBase × factorUso, 0.60, 1.10)
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3. Score de Competitividad</h3>
                  <pre className="bg-slate-900 text-slate-100 rounded-md p-3 text-xs overflow-x-auto">
{`function calcularScore(precioActual, valorTeorico, metricas, confianza) {
  posicionPercentil = calcularPercentil(precioActual, metricas)
  ratioTeorico = precioActual / valorTeorico
  
  scoreMercado = 100 - posicionPercentil
  scoreTeorico = ratioTeorico <= 1.0 
    ? 100 
    : MAX(0, 100 - (ratioTeorico - 1) × 100)
  
  // Ponderación según confianza
  if (confianza === 'alta') {
    pesoMercado = 0.7; pesoTeorico = 0.3
  } else if (confianza === 'baja') {
    pesoMercado = 0.4; pesoTeorico = 0.6
  } else {
    pesoMercado = 0.6; pesoTeorico = 0.4
  }
  
  return scoreMercado × pesoMercado + scoreTeorico × pesoTeorico
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: EJEMPLO REAL */}
          <TabsContent value="ejemplo" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ejemplo: BMW X5 2022</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Datos del Vehículo</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Modelo:</span>
                        <strong>BMW X5</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Segmento:</span>
                        <Badge variant="destructive">Premium Luxury</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Nuevo:</span>
                        <strong>95.000€</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Año:</span>
                        <strong>2022</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">KM:</span>
                        <strong>45.000 km</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Actual:</span>
                        <strong>69.990€</strong>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Cálculo Paso a Paso</h4>
                    <div className="space-y-2 text-sm">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded p-2">
                        <div className="text-xs text-muted-foreground">1. Depreciación Antigüedad</div>
                        <div className="text-xs">Factor año 1: 0.85 (15%)</div>
                        <div className="text-xs">Factor año 2: 0.748 (12%)</div>
                        <div className="text-xs">Factor año 3: 0.673 (10%)</div>
                        <div className="font-semibold mt-1">Valor: 63.935€</div>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 rounded p-2">
                        <div className="text-xs text-muted-foreground">2. Factor KM Base</div>
                        <div className="text-xs">45k km → factor: 0.91</div>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 rounded p-2">
                        <div className="text-xs text-muted-foreground">3. Contextualización</div>
                        <div className="text-xs">kmEsperados: 36.000</div>
                        <div className="text-xs">ratioUso: 1.25 → factor: 1.0</div>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 rounded p-2">
                        <div className="text-xs text-muted-foreground">4. Valor Teórico</div>
                        <div className="font-semibold">63.935 × 0.91 = 58.181€</div>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 rounded p-2">
                        <div className="text-xs text-muted-foreground">5. Competidores</div>
                        <div className="text-xs">Encontrados: 12</div>
                        <div className="text-xs">Precio medio: 68.500€</div>
                        <div className="text-xs">Percentil 25: 65.000€</div>
                      </div>
                      <div className="bg-emerald-500/20 dark:bg-emerald-500/10 rounded p-2 border border-emerald-500/30">
                        <div className="text-xs text-muted-foreground">6. Score Final</div>
                        <div className="text-xs">Posición: 60% (más caro que 60%)</div>
                        <div className="text-xs">Score mercado: 40</div>
                        <div className="text-xs">Score teórico: 80</div>
                        <div className="font-semibold mt-1">Score: 52 (Justo)</div>
                      </div>
                      <div className="bg-primary/20 dark:bg-primary/10 rounded p-2 border border-primary/30">
                        <div className="text-xs text-muted-foreground">7. Precio Recomendado</div>
                        <div className="font-semibold text-lg">66.300€</div>
                        <div className="text-xs">(Percentil 25 × 1.02)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: SEGMENTOS */}
          <TabsContent value="segmentos" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-red-700 dark:text-red-300">Premium Luxury</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Modelos:</div>
                    <div className="text-sm">X5, X6, X7, Serie 5+, i7, iX</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Depreciación anual:</div>
                    <div className="text-sm font-mono">[15%, 12%, 10%, 8%, 8%]</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Valor por km:</div>
                    <div className="text-sm font-semibold">0.20€/km</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Valor residual min:</div>
                    <div className="text-sm font-semibold">35%</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="text-yellow-700 dark:text-yellow-300">Premium Medium</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Modelos:</div>
                    <div className="text-sm">X3, X4, Serie 3, Serie 4, i4</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Depreciación anual:</div>
                    <div className="text-sm font-mono">[18%, 15%, 12%, 10%, 9%]</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Valor por km:</div>
                    <div className="text-sm font-semibold">0.15€/km</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Valor residual min:</div>
                    <div className="text-sm font-semibold">30%</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-700 dark:text-green-300">Premium Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Modelos:</div>
                    <div className="text-sm">X1, X2, Serie 1, Serie 2, MINI</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Depreciación anual:</div>
                    <div className="text-sm font-mono">[20%, 17%, 14%, 12%, 10%]</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Valor por km:</div>
                    <div className="text-sm font-semibold">0.10€/km</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Valor residual min:</div>
                    <div className="text-sm font-semibold">25%</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Niveles de Competitividad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 text-sm">
                  <div className="bg-green-500/20 rounded p-2 text-center">
                    <div className="font-semibold text-green-700 dark:text-green-300">Excelente</div>
                    <div className="text-xs text-muted-foreground">Score ≥ 80</div>
                  </div>
                  <div className="bg-blue-500/20 rounded p-2 text-center">
                    <div className="font-semibold text-blue-700 dark:text-blue-300">Bueno</div>
                    <div className="text-xs text-muted-foreground">Score ≥ 60</div>
                  </div>
                  <div className="bg-yellow-500/20 rounded p-2 text-center">
                    <div className="font-semibold text-yellow-700 dark:text-yellow-300">Justo</div>
                    <div className="text-xs text-muted-foreground">Score ≥ 40</div>
                  </div>
                  <div className="bg-orange-500/20 rounded p-2 text-center">
                    <div className="font-semibold text-orange-700 dark:text-orange-300">Alto</div>
                    <div className="text-xs text-muted-foreground">Score ≥ 20</div>
                  </div>
                  <div className="bg-red-500/20 rounded p-2 text-center">
                    <div className="font-semibold text-red-700 dark:text-red-300">Muy Alto</div>
                    <div className="text-xs text-muted-foreground">Score &lt; 20</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground border-t pt-4 mt-4">
          Esta metodología se aplica automáticamente a todos los vehículos en el comparador
        </div>
      </DialogContent>
    </Dialog>
  )
}
