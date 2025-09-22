"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { FileText, Download, TrendingUp, Target, Users, Euro, BarChart3, Zap, Shield } from "lucide-react"

export default function InformeDetalladoPage() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handlePrintPDF = () => {
    setIsGeneratingPDF(true)
    
    // Usar window.print() directamente en la página actual
    setTimeout(() => {
      window.print()
      setIsGeneratingPDF(false)
    }, 500)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            📊 Informe Detallado de Mercado
          </h1>
          <p className="text-gray-600 text-lg">
            Análisis Integral de Competencia, Oportunidades y Proyecciones
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => window.open('/dashboard/reports/plan-negocio/basico', '_blank')}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3"
          >
            <FileText className="w-5 h-5 mr-2" />
            Ver Informe Básico
          </Button>
          <Button 
            onClick={handlePrintPDF}
            disabled={isGeneratingPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          >
            <Download className="w-5 h-5 mr-2" />
            {isGeneratingPDF ? "Generando PDF..." : "Descargar PDF Completo"}
          </Button>
        </div>
      </div>

      {/* Valoración Actualizada */}
      <Card className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">🎯 Valoración Actualizada</h2>
          <div className="text-6xl font-bold mb-4">€350,000</div>
          <div className="text-xl opacity-90">Rango: €300,000 - €400,000</div>
          <p className="mt-4 text-lg opacity-90">Basado en análisis de mercado y proyecciones de crecimiento</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="competencia" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="competencia">Competencia</TabsTrigger>
          <TabsTrigger value="mercado">Mercado</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
          <TabsTrigger value="inversiones">Inversiones</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
        </TabsList>

        <TabsContent value="competencia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Análisis de Competencia - España
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <h3 className="font-bold text-lg text-red-800 mb-2">1. Autosoft DMS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-semibold text-red-700">Posición:</p>
                      <p className="text-sm">Líder en concesionarios BMW/MINI</p>
                    </div>
                    <div>
                      <p className="font-semibold text-red-700">Precio:</p>
                      <p className="text-sm">€50,000-€100,000</p>
                    </div>
                    <div>
                      <p className="font-semibold text-red-700">Cuota:</p>
                      <p className="text-sm">~30% concesionarios premium</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold text-red-700">Debilidades:</p>
                    <p className="text-sm">Alto coste, complejidad, personalización limitada</p>
                  </div>
                </div>

                <div className="p-6 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                  <h3 className="font-bold text-lg text-orange-800 mb-2">2. CDK Global</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-semibold text-orange-700">Posición:</p>
                      <p className="text-sm">Solución internacional establecida</p>
                    </div>
                    <div>
                      <p className="font-semibold text-orange-700">Precio:</p>
                      <p className="text-sm">€80,000+</p>
                    </div>
                    <div>
                      <p className="font-semibold text-orange-700">Cuota:</p>
                      <p className="text-sm">~20% grandes concesionarios</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold text-orange-700">Debilidades:</p>
                    <p className="text-sm">Coste muy alto, interfaz desactualizada, soporte limitado en español</p>
                  </div>
                </div>

                <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <h3 className="font-bold text-lg text-green-800 mb-2">🎯 Ventaja Competitiva - Sistema CVO</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <Shield className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm"><strong>Precio competitivo:</strong> €350,000 vs €50,000-€100,000+</span>
                      </li>
                      <li className="flex items-center">
                        <Zap className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm"><strong>Tecnología moderna:</strong> Next.js vs sistemas legacy</span>
                      </li>
                      <li className="flex items-center">
                        <Target className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm"><strong>IA integrada:</strong> Asistente Edelweiss único</span>
                      </li>
                    </ul>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <BarChart3 className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm"><strong>PWA avanzada:</strong> Funcionalidad offline</span>
                      </li>
                      <li className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm"><strong>Automatización completa:</strong> Scrapers automáticos</span>
                      </li>
                      <li className="flex items-center">
                        <Euro className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm"><strong>ROI superior:</strong> 18 meses vs 24-36 meses</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mercado" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Mercado Español Automoción 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">€2.1B</div>
                  <div className="text-sm text-blue-700">Mercado Total 2024</div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">12.5%</div>
                  <div className="text-sm text-green-700">Crecimiento Anual</div>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">15,400</div>
                  <div className="text-sm text-purple-700">Concesionarios</div>
                </div>
                <div className="text-center p-6 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">45,000</div>
                  <div className="text-sm text-orange-700">Talleres</div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">🎯 Segmentos de Mercado Objetivo</h3>
              
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-bold text-blue-800 mb-2">1. Concesionarios Premium (BMW, Mercedes, Audi)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Tamaño:</strong> ~2,500 puntos de venta</p>
                      <p><strong>Inversión promedio:</strong> €50,000-€150,000</p>
                    </div>
                    <div>
                      <p><strong>Oportunidad:</strong> €125M anuales</p>
                      <p><strong>Necesidades:</strong> Integración OEM, reporting avanzado</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-bold text-green-800 mb-2">2. Concesionarios Multimarca</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Tamaño:</strong> ~8,000 puntos de venta</p>
                      <p><strong>Inversión promedio:</strong> €20,000-€60,000</p>
                    </div>
                    <div>
                      <p><strong>Oportunidad:</strong> €240M anuales</p>
                      <p><strong>Necesidades:</strong> Flexibilidad, gestión multi-marca</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-bold text-purple-800 mb-2">3. Talleres Independientes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Tamaño:</strong> ~35,000 talleres</p>
                      <p><strong>Inversión promedio:</strong> €5,000-€25,000</p>
                    </div>
                    <div>
                      <p><strong>Oportunidad:</strong> €350M anuales</p>
                      <p><strong>Necesidades:</strong> Simplicidad, precio bajo</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financiero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Euro className="w-5 h-5 mr-2 text-blue-600" />
                Análisis Financiero Detallado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Concepto</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Año 1</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Año 2</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Año 3</th>
                      <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total 3 años</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 font-medium">Ingresos por Licencias</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€150,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€400,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€750,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€1,300,000</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-medium">Ingresos por Mantenimiento</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€30,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€120,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€225,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€375,000</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 font-medium">Ingresos por Servicios</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€50,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€150,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€300,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€500,000</td>
                    </tr>
                    <tr className="bg-blue-50 font-bold">
                      <td className="border border-gray-300 px-4 py-3">INGRESOS TOTALES</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-800">€230,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-800">€670,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-800">€1,275,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-blue-800">€2,175,000</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 font-medium">Costes de Desarrollo</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€80,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€120,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€150,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€350,000</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-medium">Costes Operativos</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€60,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€180,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€300,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€540,000</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 font-medium">Marketing y Ventas</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€40,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€100,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">€150,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€290,000</td>
                    </tr>
                    <tr className="bg-red-50 font-bold">
                      <td className="border border-gray-300 px-4 py-3">COSTES TOTALES</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-red-800">€180,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-red-800">€400,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-red-800">€600,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-red-800">€1,180,000</td>
                    </tr>
                    <tr className="bg-green-50 font-bold text-lg">
                      <td className="border border-gray-300 px-4 py-3">BENEFICIO NETO</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-green-800">€50,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-green-800">€270,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-green-800">€675,000</td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-green-800">€995,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-6 bg-green-50 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">📈 Métricas Clave de Rentabilidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">18 meses</div>
                    <div className="text-sm text-green-700">ROI Break-even</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">45.7%</div>
                    <div className="text-sm text-green-700">Margen Neto Año 3</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">€995K</div>
                    <div className="text-sm text-green-700">Beneficio 3 años</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inversiones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Roadmap de Inversiones Futuras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-bold text-blue-800 mb-3">Q1 2025 - Mejoras Core (€50,000)</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Optimización de rendimiento y escalabilidad</li>
                    <li>• Mejoras en UX/UI basadas en feedback de usuarios</li>
                    <li>• Integración con más APIs de fabricantes</li>
                    <li>• Sistema de notificaciones avanzado</li>
                  </ul>
                  <div className="mt-3">
                    <Progress value={25} className="h-2" />
                    <p className="text-xs text-blue-600 mt-1">ROI esperado: 6 meses</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-bold text-purple-800 mb-3">Q2-Q3 2025 - IA y Automatización (€80,000)</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Expansión del asistente IA Edelweiss</li>
                    <li>• Análisis predictivo de ventas y tendencias</li>
                    <li>• Automatización de procesos administrativos</li>
                    <li>• Machine Learning para recomendaciones personalizadas</li>
                  </ul>
                  <div className="mt-3">
                    <Progress value={50} className="h-2" />
                    <p className="text-xs text-purple-600 mt-1">ROI esperado: 8 meses</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-bold text-green-800 mb-3">Q4 2025 - Expansión Funcional (€70,000)</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Módulo de gestión financiera avanzada</li>
                    <li>• Integración con sistemas de facturación externos</li>
                    <li>• Herramientas de marketing digital integradas</li>
                    <li>• Dashboard ejecutivo con KPIs avanzados</li>
                  </ul>
                  <div className="mt-3">
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-green-600 mt-1">ROI esperado: 10 meses</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-bold text-orange-800 mb-3">2026 - Escalabilidad y Mercados (€120,000)</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Arquitectura multi-tenant para múltiples clientes</li>
                    <li>• Localización para mercados europeos (Portugal, Francia)</li>
                    <li>• API marketplace para integraciones de terceros</li>
                    <li>• Plataforma de partners y programa de resellers</li>
                  </ul>
                  <div className="mt-3">
                    <Progress value={100} className="h-2" />
                    <p className="text-xs text-orange-600 mt-1">ROI esperado: 12 meses</p>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-3">💰 Resumen de Inversiones</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Inversión Total:</strong> €320,000</p>
                      <p><strong>Período:</strong> 24 meses</p>
                      <p><strong>ROI Promedio:</strong> 9 meses</p>
                    </div>
                    <div>
                      <p><strong>Ingresos Adicionales:</strong> €800,000/año</p>
                      <p><strong>Beneficio Neto:</strong> €480,000/año</p>
                      <p><strong>Múltiplo de Inversión:</strong> 2.5x</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objetivos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Objetivos Estratégicos 2025-2027
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">📊 Métricas Clave de Crecimiento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-4xl font-bold text-blue-600 mb-2">50</div>
                      <div className="text-sm text-blue-700">Clientes Año 1</div>
                      <Progress value={100} className="mt-2 h-2" />
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <div className="text-4xl font-bold text-green-600 mb-2">150</div>
                      <div className="text-sm text-green-700">Clientes Año 2</div>
                      <Progress value={75} className="mt-2 h-2" />
                    </div>
                    <div className="text-center p-6 bg-purple-50 rounded-lg">
                      <div className="text-4xl font-bold text-purple-600 mb-2">300</div>
                      <div className="text-sm text-purple-700">Clientes Año 3</div>
                      <Progress value={50} className="mt-2 h-2" />
                    </div>
                    <div className="text-center p-6 bg-orange-50 rounded-lg">
                      <div className="text-4xl font-bold text-orange-600 mb-2">95%</div>
                      <div className="text-sm text-orange-700">Satisfacción</div>
                      <Progress value={95} className="mt-2 h-2" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">🚀 Estrategias de Crecimiento</h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <h4 className="font-bold text-blue-800 mb-2">1. Penetración de Mercado (2025)</h4>
                      <p className="text-sm text-blue-700">Focus en concesionarios BMW/MINI España como early adopters</p>
                      <div className="mt-2">
                        <Badge className="bg-blue-600">Objetivo: 50 clientes</Badge>
                        <Badge variant="outline" className="ml-2">€230K ingresos</Badge>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <h4 className="font-bold text-green-800 mb-2">2. Desarrollo de Producto (2025-2026)</h4>
                      <p className="text-sm text-green-700">Nuevas funcionalidades basadas en IA y automatización avanzada</p>
                      <div className="mt-2">
                        <Badge className="bg-green-600">Inversión: €150K</Badge>
                        <Badge variant="outline" className="ml-2">ROI: 8 meses</Badge>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                      <h4 className="font-bold text-purple-800 mb-2">3. Expansión Geográfica (2026)</h4>
                      <p className="text-sm text-purple-700">Entrada en Portugal, Francia e Italia con adaptaciones locales</p>
                      <div className="mt-2">
                        <Badge className="bg-purple-600">Mercado: €500M</Badge>
                        <Badge variant="outline" className="ml-2">Clientes potenciales: 1,000+</Badge>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                      <h4 className="font-bold text-orange-800 mb-2">4. Diversificación (2027)</h4>
                      <p className="text-sm text-orange-700">Expansión a otros sectores: maquinaria, náutica, equipamiento</p>
                      <div className="mt-2">
                        <Badge className="bg-orange-600">Sectores: 3 nuevos</Badge>
                        <Badge variant="outline" className="ml-2">Potencial: €2M+ ARR</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">🎯 KPIs y Métricas de Éxito</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Métricas Financieras</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• ARR (Annual Recurring Revenue): €2.1M para 2027</li>
                        <li>• Customer Lifetime Value: €15,000</li>
                        <li>• Customer Acquisition Cost: €2,500</li>
                        <li>• Churn Rate: &lt;5% anual</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Métricas Operativas</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Time to Market nuevas features: &lt;90 días</li>
                        <li>• Uptime del sistema: &gt;99.5%</li>
                        <li>• Tiempo de respuesta soporte: &lt;4 horas</li>
                        <li>• NPS (Net Promoter Score): &gt;70</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conclusiones Finales */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Conclusiones y Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <h3 className="font-bold text-lg mb-3">🔑 Factores Clave de Éxito</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm"><strong>Mercado en crecimiento:</strong> 12.5% anual en España</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm"><strong>Ventaja competitiva clara:</strong> IA + PWA + Automatización</span>
                  </li>
                  <li className="flex items-center">
                    <Euro className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="text-sm"><strong>ROI atractivo:</strong> 18 meses con €995K beneficio en 3 años</span>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Target className="w-4 h-4 text-orange-600 mr-2" />
                    <span className="text-sm"><strong>Escalabilidad probada:</strong> Arquitectura preparada para crecimiento</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-sm"><strong>Diferenciación tecnológica:</strong> Stack moderno vs competidores legacy</span>
                  </li>
                  <li className="flex items-center">
                    <Users className="w-4 h-4 text-indigo-600 mr-2" />
                    <span className="text-sm"><strong>Mercado objetivo claro:</strong> 60,000+ empresas potenciales</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-bold text-yellow-800 mb-3">💡 Recomendaciones Estratégicas</h3>
              <ol className="space-y-2 text-sm">
                <li><strong>1. Precio de salida:</strong> €350,000 con margen de negociación hasta €300,000</li>
                <li><strong>2. Incluir en la venta:</strong> Documentación completa + 6 meses soporte + formación del equipo</li>
                <li><strong>3. Estrategia de entrada:</strong> Focus en concesionarios premium BMW/MINI como early adopters</li>
                <li><strong>4. Timeline de venta:</strong> Cierre esperado en Q1 2025 para maximizar valor antes de mayor competencia</li>
                <li><strong>5. Post-venta:</strong> Considerar acuerdo de consultoría para desarrollos futuros</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
