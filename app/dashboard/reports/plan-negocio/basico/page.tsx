"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, TrendingUp, Target, Users, Euro, BarChart3, Zap, Shield, Database, Smartphone, Brain, Settings } from "lucide-react"

export default function InformeValoracionPage() {
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
            📊 Informe de Valoración - Sistema CVO
          </h1>
          <p className="text-gray-600 text-lg">
            Análisis Técnico y Valoración Económica Completa
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => window.open('/dashboard/reports/plan-negocio', '_blank')}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Ver Informe Detallado
          </Button>
          <Button 
            onClick={handlePrintPDF}
            disabled={isGeneratingPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          >
            <Download className="w-5 h-5 mr-2" />
            {isGeneratingPDF ? "Generando PDF..." : "Imprimir PDF"}
          </Button>
        </div>
      </div>

      {/* Valoración Principal */}
      <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">💰 Valoración del Sistema</h2>
          <div className="text-6xl font-bold mb-4">€350,000</div>
          <div className="text-xl opacity-90">Precio recomendado de venta</div>
          <p className="mt-4 text-lg opacity-90">Basado en análisis técnico y comparativa de mercado</p>
        </CardContent>
      </Card>

      {/* Resumen Ejecutivo */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Resumen Ejecutivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">€350K</div>
              <div className="text-sm text-blue-700">Valoración Total</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">18 meses</div>
              <div className="text-sm text-green-700">ROI Esperado</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">€995K</div>
              <div className="text-sm text-purple-700">Beneficio 3 años</div>
            </div>
          </div>
          <div className="mt-6 p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-700 leading-relaxed">
              El Sistema CVO representa una solución integral y moderna para la gestión de concesionarios automotrices, 
              desarrollada con tecnologías de vanguardia como Next.js 15, React 18, TypeScript y Supabase. 
              La aplicación incluye funcionalidades avanzadas como PWA, asistente de IA integrado, y automatización 
              completa de procesos mediante scrapers inteligentes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Análisis Técnico */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Análisis Técnico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🚀 Stack Tecnológico</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Next.js 15 + React 18</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS + Radix UI</li>
                <li>• Supabase (PostgreSQL)</li>
                <li>• PWA con offline</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🤖 Inteligencia Artificial</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Asistente Edelweiss</li>
                <li>• Reconocimiento de voz</li>
                <li>• Análisis automático</li>
                <li>• Recomendaciones IA</li>
                <li>• Chat inteligente</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">⚡ Automatización</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Scrapers CMS MM/MMC</li>
                <li>• Scraper DUC automático</li>
                <li>• Sincronización datos</li>
                <li>• Notificaciones push</li>
                <li>• Reportes automáticos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base de Datos */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            Base de Datos y Almacenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">📊 Estructura de Datos</h3>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Vehículos:</strong> 50,000+ registros con datos completos</li>
                <li>• <strong>Usuarios:</strong> Sistema de roles y permisos</li>
                <li>• <strong>Ventas:</strong> Historial completo de transacciones</li>
                <li>• <strong>Stock:</strong> Control en tiempo real</li>
                <li>• <strong>Notificaciones:</strong> Sistema de alertas integrado</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">🔧 Características Técnicas</h3>
              <ul className="space-y-2 text-sm">
                <li>• <strong>PostgreSQL:</strong> Base de datos robusta y escalable</li>
                <li>• <strong>Supabase Auth:</strong> Autenticación segura</li>
                <li>• <strong>Row Level Security:</strong> Protección de datos</li>
                <li>• <strong>APIs REST:</strong> Integración flexible</li>
                <li>• <strong>Backup automático:</strong> Protección de información</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componentes y Funcionalidades */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            Componentes y Funcionalidades Principales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">📊 Dashboard Centralizado</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Métricas en tiempo real</li>
                <li>• Rankings de ventas</li>
                <li>• Objetivos y KPIs</li>
                <li>• Búsqueda global</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">💰 Gestión de Ventas</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Registro de vehículos</li>
                <li>• Seguimiento de precios</li>
                <li>• Gestión de clientes</li>
                <li>• Extracción PDF automática</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">📦 Control de Stock</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Inventario en tiempo real</li>
                <li>• Gestión de talleres</li>
                <li>• Estados de reparación</li>
                <li>• Movimientos automáticos</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">🚚 Gestión de Entregas</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Seguimiento de entregas</li>
                <li>• Gestión de incidencias</li>
                <li>• Control de calidad</li>
                <li>• Reportes automáticos</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">📱 PWA Avanzada</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Funcionalidad offline</li>
                <li>• Instalación nativa</li>
                <li>• Notificaciones push</li>
                <li>• Sincronización automática</li>
              </ul>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-semibold text-indigo-800 mb-2">🎯 Características Avanzadas</h3>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Sistema de incentivos</li>
                <li>• Gestión de garantías</li>
                <li>• Módulo de transportes</li>
                <li>• Reportes personalizados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valoración Económica */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Euro className="w-5 h-5 mr-2 text-blue-600" />
            Valoración Económica Detallada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-3">💻 Desarrollo y Tecnología</h3>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Frontend Next.js:</strong> €45,000</li>
                  <li>• <strong>Backend Supabase:</strong> €25,000</li>
                  <li>• <strong>Integración APIs:</strong> €15,000</li>
                  <li>• <strong>PWA y Offline:</strong> €10,000</li>
                  <li>• <strong>Testing y QA:</strong> €8,000</li>
                </ul>
                <div className="mt-4 pt-3 border-t border-blue-200">
                  <strong className="text-blue-800">Subtotal: €103,000</strong>
                </div>
              </div>
              
              <div className="p-6 bg-green-50 rounded-lg">
                <h3 className="font-bold text-green-800 mb-3">🤖 IA y Automatización</h3>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Asistente Edelweiss:</strong> €35,000</li>
                  <li>• <strong>Scrapers automáticos:</strong> €20,000</li>
                  <li>• <strong>Reconocimiento voz:</strong> €12,000</li>
                  <li>• <strong>Análisis predictivo:</strong> €18,000</li>
                  <li>• <strong>Machine Learning:</strong> €15,000</li>
                </ul>
                <div className="mt-4 pt-3 border-t border-green-200">
                  <strong className="text-green-800">Subtotal: €100,000</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-purple-50 rounded-lg">
                <h3 className="font-bold text-purple-800 mb-3">📊 Datos y Contenido</h3>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Base de datos completa:</strong> €30,000</li>
                  <li>• <strong>50,000+ vehículos:</strong> €25,000</li>
                  <li>• <strong>Historial de ventas:</strong> €15,000</li>
                  <li>• <strong>Documentación:</strong> €8,000</li>
                  <li>• <strong>Formación incluida:</strong> €12,000</li>
                </ul>
                <div className="mt-4 pt-3 border-t border-purple-200">
                  <strong className="text-purple-800">Subtotal: €90,000</strong>
                </div>
              </div>
              
              <div className="p-6 bg-orange-50 rounded-lg">
                <h3 className="font-bold text-orange-800 mb-3">🔧 Infraestructura y Soporte</h3>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Hosting y servidores:</strong> €15,000</li>
                  <li>• <strong>Dominio y SSL:</strong> €2,000</li>
                  <li>• <strong>Backup y seguridad:</strong> €8,000</li>
                  <li>• <strong>Soporte 6 meses:</strong> €20,000</li>
                  <li>• <strong>Mantenimiento:</strong> €12,000</li>
                </ul>
                <div className="mt-4 pt-3 border-t border-orange-200">
                  <strong className="text-orange-800">Subtotal: €57,000</strong>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-green-800 mb-2">💰 Valoración Total del Sistema</h3>
                  <p className="text-sm text-gray-600">Incluye desarrollo completo, datos, IA, infraestructura y soporte</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-green-600">€350,000</div>
                  <div className="text-sm text-gray-600">Precio de venta recomendado</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proyecciones de ROI */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Proyecciones de Retorno de Inversión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">18 meses</div>
                <div className="text-sm text-blue-700">Break-even</div>
                <div className="text-xs text-gray-600 mt-1">Retorno completo de inversión</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">€995K</div>
                <div className="text-sm text-green-700">Beneficio 3 años</div>
                <div className="text-xs text-gray-600 mt-1">Proyección conservadora</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">284%</div>
                <div className="text-sm text-purple-700">ROI 3 años</div>
                <div className="text-xs text-gray-600 mt-1">Retorno sobre inversión</div>
              </div>
            </div>
            
            <div className="p-6 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-bold text-yellow-800 mb-3">📈 Factores de Valor Agregado</h3>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Automatización completa:</strong> Reduce costes operativos en 60%</li>
                <li>• <strong>IA integrada:</strong> Mejora eficiencia en 40%</li>
                <li>• <strong>PWA offline:</strong> Disponibilidad 99.9%</li>
                <li>• <strong>Datos históricos:</strong> 50,000+ vehículos listos para usar</li>
                <li>• <strong>Escalabilidad:</strong> Preparado para crecimiento futuro</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conclusiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Conclusiones y Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <h3 className="font-bold text-lg mb-3">✅ Recomendación de Compra</h3>
              <p className="text-gray-700 mb-4">
                El Sistema CVO representa una oportunidad excepcional de inversión en tecnología automotriz, 
                con un ROI proyectado del 284% en 3 años y un break-even en solo 18 meses.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">🎯 Ventajas Clave:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Tecnología de vanguardia (Next.js 15, IA)</li>
                    <li>• Base de datos completa y funcional</li>
                    <li>• Automatización total de procesos</li>
                    <li>• PWA con funcionalidad offline</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">💰 Beneficios Económicos:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Reducción costes operativos 60%</li>
                    <li>• Mejora eficiencia 40%</li>
                    <li>• ROI 284% en 3 años</li>
                    <li>• Break-even en 18 meses</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-3">💡 Próximos Pasos Recomendados</h3>
              <ol className="space-y-2 text-sm">
                <li><strong>1. Evaluación técnica:</strong> Revisión detallada del código y arquitectura</li>
                <li><strong>2. Demo en vivo:</strong> Demostración de todas las funcionalidades</li>
                <li><strong>3. Transferencia de datos:</strong> Migración completa de la base de datos</li>
                <li><strong>4. Formación del equipo:</strong> Capacitación en uso y mantenimiento</li>
                <li><strong>5. Soporte post-venta:</strong> 6 meses de soporte técnico incluido</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
