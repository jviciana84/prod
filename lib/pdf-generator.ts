import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ManualSection {
  title: string
  content: string[]
  subsections?: {
    title: string
    content: string[]
  }[]
}

export class ManualPDFGenerator {
  private doc: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private margin: number = 20

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.width
  }

  private addTitle(text: string, fontSize: number = 16, isBold: boolean = true) {
    this.checkPageBreak()
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    this.doc.text(text, this.margin, this.currentY)
    this.currentY += fontSize + 5
  }

  private addSubtitle(text: string, fontSize: number = 14) {
    this.checkPageBreak()
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.margin, this.currentY)
    this.currentY += fontSize + 3
  }

  private addText(text: string, fontSize: number = 12) {
    this.checkPageBreak()
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'normal')
    
    const maxWidth = this.pageWidth - (this.margin * 2)
    const lines = this.doc.splitTextToSize(text, maxWidth)
    
    const totalHeight = lines.length * fontSize * 0.4 + 2
    if (this.currentY + totalHeight > 270) {
      this.doc.addPage()
      this.currentY = 20
    }
    
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += totalHeight
  }

  private addBulletList(items: string[], fontSize: number = 11) {
    this.checkPageBreak()
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'normal')
    
    items.forEach(item => {
      this.checkPageBreak()
      const text = `• ${item}`
      const maxWidth = this.pageWidth - (this.margin * 2)
      const lines = this.doc.splitTextToSize(text, maxWidth)
      
      const lineHeight = lines.length * fontSize * 0.4 + 1
      if (this.currentY + lineHeight > 270) {
        this.doc.addPage()
        this.currentY = 20
      }
      
      this.doc.text(lines, this.margin, this.currentY)
      this.currentY += lineHeight
    })
    this.currentY += 3
  }

  private checkPageBreak() {
    if (this.currentY > 250) {
      this.doc.addPage()
      this.currentY = 20
    }
  }

  private addTable(headers: string[], data: string[][]) {
    this.checkPageBreak()
    autoTable(this.doc, {
      head: [headers],
      body: data,
      startY: this.currentY,
      margin: { left: this.margin },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [75, 85, 99],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      }
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  public generateManual(): void {
    this.generateCoverPage()
    this.generateTableOfContents()
    this.generateProjectInfo()
    this.generateTechStack()
    this.generateDashboardManual()
    this.generateEntregasManual()
    this.generateRecogidasManual()
    this.generateVehiculosManual()
    this.generateLlavesManual()
    this.generateCVOManual()
    this.generateEntregasEnManoManual()
    this.generateIncidenciasManual()
    this.generateUsuariosManual()
    this.generateReportesManual()
    this.generateConfiguracionManual()
  }

  private generateCoverPage(): void {
    // Título principal
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Sistema de Gestión de Entregas y Recogidas', this.pageWidth / 2, 60, { align: 'center' })
    
    // Versión
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Versión 2.0.0', this.pageWidth / 2, 80, { align: 'center' })
    
    // Descripción
    this.doc.setFontSize(12)
    this.doc.text('Manual Completo de Usuario', this.pageWidth / 2, 100, { align: 'center' })
    this.doc.text('Plataforma integral para la gestión de concesionarios', this.pageWidth / 2, 110, { align: 'center' })
    
    // Autor
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Desarrollado por: Jordi Viciana', this.pageWidth / 2, 140, { align: 'center' })
    
    // Fecha
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, this.pageWidth / 2, 160, { align: 'center' })
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateTableOfContents(): void {
    this.addTitle('ÍNDICE', 18, true)
    this.currentY += 10
    
    const sections = [
      '1. Información del Proyecto',
      '2. Stack Tecnológico',
      '3. Dashboard Principal',
      '4. Gestión de Entregas',
      '5. Gestión de Recogidas',
      '6. Administración de Vehículos',
      '7. Gestión de Llaves',
      '8. Gestión de CVO',
      '9. Entregas en Mano',
      '10. Sistema de Incidencias',
      '11. Gestión de Usuarios',
      '12. Reportes y Exportación',
      '13. Configuración del Sistema'
    ]
    
    sections.forEach(section => {
      this.addText(section, 12)
    })
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateProjectInfo(): void {
    this.addTitle('1. INFORMACIÓN DEL PROYECTO', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción General', 14)
    this.addText('Sistema integral de gestión para concesionarios que automatiza y optimiza todos los procesos relacionados con la entrega y recogida de vehículos, incluyendo gestión de llaves, documentación y certificados de circulación.', 11)
    this.currentY += 10
    
    this.addSubtitle('Características Principales', 14)
    const features = [
      'Dashboard con métricas en tiempo real y filtros avanzados',
      'Sistema de entregas con estados y gestión de fechas',
      'Gestión de recogidas con asignación automática de fotógrafos',
      'Administración de vehículos con incidentes y prioridades',
      'Sistema de gestión de llaves (1ª, 2ª y tarjeta)',
      'Gestión de CVO (Certificado de Vehículo Ocasional)',
      'Entregas en mano con confirmación por email',
      'Sistema de incidencias con prioridades y seguimiento',
      'Gestión de usuarios con roles y permisos',
      'Reportes y exportación de datos',
      'Configuración avanzada del sistema'
    ]
    this.addBulletList(features, 11)
    
    this.addSubtitle('Información Técnica', 14)
    const techInfo = [
      'Tipo: Sistema de Gestión Empresarial para Concesionarios',
      'Arquitectura: Frontend + Backend + Base de Datos',
      'Despliegue: Cloud-based con Supabase',
      'Seguridad: Autenticación y Row Level Security (RLS)',
      'Escalabilidad: Diseño modular y APIs RESTful'
    ]
    this.addBulletList(techInfo, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateTechStack(): void {
    this.addTitle('2. STACK TECNOLÓGICO', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Frontend', 14)
    const frontend = [
      'Next.js 15 - Framework de React para aplicaciones web',
      'React 18 - Biblioteca para interfaces de usuario',
      'TypeScript - Lenguaje tipado para desarrollo seguro',
      'Tailwind CSS - Framework CSS para diseño responsivo',
      'Framer Motion - Animaciones y transiciones',
      'Radix UI - Componentes accesibles',
      'Lucide React - Iconografía moderna',
      'Recharts - Gráficos y visualizaciones'
    ]
    this.addBulletList(frontend, 11)
    
    this.addSubtitle('Backend y Base de Datos', 14)
    const backend = [
      'Supabase - Backend-as-a-Service con PostgreSQL',
      'PostgreSQL - Base de datos relacional',
      'Row Level Security (RLS) - Seguridad a nivel de fila',
      'API Routes - Endpoints personalizados',
      'Vercel Blob - Almacenamiento de archivos'
    ]
    this.addBulletList(backend, 11)
    
    this.addSubtitle('Herramientas de Desarrollo', 14)
    const tools = [
      'Vercel - Despliegue y hosting',
      'Git - Control de versiones',
      'ESLint - Linting de código',
      'Prettier - Formateo de código',
      'TypeScript - Verificación de tipos'
    ]
    this.addBulletList(tools, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateDashboardManual(): void {
    this.addTitle('3. DASHBOARD PRINCIPAL', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El Dashboard es el centro de control principal que proporciona una visión general de todos los procesos del concesionario en tiempo real, con métricas clave y acceso rápido a las funciones principales.', 11)
    this.currentY += 10
    
    this.addSubtitle('Métricas Principales', 14)
    const metrics = [
      'Entregas Pendientes - Vehículos listos para entrega',
      'Recogidas Activas - Vehículos en proceso de recogida',
      'Incidencias Abiertas - Problemas sin resolver',
      'Movimientos de Llaves - Transferencias pendientes',
      'CVO Pendientes - Certificados en tramitación',
      'Usuarios Activos - Personal conectado actualmente'
    ]
    this.addBulletList(metrics, 11)
    
    this.addSubtitle('Filtros Avanzados', 14)
    const filters = [
      'Rango de Fechas - Período específico para análisis',
      'Estado - Filtrar por estado de entrega o recogida',
      'Usuario - Filtrar por responsable asignado',
      'Tipo de Vehículo - Filtrar por categoría',
      'Prioridad - Filtrar por nivel de urgencia'
    ]
    this.addBulletList(filters, 11)
    
    this.addSubtitle('Acceso Rápido', 14)
    const quickAccess = [
      'Nueva Entrega - Registrar entrega de vehículo',
      'Nueva Recogida - Iniciar proceso de recogida',
      'Gestión de Llaves - Administrar movimientos',
      'Reportes - Generar informes y estadísticas',
      'Configuración - Ajustar preferencias del sistema'
    ]
    this.addBulletList(quickAccess, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateEntregasManual(): void {
    this.addTitle('4. GESTIÓN DE ENTREGAS', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El módulo de Entregas permite gestionar todo el proceso de entrega de vehículos a clientes, desde el registro inicial hasta la confirmación final, incluyendo documentación y certificados necesarios.', 11)
    this.currentY += 10
    
    this.addSubtitle('Estados de Entrega', 14)
    const states = [
      'Pendiente - Entrega registrada pero no iniciada',
      'En Proceso - Entrega en curso con documentación',
      'Completada - Entrega finalizada exitosamente',
      'Cancelada - Entrega cancelada por el cliente',
      'Retrasada - Entrega fuera del plazo establecido'
    ]
    this.addBulletList(states, 11)
    
    this.addSubtitle('Documentación Requerida', 14)
    const documentation = [
      'Ficha Técnica - Documentación técnica del vehículo',
      'Permiso de Circulación - Certificado obligatorio',
      'Seguro - Póliza de seguro vigente',
      'ITV - Inspección técnica de vehículos',
      'Documentación Adicional - Otros documentos específicos'
    ]
    this.addBulletList(documentation, 11)
    
    this.addSubtitle('Proceso de Entrega', 14)
    const process = [
      'Registro - Crear nueva entrega con datos del vehículo',
      'Verificación - Confirmar documentación requerida',
      'Preparación - Preparar vehículo y documentación',
      'Entrega - Proceso físico de entrega al cliente',
      'Confirmación - Confirmar entrega y archivar'
    ]
    this.addBulletList(process, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateRecogidasManual(): void {
    this.addTitle('5. GESTIÓN DE RECOGIDAS', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El módulo de Recogidas gestiona el proceso de recogida de vehículos de clientes, incluyendo la asignación automática de fotógrafos, documentación fotográfica y seguimiento del estado del vehículo.', 11)
    this.currentY += 10
    
    this.addSubtitle('Asignación Automática', 14)
    const assignment = [
      'Fotógrafos Disponibles - Lista de personal disponible',
      'Carga de Trabajo - Distribución equitativa de recogidas',
      'Ubicación - Asignación por proximidad geográfica',
      'Especialización - Asignación por tipo de vehículo',
      'Prioridad - Asignación por urgencia del caso'
    ]
    this.addBulletList(assignment, 11)
    
    this.addSubtitle('Documentación Fotográfica', 14)
    const photography = [
      'Fotos Exteriores - Estado general del vehículo',
      'Fotos Interiores - Estado de tapicería y equipamiento',
      'Fotos de Daños - Documentación de desperfectos',
      'Fotos de Documentación - DNI, permiso de circulación',
      'Vídeo - Grabación del estado general del vehículo'
    ]
    this.addBulletList(photography, 11)
    
    this.addSubtitle('Estados de Recogida', 14)
    const states = [
      'Pendiente - Recogida registrada, esperando asignación',
      'Asignada - Fotógrafo asignado, en proceso',
      'En Curso - Fotógrafo en ruta hacia el vehículo',
      'Fotografiando - Documentación fotográfica en curso',
      'Completada - Recogida finalizada con documentación',
      'Cancelada - Recogida cancelada por el cliente'
    ]
    this.addBulletList(states, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateVehiculosManual(): void {
    this.addTitle('6. ADMINISTRACIÓN DE VEHÍCULOS', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El módulo de Vehículos permite administrar toda la flota, gestionar incidentes con prioridades, controlar estados de mantenimiento y mantener un historial completo de cada vehículo.', 11)
    this.currentY += 10
    
    this.addSubtitle('Gestión de Flota', 14)
    const fleet = [
      'Registro de Vehículos - Datos completos de cada unidad',
      'Estados de Mantenimiento - Control de revisiones',
      'Historial de Servicios - Registro de intervenciones',
      'Documentación - Gestión de permisos y seguros',
      'Ubicación - Control de localización de vehículos'
    ]
    this.addBulletList(fleet, 11)
    
    this.addSubtitle('Sistema de Prioridades', 14)
    const priorities = [
      'Alta (crítico) - Problemas que afectan la operación',
      'Media (importante) - Problemas que requieren atención',
      'Baja (menor) - Problemas menores o de mantenimiento'
    ]
    this.addBulletList(priorities, 11)
    
    this.addSubtitle('Tipos de Incidentes', 14)
    const incidents = [
      'Mecánicos - Problemas de motor, transmisión, etc.',
      'Eléctricos - Problemas de batería, luces, etc.',
      'Exteriores - Daños en carrocería, cristales, etc.',
      'Interiores - Problemas de tapicería, equipamiento',
      'Documentación - Problemas con permisos o seguros'
    ]
    this.addBulletList(incidents, 11)
    
    this.addSubtitle('Notificaciones', 14)
    const notifications = [
      'Alertas automáticas por prioridad',
      'Notificaciones por email a responsables',
      'Recordatorios de mantenimiento',
      'Alertas de documentación expirando'
    ]
    this.addBulletList(notifications, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateLlavesManual(): void {
    this.addTitle('7. GESTIÓN DE LLAVES', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El sistema de gestión de llaves permite controlar el movimiento de las llaves de los vehículos entre diferentes usuarios y ubicaciones, asegurando trazabilidad completa y confirmaciones automáticas.', 11)
    this.currentY += 10
    
    this.addSubtitle('Tipos de Llaves', 14)
    const keyTypes = [
      '1ª Llave - Llave principal del vehículo',
      '2ª Llave - Llave secundaria de respaldo',
      'Tarjeta - Tarjeta de acceso o mando a distancia'
    ]
    this.addBulletList(keyTypes, 11)
    
    this.addSubtitle('Movimientos de Llaves', 14)
    const movements = [
      'Transferencia - Movimiento entre usuarios',
      'Recepción - Confirmación de recepción',
      'Devolución - Retorno de llaves al almacén',
      'Pérdida - Registro de llaves perdidas',
      'Duplicado - Solicitud de llaves adicionales'
    ]
    this.addBulletList(movements, 11)
    
    this.addSubtitle('Confirmaciones Automáticas', 14)
    const confirmations = [
      'Email de Confirmación - Notificación automática',
      'Estado Pendiente - Esperando confirmación',
      'Estado Confirmado - Movimiento validado',
      'Estado Rechazado - Movimiento cancelado',
      'Historial Completo - Registro de todos los movimientos'
    ]
    this.addBulletList(confirmations, 11)
    
    this.addSubtitle('Resolución Automática de Incidentes', 14)
    const autoResolution = [
      'Detección Automática - Identificación de incidentes',
      'Resolución por Movimiento - Cierre automático',
      'Notificación de Resolución - Confirmación al usuario',
      'Historial de Resoluciones - Registro de cierres'
    ]
    this.addBulletList(autoResolution, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateCVOManual(): void {
    this.addTitle('8. GESTIÓN DE CVO', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El sistema de gestión de CVO (Certificado de Vehículo Ocasional) automatiza la generación de solicitudes de permisos de circulación cuando se registra una fecha de entrega, manteniendo la lógica correcta del negocio.', 11)
    this.currentY += 10
    
    this.addSubtitle('Lógica de Negocio', 14)
    const businessLogic = [
      'Venta - Se registra en sales_vehicles',
      'Entrega - Se registra en entregas con fecha_entrega',
      'Tramitación - Solo después de la entrega se tramita el cambio de nombre',
      'Permiso - Solo entonces se necesita el permiso de circulación'
    ]
    this.addBulletList(businessLogic, 11)
    
    this.addSubtitle('Generación Automática', 14)
    const autoGeneration = [
      'Trigger Automático - Se activa al registrar fecha_entrega',
      'Verificación de Duplicados - Evita solicitudes repetidas',
      'Datos Automáticos - Matrícula, modelo, asesor',
      'Estado Inicial - Pendiente de tramitación',
      'Observaciones - Registro de generación automática'
    ]
    this.addBulletList(autoGeneration, 11)
    
    this.addSubtitle('Estados de CVO', 14)
    const states = [
      'Pendiente - Solicitud generada, esperando tramitación',
      'En Tramitación - Proceso administrativo en curso',
      'Aprobado - Permiso concedido por la administración',
      'Rechazado - Permiso denegado con motivo',
      'Completado - Permiso entregado al cliente'
    ]
    this.addBulletList(states, 11)
    
    this.addSubtitle('Materiales de CVO', 14)
    const materials = [
      'Permiso de Circulación - Documento principal',
      'Documentación Adicional - Otros documentos requeridos',
      'Observaciones - Notas específicas del caso',
      'Estado de Material - Pendiente/Preparado/Entregado'
    ]
    this.addBulletList(materials, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateEntregasEnManoManual(): void {
    this.addTitle('9. ENTREGAS EN MANO', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El sistema de entregas en mano permite gestionar la entrega de documentación por mensajería, incluyendo confirmación por email, seguimiento de estado y tokens de seguridad para validación.', 11)
    this.currentY += 10
    
    this.addSubtitle('Proceso de Entrega', 14)
    const process = [
      'Registro - Crear entrega en mano con datos del cliente',
      'Documentación - Especificar documentos a entregar',
      'Mensajería - Asignar servicio de mensajería',
      'Seguimiento - Monitorear estado de la entrega',
      'Confirmación - Validar recepción por el cliente'
    ]
    this.addBulletList(process, 11)
    
    this.addSubtitle('Confirmación por Email', 14)
    const emailConfirmation = [
      'Email Automático - Notificación al cliente',
      'Token de Seguridad - Código único de validación',
      'Enlace de Confirmación - Acceso directo al sistema',
      'Estado de Confirmación - Pendiente/Confirmado',
      'Historial de Confirmaciones - Registro completo'
    ]
    this.addBulletList(emailConfirmation, 11)
    
    this.addSubtitle('Estados de Entrega', 14)
    const states = [
      'Pendiente - Entrega registrada, esperando envío',
      'En Tránsito - Documentación en ruta',
      'Entregado - Documentación recibida por el cliente',
      'Confirmado - Cliente ha validado la recepción',
      'Cancelado - Entrega cancelada por el cliente'
    ]
    this.addBulletList(states, 11)
    
    this.addSubtitle('Seguridad', 14)
    const security = [
      'Token Único - Código de validación único',
      'Verificación de Identidad - Confirmación del cliente',
      'Registro de Acceso - Historial de confirmaciones',
      'Trazabilidad Completa - Seguimiento completo del proceso'
    ]
    this.addBulletList(security, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateIncidenciasManual(): void {
    this.addTitle('10. SISTEMA DE INCIDENCIAS', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El sistema de incidencias permite gestionar problemas y situaciones que requieren atención especial, con un sistema de prioridades, tipos de incidencia y seguimiento completo para resolver problemas de manera eficiente.', 11)
    this.currentY += 10
    
    this.addSubtitle('Tipos de Incidencias', 14)
    const types = [
      'Llaves - Problemas relacionados con gestión de llaves',
      'Documentación - Problemas con permisos o documentación',
      'Mecánica - Problemas técnicos del vehículo',
      'Logística - Problemas de transporte o entrega',
      'Cliente - Problemas relacionados con el cliente',
      'Sistema - Problemas técnicos del software'
    ]
    this.addBulletList(types, 11)
    
    this.addSubtitle('Sistema de Prioridades', 14)
    const priorities = [
      'Alta - Problemas críticos que afectan la operación',
      'Media - Problemas importantes que requieren atención',
      'Baja - Problemas menores o de mantenimiento'
    ]
    this.addBulletList(priorities, 11)
    
    this.addSubtitle('Estados de Incidencia', 14)
    const states = [
      'Abierta - Incidencia registrada, pendiente de asignación',
      'En Proceso - Incidencia asignada, en resolución',
      'Cerrada - Incidencia resuelta exitosamente',
      'Cancelada - Incidencia cancelada o no válida'
    ]
    this.addBulletList(states, 11)
    
    this.addSubtitle('Seguimiento', 14)
    const tracking = [
      'Asignación Automática - Distribución por carga de trabajo',
      'Notificaciones - Alertas por email a responsables',
      'Actualizaciones - Registro de progreso y comentarios',
      'Tiempo de Resolución - Control de tiempos de respuesta',
      'Filtros - Filtrar incidencias por prioridad'
    ]
    this.addBulletList(tracking, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateUsuariosManual(): void {
    this.addTitle('11. GESTIÓN DE USUARIOS', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El módulo de Usuarios permite administrar el personal del concesionario, gestionar roles y permisos, y controlar el acceso a las diferentes funcionalidades del sistema.', 11)
    this.currentY += 10
    
    this.addSubtitle('Roles de Usuario', 14)
    const roles = [
      'Administrador - Acceso completo al sistema',
      'Gerente - Gestión de equipos y reportes',
      'Asesor - Gestión de ventas y entregas',
      'Fotógrafo - Documentación fotográfica',
      'Técnico - Gestión de incidencias y mantenimiento',
      'Recepcionista - Gestión de recogidas y documentación'
    ]
    this.addBulletList(roles, 11)
    
    this.addSubtitle('Permisos por Rol', 14)
    const permissions = [
      'Dashboard - Acceso a métricas y estadísticas',
      'Entregas - Gestión completa de entregas',
      'Recogidas - Gestión de recogidas y fotografía',
      'Vehículos - Administración de la flota',
      'Llaves - Gestión de movimientos de llaves',
      'Incidencias - Gestión de problemas y seguimiento',
      'Reportes - Generación y exportación de informes',
      'Configuración - Ajustes del sistema'
    ]
    this.addBulletList(permissions, 11)
    
    this.addSubtitle('Gestión de Acceso', 14)
    const access = [
      'Autenticación - Login seguro con Supabase Auth',
      'Row Level Security - Seguridad a nivel de fila',
      'Sesiones - Control de sesiones activas',
      'Logs de Actividad - Registro de acciones del usuario',
      'Recuperación de Contraseña - Proceso seguro'
    ]
    this.addBulletList(access, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateReportesManual(): void {
    this.addTitle('12. REPORTES Y EXPORTACIÓN', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El módulo de Reportes permite generar informes detallados y exportar datos en diferentes formatos para análisis, auditorías y toma de decisiones basada en datos.', 11)
    this.currentY += 10
    
    this.addSubtitle('Tipos de Reportes', 14)
    const reportTypes = [
      'Entregas - Resumen de entregas por período con estados',
      'Recogidas - Estadísticas de recogidas y fotógrafos',
      'Vehículos - Estado de la flota y disponibilidad',
      'Usuarios - Actividad y rendimiento de usuarios',
      'Incidencias - Análisis de problemas y resoluciones',
      'CVO - Estado de tramitación de certificados'
    ]
    this.addBulletList(reportTypes, 11)
    
    this.addSubtitle('Formatos de Exportación', 14)
    const formats = [
      'PDF - Reportes formateados y profesionales',
      'Excel - Datos tabulares para análisis avanzado',
      'CSV - Datos sin formato para importación en otros sistemas',
      'JSON - Datos estructurados para APIs y integraciones',
      'Personalización - Configuración de encabezados y formato'
    ]
    this.addBulletList(formats, 11)
    
    this.addSubtitle('Filtros y Personalización', 14)
    const filters = [
      'Rango de Fechas - Período específico para el reporte',
      'Estado - Filtrar por estado de entrega, recogida o incidencia',
      'Usuario Responsable - Filtrar por usuario asignado',
      'Tipo de Vehículo - Filtrar por categoría de vehículo',
      'Configuración - Personalizar columnas y ordenamiento'
    ]
    this.addBulletList(filters, 11)
    
    this.doc.addPage()
    this.currentY = 20
  }

  private generateConfiguracionManual(): void {
    this.addTitle('13. CONFIGURACIÓN DEL SISTEMA', 16, true)
    this.currentY += 10
    
    this.addSubtitle('Descripción', 14)
    this.addText('El módulo de Configuración permite personalizar el comportamiento del sistema, ajustar preferencias de usuario y gestionar configuraciones avanzadas del concesionario.', 11)
    this.currentY += 10
    
    this.addSubtitle('Configuración General', 14)
    const generalConfig = [
      'Tema - Claro/Oscuro según preferencia del usuario',
      'Idioma - Español/Inglés con persistencia de preferencia',
      'Notificaciones - Email/Push con configuración granular',
      'Auto-refresh - Intervalo de actualización automática',
      'Vista por Defecto - Configuración inicial del dashboard'
    ]
    this.addBulletList(generalConfig, 11)
    
    this.addSubtitle('Configuración de Email', 14)
    const emailConfig = [
      'SMTP - Configuración del servidor de correo',
      'Plantillas - Emails personalizados por tipo de notificación',
      'Destinatarios - Lista de contactos para notificaciones',
      'Programación - Envío automático de reportes',
      'Validación - Pruebas de configuración de email'
    ]
    this.addBulletList(emailConfig, 11)
    
    this.addSubtitle('Configuraciones Avanzadas', 14)
    const advancedConfig = [
      'Base de Datos - Conexión y optimización de consultas',
      'Integraciones - APIs externas y webhooks',
      'Sincronización - Datos en tiempo real entre módulos',
      'Logs de Actividad - Registro detallado de acciones',
      'Backup - Configuración de respaldos automáticos'
    ]
    this.addBulletList(advancedConfig, 11)
    
    // Página final con información de contacto
    this.doc.addPage()
    this.currentY = 20
    
    this.addTitle('INFORMACIÓN DE CONTACTO', 16, true)
    this.currentY += 20
    
    this.addSubtitle('Desarrollador', 14)
    this.addText('Jordi Viciana', 12)
    this.currentY += 10
    
    this.addSubtitle('Soporte Técnico', 14)
    this.addText('Para consultas técnicas o reportar problemas, contacta al equipo de desarrollo.', 11)
    this.currentY += 10
    
    this.addSubtitle('Versión del Manual', 14)
    this.addText(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 11)
  }

  public download(): void {
    this.doc.save('Manual_Sistema_Gestion_Entregas_Completo.pdf')
  }
}

export function generateManualPDF(): void {
  const generator = new ManualPDFGenerator()
  generator.generateManual()
  generator.download()
} 