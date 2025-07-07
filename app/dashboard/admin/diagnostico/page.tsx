"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bug, Mail, ArrowRightLeft, Users, Database, Settings } from "lucide-react"
import Link from "next/link"

export default function DiagnosticMainPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bug className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Centro de Diagnóstico</h1>
      </div>

      <Alert>
        <Bug className="h-4 w-4" />
        <AlertDescription>
          <strong>Centro de diagnóstico y pruebas del sistema.</strong>
          <br />
          Aquí puedes verificar el estado de todos los componentes del sistema y ejecutar pruebas.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Diagnóstico de Extornos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Extornos
            </CardTitle>
            <CardDescription>Diagnóstico del sistema de extornos y notificaciones automáticas</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/diagnostico/extornos">
              <Button className="w-full">
                <Bug className="h-4 w-4 mr-2" />
                Diagnosticar Extornos
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Diagnóstico de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Sistema de Email
            </CardTitle>
            <CardDescription>Verificar configuración SMTP y envío de notificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/email-config">
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configurar Email
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Diagnóstico de Usuarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios
            </CardTitle>
            <CardDescription>Verificar autenticación y permisos de usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/users">
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Gestionar Usuarios
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Diagnóstico de Base de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Datos
            </CardTitle>
            <CardDescription>Verificar estructura de tablas y conexiones</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/diagnostico-tablas">
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Diagnosticar Tablas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
          <CardDescription>Estado general del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Versión del Sistema:</strong> 2.0.0
            </div>
            <div>
              <strong>Entorno:</strong> {process.env.NODE_ENV || "development"}
            </div>
            <div>
              <strong>Base de Datos:</strong> Supabase PostgreSQL
            </div>
            <div>
              <strong>Autenticación:</strong> Supabase Auth
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
