"use client"

import { X, Calculator, TrendingDown, Gauge, Package, Clock, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PricingGuideModalProps {
  open: boolean
  onClose: () => void
}

export function PricingGuideModal({ open, onClose }: PricingGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              Fórmula de Cálculo de Precio Objetivo
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Fórmula Principal */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-lg p-6 border-2 border-blue-500/30">
            <div className="text-center space-y-3">
              <div className="text-sm font-medium text-muted-foreground">FÓRMULA PRINCIPAL</div>
              <div className="text-2xl font-bold">
                Precio Objetivo = promedio(Precio Mercado Ajustado, Precio AVP) → Controles Zombie/Urgencia
              </div>
              <div className="text-sm text-muted-foreground">
                1) Ajustamos la base de mercado por KM y gama/equipamiento  2) Calculamos el precio AVP (VdK + TRE)  3) Promediamos ambos y aplicamos límites/zombies
              </div>
            </div>
          </div>

          {/* Grid 2 Columnas */}
          <div className="grid grid-cols-2 gap-4">
            {/* Columna Izquierda: Factores */}
            <div className="space-y-4">
              {/* Factor 1: Base de Competencia */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">1. Base de Competencia</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gama Alta + Básico:</span>
                        <strong>Percentil 25 (más barato)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Otros casos:</span>
                        <strong>Precio Promedio</strong>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Se calcula solo con coches de equipamiento similar (±10k€ precio nuevo)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Factor 2: Ajuste por KM */}
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <Gauge className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-blue-700 dark:text-blue-300">2. Ajuste por Kilometraje</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor por km:</span>
                        <strong>Gama alta: 0.20€/km</strong>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Diferencia KM × Valor/km = impacto en el precio (positivo si lideramos, negativo si debemos bajar).
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Factor 3: Gama y Equipamiento */}
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 dark:from-amber-500/20 dark:to-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-amber-700 dark:text-amber-300">3. Gama y Equipamiento</h3>
                    <div className="text-sm space-y-2">
                      <div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Alta + Básico:</span>
                          <strong className="text-red-600 dark:text-red-400">Ser líderes de precio o justificar bonus</strong>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Con ventaja clara (km/año) → añadimos bonus. Sin ventaja → forzamos ser los más baratos.
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resto de combinaciones:</span>
                        <strong className="text-green-600 dark:text-green-400">Promedio competencia − Ajuste KM</strong>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Equipamiento se define con percentiles de precio nuevo (P25, P50, P75) calculados por gama.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Factor 4: Normalización AVP */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 dark:from-cyan-500/20 dark:to-cyan-500/10 rounded-lg p-4 border border-cyan-500/30">
                <div className="flex items-start gap-3">
                  <Gauge className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-1 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-cyan-700 dark:text-cyan-300">4. Normalización AVP (VdK + TRE)</h3>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor del Kilómetro (VdK):</span>
                        <strong>Pares similares en ±10k€</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Normalizado 0 km (PNE):</span>
                        <strong>Precio + KM × VdK</strong>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        TRE = PNE / Precio Nuevo. Aplicamos TRE medio del mercado a tu Precio Nuevo y restamos tus KM × VdK → Precio AVP.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Límites y Reglas */}
            <div className="space-y-4">
              {/* Límites de Precio */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-purple-700 dark:text-purple-300">5. Límites de Descuento</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Alta + Básico:</span>
                        <strong>Hasta -35% del precio actual</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Media + Básico:</span>
                        <strong>Hasta -25% del precio actual</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resto:</span>
                        <strong>Hasta -20% del precio actual</strong>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Límites para evitar caídas excesivas
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descuento Mínimo (Zombies) */}
              <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 dark:from-red-500/20 dark:to-red-500/10 rounded-lg p-4 border border-red-500/30">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-red-700 dark:text-red-300">6. Descuento Mínimo Requerido</h3>
                    <div className="text-sm space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Si hay competidores con <strong>&gt;60 días publicados</strong>:
                      </div>
                      <div className="pl-2 border-l-2 border-red-500/50 space-y-1 mt-2">
                        <div>• Se calcula su descuento actual</div>
                        <div>• <strong>TU descuento debe ser +1%</strong> mayor</div>
                        <div>• Ese % que NO funcionó = PISO MÍNIMO</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        El mercado ya rechazó ese precio, necesitas bajar más
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reglas de Oro */}
              <div className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 dark:from-slate-500/20 dark:to-slate-500/10 rounded-lg p-4 border border-slate-500/30">
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">⚡ Reglas de Oro</h3>
                  <div className="text-sm space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span><strong>Gama &gt; Equipamiento &gt; Precio</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Cliente <strong>NO se conforma</strong> con menos</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Alta + Básico = <strong>Patito feo</strong> (más barato)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>KM bajos compensan en <strong>TODAS</strong> las gamas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Fórmulas exactas */}
        <div className="bg-slate-950/5 dark:bg-slate-900/40 border border-slate-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            <Calculator className="w-4 h-4" />
            Fórmulas exactas que usa la API
          </div>
          <pre className="bg-slate-900/70 text-slate-100 text-xs rounded-md p-3 overflow-x-auto">
            <code>{`// 1) Percentiles propios para clasificar equipamiento
percentiles[gama] = { P25, P50, P75 } sobre precio_nuevo_original

// 2) Clasificación de equipamiento según percentiles
if (precioNuevo <= P25) equipamiento = 'basico'
else if (precioNuevo >= P75) equipamiento = 'premium'
else equipamiento = 'medio'

// 3) Valor del kilómetro (VdK) con pares similares
pares = comparables.filter(|precioNuevo_i - precioNuevo_j| <= 10k)
vdk = avg(|precio_i - precio_j| / |km_j - km_i|)

// 4) Normalización AVP (PNE y TRE)
pne = precio + km * vdk
tre = avg(pne / precioNuevo)
precioAvp = (precioNuevoPropio * tre) - (kmPropios * vdk)

// 5) Precio mercado ajustado por KM/gama
precioMercado = metodoBase(gama, equipamiento, comparables)
ajusteKm = (kmPropios - kmMedio) * valorKmPorGama[gama]
precioMercadoAjustado = precioMercado - ajusteKm (+ bonus si aplica)

// 6) Fusión y controles
precioCombinado = promedio(precioMercadoAjustado, precioAvp)
precioFinal = aplicarControlesZombieYLímites(precioCombinado, precioNuevoPropio)

return precioFinal`}</code>
          </pre>
        </div>

          {/* Ejemplo de Cálculo */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20 rounded-lg p-5 border border-cyan-500/30">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Ejemplo de Cálculo Real
            </h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-cyan-700 dark:text-cyan-300">Datos del Vehículo:</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modelo:</span>
                    <strong>BMW X5 xDrive30d</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gama:</span>
                    <strong className="text-red-600 dark:text-red-400">ALTA</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio Nuevo:</span>
                    <strong>86.799€</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipamiento:</span>
                    <strong className="text-orange-600 dark:text-orange-400">BÁSICO</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">KM:</span>
                    <strong>21.000 km</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio Actual:</span>
                    <strong>69.990€</strong>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-cyan-700 dark:text-cyan-300">Cálculo del Objetivo:</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">1. Base mercado (P25):</span>
                    <strong>63.500€</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">2. Ajuste KM (0,20€/km):</span>
                    <strong className="text-green-600 dark:text-green-400">+4.800€</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">3. Patito feo (-1%):</span>
                    <strong className="text-red-600 dark:text-red-400">-680€</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">→ Precio mercado ajustado:</span>
                    <strong>67.600€</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">4. VdK mercado:</span>
                    <strong>0,20€/km</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">5. TRE media (PNE/Precio Nuevo):</span>
                    <strong>64%</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">→ Precio AVP:</span>
                    <strong>55.800€</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">6. Promedio Mercado + AVP:</span>
                    <strong>61.700€</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">7. Control zombis (+1%):</span>
                    <strong className="text-red-600 dark:text-red-400">-900€</strong>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span className="font-medium">PRECIO OBJETIVO:</span>
                    <strong className="text-lg text-primary">~60.800€</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nota Final */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            Esta fórmula se aplica automáticamente a todos los vehículos en el comparador
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
