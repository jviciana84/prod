"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Map, Network, GitBranch, Zap, AlertCircle, Battery, CheckCircle2, Key, AlertTriangle, MessageSquare, Printer, Database, FolderTree, ChevronRight, ChevronDown, BarChart3, FileText, Code2, PanelsTopLeft, Server, Palette, FileCode2, Mail, ScanSearch, X } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ScrollIndicator } from "@/components/ui/scroll-indicator"

// Estructura completa de páginas del sistema
const pagesStructure = {
  "Dashboard Principal": {
    icon: "LayoutDashboard",
    pages: [
      { name: "Dashboard", path: "/dashboard", description: "Panel principal con vista general del sistema" }
    ]
  },
  "Gestión de Vehículos": {
    icon: "Car",
    pages: [
      { name: "Stock (Vehicles)", path: "/dashboard/vehicles", description: "Tabla principal de vehículos en stock", tables: ["stock", "fotos", "sales_vehicles"], triggers: ["sync_duc_to_stock", "delete_stock_on_delivery"] },
      { name: "DUC Scraper", path: "/dashboard/duc-scraper", description: "Datos del scraper DUC - Fuente de verdad", tables: ["duc_scraper", "battery_control"], triggers: ["sync_duc_to_stock", "sync_duc_to_nuevas_entradas"] },
      { name: "Nuevas Entradas", path: "/dashboard/nuevas-entradas", description: "Registro de vehículos nuevos antes de recepción física", tables: ["nuevas_entradas", "stock", "fotos"], triggers: ["nuevas_entradas_to_stock", "handle_vehicle_received"] },
      { name: "Añadir Nueva Entrada", path: "/dashboard/nuevas-entradas/add", description: "Formulario para crear nuevas entradas" },
      { name: "Control de Baterías", path: "/dashboard/vehiculos/baterias", description: "Monitoreo de carga de vehículos BEV/PHEV", tables: ["battery_control", "battery_control_config", "duc_scraper"] },
      { name: "Gestión de Vehículos", path: "/dashboard/vehicles/gestion", description: "Panel de gestión avanzada" },
      { name: "Gestión (Vehiculos)", path: "/dashboard/vehiculos/gestion", description: "Gestión completa de flota" },
      { name: "Tipos de Gasto", path: "/dashboard/vehicles/expense-types", description: "Configuración de tipos de gasto", tables: ["expense_types"] },
      { name: "Estadísticas Vehículos", path: "/dashboard/vehicles/stats", description: "Estadísticas y métricas de vehículos" },
      { name: "Detalle Vehículo", path: "/dashboard/vehicles/[id]", description: "Vista detallada de un vehículo específico" },
      { name: "Movimientos", path: "/dashboard/vehicles/movements/[licensePlate]", description: "Historial de movimientos por matrícula" }
    ]
  },
  "Fotografías": {
    icon: "Camera",
    pages: [
      { name: "Fotos", path: "/dashboard/photos", description: "Gestión de fotografías de vehículos", tables: ["fotos", "stock"], triggers: ["sync_body_status_to_paint_status", "sync_sales_to_fotos_vendido"] },
      { name: "Asignar Fotógrafo", path: "/dashboard/photos/asignar", description: "Asignación manual de fotógrafos" },
      { name: "Asignación (Assignment)", path: "/dashboard/photos/assignment", description: "Sistema de asignación automática" },
      { name: "Asignaciones", path: "/dashboard/photos/assignments", description: "Vista de todas las asignaciones" },
      { name: "Estadísticas Fotos", path: "/dashboard/photos/stats", description: "Métricas de fotografías" },
      { name: "Resumen Fotógrafos", path: "/dashboard/photos/summary", description: "Resumen por fotógrafo" },
      { name: "Ventas Prematuras (Photos)", path: "/dashboard/photos/ventas-prematuras", description: "Vehículos vendidos sin fotos completas" },
      { name: "Diagnóstico Fotos", path: "/dashboard/photos/diagnostico", description: "Debug de sistema de fotos" },
      { name: "Diagnóstico Asignación", path: "/dashboard/photos/diagnostico-asignacion", description: "Debug de asignaciones" },
      { name: "Test Fotos", path: "/dashboard/photos/test", description: "Página de pruebas" }
    ]
  },
  "Ventas": {
    icon: "DollarSign",
    pages: [
      { name: "Ventas", path: "/dashboard/ventas", description: "Gestión de ventas de vehículos", tables: ["sales_vehicles", "stock", "entregas", "incentivos"], triggers: ["sync_stock_on_sale_insert", "sync_stock_on_sale_delete"] },
      { name: "Añadir Venta", path: "/dashboard/ventas/add", description: "Formulario de nueva venta" },
      { name: "Subir PDF", path: "/dashboard/ventas/upload-pdf", description: "Carga de PDFs de venta para OCR", tables: ["pdf_extracted_data"] },
      { name: "Estadísticas Ventas", path: "/dashboard/ventas/stats", description: "Métricas de ventas" },
      { name: "Validados", path: "/dashboard/validados", description: "Pedidos validados - Copia inmutable", tables: ["pedidos_validados", "sales_vehicles"] },
      { name: "Ventas Profesionales", path: "/dashboard/ventas-profesionales", description: "Ventas a profesionales", tables: ["professional_sales"] }
    ]
  },
  "Entregas": {
    icon: "Truck",
    pages: [
      { name: "Entregas", path: "/dashboard/entregas", description: "Gestión de entregas de vehículos", tables: ["entregas", "sales_vehicles", "incidencias_historial"], triggers: ["delete_stock_on_delivery"] },
      { name: "Informes de Entregas", path: "/dashboard/entregas/informes", description: "Informes detallados de entregas" },
      { name: "Diagnóstico Entregas", path: "/dashboard/entregas/diagnostico", description: "Debug de entregas" },
      { name: "Detalle Entrega", path: "/dashboard/entregas/[id]", description: "Vista detallada de una entrega" },
      { name: "Entregas Admin", path: "/dashboard/entregas-admin", description: "Panel admin de entregas" },
      { name: "Entregas Fix", path: "/dashboard/entregas-fix", description: "Corrección de entregas" },
      { name: "Confirmar Entrega", path: "/confirmar-entrega", description: "Confirmación de entrega (pública)" }
    ]
  },
  "Incentivos": {
    icon: "Award",
    pages: [
      { name: "Incentivos", path: "/dashboard/incentivos", description: "Gestión de incentivos comerciales", tables: ["incentivos", "garantias_brutas_mm", "garantias_brutas_mmc"], triggers: ["auto_update_garantia_incentivos"] },
      { name: "Configurar Incentivos", path: "/dashboard/incentivos/config", description: "Configuración de incentivos" },
      { name: "Incentivos (Alt)", path: "/incentivos", description: "Vista alternativa de incentivos" },
      { name: "Config Incentivos (Alt)", path: "/incentivos/config", description: "Configuración alternativa" }
    ]
  },
  "Llaves y Documentos": {
    icon: "Key",
    pages: [
      { name: "Llaves y Documentos", path: "/dashboard/llaves", description: "Gestión completa de llaves y documentación", tables: ["vehicle_keys", "vehicle_documents", "key_movements", "document_movements", "key_document_requests"] },
      { name: "Historial Llaves", path: "/dashboard/llaves/historial", description: "Historial de movimientos" },
      { name: "Incidencias Llaves", path: "/dashboard/llaves/incidencias", description: "Incidencias relacionadas con llaves/docs" },
      { name: "Diagnóstico Incidencias", path: "/dashboard/llaves/diagnostico-incidencias", description: "Debug de incidencias" },
      { name: "Debug Card", path: "/dashboard/llaves/debug-card", description: "Debug de tarjetas" }
    ]
  },
  "Recogidas": {
    icon: "Package",
    pages: [
      { name: "Recogidas", path: "/dashboard/recogidas", description: "Solicitudes de recogida de documentación", tables: ["recogidas_historial"] },
      { name: "Configuración Recogidas", path: "/dashboard/recogidas/configuracion", description: "Configurar centros y opciones" },
      { name: "Seguimiento", path: "/dashboard/recogidas/seguimiento", description: "Seguimiento de recogidas" }
    ]
  },
  "Soporte e Incidencias": {
    icon: "Headphones",
    pages: [
      { name: "Soporte (Público)", path: "/soporte", description: "Portal público de soporte para clientes", tables: ["soporte_tickets", "entregas", "incidencias_historial"] },
      { name: "Extornos", path: "/dashboard/extornos", description: "Gestión de extornos y devoluciones", tables: ["extornos"] },
      { name: "Extornos Test", path: "/dashboard/extornos/test", description: "Pruebas de extornos" },
      { name: "Confirmación Extorno", path: "/extornos/confirmacion", description: "Confirmación pública de extorno" },
      { name: "Movimientos Pendientes", path: "/dashboard/movimientos-pendientes", description: "Movimientos pendientes de resolver" }
    ]
  },
  "Reportes": {
    icon: "BarChart",
    pages: [
      { name: "Reportes", path: "/dashboard/reports", description: "Centro de reportes del sistema" },
      { name: "Días Preparación VO", path: "/dashboard/reports/dias-preparacion-vo", description: "Análisis de tiempos de preparación" },
      { name: "Ventas Mensual", path: "/dashboard/reports/ventas-mensual", description: "Reporte mensual de ventas" }
    ]
  },
  "Noticias": {
    icon: "Newspaper",
    pages: [
      { name: "Noticias", path: "/dashboard/noticias", description: "Noticias del sector BMW", tables: ["bmw_noticias"] }
    ]
  },
  "Tasaciones (Público)": {
    icon: "FileText",
    pages: [
      { name: "Tasación", path: "/tasacion/[advisorSlug]", description: "Formulario público de tasación", tables: ["tasaciones", "advisor_links"] },
      { name: "Tasación Completada", path: "/tasacion/completada", description: "Confirmación de tasación enviada" },
      { name: "Test PDF Tasación", path: "/tasacion/test-pdf", description: "Prueba de PDF de tasación" },
      { name: "Tasaciones (Dashboard)", path: "/dashboard/tasaciones", description: "Panel de gestión de tasaciones" }
    ]
  },
  "OCR Scanner": {
    icon: "Scan",
    pages: [
      { name: "OCR Scanner", path: "/dashboard/ocr-scanner", description: "Sistema de escaneo OCR de documentos" },
      { name: "OCR Mobile", path: "/dashboard/ocr-scanner/mobile", description: "Scanner móvil" },
      { name: "OCR Coming Soon", path: "/dashboard/ocr-scanner/coming-soon", description: "Próximamente" },
      { name: "OCR Test", path: "/dashboard/ocr-scanner/ocr_test", description: "Pruebas OCR" }
    ]
  },
  "Configuración": {
    icon: "Settings",
    pages: [
      { name: "Configuración", path: "/dashboard/settings", description: "Configuración del sistema", tables: ["user_preferences", "footer_settings"] },
      { name: "Notificaciones", path: "/dashboard/notifications", description: "Centro de notificaciones" },
      { name: "Config Notificaciones", path: "/dashboard/notifications/settings", description: "Configurar notificaciones" },
      { name: "Test Notificaciones", path: "/dashboard/notifications/test", description: "Probar notificaciones" },
      { name: "Diagnóstico Notificaciones", path: "/dashboard/notifications/diagnostico", description: "Debug de notificaciones" },
      { name: "Perfil", path: "/dashboard/profile", description: "Perfil de usuario", tables: ["profiles"] },
      { name: "Perfil (Alt)", path: "/profile", description: "Perfil alternativo" },
      { name: "Avatar", path: "/profile/avatar", description: "Gestión de avatar" },
      { name: "Directorio", path: "/dashboard/directory", description: "Directorio de usuarios" },
      { name: "Usuario Directorio", path: "/dashboard/directory/[userId]", description: "Perfil público de usuario" }
    ]
  },
  "Administración": {
    icon: "Shield",
    pages: [
      { name: "Usuarios", path: "/dashboard/admin/users", description: "Gestión de usuarios", tables: ["profiles"] },
      { name: "Usuarios (Alt)", path: "/admin/users", description: "Panel alternativo de usuarios" },
      { name: "User Mappings", path: "/admin/user-mappings", description: "Mapeo de usuarios" },
      { name: "Soporte Admin", path: "/dashboard/admin/soporte", description: "Panel admin de soporte" },
      { name: "Config Email Soporte", path: "/dashboard/admin/soporte-email-config", description: "Configurar emails de soporte" },
      { name: "Avatares", path: "/dashboard/admin/avatares", description: "Gestión de avatares" },
      { name: "Avatars", path: "/dashboard/admin/avatars", description: "Sistema de avatares" },
      { name: "Diagnóstico Avatars", path: "/dashboard/admin/avatars/diagnostico", description: "Debug de avatares" },
      { name: "Migración Avatars", path: "/dashboard/admin/avatars/migration", description: "Migrar avatares" },
      { name: "Configuración Admin", path: "/dashboard/admin/configuracion", description: "Configuración general" },
      { name: "Email Config", path: "/dashboard/admin/email-config", description: "Configurar emails del sistema" },
      { name: "Footer Messages", path: "/dashboard/admin/footer-messages", description: "Mensajes del footer" },
      { name: "Footer Settings", path: "/dashboard/admin/footer-messages/settings", description: "Configurar footer" },
      { name: "Conversaciones", path: "/dashboard/admin/conversaciones", description: "Conversaciones del sistema" },
      { name: "Objetivos", path: "/dashboard/admin/objetivos", description: "Gestión de objetivos" },
      { name: "Blob Files", path: "/dashboard/admin/blob-files", description: "Gestión de archivos en blob" },
      { name: "Column Mapping", path: "/dashboard/admin/column-mapping", description: "Mapeo de columnas para importación" },
      { name: "Carga Masiva", path: "/dashboard/admin/carga-masiva", description: "Importación masiva de datos" },
      { name: "Migrate Dates", path: "/dashboard/admin/migrate-dates", description: "Migración de fechas" },
      { name: "Update Vehicle Types", path: "/dashboard/admin/update-vehicle-types", description: "Actualizar tipos de vehículos" },
      { name: "Cleanup", path: "/dashboard/admin/cleanup", description: "Limpieza de datos" },
      { name: "Diagnóstico Admin", path: "/dashboard/admin/diagnostico", description: "Panel de diagnóstico" },
      { name: "Diagnóstico Extornos", path: "/dashboard/admin/diagnostico/extornos", description: "Debug de extornos" },
      { name: "Payment Method Diagnostic", path: "/dashboard/admin/payment-method-diagnostic", description: "Diagnóstico de métodos de pago" },
      { name: "Admin Notifications", path: "/dashboard/admin/notifications", description: "Notificaciones admin" }
    ]
  },
  "Herramientas del Sistema": {
    icon: "Wrench",
    pages: [
      { name: "Mapa de Flujo", path: "/dashboard/mapa-flujo", description: "Esta página - Documentación visual del sistema" },
      { name: "Columnas", path: "/dashboard/columnas", description: "Gestión de columnas de tablas" },
      { name: "Filter Config", path: "/dashboard/filter-config", description: "Configuración de filtros", tables: ["filter_configs"] },
      { name: "Diagnóstico Tablas", path: "/dashboard/diagnostico-tablas", description: "Diagnóstico de estructura de tablas" },
      { name: "Diagnostico", path: "/diagnostico", description: "Diagnóstico general del sistema" },
      { name: "Automatic Cleanup", path: "/dashboard/automatic-cleanup", description: "Limpieza automática de datos" },
      { name: "Cleanup Stock", path: "/dashboard/cleanup-stock", description: "Limpieza de stock" },
      { name: "Reserved Sync", path: "/dashboard/reserved-sync", description: "Sincronización de reservas" },
      { name: "Verify Sync", path: "/dashboard/verify-sync", description: "Verificar sincronización" },
      { name: "Images", path: "/dashboard/images", description: "Gestión de imágenes" },
      { name: "Images Gallery", path: "/dashboard/images/gallery", description: "Galería de imágenes" },
      { name: "Demo SVG Mapper", path: "/demo-svg-mapper", description: "Demo de mapeo SVG" },
      { name: "Test Map", path: "/dashboard/test-map", description: "Mapa de pruebas" },
      { name: "PDF Debug", path: "/dashboard/pdf-debug", description: "Debug de PDFs" },
      { name: "Test Save PDF", path: "/dashboard/test-save-pdf", description: "Prueba guardar PDF" },
      { name: "Debug Coordenadas", path: "/dashboard/debug-coordenadas", description: "Debug de coordenadas" },
      { name: "Debug Auto Resolve", path: "/dashboard/debug-auto-resolve", description: "Debug de resolución automática" },
      { name: "Validación Debug", path: "/dashboard/validacion-debug", description: "Debug de validaciones" }
    ]
  },
  "Páginas Públicas": {
    icon: "Globe",
    pages: [
      { name: "About", path: "/about", description: "Acerca de la aplicación" },
      { name: "Política de Privacidad", path: "/politica-privacidad", description: "Política de privacidad" },
      { name: "Reset Password", path: "/reset-password", description: "Restablecer contraseña" },
      { name: "Auth Reset Password", path: "/auth/reset-password", description: "Confirmar nueva contraseña" },
      { name: "Force Password Change", path: "/force-password-change", description: "Cambio forzado de contraseña" },
      { name: "Dashboard Cliente", path: "/dashboard-cliente", description: "Panel del cliente" }
    ]
  },
  "Notificaciones Push": {
    icon: "Bell",
    pages: [
      { name: "Activate Push", path: "/activate-push", description: "Activar notificaciones push" },
      { name: "Force Activate Push", path: "/force-activate-push", description: "Forzar activación push" },
      { name: "Check Subscriptions", path: "/check-my-subscriptions", description: "Verificar suscripciones" },
      { name: "Clear SW", path: "/clear-sw", description: "Limpiar Service Worker" },
      { name: "Process Emails", path: "/process-emails", description: "Procesar emails" }
    ]
  },
  "Debug & Testing": {
    icon: "Bug",
    collapsed: true,
    pages: [
      { name: "Debug Auth", path: "/debug-auth", description: "Debug de autenticación" },
      { name: "Debug Session", path: "/debug-session", description: "Debug de sesión" },
      { name: "Debug Roles", path: "/debug-roles", description: "Debug de roles" },
      { name: "Debug SMTP", path: "/debug-smtp", description: "Debug de SMTP" },
      { name: "Debug SMTP Config", path: "/debug-smtp-config", description: "Config SMTP debug" },
      { name: "Debug Stock Client", path: "/debug-stock-client", description: "Debug stock cliente" },
      { name: "Debug Table Structure", path: "/debug-table-structure", description: "Debug estructura tablas" },
      { name: "Debug Vehicle Data", path: "/debug-vehicle-data", description: "Debug datos vehículos" },
      { name: "Debug VAPID Keys", path: "/debug-vapid-keys", description: "Debug claves VAPID" },
      { name: "Debug User Lookup", path: "/debug-user-lookup", description: "Debug búsqueda usuarios" },
      { name: "Debug Notifications", path: "/debug-notifications", description: "Debug notificaciones" },
      { name: "Debug Push Processor", path: "/debug-push-processor", description: "Debug procesador push" },
      { name: "Debug Subscriptions", path: "/debug-subscriptions", description: "Debug suscripciones" },
      { name: "Debug Subscription Creation", path: "/debug-subscription-creation", description: "Debug creación suscripciones" },
      { name: "Debug Add Column", path: "/debug-add-column", description: "Debug añadir columna" },
      { name: "Debug Sales Dashboard", path: "/debug-sales-dashboard", description: "Debug dashboard ventas" },
      { name: "Debug Test", path: "/debug-test", description: "Pruebas debug" },
      { name: "Notifications Debug", path: "/notifications-debug", description: "Debug notificaciones" },
      { name: "Notifications Fix", path: "/notifications-fix", description: "Fix notificaciones" },
      { name: "Notifications Simple", path: "/notifications-simple", description: "Notificaciones simples" },
      { name: "Debug Recogidas Config", path: "/debug-fix-recogidas-config", description: "Debug config recogidas" },
      { name: "Debug Recogidas Email", path: "/debug-recogidas-email", description: "Debug email recogidas" },
      { name: "Debug Recogidas Historial", path: "/debug-recogidas-historial", description: "Debug historial recogidas" },
      { name: "Debug Recogidas Table", path: "/debug-recogidas-table", description: "Debug tabla recogidas" },
      { name: "Debug Recogidas Tables", path: "/debug-recogidas-tables", description: "Debug tablas recogidas" },
      { name: "Debug Recogidas Testing", path: "/debug-recogidas-testing", description: "Testing recogidas" },
      { name: "Debug Test Add Recogida", path: "/debug-test-add-recogida", description: "Test añadir recogida" },
      { name: "Debug Test Recogidas Email", path: "/debug-test-recogidas-email", description: "Test email recogidas" },
      { name: "Debug Entregas", path: "/debug/entregas", description: "Debug entregas" },
      { name: "Debug Email Preview", path: "/debug/email-preview", description: "Preview emails" },
      { name: "Debug Fix Trigger", path: "/debug/fix-trigger", description: "Fix trigger" },
      { name: "Test Auth", path: "/test-auth", description: "Test autenticación" },
      { name: "Test SMTP", path: "/test-smtp", description: "Test SMTP" },
      { name: "Test All SMTP", path: "/test-all-smtp", description: "Test todos SMTP" },
      { name: "Test Notifications", path: "/test-notifications", description: "Test notificaciones" },
      { name: "Test Notification API", path: "/test-notification-api", description: "Test API notificaciones" },
      { name: "Test Push Manual", path: "/test-push-manual", description: "Test push manual" },
      { name: "Test Simple", path: "/test-simple", description: "Test simple" },
      { name: "Test Final", path: "/test-final", description: "Test final" },
      { name: "Test New Sale", path: "/test-new-sale", description: "Test nueva venta" },
      { name: "Test Failed Sale", path: "/test-failed-sale", description: "Test venta fallida" },
      { name: "Test Vehicle Certification", path: "/test-vehicle-certification", description: "Test certificación vehículo" },
      { name: "Test Email Docuware", path: "/test-email-docuware", description: "Test email docuware" },
      { name: "Test Email Realizado", path: "/test-email-realizado", description: "Test email realizado" },
      { name: "Test Entrega En Mano", path: "/test-entrega-en-mano", description: "Test entrega en mano" },
      { name: "Test PDF Extract", path: "/test-pdf-extract", description: "Test extracción PDF" },
      { name: "Test Photo Assignment", path: "/test-photo-assignment", description: "Test asignación fotos" },
      { name: "Test Sales Layout", path: "/test-sales-layout", description: "Test layout ventas" }
    ]
  }
}

