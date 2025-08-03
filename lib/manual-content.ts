export interface ProjectInfo {
  name: string
  version: string
  developer: string
  description: string
  features: string[]
  techInfo: string[]
}

export interface TechStackItem {
  name: string
  description: string
  category: 'frontend' | 'backend' | 'database' | 'tools'
}

export interface ManualSection {
  id: string
  title: string
  description: string
  features: string[]
  subsections?: {
    title: string
    content: string[]
  }[]
}

export const PROJECT_INFO: ProjectInfo = {
  name: 'Sistema de Gestión de Entregas y Recogidas',
  version: '2.0.0',
  developer: 'Jordi Viciana',
  description: 'Plataforma integral para la gestión completa de entregas, recogidas, vehículos, llaves, CVO y documentación de concesionarios',
  features: [
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
  ],
  techInfo: [
    'Tipo: Sistema de Gestión Empresarial para Concesionarios',
    'Arquitectura: Frontend + Backend + Base de Datos',
    'Despliegue: Cloud-based con Supabase',
    'Seguridad: Autenticación y Row Level Security (RLS)',
    'Escalabilidad: Diseño modular y APIs RESTful'
  ]
}

export const TECH_STACK: TechStackItem[] = [
  {
    name: 'Next.js 15',
    description: 'Framework de React para aplicaciones web con renderizado híbrido',
    category: 'frontend'
  },
  {
    name: 'React 18',
    description: 'Biblioteca para interfaces de usuario con hooks y concurrent features',
    category: 'frontend'
  },
  {
    name: 'TypeScript',
    description: 'Lenguaje tipado para desarrollo seguro y mantenible',
    category: 'frontend'
  },
  {
    name: 'Tailwind CSS',
    description: 'Framework CSS utility-first para diseño responsivo',
    category: 'frontend'
  },
  {
    name: 'Framer Motion',
    description: 'Biblioteca de animaciones para React con transiciones suaves',
    category: 'frontend'
  },
  {
    name: 'Radix UI',
    description: 'Componentes accesibles y sin estilos predefinidos',
    category: 'frontend'
  },
  {
    name: 'Lucide React',
    description: 'Iconografía moderna y consistente',
    category: 'frontend'
  },
  {
    name: 'Recharts',
    description: 'Biblioteca de gráficos para visualizaciones de datos',
    category: 'frontend'
  },
  {
    name: 'Supabase',
    description: 'Backend-as-a-Service con PostgreSQL y autenticación',
    category: 'backend'
  },
  {
    name: 'PostgreSQL',
    description: 'Base de datos relacional robusta y escalable',
    category: 'database'
  },
  {
    name: 'Row Level Security',
    description: 'Seguridad a nivel de fila para control de acceso granular',
    category: 'database'
  },
  {
    name: 'API Routes',
    description: 'Endpoints personalizados para lógica de negocio',
    category: 'backend'
  },
  {
    name: 'Vercel Blob',
    description: 'Almacenamiento de archivos para imágenes y documentos',
    category: 'backend'
  },
  {
    name: 'Vercel',
    description: 'Plataforma de despliegue y hosting optimizada',
    category: 'tools'
  }
]

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Principal',
    description: 'Centro de control con métricas en tiempo real, filtros avanzados y acceso rápido a todas las funcionalidades del sistema.',
    features: [
      'Métricas en tiempo real de entregas, recogidas e incidencias',
      'Filtros por fecha, estado, usuario y tipo de vehículo',
      'Gráficos interactivos de rendimiento',
      'Acceso directo a todas las funcionalidades',
      'Notificaciones y alertas automáticas'
    ],
    subsections: [
      {
        title: 'Métricas Principales',
        content: [
          'Entregas Pendientes - Vehículos listos para entrega',
          'Recogidas Activas - Vehículos en proceso de recogida',
          'Incidencias Abiertas - Problemas sin resolver',
          'Movimientos de Llaves - Transferencias pendientes',
          'CVO Pendientes - Certificados en tramitación'
        ]
      },
      {
        title: 'Filtros Avanzados',
        content: [
          'Rango de Fechas - Período específico para análisis',
          'Estado - Filtrar por estado de entrega o recogida',
          'Usuario - Filtrar por responsable asignado',
          'Tipo de Vehículo - Filtrar por categoría',
          'Prioridad - Filtrar por nivel de urgencia'
        ]
      }
    ]
  },
  {
    id: 'entregas',
    title: 'Gestión de Entregas',
    description: 'Sistema completo para gestionar el proceso de entrega de vehículos, desde el registro inicial hasta la confirmación final.',
    features: [
      'Registro de entregas con datos completos del vehículo',
      'Estados de entrega (Pendiente, En Proceso, Completada)',
      'Gestión de documentación requerida',
      'Filtros por fecha y estado',
      'Edición en línea de fechas y observaciones'
    ],
    subsections: [
      {
        title: 'Estados de Entrega',
        content: [
          'Pendiente - Entrega registrada pero no iniciada',
          'En Proceso - Entrega en curso con documentación',
          'Completada - Entrega finalizada exitosamente',
          'Cancelada - Entrega cancelada por el cliente',
          'Retrasada - Entrega fuera del plazo establecido'
        ]
      },
      {
        title: 'Documentación Requerida',
        content: [
          'Ficha Técnica - Documentación técnica del vehículo',
          'Permiso de Circulación - Certificado obligatorio',
          'Seguro - Póliza de seguro vigente',
          'ITV - Inspección técnica de vehículos',
          'Documentación Adicional - Otros documentos específicos'
        ]
      }
    ]
  },
  {
    id: 'recogidas',
    title: 'Gestión de Recogidas',
    description: 'Sistema de recogidas con asignación automática de fotógrafos, documentación fotográfica y seguimiento completo del proceso.',
    features: [
      'Asignación automática de fotógrafos',
      'Documentación fotográfica completa',
      'Seguimiento en tiempo real del estado',
      'Gestión de vehículos para recoger',
      'Historial de recogidas con filtros'
    ],
    subsections: [
      {
        title: 'Asignación Automática',
        content: [
          'Fotógrafos Disponibles - Lista de personal disponible',
          'Carga de Trabajo - Distribución equitativa de recogidas',
          'Ubicación - Asignación por proximidad geográfica',
          'Especialización - Asignación por tipo de vehículo',
          'Prioridad - Asignación por urgencia del caso'
        ]
      },
      {
        title: 'Documentación Fotográfica',
        content: [
          'Fotos Exteriores - Estado general del vehículo',
          'Fotos Interiores - Estado de tapicería y equipamiento',
          'Fotos de Daños - Documentación de desperfectos',
          'Fotos de Documentación - DNI, permiso de circulación',
          'Vídeo - Grabación del estado general del vehículo'
        ]
      }
    ]
  },
  {
    id: 'vehiculos',
    title: 'Administración de Vehículos',
    description: 'Gestión completa de la flota con control de estados, mantenimiento, incidentes y prioridades.',
    features: [
      'Registro completo de vehículos con datos técnicos',
      'Sistema de prioridades (Alta, Media, Baja)',
      'Gestión de incidentes por categorías',
      'Control de estados de mantenimiento',
      'Historial completo de cada vehículo'
    ],
    subsections: [
      {
        title: 'Sistema de Prioridades',
        content: [
          'Alta (crítico) - Problemas que afectan la operación',
          'Media (importante) - Problemas que requieren atención',
          'Baja (menor) - Problemas menores o de mantenimiento'
        ]
      },
      {
        title: 'Tipos de Incidentes',
        content: [
          'Mecánicos - Problemas de motor, transmisión, etc.',
          'Eléctricos - Problemas de batería, luces, etc.',
          'Exteriores - Daños en carrocería, cristales, etc.',
          'Interiores - Problemas de tapicería, equipamiento',
          'Documentación - Problemas con permisos o seguros'
        ]
      }
    ]
  },
  {
    id: 'llaves',
    title: 'Gestión de Llaves',
    description: 'Sistema de control de movimientos de llaves entre usuarios con confirmaciones automáticas y resolución de incidentes.',
    features: [
      'Control de 1ª, 2ª llave y tarjeta',
      'Movimientos entre usuarios con trazabilidad',
      'Confirmaciones automáticas por email',
      'Resolución automática de incidentes',
      'Historial completo de movimientos'
    ],
    subsections: [
      {
        title: 'Tipos de Llaves',
        content: [
          '1ª Llave - Llave principal del vehículo',
          '2ª Llave - Llave secundaria de respaldo',
          'Tarjeta - Tarjeta de acceso o mando a distancia'
        ]
      },
      {
        title: 'Movimientos de Llaves',
        content: [
          'Transferencia - Movimiento entre usuarios',
          'Recepción - Confirmación de recepción',
          'Devolución - Retorno de llaves al almacén',
          'Pérdida - Registro de llaves perdidas',
          'Duplicado - Solicitud de llaves adicionales'
        ]
      }
    ]
  },
  {
    id: 'cvo',
    title: 'Gestión de CVO',
    description: 'Sistema automatizado para la gestión de Certificados de Vehículo Ocasional con triggers automáticos y lógica de negocio.',
    features: [
      'Generación automática al registrar fecha de entrega',
      'Lógica de negocio correcta (Venta → Entrega → Tramitación)',
      'Verificación de duplicados',
      'Estados de tramitación',
      'Gestión de materiales de CVO'
    ],
    subsections: [
      {
        title: 'Lógica de Negocio',
        content: [
          'Venta - Se registra en sales_vehicles',
          'Entrega - Se registra en entregas con fecha_entrega',
          'Tramitación - Solo después de la entrega se tramita el cambio de nombre',
          'Permiso - Solo entonces se necesita el permiso de circulación'
        ]
      },
      {
        title: 'Estados de CVO',
        content: [
          'Pendiente - Solicitud generada, esperando tramitación',
          'En Tramitación - Proceso administrativo en curso',
          'Aprobado - Permiso concedido por la administración',
          'Rechazado - Permiso denegado con motivo',
          'Completado - Permiso entregado al cliente'
        ]
      }
    ]
  },
  {
    id: 'entregas-en-mano',
    title: 'Entregas en Mano',
    description: 'Sistema para gestionar entregas de documentación por mensajería con confirmación por email y tokens de seguridad.',
    features: [
      'Registro de entregas en mano con datos del cliente',
      'Confirmación por email con token de seguridad',
      'Seguimiento de estado de la entrega',
      'Validación de recepción por el cliente',
      'Historial completo de entregas'
    ],
    subsections: [
      {
        title: 'Proceso de Entrega',
        content: [
          'Registro - Crear entrega en mano con datos del cliente',
          'Documentación - Especificar documentos a entregar',
          'Mensajería - Asignar servicio de mensajería',
          'Seguimiento - Monitorear estado de la entrega',
          'Confirmación - Validar recepción por el cliente'
        ]
      },
      {
        title: 'Seguridad',
        content: [
          'Token Único - Código de validación único',
          'Verificación de Identidad - Confirmación del cliente',
          'Registro de Acceso - Historial de confirmaciones',
          'Trazabilidad Completa - Seguimiento completo del proceso'
        ]
      }
    ]
  },
  {
    id: 'incidencias',
    title: 'Sistema de Incidencias',
    description: 'Gestión de problemas y situaciones que requieren atención especial con sistema de prioridades y seguimiento completo.',
    features: [
      'Tipos de incidencias (Llaves, Documentación, Mecánica, etc.)',
      'Sistema de prioridades (Alta, Media, Baja)',
      'Estados de incidencia (Abierta, En Proceso, Cerrada)',
      'Asignación automática por carga de trabajo',
      'Notificaciones por email a responsables'
    ],
    subsections: [
      {
        title: 'Tipos de Incidencias',
        content: [
          'Llaves - Problemas relacionados con gestión de llaves',
          'Documentación - Problemas con permisos o documentación',
          'Mecánica - Problemas técnicos del vehículo',
          'Logística - Problemas de transporte o entrega',
          'Cliente - Problemas relacionados con el cliente',
          'Sistema - Problemas técnicos del software'
        ]
      },
      {
        title: 'Sistema de Prioridades',
        content: [
          'Alta - Problemas críticos que afectan la operación',
          'Media - Problemas importantes que requieren atención',
          'Baja - Problemas menores o de mantenimiento'
        ]
      }
    ]
  },
  {
    id: 'usuarios',
    title: 'Gestión de Usuarios',
    description: 'Administración del personal del concesionario con roles, permisos y control de acceso a las funcionalidades.',
    features: [
      'Roles de usuario (Administrador, Gerente, Asesor, etc.)',
      'Permisos granulares por funcionalidad',
      'Autenticación segura con Supabase Auth',
      'Row Level Security para control de acceso',
      'Logs de actividad y sesiones'
    ],
    subsections: [
      {
        title: 'Roles de Usuario',
        content: [
          'Administrador - Acceso completo al sistema',
          'Gerente - Gestión de equipos y reportes',
          'Asesor - Gestión de ventas y entregas',
          'Fotógrafo - Documentación fotográfica',
          'Técnico - Gestión de incidencias y mantenimiento',
          'Recepcionista - Gestión de recogidas y documentación'
        ]
      },
      {
        title: 'Gestión de Acceso',
        content: [
          'Autenticación - Login seguro con Supabase Auth',
          'Row Level Security - Seguridad a nivel de fila',
          'Sesiones - Control de sesiones activas',
          'Logs de Actividad - Registro de acciones del usuario',
          'Recuperación de Contraseña - Proceso seguro'
        ]
      }
    ]
  },
  {
    id: 'reportes',
    title: 'Reportes y Exportación',
    description: 'Generación de informes detallados y exportación de datos en diferentes formatos para análisis y auditorías.',
    features: [
      'Reportes por tipo (Entregas, Recogidas, Vehículos, etc.)',
      'Formatos de exportación (PDF, Excel, CSV, JSON)',
      'Filtros avanzados por fecha, estado y usuario',
      'Personalización de columnas y ordenamiento',
      'Programación automática de reportes'
    ],
    subsections: [
      {
        title: 'Tipos de Reportes',
        content: [
          'Entregas - Resumen de entregas por período con estados',
          'Recogidas - Estadísticas de recogidas y fotógrafos',
          'Vehículos - Estado de la flota y disponibilidad',
          'Usuarios - Actividad y rendimiento de usuarios',
          'Incidencias - Análisis de problemas y resoluciones',
          'CVO - Estado de tramitación de certificados'
        ]
      },
      {
        title: 'Formatos de Exportación',
        content: [
          'PDF - Reportes formateados y profesionales',
          'Excel - Datos tabulares para análisis avanzado',
          'CSV - Datos sin formato para importación en otros sistemas',
          'JSON - Datos estructurados para APIs y integraciones',
          'Personalización - Configuración de encabezados y formato'
        ]
      }
    ]
  },
  {
    id: 'configuracion',
    title: 'Configuración del Sistema',
    description: 'Personalización del comportamiento del sistema, ajustes de usuario y configuraciones avanzadas del concesionario.',
    features: [
      'Configuración de tema (Claro/Oscuro)',
      'Gestión de idioma y preferencias',
      'Configuración de email y notificaciones',
      'Ajustes de base de datos y integraciones',
      'Configuración de respaldos automáticos'
    ],
    subsections: [
      {
        title: 'Configuración General',
        content: [
          'Tema - Claro/Oscuro según preferencia del usuario',
          'Idioma - Español/Inglés con persistencia de preferencia',
          'Notificaciones - Email/Push con configuración granular',
          'Auto-refresh - Intervalo de actualización automática',
          'Vista por Defecto - Configuración inicial del dashboard'
        ]
      },
      {
        title: 'Configuración de Email',
        content: [
          'SMTP - Configuración del servidor de correo',
          'Plantillas - Emails personalizados por tipo de notificación',
          'Destinatarios - Lista de contactos para notificaciones',
          'Programación - Envío automático de reportes',
          'Validación - Pruebas de configuración de email'
        ]
      }
    ]
  }
]

// Función para actualizar una sección específica del manual
export function updateManualSection(sectionId: string, updates: Partial<ManualSection>) {
  const sectionIndex = MANUAL_SECTIONS.findIndex(section => section.id === sectionId)
  if (sectionIndex !== -1) {
    MANUAL_SECTIONS[sectionIndex] = { ...MANUAL_SECTIONS[sectionIndex], ...updates }
  }
}

// Función para actualizar información del proyecto
export function updateProjectInfo(updates: Partial<ProjectInfo>) {
  Object.assign(PROJECT_INFO, updates)
}

// Función para actualizar el stack tecnológico
export function updateTechStack(updates: TechStackItem[]) {
  TECH_STACK.length = 0
  TECH_STACK.push(...updates)
}

// Función para obtener una sección específica
export function getManualSection(sectionId: string): ManualSection | undefined {
  return MANUAL_SECTIONS.find(section => section.id === sectionId)
}

// Función para obtener todas las secciones
export function getAllManualSections(): ManualSection[] {
  return MANUAL_SECTIONS
} 