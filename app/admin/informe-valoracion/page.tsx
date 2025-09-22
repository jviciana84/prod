"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Euro, TrendingUp, Database, Code, Zap, Shield, Users, BarChart3 } from "lucide-react"

export default function InformeValoracionPage() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handlePrintPDF = async () => {
    setIsGeneratingPDF(true)
    
    // Crear una nueva ventana para la impresión
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Informe de Valoración - Sistema CVO</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #2563eb;
              font-size: 2.5rem;
              margin: 0;
            }
            .header p {
              color: #64748b;
              font-size: 1.1rem;
              margin: 10px 0 0 0;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section h2 {
              color: #1e40af;
              font-size: 1.8rem;
              margin-bottom: 15px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .section h3 {
              color: #374151;
              font-size: 1.3rem;
              margin: 20px 0 10px 0;
            }
            .tech-stack {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin: 15px 0;
            }
            .tech-item {
              background: #f8fafc;
              padding: 10px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .features-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
              margin: 15px 0;
            }
            .feature-card {
              background: #f1f5f9;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .valuation-box {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              margin: 20px 0;
            }
            .valuation-box h2 {
              color: white;
              border: none;
              margin-bottom: 10px;
            }
            .valuation-amount {
              font-size: 3rem;
              font-weight: bold;
              margin: 15px 0;
            }
            .valuation-range {
              font-size: 1.2rem;
              opacity: 0.9;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .table th, .table td {
              border: 1px solid #e5e7eb;
              padding: 12px;
              text-align: left;
            }
            .table th {
              background: #f9fafb;
              font-weight: 600;
            }
            .checklist {
              list-style: none;
              padding: 0;
            }
            .checklist li {
              padding: 5px 0;
              padding-left: 25px;
              position: relative;
            }
            .checklist li::before {
              content: "✅";
              position: absolute;
              left: 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #64748b;
            }
            @media print {
              body { margin: 0; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 INFORME TÉCNICO Y VALORACIÓN ECONÓMICA</h1>
            <p>Sistema CVO Dashboard - Aplicación Web Empresarial</p>
            <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
          </div>

          <div class="section">
            <h2>🎯 RESUMEN EJECUTIVO</h2>
            <p><strong>Sistema CVO Dashboard</strong> es una aplicación web completa de gestión empresarial para el sector automotriz, desarrollada con tecnologías modernas y arquitectura escalable. El sistema integra múltiples módulos especializados para la gestión de ventas, stock, entregas, certificaciones y automatización de procesos.</p>
          </div>

          <div class="section">
            <h2>🏗️ ANÁLISIS TÉCNICO</h2>
            <h3>Stack Tecnológico</h3>
            <div class="tech-stack">
              <div class="tech-item"><strong>Frontend:</strong> Next.js 15.2.4 + React 18 + TypeScript</div>
              <div class="tech-item"><strong>Backend:</strong> Next.js API Routes + Supabase</div>
              <div class="tech-item"><strong>Base de Datos:</strong> PostgreSQL (Supabase)</div>
              <div class="tech-item"><strong>UI/UX:</strong> Tailwind CSS + Radix UI + Framer Motion</div>
              <div class="tech-item"><strong>Autenticación:</strong> Supabase Auth</div>
              <div class="tech-item"><strong>Deployment:</strong> Vercel + PWA habilitado</div>
            </div>
            
            <h3>Arquitectura y Patrones</h3>
            <ul class="checklist">
              <li>Arquitectura moderna: Next.js App Router</li>
              <li>Separación de responsabilidades: Server/Client Components</li>
              <li>Sistema de permisos robusto: RLS + Roles granulares</li>
              <li>Hooks personalizados: Reutilización de lógica</li>
              <li>Componentes modulares: UI Library personalizada</li>
              <li>Caching inteligente: React Cache + Supabase optimizations</li>
            </ul>
          </div>

          <div class="section">
            <h2>🚀 FUNCIONALIDADES PRINCIPALES</h2>
            <div class="features-grid">
              <div class="feature-card">
                <h3>📊 Dashboard Centralizado</h3>
                <ul>
                  <li>Métricas en tiempo real</li>
                  <li>Rankings de ventas y financiación</li>
                  <li>Objetivos y KPIs</li>
                  <li>Actividad reciente</li>
                  <li>Búsqueda global inteligente</li>
                </ul>
              </div>
              <div class="feature-card">
                <h3>💰 Gestión de Ventas</h3>
                <ul>
                  <li>Registro completo de vehículos</li>
                  <li>Seguimiento de precios y comisiones</li>
                  <li>Gestión de clientes</li>
                  <li>Extracción automática de PDFs</li>
                  <li>Validación de pedidos</li>
                </ul>
              </div>
              <div class="feature-card">
                <h3>📦 Control de Stock</h3>
                <ul>
                  <li>Inventario en tiempo real</li>
                  <li>Gestión de talleres</li>
                  <li>Estados de pintura/mecánica</li>
                  <li>Reportes de rotación</li>
                  <li>Movimientos automáticos</li>
                </ul>
              </div>
              <div class="feature-card">
                <h3>🚚 Sistema de Entregas</h3>
                <ul>
                  <li>Programación de entregas</li>
                  <li>Seguimiento de ubicaciones</li>
                  <li>Gestión de incidencias</li>
                  <li>Notificaciones automáticas</li>
                  <li>Reportes de estado</li>
                </ul>
              </div>
              <div class="feature-card">
                <h3>📜 Certificaciones CVO</h3>
                <ul>
                  <li>Gestión de certificados</li>
                  <li>Estados de trámites</li>
                  <li>Documentación automática</li>
                  <li>Integración con sistemas externos</li>
                </ul>
              </div>
              <div class="feature-card">
                <h3>🤖 Automatización Avanzada</h3>
                <ul>
                  <li>Asistente IA "Edelweiss"</li>
                  <li>Scrapers automáticos CMS/DUC</li>
                  <li>Sistema de notificaciones</li>
                  <li>Reportes automatizados</li>
                  <li>Procesamiento de documentos</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>🗄️ BASE DE DATOS</h2>
            <h3>Tablas Principales (25+ tablas)</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Tabla</th>
                  <th>Propósito</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>sales_vehicles</td><td>Gestión de ventas</td></tr>
                <tr><td>nuevas_entradas</td><td>Control de stock</td></tr>
                <tr><td>entregas</td><td>Programación de entregas</td></tr>
                <tr><td>profiles</td><td>Usuarios y roles</td></tr>
                <tr><td>pdf_extracted_data</td><td>Datos extraídos automáticamente</td></tr>
                <tr><td>incidencias_historial</td><td>Seguimiento de problemas</td></tr>
                <tr><td>garantias_brutas_mm/mmc</td><td>Datos de garantías</td></tr>
                <tr><td>recogidas_historial</td><td>Sistema de recogidas</td></tr>
                <tr><td>incentivos</td><td>Gestión de comisiones</td></tr>
              </tbody>
            </table>
            
            <h3>Características de BD</h3>
            <ul class="checklist">
              <li>Seguridad: Row Level Security (RLS)</li>
              <li>Escalabilidad: Índices optimizados</li>
              <li>Integridad: Foreign keys y constraints</li>
              <li>Auditoría: Timestamps automáticos</li>
              <li>Backup: Automático en Supabase</li>
            </ul>
          </div>

          <div class="section">
            <h2>🧩 COMPONENTES Y MÓDULOS</h2>
            <div class="features-grid">
              <div class="feature-card">
                <h3>Componentes UI (76 archivos)</h3>
                <ul>
                  <li>Sistema de diseño completo</li>
                  <li>Componentes reutilizables</li>
                  <li>Temas claro/oscuro</li>
                  <li>Responsive design</li>
                  <li>Accesibilidad WCAG</li>
                </ul>
              </div>
              <div class="feature-card">
                <h3>Módulos Especializados</h3>
                <ul>
                  <li>Dashboard: 21 componentes</li>
                  <li>Reports: 16 componentes</li>
                  <li>Sales: 10 componentes</li>
                  <li>Vehicles: 13 componentes</li>
                  <li>Transport: 8 componentes</li>
                  <li>Admin: 13 componentes</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>📱 CARACTERÍSTICAS AVANZADAS</h2>
            <div class="features-grid">
              <div class="feature-card">
                <h3>PWA (Progressive Web App)</h3>
                <ul>
                  <li>Instalable en dispositivos</li>
                  <li>Funciona offline</li>
                  <li>Notificaciones push</li>
                  <li>Actualizaciones automáticas</li>
                </ul>
              </div>
              <div class="feature-card">
                <h3>Integración de IA</h3>
                <ul>
                  <li>Chat inteligente con contexto completo</li>
                  <li>Reconocimiento de voz</li>
                  <li>Análisis predictivo</li>
                  <li>Búsqueda semántica</li>
                </ul>
              </div>
              <div class="feature-card">
                <h3>Automatización</h3>
                <ul>
                  <li>Scrapers programados (8h intervalos)</li>
                  <li>Sistema de notificaciones</li>
                  <li>Reportes automáticos</li>
                  <li>Procesamiento de documentos</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>💰 VALORACIÓN ECONÓMICA</h2>
            <h3>Método de Valoración por Costo de Desarrollo</h3>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Horas</th>
                  <th>Precio/h</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Desarrollo Frontend/Backend</td><td>1,250h</td><td>€50</td><td>€62,500</td></tr>
                <tr><td>Funcionalidades Avanzadas</td><td>1,000h</td><td>€55</td><td>€55,000</td></tr>
                <tr><td>Base de Datos y Arquitectura</td><td>350h</td><td>€55</td><td>€19,250</td></tr>
                <tr><td>Testing y QA</td><td>300h</td><td>€45</td><td>€13,500</td></tr>
                <tr><td><strong>TOTAL</strong></td><td><strong>2,900h</strong></td><td></td><td><strong>€150,250</strong></td></tr>
              </tbody>
            </table>
          </div>

          <div class="valuation-box">
            <h2>🎯 VALORACIÓN FINAL RECOMENDADA</h2>
            <div class="valuation-amount">€200,000</div>
            <div class="valuation-range">Rango: €180,000 - €250,000</div>
          </div>

          <div class="section">
            <h2>📋 FACTORES QUE JUSTIFICAN EL VALOR</h2>
            <ul class="checklist">
              <li>Complejidad técnica alta: Stack moderno + arquitectura escalable</li>
              <li>Funcionalidades avanzadas: IA + automatización + PWA</li>
              <li>Base de datos robusta: 25+ tablas + seguridad avanzada</li>
              <li>Código de calidad: TypeScript + patrones modernos</li>
              <li>Escalabilidad: Preparado para crecimiento</li>
              <li>Mantenibilidad: Código bien estructurado y documentado</li>
            </ul>
          </div>

          <div class="section">
            <h2>💡 RECOMENDACIONES DE VENTA</h2>
            <div class="features-grid">
              <div class="feature-card">
                <h3>Estrategia de Precio</h3>
                <ul>
                  <li><strong>Precio inicial:</strong> €200,000</li>
                  <li><strong>Precio negociable:</strong> €180,000 - €220,000</li>
                  <li><strong>Incluir:</strong> Documentación + soporte 3 meses</li>
                  <li><strong>Opcional:</strong> Formación + mantenimiento anual</li>
                </ul>
              </div>
              <div class="feature-card">
                <h3>ROI Esperado</h3>
                <ul>
                  <li><strong>Retorno de inversión:</strong> 12-18 meses</li>
                  <li><strong>Valor inmediato:</strong> Listo para producción</li>
                  <li><strong>Escalabilidad:</strong> Crecimiento sin límites</li>
                  <li><strong>Mantenimiento:</strong> Bajo costo operativo</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>📋 CONCLUSIONES</h2>
            <p>El <strong>Sistema CVO Dashboard</strong> representa una solución empresarial completa y moderna con un valor económico estimado de <strong>€180,000 - €250,000</strong>. Su arquitectura escalable, funcionalidades avanzadas de IA y automatización, junto con su robusta base de datos, lo posicionan como una inversión valiosa para empresas del sector automotriz que buscan digitalizar y optimizar sus procesos operativos.</p>
            <p>La aplicación está lista para producción y puede generar valor inmediato para el comprador, con un ROI esperado de 12-18 meses dependiendo del volumen de operaciones.</p>
          </div>

          <div class="footer">
            <p>Informe generado el ${new Date().toLocaleDateString('es-ES')} - Sistema CVO Dashboard</p>
          </div>
        </body>
        </html>
      `)
      
      printWindow.document.close()
      
      // Esperar a que se cargue el contenido y luego imprimir
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
        setIsGeneratingPDF(false)
      }, 1000)
    } else {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            📊 Informe de Valoración
          </h1>
          <p className="text-gray-600 text-lg">
            Sistema CVO Dashboard - Análisis Técnico y Económico
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => window.open('/admin/informe-detallado', '_blank')}
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

      {/* Resumen Ejecutivo */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            Resumen Ejecutivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">
            <strong>Sistema CVO Dashboard</strong> es una aplicación web completa de gestión empresarial para el sector automotriz, 
            desarrollada con tecnologías modernas y arquitectura escalable. El sistema integra múltiples módulos especializados 
            para la gestión de ventas, stock, entregas, certificaciones y automatización de procesos.
          </p>
        </CardContent>
      </Card>

      {/* Valoración Principal */}
      <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">🎯 Valoración Final Recomendada</h2>
          <div className="text-6xl font-bold mb-4">€200,000</div>
          <div className="text-xl opacity-90">Rango: €180,000 - €250,000</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Stack Tecnológico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="w-5 h-5 mr-2 text-blue-600" />
              Stack Tecnológico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Frontend</span>
                <Badge variant="secondary">Next.js 15 + React 18 + TypeScript</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Backend</span>
                <Badge variant="secondary">Next.js API + Supabase</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Base de Datos</span>
                <Badge variant="secondary">PostgreSQL (Supabase)</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">UI/UX</span>
                <Badge variant="secondary">Tailwind + Radix UI</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="font-medium">Deployment</span>
                <Badge variant="secondary">Vercel + PWA</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Base de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2 text-blue-600" />
              Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Total de tablas:</span>
                <Badge className="bg-blue-100 text-blue-800">25+ tablas</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Seguridad:</span>
                <Badge className="bg-green-100 text-green-800">RLS habilitado</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Escalabilidad:</span>
                <Badge className="bg-purple-100 text-purple-800">Índices optimizados</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Backup:</span>
                <Badge className="bg-orange-100 text-orange-800">Automático</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funcionalidades Principales */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Funcionalidades Principales
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
              <h3 className="font-semibold text-orange-800 mb-2">🚚 Sistema de Entregas</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Programación automática</li>
                <li>• Seguimiento de ubicaciones</li>
                <li>• Gestión de incidencias</li>
                <li>• Notificaciones automáticas</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">🤖 Automatización IA</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Asistente IA "Edelweiss"</li>
                <li>• Scrapers automáticos</li>
                <li>• Procesamiento de documentos</li>
                <li>• Reportes automatizados</li>
              </ul>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-semibold text-indigo-800 mb-2">📱 PWA Avanzada</h3>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Instalable en dispositivos</li>
                <li>• Funciona offline</li>
                <li>• Notificaciones push</li>
                <li>• Actualizaciones automáticas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componentes y Módulos */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Componentes y Módulos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Componentes UI (76 archivos)</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Sistema de diseño completo
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Componentes reutilizables
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Temas claro/oscuro
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                  Responsive design
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Accesibilidad WCAG
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Módulos Especializados</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="font-bold text-blue-800">Dashboard</div>
                  <div className="text-sm text-blue-600">21 componentes</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="font-bold text-green-800">Reports</div>
                  <div className="text-sm text-green-600">16 componentes</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <div className="font-bold text-purple-800">Sales</div>
                  <div className="text-sm text-purple-600">10 componentes</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <div className="font-bold text-orange-800">Vehicles</div>
                  <div className="text-sm text-orange-600">13 componentes</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <div className="font-bold text-red-800">Transport</div>
                  <div className="text-sm text-red-600">8 componentes</div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-center">
                  <div className="font-bold text-indigo-800">Admin</div>
                  <div className="text-sm text-indigo-600">13 componentes</div>
                </div>
              </div>
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Categoría</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Horas</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Precio/h</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-3">Desarrollo Frontend/Backend</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">1,250h</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">€50</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€62,500</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">Funcionalidades Avanzadas</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">1,000h</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">€55</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€55,000</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3">Base de Datos y Arquitectura</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">350h</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">€55</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€19,250</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">Testing y QA</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">300h</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">€45</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€13,500</td>
                </tr>
                <tr className="bg-blue-100 font-bold">
                  <td className="border border-gray-300 px-4 py-3">TOTAL</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">2,900h</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-blue-800">€150,250</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Factores de Valor */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Factores que Justifican el Valor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Complejidad Técnica Alta</h4>
                  <p className="text-sm text-gray-600">Stack moderno + arquitectura escalable</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Funcionalidades Avanzadas</h4>
                  <p className="text-sm text-gray-600">IA + automatización + PWA</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Database className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Base de Datos Robusta</h4>
                  <p className="text-sm text-gray-600">25+ tablas + seguridad avanzada</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Code className="w-5 h-5 text-orange-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Código de Calidad</h4>
                  <p className="text-sm text-gray-600">TypeScript + patrones modernos</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Escalabilidad</h4>
                  <p className="text-sm text-gray-600">Preparado para crecimiento</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Mantenibilidad</h4>
                  <p className="text-sm text-gray-600">Código bien estructurado y documentado</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Recomendaciones de Venta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 text-blue-800">Estrategia de Precio</h3>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span>Precio inicial:</span>
                  <Badge className="bg-blue-600">€200,000</Badge>
                </li>
                <li className="flex justify-between">
                  <span>Precio negociable:</span>
                  <Badge variant="outline">€180,000 - €220,000</Badge>
                </li>
                <li className="flex justify-between">
                  <span>Incluir:</span>
                  <span className="text-sm">Documentación + soporte 3 meses</span>
                </li>
                <li className="flex justify-between">
                  <span>Opcional:</span>
                  <span className="text-sm">Formación + mantenimiento anual</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 text-green-800">ROI Esperado</h3>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span>Retorno de inversión:</span>
                  <Badge className="bg-green-600">12-18 meses</Badge>
                </li>
                <li className="flex justify-between">
                  <span>Valor inmediato:</span>
                  <Badge variant="outline">Listo para producción</Badge>
                </li>
                <li className="flex justify-between">
                  <span>Escalabilidad:</span>
                  <span className="text-sm">Crecimiento sin límites</span>
                </li>
                <li className="flex justify-between">
                  <span>Mantenimiento:</span>
                  <span className="text-sm">Bajo costo operativo</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conclusiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Conclusiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed mb-4">
            El <strong>Sistema CVO Dashboard</strong> representa una solución empresarial completa y moderna con un valor económico estimado de <strong>€180,000 - €250,000</strong>. Su arquitectura escalable, funcionalidades avanzadas de IA y automatización, junto con su robusta base de datos, lo posicionan como una inversión valiosa para empresas del sector automotriz que buscan digitalizar y optimizar sus procesos operativos.
          </p>
          <p className="text-lg leading-relaxed">
            La aplicación está lista para producción y puede generar valor inmediato para el comprador, con un ROI esperado de 12-18 meses dependiendo del volumen de operaciones.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
