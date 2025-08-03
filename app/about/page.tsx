"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  BookOpen, 
  Code, 
  Car, 
  Package, 
  Camera, 
  Key, 
  AlertTriangle,
  Users,
  BarChart3,
  Settings,
  FileText,
  Building2,
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react"
import { generateManualPDF } from '@/lib/pdf-generator'
import { PROJECT_INFO, TECH_STACK, MANUAL_SECTIONS } from '@/lib/manual-content'

export default function AboutPage() {
  const handleDownloadPDF = () => {
    try {
      generateManualPDF()
    } catch (error) {
      console.error('Error al generar PDF:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header con Logo */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10"></div>
        <div className="relative px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-6">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                  {PROJECT_INFO.name}
                </h1>
                <p className="mt-6 text-xl leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  {PROJECT_INFO.description}
                </p>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Badge variant="secondary" className="text-sm">
                    Versión {PROJECT_INFO.version}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    Desarrollado por {PROJECT_INFO.developer}
                  </Badge>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Vista General
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manual Completo
              </TabsTrigger>
              <TabsTrigger value="tech" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Tecnologías
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Funcionalidades
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-lg">Gestión de Vehículos</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300">
                        Administración completa de la flota con control de estados, mantenimiento y prioridades.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-lg">Entregas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300">
                        Proceso completo de entrega de vehículos con documentación y seguimiento.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <Camera className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <CardTitle className="text-lg">Recogidas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300">
                        Asignación automática de fotógrafos y documentación fotográfica.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                          <Key className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <CardTitle className="text-lg">Gestión de Llaves</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300">
                        Control de movimientos de llaves con confirmaciones automáticas.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-lg">Incidencias</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300">
                        Sistema de gestión de problemas con prioridades y seguimiento.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                          <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <CardTitle className="text-lg">Usuarios</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300">
                        Gestión de roles y permisos con autenticación segura.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-12 text-center">
                  <Button 
                    onClick={handleDownloadPDF}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Descargar Manual Completo
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {MANUAL_SECTIONS.map((section, index) => (
                    <Card key={section.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                            <div className="text-white font-bold text-sm">{index + 1}</div>
                          </div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {section.description}
                        </p>
                        <div className="space-y-2">
                          {section.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="tech" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {TECH_STACK.map((tech, index) => (
                    <Card key={tech.name} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            tech.category === 'frontend' ? 'bg-blue-100 dark:bg-blue-900' :
                            tech.category === 'backend' ? 'bg-green-100 dark:bg-green-900' :
                            tech.category === 'database' ? 'bg-purple-100 dark:bg-purple-900' :
                            'bg-orange-100 dark:bg-orange-900'
                          }`}>
                            <Code className={`h-6 w-6 ${
                              tech.category === 'frontend' ? 'text-blue-600 dark:text-blue-400' :
                              tech.category === 'backend' ? 'text-green-600 dark:text-green-400' :
                              tech.category === 'database' ? 'text-purple-600 dark:text-purple-400' :
                              'text-orange-600 dark:text-orange-400'
                            }`} />
                          </div>
                          <CardTitle className="text-lg">{tech.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-300">
                          {tech.description}
                        </p>
                        <Badge variant="outline" className="mt-3">
                          {tech.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="features" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PROJECT_INFO.features.map((feature, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mt-1">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {feature}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 