export default function MapaFlujoPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [mermaidLoaded, setMermaidLoaded] = useState(false)
  const [showExplorer, setShowExplorer] = useState(false)
  const [selectedPage, setSelectedPage] = useState<any>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  // Estadísticas del sistema
  const totalTables = 40 // duc_scraper, nuevas_entradas, stock, fotos, sales_vehicles, pedidos_validados, entregas, incentivos, garantias_brutas_mm, garantias_brutas_mmc, vehicle_keys, key_movements, vehicle_documents, document_movements, key_document_requests, key_document_materials, external_material_vehicles, circulation_permit_requests, incidencias_historial, soporte_tickets, battery_control, battery_control_config, recogidas_historial, bmw_noticias, tasaciones, advisor_links, profiles, expense_types, locations, delivery_centers, pdf_extracted_data, user_preferences, footer_settings, forced_updates, user_forced_updates, filter_configs, filter_processing_log, column_mappings, avatar_mappings, professional_sales
  const totalTriggers = 14
  const totalPages = Object.values(pagesStructure).reduce((acc, cat: any) => acc + cat.pages.length, 0)
  const totalAPIRoutes = 313 // de la estructura de archivos

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  const selectPage = (page: any) => {
    setSelectedPage(page)
    setShowExplorer(true)
  }

  const handlePrint = () => {
    const printContents = document.querySelector('.mermaid-print-area')?.innerHTML
    
    if (printContents) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Mapa de Flujo CVO - ${activeTab}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
              @page { 
                size: landscape; 
                margin: 0.5cm; 
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              html, body { 
                width: 100%;
                height: 100vh;
                overflow: hidden;
              }
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                background: white;
                display: flex;
                flex-direction: column;
                padding: 10px;
              }
              h1 { 
                color: #333; 
                font-size: 18px;
                margin-bottom: 10px;
                text-align: center;
              }
              .mermaid-container {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: calc(100vh - 40px);
                overflow: hidden;
              }
              svg { 
                max-width: 100% !important;
                max-height: 100% !important;
                width: auto !important;
                height: auto !important;
                display: block;
              }
              .mermaid {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
              }
              @media print {
                html, body {
                  height: 100%;
                  overflow: hidden;
                }
                body { 
                  padding: 5px;
                }
                h1 {
                  font-size: 16px;
                  margin-bottom: 5px;
                }
                .mermaid-container {
                  height: calc(100% - 30px);
                }
                svg {
                  page-break-inside: avoid;
                  max-width: 100% !important;
                  max-height: calc(100vh - 35px) !important;
                }
              }
            </style>
          </head>
          <body>
            <h1>Mapa de Flujo CVO - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <div class="mermaid-container">
              ${printContents}
            </div>
          </body>
          </html>
        `)
        printWindow.document.close()
        
        // Esperar a que se cargue y luego imprimir
        setTimeout(() => {
          printWindow.print()
        }, 800)
      }
    }
  }

  useEffect(() => {
    // Cargar Mermaid + Font Awesome
    const loadMermaid = async () => {
      if (typeof window !== 'undefined' && !mermaidLoaded) {
        // Cargar Font Awesome
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
        document.head.appendChild(link)
        
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          fontFamily: 'inherit'
        })
        setMermaidLoaded(true)
        
        // Re-renderizar diagramas cuando cambie el tab
        setTimeout(() => {
          mermaid.contentLoaded()
        }, 100)
      }
    }
    loadMermaid()
  }, [mermaidLoaded])

  useEffect(() => {
    if (mermaidLoaded && typeof window !== 'undefined') {
      const mermaid = require('mermaid').default
      setTimeout(() => {
        mermaid.contentLoaded()
      }, 100)
    }
  }, [activeTab, mermaidLoaded])

  // Diagramas Mermaid
  const diagramas = {
    general: `
flowchart TD
    %% NIVEL 0: FUENTES EXTERNAS
    DUC_WEB["<i class='fa-solid fa-globe'></i> DUC Web<br/>gestionbmw.motorflash.com"]
    CMS_WEB["<i class='fa-solid fa-globe'></i> CMS Web<br/>cmsweb.cmsseguros.es"]
    
    %% SCRAPERS
    SCRAPER_DUC["<i class='fa-solid fa-robot'></i> Scraper DUC<br/>Python cada 8h"]
    SCRAPER_CMS["<i class='fa-solid fa-robot'></i> Scraper CMS<br/>Python cada 8h"]
    
    %% TABLAS BRUTAS
    DUC_SCRAPER[("<i class='fa-solid fa-database'></i> duc_scraper")]
    GARANTIAS_MM[("<i class='fa-solid fa-database'></i> garantias_brutas_mm")]
    GARANTIAS_MMC[("<i class='fa-solid fa-database'></i> garantias_brutas_mmc")]
    
    %% ENTRADA MANUAL
    USUARIO["<i class='fa-solid fa-user'></i> Usuario CVO"]
    NUEVAS_ENTRADAS[("<i class='fa-solid fa-database'></i> nuevas_entradas")]
    
    %% TABLAS CENTRALES
    STOCK[("<i class='fa-solid fa-warehouse'></i> STOCK<br/>Tabla Central")]
    FOTOS[("<i class='fa-solid fa-camera'></i> fotos")]
    
    %% TABLAS OPERACIONALES
    SALES[("<i class='fa-solid fa-hand-holding-dollar'></i> sales_vehicles")]
    VALIDADOS[("<i class='fa-solid fa-circle-check'></i> pedidos_validados")]
    ENTREGAS[("<i class='fa-solid fa-truck'></i> entregas")]
    INCENTIVOS[("<i class='fa-solid fa-coins'></i> incentivos")]
    RECOGIDAS[("<i class='fa-solid fa-box'></i> recogidas_historial")]
    BATERIAS[("<i class='fa-solid fa-car-battery'></i> battery_control")]
    
    %% SISTEMA DE LLAVES Y DOCUMENTOS
    VEHICLE_KEYS[("<i class='fa-solid fa-key'></i> vehicle_keys")]
    KEY_MOVEMENTS[("<i class='fa-solid fa-arrow-right-arrow-left'></i> key_movements")]
    VEHICLE_DOCS[("<i class='fa-solid fa-file-lines'></i> vehicle_documents")]
    DOC_MOVEMENTS[("<i class='fa-solid fa-arrow-right-arrow-left'></i> document_movements")]
    KEY_REQUESTS[("<i class='fa-solid fa-envelope'></i> key_document_requests")]
    
    %% INCIDENCIAS Y SOPORTE
    INCIDENCIAS[("<i class='fa-solid fa-triangle-exclamation'></i> incidencias_historial")]
    ENTREGAS_INC[("<i class='fa-solid fa-truck'></i> entregas<br/>tipos_incidencia")]
    SOPORTE[("<i class='fa-solid fa-headset'></i> soporte_tickets<br/>Portal Cliente")]
    AUTO_RESOLVE["<i class='fa-solid fa-wand-magic-sparkles'></i> autoResolveIncident<br/>Resuelve automático"]
    
    %% FLUJO SCRAPER DUC
    DUC_WEB -->|Descarga CSV| SCRAPER_DUC
    SCRAPER_DUC -->|INSERT| DUC_SCRAPER
    DUC_SCRAPER -->|⚡ TRIGGER AUTO| STOCK
    DUC_SCRAPER -->|⚡ TRIGGER AUTO| FOTOS
    DUC_SCRAPER -->|⚡ TRIGGER AUTO| NUEVAS_ENTRADAS
    DUC_SCRAPER -->|✅ Filtra BEV/PHEV| BATERIAS
    
    %% FLUJO SCRAPER CMS
    CMS_WEB -->|Descarga Excel| SCRAPER_CMS
    SCRAPER_CMS -->|INSERT| GARANTIAS_MM
    SCRAPER_CMS -->|INSERT| GARANTIAS_MMC
    
    %% FLUJO ENTRADA MANUAL
    USUARIO -->|Crea entrada| NUEVAS_ENTRADAS
    NUEVAS_ENTRADAS -->|⚡ TRIGGER| STOCK
    NUEVAS_ENTRADAS -->|⚡ TRIGGER| FOTOS
    
    %% FLUJO CENTRAL
    STOCK -->|⚡ TRIGGER| FOTOS
    STOCK <-->|FK + TRIGGER| SALES
    SALES --> VALIDADOS
    SALES --> ENTREGAS
    SALES --> INCENTIVOS
    
    %% FLUJO GARANTIAS
    GARANTIAS_MM -.->|⚡ TRIGGER| INCENTIVOS
    GARANTIAS_MMC -.->|⚡ TRIGGER| INCENTIVOS
    
    %% FLUJO BATERIAS
    BATERIAS <-->|Compara vendidos| SALES
    
    %% SISTEMA DE LLAVES Y DOCUMENTOS
    SALES --> VEHICLE_KEYS
    SALES --> VEHICLE_DOCS
    VEHICLE_KEYS --> KEY_MOVEMENTS
    VEHICLE_DOCS --> DOC_MOVEMENTS
    SALES --> KEY_REQUESTS
    
    %% INCIDENCIAS Y RESOLUCIÓN AUTOMÁTICA
    ENTREGAS --> ENTREGAS_INC
    ENTREGAS_INC --> INCIDENCIAS
    KEY_MOVEMENTS -->|✅ Entrega| AUTO_RESOLVE
    DOC_MOVEMENTS -->|✅ Entrega| AUTO_RESOLVE
    AUTO_RESOLVE -->|Resuelve| ENTREGAS_INC
    AUTO_RESOLVE -->|Registra| INCIDENCIAS
    
    %% PORTAL DE SOPORTE
    ENTREGAS_INC --> SOPORTE
    INCIDENCIAS --> SOPORTE
    SALES -.->|Consulta datos| SOPORTE
    
    %% TABLA INDEPENDIENTE
    USUARIO -->|Solicita| RECOGIDAS
    
    %% ESTILOS
    classDef scraper fill:#ffd700,stroke:#333,stroke-width:2px
    classDef bruta fill:#ff9999,stroke:#333,stroke-width:2px
    classDef central fill:#90EE90,stroke:#333,stroke-width:3px
    classDef operacional fill:#87CEEB,stroke:#333,stroke-width:2px
    classDef aislada fill:#d3d3d3,stroke:#333,stroke-width:2px
    
    class SCRAPER_DUC,SCRAPER_CMS scraper
    class DUC_SCRAPER,GARANTIAS_MM,GARANTIAS_MMC bruta
    class STOCK,FOTOS central
    class SALES,ENTREGAS,INCENTIVOS,BATERIAS,VALIDADOS,VEHICLE_KEYS,KEY_MOVEMENTS,VEHICLE_DOCS,DOC_MOVEMENTS,KEY_REQUESTS,INCIDENCIAS,ENTREGAS_INC,SOPORTE operacional
    class AUTO_RESOLVE scraper
    class RECOGIDAS aislada
`,
    cascada: `
flowchart TB
    USUARIO1["<i class='fa-solid fa-user'></i> Usuario crea vehículo"]
    NE[("<i class='fa-solid fa-database'></i> nuevas_entradas<br/>is_received = FALSE")]
    RECEPCION["<i class='fa-solid fa-truck-fast'></i> Usuario marca RECIBIDO<br/>is_received = TRUE"]
    STOCK[("<i class='fa-solid fa-warehouse'></i> STOCK<br/>Estados: pendiente")]
    FOTOS[("<i class='fa-solid fa-camera'></i> fotos<br/>estado_pintura: pendiente")]
    INSPECCION["<i class='fa-solid fa-magnifying-glass'></i> Mecánico inspecciona"]
    STOCK2[("<i class='fa-solid fa-warehouse'></i> STOCK<br/>body_status: apto")]
    FOTOS2[("<i class='fa-solid fa-camera'></i> fotos<br/>estado_pintura: apto")]
    FOTOGRAFIA["<i class='fa-solid fa-camera-retro'></i> Fotógrafo asignado"]
    FOTOS3[("<i class='fa-solid fa-camera'></i> fotos<br/>photos_completed: true")]
    VENTA["<i class='fa-solid fa-hand-holding-dollar'></i> Asesor crea venta"]
    SALES[("<i class='fa-solid fa-hand-holding-dollar'></i> sales_vehicles")]
    STOCK3[("<i class='fa-solid fa-warehouse'></i> STOCK<br/>is_sold: TRUE")]
    ENTREGA["<i class='fa-solid fa-box-open'></i> Confirmar entrega"]
    ENTREGAS[("<i class='fa-solid fa-truck'></i> entregas")]
    INCENTIVOS[("<i class='fa-solid fa-coins'></i> incentivos")]
    
    USUARIO1 --> NE
    NE --> RECEPCION
    RECEPCION -->|⚡ TRIGGER 1| STOCK
    RECEPCION -->|⚡ TRIGGER 2| FOTOS
    STOCK --> INSPECCION
    INSPECCION --> STOCK2
    STOCK2 -->|⚡ TRIGGER| FOTOS2
    FOTOS2 --> FOTOGRAFIA
    FOTOGRAFIA --> FOTOS3
    FOTOS3 --> VENTA
    VENTA --> SALES
    SALES -->|⚡ TRIGGER| STOCK3
    STOCK3 --> ENTREGA
    ENTREGA --> ENTREGAS
    ENTREGAS --> INCENTIVOS
    
    classDef manual fill:#ffd700,stroke:#333,stroke-width:2px
    classDef tabla fill:#90EE90,stroke:#333,stroke-width:2px
    
    class USUARIO1,RECEPCION,INSPECCION,FOTOGRAFIA,VENTA,ENTREGA manual
    class NE,STOCK,FOTOS,STOCK2,FOTOS2,FOTOS3,SALES,STOCK3,ENTREGAS,INCENTIVOS tabla
`,
    paso1: `
flowchart LR
    DUC["<i class='fa-solid fa-globe'></i> DUC Web<br/>gestionbmw.motorflash.com"]
    SCRAPER["<i class='fa-solid fa-robot'></i> Scraper Python<br/>main.py<br/>Cada 8 horas"]
    CSV["<i class='fa-solid fa-file-csv'></i> CSV Descargado<br/>stock_551_0_*.csv<br/>77 vehículos"]
    PANDAS["<i class='fa-brands fa-python'></i> pandas.read_csv<br/>Limpieza de datos"]
    DELETE["<i class='fa-solid fa-trash'></i> DELETE ALL<br/>duc_scraper"]
    INSERT["<i class='fa-solid fa-plus'></i> INSERT nuevos registros<br/>Columna: Disponibilidad"]
    DUC_SCRAPER[("<i class='fa-solid fa-database'></i> duc_scraper<br/>77 vehículos<br/>FUENTE ÚNICA")]
    TRIGGER_SYNC["<i class='fa-solid fa-bolt'></i> TRIGGER<br/>sync_duc_to_stock<br/>Stock = DUC"]
    STOCK[("<i class='fa-solid fa-warehouse'></i> stock<br/>77 vehículos<br/>is_available = f(Disponibilidad)")]
    FOTOS[("<i class='fa-solid fa-camera'></i> fotos<br/>Sincronizado")]
    ENTREGAS[("<i class='fa-solid fa-truck'></i> entregas<br/>fecha_entrega → DELETE stock")]
    
    DUC -->|Selenium| SCRAPER
    SCRAPER --> CSV
    CSV --> PANDAS
    PANDAS --> DELETE
    DELETE --> INSERT
    INSERT --> DUC_SCRAPER
    DUC_SCRAPER -->|⚡ AUTOMÁTICO| TRIGGER_SYNC
    TRIGGER_SYNC -->|Crea/Actualiza| STOCK
    TRIGGER_SYNC -->|Disponibilidad = DISPONIBLE<br/>→ is_available = TRUE| STOCK
    TRIGGER_SYNC -->|Disponibilidad ≠ DISPONIBLE<br/>→ is_available = FALSE| STOCK
    STOCK --> FOTOS
    ENTREGAS -->|⚡ DELETE| STOCK
    
    classDef external fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef process fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef tabla fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef trigger fill:#ff7043,stroke:#bf360c,stroke-width:3px
    
    class DUC external
    class SCRAPER,PANDAS,DELETE,INSERT process
    class CSV,DUC_SCRAPER,STOCK,FOTOS,ENTREGAS tabla
    class TRIGGER_SYNC trigger
`,
    paso2: `
flowchart TB
    USUARIO["<i class='fa-solid fa-user'></i> Usuario en<br/>/dashboard/nuevas-entradas"]
    FORM["<i class='fa-solid fa-list-check'></i> Formulario<br/>license_plate<br/>model<br/>purchase_date"]
    API1["<i class='fa-solid fa-plug'></i> API POST<br/>/api/transport/create"]
    NE1[("<i class='fa-solid fa-database'></i> nuevas_entradas<br/>is_received: FALSE")]
    ESPERA["<i class='fa-solid fa-clock'></i> Vehículo llega"]
    USUARIO2["<i class='fa-solid fa-user-check'></i> Usuario marca RECIBIDO"]
    API2["<i class='fa-solid fa-plug'></i> API POST<br/>/api/transport/update<br/>is_received: TRUE"]
    NE2[("<i class='fa-solid fa-database'></i> nuevas_entradas<br/>is_received: TRUE")]
    TRIGGER1["<i class='fa-solid fa-bolt'></i> TRIGGER<br/>nuevas_entradas_to_stock"]
    TRIGGER2["<i class='fa-solid fa-bolt'></i> TRIGGER<br/>handle_vehicle_received"]
    STOCK[("<i class='fa-solid fa-warehouse'></i> STOCK<br/>Estados: pendiente")]
    FOTOS[("<i class='fa-solid fa-camera'></i> fotos<br/>estado_pintura: pendiente")]
    
    USUARIO --> FORM
    FORM --> API1
    API1 --> NE1
    NE1 --> ESPERA
    ESPERA --> USUARIO2
    USUARIO2 --> API2
    API2 --> NE2
    NE2 --> TRIGGER1
    NE2 --> TRIGGER2
    TRIGGER1 --> STOCK
    TRIGGER2 --> FOTOS
    
    classDef user fill:#ffd54f,stroke:#f57f17,stroke-width:2px
    classDef api fill:#81d4fa,stroke:#0277bd,stroke-width:2px
    classDef tabla fill:#a5d6a7,stroke:#2e7d32,stroke-width:2px
    classDef trigger fill:#ef5350,stroke:#c62828,stroke-width:3px
    
    class USUARIO,USUARIO2,ESPERA user
    class API1,API2,FORM api
    class NE1,NE2,STOCK,FOTOS tabla
    class TRIGGER1,TRIGGER2 trigger
`,
    triggers: `
flowchart TD
    TITLE["<i class='fa-solid fa-bolt'></i> TODOS LOS TRIGGERS ACTIVOS - 12 TRIGGERS"]
    
    subgraph NUEVOS_STOCK["<i class='fa-solid fa-star'></i> NUEVO SISTEMA STOCK (Oct 2025)"]
        T10["<i class='fa-solid fa-bolt'></i> delete_stock_on_delivery<br/>WHEN: entregas.fecha_entrega ≠ NULL<br/>ACTION: DELETE FROM stock<br/>Vehículo entregado sale del sistema"]
        T11["<i class='fa-solid fa-bolt'></i> sync_duc_to_stock<br/>WHEN: INSERT/UPDATE duc_scraper<br/>ACTION: Crea/actualiza stock<br/>is_available según Disponibilidad"]
        T12["<i class='fa-solid fa-bolt'></i> sync_sales_to_fotos_vendido<br/>WHEN: INSERT sales_vehicles<br/>ACTION: fotos estado = vendido<br/>photos_completed = TRUE"]
    end
    
    subgraph NUEVOS_RECEPCION["<i class='fa-solid fa-star'></i> SISTEMA RECEPCIÓN FÍSICA"]
        T7["<i class='fa-solid fa-bolt'></i> sync_duc_to_all_tables<br/>WHEN: INSERT en duc_scraper<br/>ACTION: INSERT stock+fotos+nuevas_entradas<br/>Detección automática de fotos"]
        T8["<i class='fa-solid fa-bolt'></i> auto_mark_received_on_photos_complete<br/>WHEN: photos_completed = TRUE<br/>ACTION: Marca recibido -2 días (prevalece)"]
        T9["<i class='fa-solid fa-bolt'></i> sync_received_status<br/>WHEN: is_received = TRUE<br/>ACTION: UPDATE stock+fotos (respeta auto)"]
    end
    
    subgraph EXISTENTES["<i class='fa-solid fa-check'></i> EXISTENTES"]
        T1["<i class='fa-solid fa-bolt'></i> nuevas_entradas_to_stock<br/>WHEN: is_received = TRUE<br/>ACTION: INSERT INTO stock"]
        T2["<i class='fa-solid fa-bolt'></i> handle_vehicle_received<br/>WHEN: is_received = TRUE<br/>ACTION: INSERT INTO fotos"]
        T3["<i class='fa-solid fa-bolt'></i> sync_body_status_to_paint_status<br/>WHEN: body_status = apto<br/>ACTION: UPDATE fotos"]
        T4["<i class='fa-solid fa-bolt'></i> sync_stock_on_sale_insert<br/>WHEN: INSERT en sales_vehicles<br/>ACTION: UPDATE stock.is_sold = TRUE"]
        T5["<i class='fa-solid fa-bolt'></i> sync_stock_on_sale_delete<br/>WHEN: DELETE en sales_vehicles<br/>ACTION: UPDATE stock.is_sold = FALSE"]
        T6["<i class='fa-solid fa-bolt'></i> update_garantia_incentivos<br/>WHEN: INSERT en garantias<br/>ACTION: UPDATE incentivos"]
    end
    
    TITLE --> NUEVOS_STOCK
    TITLE --> NUEVOS_RECEPCION
    TITLE --> EXISTENTES
    
    T10 --> STOCK10[("<i class='fa-solid fa-trash'></i> stock<br/>DELETE")]
    T11 --> STOCK11[("<i class='fa-solid fa-warehouse'></i> stock<br/>CREATE/UPDATE")]
    T12 --> FOTOS12[("<i class='fa-solid fa-camera'></i> fotos<br/>vendido")]
    
    T7 --> STOCK7[("<i class='fa-solid fa-warehouse'></i> stock")]
    T7 --> FOTOS7[("<i class='fa-solid fa-camera'></i> fotos")]
    T7 --> NUEVAS7[("<i class='fa-solid fa-database'></i> nuevas_entradas")]
    T8 --> STOCK8[("<i class='fa-solid fa-warehouse'></i> stock<br/>-2 días")]
    T8 --> FOTOS8[("<i class='fa-solid fa-camera'></i> fotos<br/>-2 días")]
    T9 --> STOCK9[("<i class='fa-solid fa-warehouse'></i> stock")]
    
    T1 --> STOCK1[("<i class='fa-solid fa-warehouse'></i> stock")]
    T2 --> FOTOS1[("<i class='fa-solid fa-camera'></i> fotos")]
    T3 --> FOTOS2[("<i class='fa-solid fa-camera'></i> fotos")]
    T4 --> STOCK2[("<i class='fa-solid fa-warehouse'></i> stock")]
    T5 --> STOCK3[("<i class='fa-solid fa-warehouse'></i> stock")]
    T6 --> INC1[("<i class='fa-solid fa-coins'></i> incentivos")]
    
    classDef trigger fill:#ff7043,stroke:#bf360c,stroke-width:2px
    classDef triggerNuevo fill:#66bb6a,stroke:#2e7d32,stroke-width:3px
    classDef triggerNuevoStock fill:#2196f3,stroke:#0d47a1,stroke-width:3px
    classDef tabla fill:#90caf9,stroke:#1565c0,stroke-width:2px
    
    class T1,T2,T3,T4,T5,T6 trigger
    class T7,T8,T9 triggerNuevo
    class T10,T11,T12 triggerNuevoStock
    class STOCK1,STOCK2,STOCK3,STOCK7,STOCK8,STOCK9,STOCK10,STOCK11,FOTOS1,FOTOS2,FOTOS7,FOTOS8,FOTOS12,INC1,NUEVAS7 tabla
`,
    problema: `
flowchart TB
    DUC[("<i class='fa-solid fa-database'></i> duc_scraper<br/>Scraper cada 8h")]
    
    TRIGGER["<i class='fa-solid fa-bolt'></i> sync_duc_to_all_tables<br/>Detección de fotos automática"]
    
    CONFOTOS["<i class='fa-solid fa-circle-check'></i> CON FOTOS (DUC)<br/>URL foto 1/2/3 ≠ NULL"]
    SINFOTOS["<i class='fa-solid fa-clock'></i> SIN FOTOS (DUC)<br/>Aún en tránsito"]
    
    STOCK1[("<i class='fa-solid fa-warehouse'></i> stock<br/>physical_reception_date = -2 días<br/>is_available = TRUE")]
    FOTOS1[("<i class='fa-solid fa-camera'></i> fotos<br/>photos_completed = TRUE<br/>estado_pintura = completado")]
    NUEVAS1[("<i class='fa-solid fa-database'></i> nuevas_entradas<br/>is_received = TRUE")]
    
    STOCK2[("<i class='fa-solid fa-warehouse'></i> stock<br/>physical_reception_date = NULL<br/>is_available = FALSE")]
    FOTOS2[("<i class='fa-solid fa-camera'></i> fotos<br/>photos_completed = FALSE<br/>estado_pintura = pendiente<br/>NO visible hasta recibir")]
    NUEVAS2[("<i class='fa-solid fa-database'></i> nuevas_entradas<br/>is_received = FALSE")]
    
    DUC --> TRIGGER
    TRIGGER --> CONFOTOS
    TRIGGER --> SINFOTOS
    
    CONFOTOS -->|Contador desde -2 días| STOCK1
    CONFOTOS -->|Completado automático| FOTOS1
    CONFOTOS -->|Marcado recibido| NUEVAS1
    
    SINFOTOS -->|NO cuenta días aún| STOCK2
    SINFOTOS -->|NO aparece pendiente| FOTOS2
    SINFOTOS -->|Esperando llegada| NUEVAS2
    
    classDef exito fill:#66bb6a,stroke:#2e7d32,stroke-width:3px
    classDef espera fill:#ffd54f,stroke:#f57f17,stroke-width:2px
    classDef tabla fill:#90caf9,stroke:#1565c0,stroke-width:2px
    classDef trigger fill:#ff7043,stroke:#bf360c,stroke-width:3px
    
    class CONFOTOS exito
    class SINFOTOS espera
    class DUC,STOCK1,STOCK2,FOTOS1,FOTOS2,NUEVAS1,NUEVAS2 tabla
    class TRIGGER trigger
`,
    baterias: `
flowchart TB
    DUC[("<i class='fa-solid fa-database'></i> duc_scraper<br/>Todos los vehículos")]
    
    FILTRO["<i class='fa-solid fa-filter'></i> Filtro Automático<br/>Tipo motor = BEV/PHEV<br/>Combustible = eléctrico"]
    
    BATTERY[("<i class='fa-solid fa-car-battery'></i> battery_control<br/>Solo vehículos eléctricos")]
    
    USUARIO["<i class='fa-solid fa-user-pen'></i> Usuario actualiza<br/>% carga, estado, observaciones"]
    
    CONFIG[("<i class='fa-solid fa-gear'></i> battery_control_config<br/>Niveles OK/Suficiente/Insuficiente<br/>XEV: 80%/50%/30%<br/>PHEV: 70%/40%/20%")]
    
    SALES[("<i class='fa-solid fa-hand-holding-dollar'></i> sales_vehicles<br/>Ventas")]
    
    COMPARACION["<i class='fa-solid fa-right-left'></i> Comparación Vendidos<br/>Identifica vehículos vendidos"]
    
    ALERTAS["<i class='fa-solid fa-bell'></i> Sistema de Alertas<br/>Pendiente de revisión<br/>X días sin revisar<br/>Carga insuficiente"]
    
    DUC --> FILTRO
    FILTRO -->|Solo BEV/PHEV| BATTERY
    BATTERY --> USUARIO
    USUARIO --> BATTERY
    CONFIG -.->|Define niveles| ALERTAS
    BATTERY <-->|Verifica vendidos| COMPARACION
    COMPARACION <--> SALES
    BATTERY --> ALERTAS
    
    classDef bruta fill:#ff9999,stroke:#333,stroke-width:2px
    classDef tabla fill:#90caf9,stroke:#1565c0,stroke-width:2px
    classDef proceso fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef config fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    
    class DUC bruta
    class BATTERY,SALES tabla
    class FILTRO,USUARIO,COMPARACION,ALERTAS proceso
    class CONFIG config
`,
    validados: `
flowchart TB
    SALES[("<i class='fa-solid fa-hand-holding-dollar'></i> sales_vehicles<br/>Venta creada")]
    
    VALIDAR["<i class='fa-solid fa-circle-check'></i> Usuario valida venta<br/>Marca como válida"]
    
    SYNC["<i class='fa-solid fa-arrows-rotate'></i> syncValidatedVehicle<br/>Server Action"]
    
    VALIDADOS[("<i class='fa-solid fa-circle-check'></i> pedidos_validados<br/>Copia completa de la venta<br/>validated = TRUE")]
    
    STOCK[("<i class='fa-solid fa-warehouse'></i> stock<br/>FK: stock_id")]
    
    SALES --> VALIDAR
    VALIDAR --> SYNC
    SYNC --> VALIDADOS
    SALES <-.->|FK: vehicle_id| VALIDADOS
    SALES <-.->|FK: stock_id| STOCK
    VALIDADOS <-.->|Referencia| STOCK
    
    classDef tabla fill:#90caf9,stroke:#1565c0,stroke-width:2px
    classDef proceso fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class SALES,VALIDADOS,STOCK tabla
    class VALIDAR,SYNC proceso
`,
    llaves: `
flowchart TB
    SALES[("<i class='fa-solid fa-hand-holding-dollar'></i> sales_vehicles<br/>Venta del vehículo")]
    
    INIT["<i class='fa-solid fa-play'></i> Inicializar<br/>Al ver detalle del vehículo"]
    
    KEYS[("<i class='fa-solid fa-key'></i> vehicle_keys<br/>Estado de llaves<br/>key_1_status<br/>key_2_status<br/>card_key_status")]
    
    DOCS[("<i class='fa-solid fa-file-lines'></i> vehicle_documents<br/>Estado de documentos<br/>technical_sheet_status<br/>circulation_permit_status")]
    
    USUARIO["<i class='fa-solid fa-user-pen'></i> Usuario mueve llave<br/>De X a Y"]
    
    KEY_MOV[("<i class='fa-solid fa-arrow-right-arrow-left'></i> key_movements<br/>Historial de movimientos<br/>from_user → to_user")]
    
    USUARIO2["<i class='fa-solid fa-user-pen'></i> Usuario mueve documento<br/>De X a Y"]
    
    DOC_MOV[("<i class='fa-solid fa-arrow-right-arrow-left'></i> document_movements<br/>Historial de movimientos<br/>from_user → to_user")]
    
    SOLICITUD["<i class='fa-solid fa-envelope'></i> Solicitud Docuware<br/>Email a Docuware"]
    
    REQUESTS[("<i class='fa-solid fa-clipboard-list'></i> key_document_requests<br/>Solicitudes pendientes<br/>+ materials")]
    
    SALES -->|vehicle_id| INIT
    INIT --> KEYS
    INIT --> DOCS
    KEYS --> USUARIO
    USUARIO --> KEY_MOV
    DOCS --> USUARIO2
    USUARIO2 --> DOC_MOV
    SALES --> SOLICITUD
    SOLICITUD --> REQUESTS
    
    classDef venta fill:#90caf9,stroke:#1565c0,stroke-width:2px
    classDef llaves fill:#a5d6a7,stroke:#2e7d32,stroke-width:2px
    classDef movimientos fill:#ffcc80,stroke:#e65100,stroke-width:2px
    
    class SALES venta
    class KEYS,DOCS,REQUESTS llaves
    class KEY_MOV,DOC_MOV,USUARIO,USUARIO2,INIT,SOLICITUD movimientos
`,
    incidencias: `
flowchart LR
    ENTREGAS[("<i class='fa-solid fa-truck'></i> entregas<br/>Entrega del vehículo<br/>confirmada = TRUE")]
    
    PROBLEMA["<i class='fa-solid fa-triangle-exclamation'></i> Surge problema<br/>en la entrega"]
    
    USUARIO["<i class='fa-solid fa-user-pen'></i> Usuario registra<br/>incidencia"]
    
    INCIDENCIAS[("<i class='fa-solid fa-clock-rotate-left'></i> incidencias_historial<br/>tipo<br/>descripcion<br/>estado<br/>fecha<br/>resolucion")]
    
    ENTREGAS2[("<i class='fa-solid fa-truck'></i> entregas<br/>Campo: incidencias<br/>Array de incidencias")]
    
    RESOLUCION["<i class='fa-solid fa-circle-check'></i> Resolver incidencia"]
    
    ENTREGAS --> PROBLEMA
    PROBLEMA --> USUARIO
    USUARIO --> INCIDENCIAS
    INCIDENCIAS -.->|Referencia| ENTREGAS2
    INCIDENCIAS --> RESOLUCION
    
    classDef tabla fill:#90caf9,stroke:#1565c0,stroke-width:2px
    classDef problema fill:#ffab91,stroke:#d84315,stroke-width:2px
    classDef proceso fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class ENTREGAS,ENTREGAS2,INCIDENCIAS tabla
    class PROBLEMA,RESOLUCION problema
    class USUARIO proceso
`,
    incidenciasCompleto: `
flowchart TB
    ENTREGA[("<i class='fa-solid fa-truck'></i> entregas<br/>Vehículo entregado")]
    
    PROBLEMA["<i class='fa-solid fa-triangle-exclamation'></i> Falta llave o documento"]
    
    INCIDENCIA_CREATE["<i class='fa-solid fa-file-circle-plus'></i> Se crea incidencia<br/>tipos_incidencia array"]
    
    ENTREGAS_INC[("<i class='fa-solid fa-truck'></i> entregas<br/>tipos_incidencia: array<br/>incidencia: TRUE")]
    
    HISTORIAL[("<i class='fa-solid fa-clock-rotate-left'></i> incidencias_historial<br/>tipo_incidencia<br/>resuelta: FALSE")]
    
    LLAVES["<i class='fa-solid fa-key'></i> Usuario entrega llave"]
    DOCS["<i class='fa-solid fa-file-lines'></i> Usuario entrega documento"]
    
    KEY_MOV[("<i class='fa-solid fa-arrow-right-arrow-left'></i> key_movements<br/>Movimiento registrado")]
    DOC_MOV[("<i class='fa-solid fa-arrow-right-arrow-left'></i> document_movements<br/>Movimiento registrado")]
    
    AUTO["<i class='fa-solid fa-wand-magic-sparkles'></i> autoResolveIncident<br/>Función automática<br/>detecta tipo resuelto"]
    
    RESUELVE1[("<i class='fa-solid fa-truck'></i> entregas<br/>Quita de tipos_incidencia<br/>incidencia = FALSE si vacío")]
    
    RESUELVE2[("<i class='fa-solid fa-clock-rotate-left'></i> incidencias_historial<br/>INSERT nueva entrada<br/>resuelta: TRUE")]
    
    SOPORTE[("<i class='fa-solid fa-headset'></i> soporte_tickets<br/>Portal cliente ve estado")]
    
    ENTREGA --> PROBLEMA
    PROBLEMA --> INCIDENCIA_CREATE
    INCIDENCIA_CREATE --> ENTREGAS_INC
    INCIDENCIA_CREATE --> HISTORIAL
    
    ENTREGAS_INC --> SOPORTE
    HISTORIAL --> SOPORTE
    
    LLAVES --> KEY_MOV
    DOCS --> DOC_MOV
    
    KEY_MOV -->|⚡ TRIGGER| AUTO
    DOC_MOV -->|⚡ TRIGGER| AUTO
    
    AUTO --> RESUELVE1
    AUTO --> RESUELVE2
    
    RESUELVE1 --> SOPORTE
    RESUELVE2 --> SOPORTE
    
    classDef tabla fill:#90caf9,stroke:#1565c0,stroke-width:2px
    classDef problema fill:#ffab91,stroke:#d84315,stroke-width:2px
    classDef auto fill:#66bb6a,stroke:#2e7d32,stroke-width:3px
    classDef soporte fill:#ce93d8,stroke:#6a1b9a,stroke-width:2px
    
    class ENTREGAS_INC,HISTORIAL,KEY_MOV,DOC_MOV,RESUELVE1,RESUELVE2 tabla
    class PROBLEMA,INCIDENCIA_CREATE problema
    class LLAVES,DOCS,ENTREGA proceso
    class AUTO auto
    class SOPORTE soporte
`,
    soporte: `
flowchart TB
    ENTREGAS[("<i class='fa-solid fa-truck'></i> entregas<br/>tipos_incidencia<br/>incidencia: TRUE")]
    
    HISTORIAL[("<i class='fa-solid fa-clock-rotate-left'></i> incidencias_historial<br/>Registro completo<br/>tipo, fecha, usuario")]
    
    SALES[("<i class='fa-solid fa-hand-holding-dollar'></i> sales_vehicles<br/>Datos del vehículo<br/>y cliente")]
    
    SOPORTE[("<i class='fa-solid fa-headset'></i> soporte_tickets<br/>Portal Cliente")]
    
    CLIENTE["<i class='fa-solid fa-user'></i> Cliente accede<br/>al portal con DNI"]
    
    VER["<i class='fa-solid fa-eye'></i> Ver estado de:<br/>- Incidencias activas<br/>- Historial resuelto<br/>- Datos del vehículo<br/>- Tiempo desde venta"]
    
    ADMIN["<i class='fa-solid fa-user-tie'></i> Admin responde<br/>desde panel"]
    
    RESPUESTA["<i class='fa-solid fa-paper-plane'></i> Email enviado<br/>al cliente"]
    
    ENTREGAS --> SOPORTE
    HISTORIAL --> SOPORTE
    SALES -.->|Enriquece datos| SOPORTE
    
    SOPORTE --> CLIENTE
    CLIENTE --> VER
    
    SOPORTE --> ADMIN
    ADMIN --> RESPUESTA
    RESPUESTA -.-> CLIENTE
    
    classDef tabla fill:#90caf9,stroke:#1565c0,stroke-width:2px
    classDef soporte fill:#ce93d8,stroke:#6a1b9a,stroke-width:3px
    classDef usuario fill:#ffd54f,stroke:#f57f17,stroke-width:2px
    
    class ENTREGAS,HISTORIAL,SALES tabla
    class SOPORTE soporte
    class CLIENTE,ADMIN,VER,RESPUESTA usuario
`,
    fotos: `
flowchart TB
    subgraph CREACION["<i class='fa-solid fa-plus-circle'></i> CREACIÓN DEL REGISTRO"]
        NE[("<i class='fa-solid fa-database'></i> nuevas_entradas<br/>is_received = TRUE")]
        TRIGGER1["<i class='fa-solid fa-bolt'></i> handle_vehicle_received<br/>INSERT INTO fotos"]
        FOTOS_NEW[("<i class='fa-solid fa-camera'></i> fotos<br/>estado_pintura: pendiente<br/>photos_completed: false")]
    end
    
    subgraph SINCRONIZACION["<i class='fa-solid fa-arrows-rotate'></i> SINCRONIZACIÓN CON STOCK"]
        STOCK[("<i class='fa-solid fa-warehouse'></i> stock<br/>body_status: apto")]
        TRIGGER2["<i class='fa-solid fa-bolt'></i> sync_body_status<br/>UPDATE fotos"]
        FOTOS_APTO[("<i class='fa-solid fa-camera'></i> fotos<br/>estado_pintura: apto")]
    end
    
    subgraph AUTOMATICO["<i class='fa-solid fa-robot'></i> SISTEMA AUTOMÁTICO"]
        DUC[("<i class='fa-solid fa-database'></i> duc_scraper<br/>URL foto 9 ≠ NULL")]
        GITHUB["<i class='fa-brands fa-github'></i> GitHub Actions<br/>Cada 15 minutos"]
        FUNCION["<i class='fa-solid fa-code'></i> mark_photos_as_completed()"]
        FOTOS_AUTO[("<i class='fa-solid fa-camera'></i> fotos<br/>photos_completed: TRUE<br/>Marcado automático")]
    end
    
    subgraph MANUAL["<i class='fa-solid fa-user-pen'></i> GESTIÓN MANUAL"]
        USUARIO["<i class='fa-solid fa-user'></i> Usuario/Fotógrafo"]
        API1["<i class='fa-solid fa-plug'></i> /api/photos/update-photo-status"]
        API2["<i class='fa-solid fa-plug'></i> /api/photos/update-paint-status"]
        API3["<i class='fa-solid fa-plug'></i> /api/photos/update-photographer"]
        API4["<i class='fa-solid fa-plug'></i> /api/photos/mark-error"]
        FOTOS_MAN[("<i class='fa-solid fa-camera'></i> fotos<br/>Estado actualizado")]
    end
    
    subgraph VENDIDO["<i class='fa-solid fa-hand-holding-dollar'></i> VEHÍCULO VENDIDO"]
        VENTA[("<i class='fa-solid fa-hand-holding-dollar'></i> sales_vehicles<br/>Venta registrada")]
        STOCK_SOLD[("<i class='fa-solid fa-warehouse'></i> stock<br/>is_sold: TRUE")]
        FOTOS_SOLD[("<i class='fa-solid fa-camera'></i> fotos<br/>Registro se MANTIENE<br/>estado_pintura: vendido<br/>Filtrado en interfaz")]
    end
    
    NE --> TRIGGER1
    TRIGGER1 --> FOTOS_NEW
    
    FOTOS_NEW --> STOCK
    STOCK --> TRIGGER2
    TRIGGER2 --> FOTOS_APTO
    
    DUC --> GITHUB
    GITHUB --> FUNCION
    FUNCION --> FOTOS_AUTO
    
    FOTOS_APTO --> USUARIO
    USUARIO --> API1
    USUARIO --> API2
    USUARIO --> API3
    USUARIO --> API4
    API1 --> FOTOS_MAN
    API2 --> FOTOS_MAN
    API3 --> FOTOS_MAN
    API4 --> FOTOS_MAN
    
    FOTOS_MAN --> VENTA
    VENTA --> STOCK_SOLD
    STOCK_SOLD --> FOTOS_SOLD
    
    classDef tabla fill:#90caf9,stroke:#1565c0,stroke-width:2px
    classDef trigger fill:#ef5350,stroke:#c62828,stroke-width:3px
    classDef auto fill:#66bb6a,stroke:#2e7d32,stroke-width:3px
    classDef api fill:#81d4fa,stroke:#0277bd,stroke-width:2px
    classDef usuario fill:#ffd54f,stroke:#f57f17,stroke-width:2px
    
    class NE,FOTOS_NEW,STOCK,FOTOS_APTO,DUC,FOTOS_AUTO,FOTOS_MAN,VENTA,STOCK_SOLD,FOTOS_SOLD tabla
    class TRIGGER1,TRIGGER2 trigger
    class GITHUB,FUNCION auto
    class API1,API2,API3,API4 api
    class USUARIO usuario
`
  }

  return (
    <>
      {/* Estilos para ocultar scrollbar */}
      <style jsx global>{`
        .explorer-scroll::-webkit-scrollbar {
          display: none;
        }
        .explorer-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>

      {/* Botón Fijo Colapsado - Más pequeño */}
      {!showExplorer && (
        <button
          onClick={() => setShowExplorer(true)}
          className="fixed left-[70px] top-20 z-50 bg-background hover:bg-accent rounded-md p-1 shadow-lg border border-border/50 transition-all duration-300 ease-in-out"
          title="Abrir Explorador"
        >
          <FolderTree className="h-3 w-3" />
        </button>
      )}

      {/* Explorador como Sidebar Translúcido - Sin bordes, se sobrepone */}
      <div 
        className={`fixed left-0 top-14 bottom-8 bg-background/80 backdrop-blur-lg z-50 overflow-hidden flex flex-col shadow-2xl ${showExplorer ? 'w-64' : 'w-0'}`}
        style={{
          transition: 'width 0.3s ease-in-out',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onMouseLeave={() => setShowExplorer(false)}
      >
          {showExplorer && (
            <>
              <div className="p-4 flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Explorador</h3>
              </div>
              
              {/* Contenido con scroll nativo pero estilizado */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 explorer-scroll" style={{position: 'relative'}}>
            {Object.entries(pagesStructure).map(([category, data]: [string, any]) => (
              <div key={category} className="space-y-1">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-2 hover:bg-accent/50 rounded-lg text-sm font-medium transition-colors"
                >
                  <span className="truncate">{category}</span>
                  {expandedCategories.includes(category) ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </button>
                {expandedCategories.includes(category) && (
                  <div className="ml-2 space-y-1">
                    {data.pages.map((page: any) => (
                      <button
                        key={page.path}
                        onClick={() => selectPage(page)}
                        className={`w-full text-left p-2 rounded-lg text-xs hover:bg-accent/50 transition-colors ${
                          selectedPage?.path === page.path ? 'bg-accent font-medium' : ''
                        }`}
                      >
                        <div className="truncate">{page.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

              <div className="p-3 bg-background/70 backdrop-blur-sm text-xs text-muted-foreground">
                {totalPages} páginas • {Object.keys(pagesStructure).length} categorías
              </div>
            </>
          )}
          <ScrollIndicator isExpanded={showExplorer} />
      </div>

    <div className="p-4 md:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <Breadcrumbs
          segments={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Mapa de Flujo", href: "/dashboard/mapa-flujo" },
          ]}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mapa de Flujo del Sistema CVO</h1>
              <p className="text-muted-foreground">
                Documentación completa e interactiva - Libro de instrucciones del sistema
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowExplorer(!showExplorer)
                setSelectedPage(null)
              }}
              variant={showExplorer ? "default" : "outline"}
              size="sm"
              className="gap-2"
            >
              <FolderTree className="h-4 w-4" />
              {showExplorer ? "Ocultar" : "Ver"} Explorador
            </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
              Imprimir
          </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas del Sistema - Compactas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Tablas</p>
                <h3 className="text-xl font-bold">{totalTables}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Triggers</p>
                <h3 className="text-xl font-bold">{totalTriggers}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Páginas</p>
                <h3 className="text-xl font-bold">{totalPages}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Network className="h-6 w-6 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">API Routes</p>
                <h3 className="text-xl font-bold">{totalAPIRoutes}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stack Tecnológico */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-lg">Stack Tecnológico</h3>
        </div>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">React 18</span>
          </div>
          <div className="flex items-center gap-2">
                  <PanelsTopLeft className="h-5 w-5 text-black dark:text-white" />
                  <span className="text-sm font-medium">Next.js 15</span>
          </div>
          <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Supabase</span>
          </div>
          <div className="flex items-center gap-2">
                  <FileCode2 className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">TypeScript</span>
          </div>
          <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-cyan-500" />
                  <span className="text-sm font-medium">Tailwind</span>
          </div>
          <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">Python</span>
          </div>
              </div>
              <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Recharts</span>
          </div>
          <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-pink-500" />
                  <span className="text-sm font-medium">Framer Motion</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">PDF.js</span>
                </div>
                <div className="flex items-center gap-2">
                  <ScanSearch className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium">Tesseract OCR</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-700" />
                  <span className="text-sm font-medium">Nodemailer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-green-700" />
                  <span className="text-sm font-medium">Selenium</span>
                </div>
              </div>
          </div>
        </CardContent>
      </Card>
      </div>


      {/* Contenido: Vista Individual o Diagramas */}
      {selectedPage ? (
        /* Vista Individual de Página */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{selectedPage.name}</CardTitle>
                <CardDescription className="mt-1">{selectedPage.description}</CardDescription>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Ruta:</strong> <code className="bg-muted px-2 py-1 rounded">{selectedPage.path}</code>
                </p>
              </div>
              <Button
                onClick={() => setSelectedPage(null)}
                variant="outline"
                size="sm"
              >
                Volver a Diagramas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tablas que utiliza */}
            {selectedPage.tables && selectedPage.tables.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  Tablas que Utiliza
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPage.tables.map((table: string) => (
                    <div key={table} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                      {table}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Triggers relacionados */}
            {selectedPage.triggers && selectedPage.triggers.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  Triggers Automáticos
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPage.triggers.map((trigger: string) => (
                    <div key={trigger} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                      ⚡ {trigger}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explicación detallada (próximamente) */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Próximamente:</strong> Explicación detallada del flujo de datos, validaciones importantes y diagramas individuales para esta página.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Vista de Diagramas (original) */
        <>
      {/* Tabs con diagramas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="space-y-2">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 gap-1">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="cascada">Cascada</TabsTrigger>
            <TabsTrigger value="paso1">DUC</TabsTrigger>
            <TabsTrigger value="paso2">Entrada</TabsTrigger>
            <TabsTrigger value="problema">Auto-Sync</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-1">
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="baterias">Baterías</TabsTrigger>
            <TabsTrigger value="validados">Validados</TabsTrigger>
            <TabsTrigger value="llaves">Llaves/Docs</TabsTrigger>
            <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
            <TabsTrigger value="soporte">Soporte</TabsTrigger>
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
          </TabsList>
          <div className="mt-2 text-center text-sm text-muted-foreground flex items-center justify-center gap-3">
            <Button
              onClick={() => {
                setShowExplorer(!showExplorer)
                setSelectedPage(null)
              }}
              variant={showExplorer ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs gap-1.5"
            >
              <FolderTree className="h-3.5 w-3.5" />
              {showExplorer ? "Ocultar" : "Ver"} Explorador
            </Button>
            <span>Total de tablas en el sistema: 40</span>
            <span className="text-muted-foreground">|</span>
            <button 
              onClick={() => window.open('/LISTADO_COMPLETO_TABLAS_CVO.md', '_blank')}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Ver listado completo
            </button>
          </div>
        </div>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-6">
                <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-600" />
                Vista General del Sistema
              </CardTitle>
              <CardDescription>
                Todas las tablas y cómo se conectan entre sí
              </CardDescription>
                </div>
                {/* Leyenda a la derecha */}
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-yellow-400 rounded border border-gray-700 flex-shrink-0"></div>
                      <span>Scraper/Usuario</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-red-300 rounded border border-gray-700 flex-shrink-0"></div>
                      <span>Tabla bruta</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-green-300 rounded border border-gray-700 flex-shrink-0"></div>
                      <span>Tabla central</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-sky-300 rounded border border-gray-700 flex-shrink-0"></div>
                      <span>Tabla operacional</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">→</span>
                      <span>Flujo directo</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">- - -→</span>
                      <span>No conectado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">⚡</span>
                      <span>Trigger automático</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">❌</span>
                      <span>Problema</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid text-center">{diagramas.general}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cascada" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-green-600" />
                Cascada Vertical - Flujo Principal
              </CardTitle>
              <CardDescription>
                Flujo secuencial desde la creación hasta los incentivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.cascada}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paso1" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Paso 1: Scraper DUC → Sistema Automático
              </CardTitle>
              <CardDescription>
                NUEVO SISTEMA: Stock = SOLO lo que está en DUC. Sincronización automática con Disponibilidad. Entrega elimina de stock.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.paso1}</pre>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>✅ NUEVO SISTEMA (23 Oct 2025):</strong> Stock = SOLO lo que está en DUC (77 vehículos).
                    Trigger sync_duc_to_stock sincroniza automáticamente is_available según columna "Disponibilidad" de DUC.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>🔄 Sincronización:</strong> DISPONIBLE → is_available=TRUE, cualquier otro → is_available=FALSE.
                    Stock limpiado de 88 vehículos ausentes (ya no en DUC).
                  </p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>🚚 Al entregar:</strong> Trigger delete_stock_on_delivery elimina vehículo de stock cuando
                    se registra fecha_entrega en entregas (vehículo ya no está físicamente).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paso2" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Paso 2: Nuevas Entradas → Stock + Fotos
              </CardTitle>
              <CardDescription>
                Cómo un usuario crea una entrada y los triggers la convierten en stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.paso2}</pre>
              </div>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✅ Funcionando:</strong> Cuando is_received = TRUE, dos triggers automáticos
                  crean registros en stock y fotos.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fotos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Tabla Fotos - Sistema Completo
              </CardTitle>
              <CardDescription>
                Gestión de fotografías, estado de pintura y asignación de fotógrafos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.fotos}</pre>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>✅ Creación Automática:</strong> Cuando un vehículo es marcado como recibido (is_received = TRUE), 
                    se crea automáticamente un registro en fotos con estado_pintura = 'pendiente'.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>📸 Sistema Automático de Fotos:</strong> GitHub Actions ejecuta cada 15 minutos la función 
                    mark_photos_as_completed() que detecta vehículos con fotos en duc_scraper (columna "URL foto 9") 
                    y marca automáticamente photos_completed = TRUE.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>🔄 Sincronización con Stock:</strong> Cuando body_status cambia a 'apto' en stock, 
                    se actualiza automáticamente estado_pintura = 'apto' en fotos mediante trigger.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>🚗 Vehículos Vendidos:</strong> Cuando un vehículo se vende, el registro en fotos SE MANTIENE 
                    (no se elimina). Se actualiza estado_pintura = 'vendido' y se filtra en la interfaz para no aparecer 
                    en listas de pendientes.
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-sm text-indigo-800">
                    <strong>🔌 API Routes Disponibles:</strong> /api/photos/update-photo-status (marcar completado), 
                    /api/photos/update-paint-status (cambiar estado), /api/photos/update-photographer (asignar fotógrafo), 
                    /api/photos/mark-error (reportar error), /api/photos/subsanate-error (resolver error).
                  </p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                  <p className="text-sm text-rose-800">
                    <strong>⚠️ Gestión de Errores:</strong> Sistema de contador de errores (error_count) con posibilidad 
                    de subsanación (error_subsanated). Cada error incrementa el contador y el vehículo vuelve a estado pendiente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="baterias" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5 text-green-600" />
                Control de Baterías BEV/PHEV
              </CardTitle>
              <CardDescription>
                Sistema de monitoreo de carga de vehículos eléctricos e híbridos enchufables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.baterias}</pre>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>📊 Origen:</strong> Se alimenta automáticamente de duc_scraper filtrando solo
                    vehículos BEV (100% eléctricos) y PHEV (híbridos enchufables).
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>✅ Sincronización:</strong> Compara automáticamente con sales_vehicles para
                    identificar qué vehículos eléctricos están vendidos.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>⚙️ Configuración:</strong> Niveles de carga configurables por tipo de vehículo
                    (XEV: 80%/50%/30%, PHEV: 70%/40%/20%).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validados" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Pedidos Validados
              </CardTitle>
              <CardDescription>
                Copia de sales_vehicles cuando una venta es validada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.validados}</pre>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800">
                    <strong>📊 Flujo:</strong> Cuando un usuario valida una venta, se crea una copia completa
                    en pedidos_validados con todos los datos de sales_vehicles.
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    <strong>✅ Propósito:</strong> Mantener un registro inmutable de ventas validadas,
                    incluso si la venta original se modifica o elimina.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llaves" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-yellow-600" />
                Sistema de Llaves y Documentos
              </CardTitle>
              <CardDescription>
                Gestión completa de llaves y documentación de vehículos vendidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.llaves}</pre>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Sistema completo:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>vehicle_keys:</strong> Estado actual de las 3 llaves (llave 1, llave 2, tarjeta)</li>
                  <li><strong>vehicle_documents:</strong> Estado de documentos (ficha técnica, permiso circulación)</li>
                  <li><strong>key_movements:</strong> Historial de movimientos de llaves entre usuarios</li>
                  <li><strong>document_movements:</strong> Historial de movimientos de documentos</li>
                  <li><strong>key_document_requests:</strong> Solicitudes a Docuware para documentación faltante</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidencias" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Sistema de Incidencias + Resolución Automática
              </CardTitle>
              <CardDescription>
                Ciclo completo: creación, seguimiento y resolución automática de incidencias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.incidenciasCompleto}</pre>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">
                    <strong>⚠️ Creación:</strong> Cuando falta llave o documento en la entrega, se crea
                    incidencia en entregas.tipos_incidencia (array) e incidencias_historial.
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    <strong>✅ Resolución Automática:</strong> Cuando se entrega la llave/documento faltante,
                    la función autoResolveIncident() detecta el tipo y resuelve la incidencia automáticamente.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800">
                    <strong>📊 Flujo:</strong> key_movements/document_movements → autoResolveIncident() →
                    Actualiza entregas (quita tipo) + Registra en incidencias_historial (resuelta=true)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="soporte" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Portal de Soporte Cliente
              </CardTitle>
              <CardDescription>
                Sistema unificado de soporte con acceso para clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.soporte}</pre>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Fuentes de datos:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>entregas:</strong> Incidencias activas del campo tipos_incidencia</li>
                  <li><strong>incidencias_historial:</strong> Historial completo con estados</li>
                  <li><strong>sales_vehicles:</strong> Datos del vehículo y cliente para enriquecer</li>
                </ul>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mt-3">
                  <p className="text-purple-800">
                    <strong>🌐 Portal Cliente:</strong> Los clientes pueden acceder con su DNI para ver
                    el estado de sus incidencias, historial de resoluciones y datos del vehículo.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800">
                    <strong>👨‍💼 Panel Admin:</strong> Los administradores pueden responder incidencias
                    y enviar emails automáticos a los clientes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Todos los Triggers del Sistema
              </CardTitle>
              <CardDescription>
                12 triggers automáticos que sincronizan las tablas (6 nuevos: 3 recepción física + 3 nuevo sistema stock)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.triggers}</pre>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Triggers activos (12 total):</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong className="text-blue-600">NUEVO STOCK:</strong> delete_stock_on_delivery → Borra stock cuando se entrega (fecha_entrega ≠ NULL)</li>
                  <li><strong className="text-blue-600">NUEVO STOCK:</strong> sync_duc_to_stock → Sincroniza stock con DUC (is_available según Disponibilidad)</li>
                  <li><strong className="text-blue-600">NUEVO STOCK:</strong> sync_sales_to_fotos_vendido → Marca fotos como vendido al vender</li>
                  <li><strong className="text-green-600">RECEPCIÓN FÍSICA:</strong> sync_duc_to_all_tables → Detección de fotos automática</li>
                  <li><strong className="text-green-600">RECEPCIÓN FÍSICA:</strong> auto_mark_received_on_photos_complete → Marca recibido -2 días</li>
                  <li><strong className="text-green-600">RECEPCIÓN FÍSICA:</strong> sync_received_status → Actualiza stock+fotos (respeta auto)</li>
                  <li>nuevas_entradas → stock (cuando is_received = true)</li>
                  <li>nuevas_entradas → fotos (cuando is_received = true)</li>
                  <li>stock.body_status → fotos.estado_pintura (sincronización)</li>
                  <li>sales_vehicles INSERT → stock.is_sold = true</li>
                  <li>sales_vehicles DELETE → stock.is_sold = false</li>
                  <li>garantias_brutas → incentivos.garantia (auto-cálculo)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problema" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                duc_scraper: Sincronización Automática
              </CardTitle>
              <CardDescription>
                Sistema de detección automática de fotos y sincronización con stock, fotos y nuevas_entradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border overflow-x-auto mermaid-print-area">
                <pre className="mermaid">{diagramas.problema}</pre>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>✅ SISTEMA AUTOMÁTICO COMPLETO:</strong> duc_scraper ahora sincroniza automáticamente
                    con stock, fotos y nuevas_entradas. Detecta si tiene fotos (URL foto 1/2/3) y marca
                    recepción física hace 2 días automáticamente.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>📸 Detección Inteligente:</strong> Si el vehículo tiene fotos en DUC, el sistema
                    asume que llegó hace 2 días y marca todo como completado. Si no tiene fotos, queda
                    pendiente hasta confirmación manual o hasta que se completen las fotos.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>🎯 DEMOS Resueltos:</strong> Vehículos DEMO que se matriculan directamente en Terrassa
                    y aparecen con fotos en DUC se detectan automáticamente y marcan con backdating de 2 días,
                    eliminando completamente el factor humano.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}

    </div>
    </>
  )
}

