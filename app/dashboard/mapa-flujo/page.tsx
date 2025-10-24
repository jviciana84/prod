"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Map, Network, GitBranch, Zap, AlertCircle, Battery, CheckCircle2, Key, AlertTriangle, MessageSquare, Printer, Database, FolderTree, ChevronRight, ChevronDown, BarChart3, FileText, Code2, PanelsTopLeft, Server, Palette, FileCode2, Mail, ScanSearch, X } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ScrollIndicator } from "@/components/ui/scroll-indicator"

// Explicaciones detalladas por página
const pageExplanations: { [key: string]: { steps: string[], validations: string[], technical: string[], diagram?: string } } = {
  "DUC Scraper": {
    steps: [
      "📥 **Scraper Automático:** Se ejecuta automáticamente y descarga CSV del sitio DUC.",
      "🔄 **Carga a duc_scraper:** Los datos crudos se suben a la tabla 'duc_scraper' (fuente de verdad).",
      "⚡ **Trigger sync_duc_to_stock:** Automáticamente sincroniza vehículos a la tabla 'stock' marcándolos como disponibles.",
      "⚡ **Trigger sync_duc_to_nuevas_entradas:** Crea registros en 'nuevas_entradas' para vehículos sin recepción física.",
      "🔋 **Control de Baterías:** Para BEV/PHEV, se crean registros automáticos en 'battery_control' para monitoreo de carga."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de duc_scraper",
      "🔧 **Mutaciones:** Solo el scraper (Python) inserta datos, nunca desde el frontend",
      "📊 **Patrón:** Esta página es solo lectura (READ-ONLY) desde el dashboard",
      "⚡ **Triggers:** Se ejecutan automáticamente en Supabase tras cada INSERT"
    ],
    validations: [
      "❌ NUNCA modificar datos en 'duc_scraper' - es la fuente de verdad inmutable",
      "⚠️ NO eliminar registros del scraper - esto rompe la trazabilidad",
      "✅ Los cambios deben hacerse en 'stock' o 'nuevas_entradas', nunca en duc_scraper",
      "🔍 Revisar logs si el scraper falla - puede afectar toda la cadena de datos"
    ],
    diagram: `
    graph TD
      A[🤖 Scraper DUC Automático] -->|Descarga CSV| B[📊 duc_scraper]
      B -->|Trigger| C[🚗 stock]
      B -->|Trigger| D[📝 nuevas_entradas]
      B -->|BEV/PHEV| E[🔋 battery_control]
      style B fill:#ffcccc
      style C fill:#ccffcc
      style D fill:#ccffcc
      style E fill:#cce5ff
    `
  },
  "Nuevas Entradas": {
    steps: [
      "📝 **Registro Inicial:** Se crea automáticamente desde DUC o manualmente por el usuario.",
      "📸 **Asignación Fotográfica:** El sistema puede asignar automáticamente un fotógrafo.",
      "✅ **Recepción Física:** Cuando el vehículo llega, se marca como 'recibido' (checkbox).",
      "⚡ **Trigger nuevas_entradas_to_stock:** Al marcar como recibido, automáticamente pasa a 'stock' disponible.",
      "📁 **Carga de PDFs:** Se suben certificados (CyP, 360, etc.) que habilitan validaciones posteriores."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de nuevas_entradas",
      "🔧 **Mutaciones:** `/api/nuevas-entradas/crear` para INSERT (creación manual)",
      "📝 **Edición:** `/api/nuevas-entradas/editar` para UPDATE (marcar recibido, PDFs)",
      "📊 **Patrón:** Componente separado `nuevas-entradas-table.tsx` + API Routes"
    ],
    validations: [
      "❌ NO marcar como recibido si el vehículo no ha llegado físicamente",
      "⚠️ NO saltarse la carga de PDFs - son obligatorios para entregas",
      "✅ Verificar que los datos coinciden con la documentación física antes de recibir",
      "🔍 Revisar fotos asignadas - deben completarse antes de vender"
    ],
    diagram: `
    graph TD
      A[📝 Crear Entrada<br/>DUC o Manual] --> B[📋 nuevas_entradas]
      B --> C[📸 Asignar Fotógrafo]
      B --> D[📁 Subir PDFs<br/>CyP, 360]
      B --> E{✅ Recibido?}
      E -->|NO| B
      E -->|SÍ| F[⚡ Trigger]
      F --> G[🚗 stock disponible]
      style B fill:#ccffcc
      style G fill:#ccffcc
      style F fill:#ffffcc
    `
  },
  "Stock (Vehicles)": {
    steps: [
      "🚗 **Tabla Central:** Almacena todos los vehículos disponibles, vendidos y en proceso.",
      "🔄 **Sincronización DUC:** Se actualiza automáticamente desde 'duc_scraper' vía trigger.",
      "📊 **Estados:** disponible → vendido → entregado (según el flujo de venta).",
      "🔗 **Relaciones:** Conecta con 'fotos', 'sales_vehicles', 'entregas', 'llaves', etc.",
      "⚡ **Trigger delete_stock_on_delivery:** Elimina el vehículo de stock al completar entrega."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT con joins a fotos, sales",
      "🔧 **Mutaciones:** `/api/vehicles/editar` para UPDATE (cambios de estado, validación)",
      "🗑️ **Eliminación:** `/api/vehicles/eliminar` para DELETE (solo casos especiales)",
      "📊 **Patrón:** Componente separado `vehicles-table.tsx` + API Routes + Service Role"
    ],
    validations: [
      "❌ NO modificar 'matricula' - es la clave única del sistema",
      "⚠️ NO cambiar estado manualmente sin seguir el flujo completo",
      "✅ Verificar que CyP y 360 estén completos antes de marcar como 'validado'",
      "🔍 Revisar fotos completas antes de vender - evita ventas prematuras"
    ],
    diagram: `
    graph TD
      A[📊 duc_scraper] -->|Trigger| B[🚗 stock disponible]
      B --> C[📸 fotos]
      B --> D{✅ Validado?<br/>CyP + 360}
      D -->|SÍ| E[✅ pedidos_validados]
      E --> F[💰 Venta]
      F --> G[📋 sales_vehicles]
      G --> H[🚚 Entrega]
      H -->|Trigger| I[🗑️ DELETE stock]
      style B fill:#ccffcc
      style E fill:#ccffcc
      style G fill:#cce5ff
      style I fill:#ffcccc
    `
  },
  "Fotos": {
    steps: [
      "📸 **Asignación:** Los vehículos se asignan a fotógrafos (manual o automática).",
      "🖼️ **Carga de Fotos:** El fotógrafo sube las fotos del vehículo.",
      "🎨 **Estados:** sin_fotos → asignado → fotos_completadas → publicado.",
      "⚡ **Trigger sync_body_status_to_paint_status:** Sincroniza estados de carrocería y pintura.",
      "⚡ **Trigger sync_sales_to_fotos_vendido:** Marca fotos como vendidas al completar venta."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de fotos con join a stock",
      "🔧 **Mutaciones:** `/api/photos/asignar` para UPDATE (asignar fotógrafo)",
      "📷 **Subida:** `/api/photos/upload` para INSERT (subir fotos a storage + DB)",
      "📊 **Patrón:** Componente `photos-table.tsx` + API Routes + Supabase Storage"
    ],
    validations: [
      "❌ NO marcar fotos como completas si faltan ángulos obligatorios",
      "⚠️ NO vender sin fotos completas - genera 'ventas prematuras'",
      "✅ Verificar calidad y cantidad de fotos antes de publicar",
      "🔍 Revisar 'ventas-prematuras' para recuperar fotos pendientes"
    ],
    diagram: `
    graph TD
      A[🚗 stock] --> B{📸 Tiene fotos?}
      B -->|NO| C[👤 Asignar Fotógrafo]
      C --> D[📸 fotos asignado]
      D --> E[🖼️ Subir Fotos]
      E --> F[✅ fotos_completadas]
      F --> G{💰 Vendido?}
      G -->|SÍ| H[⚡ Trigger vendido]
      style D fill:#cce5ff
      style F fill:#ccffcc
      style H fill:#ffffcc
    `
  },
  "Ventas": {
    steps: [
      "🛒 **Crear Venta:** Se registra cliente, vehículo, precio y condiciones.",
      "💰 **Financiación:** Se indica si es financiado (opcional).",
      "📋 **Validación:** El sistema verifica que CyP y 360 estén completos.",
      "✅ **Confirmación:** Se confirma la venta y pasa a 'sales_vehicles'.",
      "🚚 **Preparación Entrega:** Se generan documentos y se prepara el proceso de entrega."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de sales_vehicles",
      "🔧 **Mutaciones:** `/api/ventas/crear` para INSERT (nueva venta)",
      "📝 **Edición:** `/api/ventas/editar` para UPDATE (modificar datos, confirmar)",
      "📊 **Patrón:** Formulario + Tabla separada + API Routes con validaciones"
    ],
    validations: [
      "❌ NO vender sin CyP y 360 completos - bloquea la entrega",
      "⚠️ NO vender vehículos sin fotos completas",
      "✅ Verificar que el cliente tiene todos los datos completos",
      "🔍 Confirmar precio y condiciones antes de finalizar venta"
    ],
    diagram: `
    graph TD
      A[✅ pedidos_validados] --> B{📋 Crear Venta}
      B --> C[👤 Datos Cliente]
      B --> D[💰 Precio + Condiciones]
      C --> E{✅ Todo OK?}
      D --> E
      E -->|SÍ| F[💾 sales_vehicles]
      E -->|NO| G[❌ Bloquear venta]
      F --> H[🚚 Preparar Entrega]
      style A fill:#ccffcc
      style F fill:#cce5ff
      style G fill:#ffcccc
      style H fill:#ffffcc
    `
  },
  "Entregas": {
    steps: [
      "📅 **Programar Entrega:** Se asigna fecha y hora para la entrega del vehículo.",
      "📋 **Documentación:** Se verifica que todos los documentos estén completos.",
      "🔑 **Llaves y Docs:** Se confirma disponibilidad de llaves y documentos físicos.",
      "✅ **Entrega Física:** Se marca como entregado al completar la entrega.",
      "⚡ **Trigger delete_stock_on_delivery:** Elimina el vehículo de stock automáticamente."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de entregas",
      "🔧 **Mutaciones:** `/api/entregas/crear` para INSERT (programar entrega)",
      "✅ **Completar:** `/api/entregas/completar` para UPDATE (marcar como entregado)",
      "📊 **Patrón:** Formulario complejo + Validaciones + API Routes + Trigger automático"
    ],
    validations: [
      "❌ NO entregar sin CyP y 360 validados - requisito obligatorio",
      "⚠️ NO entregar sin llaves y documentos físicos disponibles",
      "✅ Verificar que el cliente ha firmado todos los documentos",
      "🔍 Confirmar que el vehículo está en condiciones óptimas antes de entregar"
    ],
    diagram: `
    graph TD
      A[💰 sales_vehicles] --> B{📋 Programar Entrega}
      B --> C{✅ CyP + 360?}
      C -->|NO| D[❌ Bloqueado]
      C -->|SÍ| E{🔑 Llaves/Docs?}
      E -->|NO| D
      E -->|SÍ| F[📅 entregas programada]
      F --> G[✅ Marcar Entregado]
      G --> H[⚡ Trigger DELETE]
      H --> I[🗑️ Eliminar de stock]
      style F fill:#cce5ff
      style D fill:#ffcccc
      style H fill:#ffffcc
      style I fill:#ffcccc
    `
  },
  "Llaves y Documentos": {
    steps: [
      "🔑 **Registro de Llaves:** Se registran las llaves del vehículo al llegar.",
      "📄 **Registro de Documentos:** Se registran permisos de circulación y otros docs.",
      "📍 **Ubicación:** Se indica dónde están almacenadas físicamente.",
      "🔄 **Movimientos:** Se registran entradas/salidas para trazabilidad.",
      "✅ **Disponibilidad:** Se verifica disponibilidad antes de cada entrega."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de vehicle_keys, vehicle_documents",
      "🔧 **Mutaciones:** `/api/llaves/registrar` para INSERT (nueva llave/documento)",
      "📍 **Movimientos:** `/api/llaves/mover` para INSERT en key_movements, document_movements",
      "📊 **Patrón:** Sistema de trazabilidad completo + Historial + API Routes"
    ],
    validations: [
      "❌ NO registrar llaves/docs que no existen físicamente",
      "⚠️ NO entregar sin confirmar ubicación física de llaves y docs",
      "✅ Actualizar ubicación en cada movimiento para evitar pérdidas",
      "🔍 Revisar historial de movimientos si no se encuentran"
    ],
    diagram: `
    graph TD
      A[🚗 Vehículo llega] --> B[🔑 Registrar Llaves]
      A --> C[📄 Registrar Docs]
      B --> D[📍 Ubicación]
      C --> D
      D --> E[📋 vehicle_keys<br/>vehicle_documents]
      E --> F{🔄 Movimiento?}
      F -->|SÍ| G[📝 Registrar en<br/>key_movements<br/>document_movements]
      G --> D
      E --> H{🚚 Entrega?}
      H -->|SÍ| I[✅ Verificar<br/>Disponibilidad]
      I -->|OK| J[📦 Preparar Entrega]
      style E fill:#cce5ff
      style G fill:#ffffcc
      style J fill:#ccffcc
    `
  },
  // FASE 2: FLUJO COMPLETO DE VEHÍCULOS
  "Control de Baterías": {
    steps: [
      "🔋 **Monitoreo BEV/PHEV:** Sistema automático para vehículos eléctricos e híbridos enchufables.",
      "📊 **Estado de Carga:** Registra nivel de batería, fecha de última carga y días sin cargar.",
      "⚠️ **Alertas:** Genera alertas cuando la batería lleva demasiado tiempo sin carga.",
      "🔄 **Actualización:** Los usuarios actualizan manualmente el estado de carga.",
      "📈 **Estadísticas:** Muestra promedios de días en taller y días sin cargar."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de battery_control + join duc_scraper",
      "🔧 **Mutaciones:** `/api/baterias/actualizar` para UPDATE (actualizar estado carga)",
      "📊 **Patrón:** Componente `battery-control-table.tsx` + API Routes",
      "🔄 **Auto-creación:** Se crean registros automáticamente desde DUC para BEV/PHEV"
    ],
    validations: [
      "❌ NO marcar como cargado sin verificar físicamente la carga",
      "⚠️ NO ignorar alertas de batería - puede dañar el vehículo",
      "✅ Cargar al menos cada 15 días para mantener salud de batería",
      "🔍 Revisar configuración de días máximos sin carga"
    ],
    diagram: `
    graph TD
      A[📊 duc_scraper] --> B{🔋 BEV/PHEV?}
      B -->|SÍ| C[🔄 Auto-crear en<br/>battery_control]
      B -->|NO| D[⏭️ Skip]
      C --> E[📊 Monitorear<br/>días sin carga]
      E --> F{⚠️ >15 días?}
      F -->|SÍ| G[🔔 Alerta Usuario]
      F -->|NO| E
      G --> H[⚡ Usuario Carga]
      H --> I[💾 Actualizar<br/>fecha_carga]
      I --> E
      style C fill:#ccffcc
      style G fill:#ffcccc
      style I fill:#cce5ff
    `
  },
  "Asignar Fotógrafo": {
    steps: [
      "📸 **Asignación Manual:** El usuario selecciona vehículo y fotógrafo manualmente.",
      "👤 **Lista Fotógrafos:** Muestra fotógrafos activos disponibles.",
      "📅 **Fecha Asignación:** Registra fecha y hora de asignación.",
      "🔔 **Notificación:** Opcionalmente notifica al fotógrafo asignado.",
      "📊 **Actualización Estado:** Cambia estado del vehículo a 'asignado'."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de fotos, profiles",
      "🔧 **Mutaciones:** `/api/photos/asignar` para UPDATE (asignar fotógrafo)",
      "📊 **Patrón:** Formulario de asignación + Lista de fotógrafos + API Route",
      "🔔 **Notificaciones:** Opcional - envía notificación push/email al fotógrafo"
    ],
    validations: [
      "❌ NO asignar sin verificar disponibilidad del fotógrafo",
      "⚠️ NO asignar múltiples vehículos al mismo fotógrafo simultáneamente",
      "✅ Verificar ubicación del vehículo antes de asignar",
      "🔍 Revisar carga de trabajo del fotógrafo antes de asignar"
    ]
  },
  "Assignment": {
    steps: [
      "🤖 **Asignación Automática:** Sistema inteligente que asigna fotógrafos automáticamente.",
      "📊 **Criterios:** Considera carga de trabajo, ubicación y disponibilidad.",
      "⚡ **Proceso Batch:** Asigna múltiples vehículos de una vez.",
      "📈 **Balanceo:** Distribuye equitativamente entre fotógrafos disponibles.",
      "✅ **Confirmación:** Muestra resultado y permite ajustes manuales."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de fotos + carga de trabajo",
      "🔧 **Mutaciones:** `/api/photos/auto-assign` para UPDATE batch (asignación múltiple)",
      "📊 **Patrón:** Algoritmo de asignación + Vista de resultado + API Route",
      "🤖 **Lógica:** Balancea por número de vehículos asignados actualmente"
    ],
    validations: [
      "❌ NO ejecutar sin revisar carga actual de fotógrafos",
      "⚠️ NO asignar vehículos que ya tienen fotógrafo",
      "✅ Verificar resultado antes de confirmar asignaciones",
      "🔍 Permitir ajustes manuales después de asignación automática"
    ]
  },
  "Estadísticas Fotos": {
    steps: [
      "📊 **Métricas Globales:** Muestra totales de fotos completadas, pendientes, en proceso.",
      "👤 **Por Fotógrafo:** Desglose de performance individual.",
      "📈 **Tendencias:** Gráficos de evolución temporal.",
      "⏱️ **Tiempos:** Promedio de tiempo entre asignación y completado.",
      "🎯 **Objetivos:** Compara contra metas establecidas."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT con agregaciones",
      "📊 **Patrón:** Solo lectura - Componente de estadísticas + Gráficos (Recharts)",
      "📈 **Agregaciones:** COUNT, AVG, SUM directamente en queries Supabase",
      "🎨 **Visualización:** Cards + Charts para diferentes métricas"
    ],
    validations: [
      "✅ Actualizar datos en tiempo real para ver cambios",
      "🔍 Filtrar por rango de fechas para análisis específicos",
      "📊 Exportar datos para reportes externos si es necesario",
      "⏱️ Los tiempos se calculan automáticamente, no editar manualmente"
    ]
  },
  "Resumen Fotógrafos": {
    steps: [
      "👥 **Lista de Fotógrafos:** Muestra todos los fotógrafos activos.",
      "📊 **Performance Individual:** Vehículos asignados, completados, pendientes.",
      "⏱️ **Tiempo Promedio:** Tiempo medio que tarda cada fotógrafo.",
      "📈 **Ranking:** Ordena por productividad y calidad.",
      "🎯 **Alertas:** Marca fotógrafos con retrasos o problemas."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de profiles + fotos agregadas",
      "📊 **Patrón:** Solo lectura - Tabla resumen + Métricas por fotógrafo",
      "📈 **Join:** Combina datos de profiles con estadísticas de fotos",
      "🎨 **Indicadores:** Badges de colores para diferentes estados de performance"
    ],
    validations: [
      "✅ Revisar regularmente para detectar cuellos de botella",
      "🔍 Identificar fotógrafos que necesitan más asignaciones",
      "📊 Usar para tomar decisiones de asignación manual",
      "⏱️ Considerar variaciones estacionales en la carga de trabajo"
    ]
  },
  "Ventas Prematuras (Photos)": {
    steps: [
      "⚠️ **Detección:** Identifica vehículos vendidos sin fotos completas.",
      "📸 **Estado Fotos:** Muestra qué fotos faltan por completar.",
      "🚗 **Datos Vehículo:** Información del vehículo y venta.",
      "🔔 **Alertas:** Notifica a fotógrafos para completar fotos urgentes.",
      "✅ **Resolución:** Marca como resuelto cuando se completan las fotos."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT con join sales + fotos incompletas",
      "🔧 **Mutaciones:** `/api/photos/resolver-prematura` para UPDATE (marcar como resuelto)",
      "📊 **Patrón:** Tabla de alertas + Acción rápida + API Route",
      "⚠️ **Filtro:** WHERE vendido = true AND fotos_completas = false"
    ],
    validations: [
      "❌ NO ignorar ventas prematuras - afecta la calidad del inventario online",
      "⚠️ PRIORIZAR estas fotos sobre nuevas asignaciones",
      "✅ Notificar a fotógrafos inmediatamente cuando aparece una venta prematura",
      "🔍 Analizar causas para prevenir futuras ventas sin fotos completas"
    ]
  },
  "Gestión de Ventas": {
    steps: [
      "🛒 **Tabla de Ventas:** Lista todas las ventas registradas en el sistema.",
      "📊 **Estados:** Pendiente, confirmada, entregada, cancelada.",
      "🔍 **Filtros:** Por fecha, cliente, vehículo, vendedor, estado.",
      "✏️ **Edición:** Permite modificar datos de ventas existentes.",
      "📄 **Documentos:** Acceso a contratos, facturas y documentación."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de sales_vehicles + joins",
      "🔧 **Mutaciones:** `/api/ventas/editar` para UPDATE (modificar venta)",
      "🗑️ **Cancelar:** `/api/ventas/cancelar` para UPDATE (cancelar venta)",
      "📊 **Patrón:** Tabla compleja + Modal de edición + API Routes"
    ],
    validations: [
      "❌ NO cancelar ventas sin motivo válido - afecta métricas",
      "⚠️ NO modificar precios después de confirmar sin autorización",
      "✅ Verificar datos del cliente antes de confirmar venta",
      "🔍 Mantener documentación completa para auditorías"
    ],
    diagram: `
    graph TD
      A[📊 sales_vehicles<br/>pendiente] --> B{✏️ Acción?}
      B -->|Confirmar| C[✅ estado:<br/>confirmada]
      B -->|Editar| D[📝 Modificar<br/>datos]
      B -->|Cancelar| E[❌ estado:<br/>cancelada]
      C --> F[📄 Generar<br/>Documentos]
      F --> G[🚚 Programar<br/>Entrega]
      D --> A
      E --> H[📊 Actualizar<br/>métricas]
      G --> I[📋 entregas]
      I --> J[✅ Entrega<br/>completada]
      J --> K[💰 Calcular<br/>Incentivos]
      style C fill:#ccffcc
      style E fill:#ffcccc
      style J fill:#ccffcc
    `
  },
  "Nueva Venta": {
    steps: [
      "🛒 **Selección Vehículo:** Buscar y seleccionar vehículo disponible.",
      "👤 **Datos Cliente:** Ingresar información completa del cliente.",
      "💰 **Precio y Condiciones:** Precio final, forma de pago, financiación.",
      "📋 **Validaciones:** Sistema verifica CyP, 360, fotos completas.",
      "✅ **Confirmación:** Se crea la venta y se actualiza estado del vehículo."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de stock disponible",
      "🔧 **Mutaciones:** `/api/ventas/crear` para INSERT (nueva venta)",
      "📊 **Patrón:** Formulario multi-paso + Validaciones en tiempo real + API Route",
      "✅ **Validaciones:** Verifica requisitos antes de permitir venta"
    ],
    validations: [
      "❌ NO vender sin verificar CyP y 360 completos",
      "⚠️ NO permitir venta de vehículos sin fotos",
      "✅ Confirmar datos del cliente - DNI, contacto, dirección",
      "🔍 Verificar disponibilidad real del vehículo antes de vender"
    ]
  },
  "Detalle Venta [id]": {
    steps: [
      "📄 **Información Completa:** Muestra todos los datos de la venta.",
      "🚗 **Datos Vehículo:** Matrícula, modelo, precio, estado.",
      "👤 **Datos Cliente:** Información de contacto y documentación.",
      "📊 **Timeline:** Historial de cambios y eventos de la venta.",
      "📄 **Documentos:** Descarga de contratos, facturas, etc."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de sales_vehicles por ID",
      "📊 **Patrón:** Vista detalle de solo lectura + Acciones específicas",
      "🔧 **Join:** Combina datos de sales, stock, cliente en una vista",
      "📄 **Archivos:** Acceso a documentos desde Supabase Storage"
    ],
    validations: [
      "✅ Revisar timeline para entender el proceso de venta",
      "🔍 Verificar que todos los documentos estén disponibles",
      "📊 Usar esta vista para auditorías y seguimiento",
      "📄 Descargar documentos solo cuando sea necesario"
    ]
  },
  "Estadísticas Ventas": {
    steps: [
      "📊 **Métricas Globales:** Total ventas, ingresos, promedio por venta.",
      "📈 **Tendencias:** Evolución de ventas en el tiempo.",
      "👤 **Por Vendedor:** Performance individual de cada vendedor.",
      "🚗 **Por Tipo:** Desglose por marca, modelo, tipo de combustible.",
      "💰 **Financiación:** Porcentaje de ventas financiadas vs. contado."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT con agregaciones complejas",
      "📊 **Patrón:** Solo lectura - Dashboard de estadísticas + Gráficos (Recharts)",
      "📈 **Agregaciones:** SUM, AVG, COUNT, GROUP BY en queries",
      "🎨 **Visualización:** Cards + Line Charts + Bar Charts + Pie Charts"
    ],
    validations: [
      "✅ Actualizar periódicamente para ver tendencias",
      "🔍 Filtrar por períodos para análisis comparativos",
      "📊 Usar para establecer objetivos y metas de ventas",
      "💰 Analizar patrones de financiación para estrategias comerciales"
    ]
  },
  "Gestión Entregas": {
    steps: [
      "🚚 **Tabla de Entregas:** Lista todas las entregas programadas y completadas.",
      "📅 **Calendario:** Vista de entregas por fecha.",
      "📍 **Estado:** Programada, en preparación, completada, cancelada.",
      "🔍 **Filtros:** Por fecha, cliente, vehículo, centro de entrega.",
      "✏️ **Edición:** Reprogramar o modificar datos de entrega."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de entregas + joins",
      "🔧 **Mutaciones:** `/api/entregas/editar` para UPDATE (modificar entrega)",
      "📅 **Reprogramar:** `/api/entregas/reprogramar` para UPDATE (cambiar fecha)",
      "📊 **Patrón:** Tabla + Calendario + Modal de edición + API Routes"
    ],
    validations: [
      "❌ NO entregar sin verificar documentación completa",
      "⚠️ NO reprogramar sin notificar al cliente",
      "✅ Confirmar disponibilidad de llaves y documentos antes de fecha",
      "🔍 Verificar que el vehículo está preparado antes de entrega"
    ]
  },
  "Nueva Entrega": {
    steps: [
      "📅 **Seleccionar Venta:** Elegir venta confirmada sin entrega.",
      "🗓️ **Fecha y Hora:** Programar fecha y hora de entrega.",
      "📍 **Centro Entrega:** Seleccionar ubicación de entrega.",
      "📋 **Checklist:** Verificar requisitos: CyP, 360, llaves, docs.",
      "✅ **Confirmación:** Se crea la entrega y se notifica al cliente."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de ventas sin entrega",
      "🔧 **Mutaciones:** `/api/entregas/crear` para INSERT (nueva entrega)",
      "📊 **Patrón:** Formulario con validaciones + Checklist + API Route",
      "✅ **Validaciones:** Verifica todos los requisitos antes de permitir programar"
    ],
    validations: [
      "❌ NO programar sin CyP y 360 validados",
      "⚠️ NO programar sin confirmar disponibilidad de llaves/docs",
      "✅ Verificar que el cliente puede asistir en fecha/hora seleccionada",
      "🔍 Confirmar que el vehículo está en condiciones óptimas"
    ]
  },
  "Detalle Entrega [id]": {
    steps: [
      "📄 **Información Completa:** Todos los datos de la entrega programada.",
      "🚗 **Vehículo:** Datos completos del vehículo a entregar.",
      "👤 **Cliente:** Información de contacto y documentación.",
      "📋 **Checklist:** Estado de cada requisito (CyP, 360, llaves, docs).",
      "📊 **Timeline:** Historial de eventos y cambios de la entrega."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de entregas por ID + joins",
      "📊 **Patrón:** Vista detalle + Checklist visual + Timeline",
      "✅ **Completar:** `/api/entregas/completar` para UPDATE (marcar como entregado)",
      "🔧 **Join:** Combina datos de entregas, ventas, stock, cliente"
    ],
    validations: [
      "✅ Verificar checklist completo antes de entregar",
      "🔍 Revisar timeline para entender el proceso",
      "📄 Confirmar que cliente ha firmado todos los documentos",
      "🚗 Inspección final del vehículo antes de entrega"
    ]
  },
  // FASE 3: OPERACIONES Y CONTROL
  "Vehicle Keys": {
    steps: [
      "🔑 **Registro:** Se registra cada llave con su tipo (original, copia, mando).",
      "📍 **Ubicación:** Se indica ubicación física específica.",
      "✅ **Estado:** Disponible, en uso, extraviada, entregada.",
      "🔄 **Movimientos:** Cada cambio de ubicación se registra automáticamente.",
      "📊 **Trazabilidad:** Historial completo de todos los movimientos."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de vehicle_keys",
      "🔧 **Mutaciones:** `/api/llaves/crear` para INSERT (nueva llave)",
      "📊 **Patrón:** Tabla + Formulario + Sistema de ubicaciones + API Routes",
      "🔄 **Trigger:** Movimientos se registran automáticamente en key_movements"
    ],
    validations: [
      "❌ NO registrar llaves sin verificar existencia física",
      "⚠️ NO cambiar ubicación sin registro de movimiento",
      "✅ Actualizar estado inmediatamente al detectar pérdida",
      "🔍 Revisar historial antes de marcar como extraviada"
    ]
  },
  "Key Movements": {
    steps: [
      "📋 **Registro Automático:** Cada movimiento se registra con fecha, hora, usuario.",
      "📍 **Ubicaciones:** Desde → Hasta con razón del movimiento.",
      "👤 **Responsable:** Quién autoriza y ejecuta el movimiento.",
      "📊 **Historial:** Lista completa de todos los movimientos.",
      "🔍 **Auditoría:** Sistema inmutable para trazabilidad completa."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de key_movements",
      "📊 **Patrón:** Solo lectura - Tabla de historial inmutable",
      "🔧 **Creación:** Se crean automáticamente desde UPDATE de vehicle_keys",
      "🔒 **Inmutable:** No se puede editar ni eliminar movimientos"
    ],
    validations: [
      "✅ Revisar historial para encontrar llaves perdidas",
      "🔍 Usar para auditorías y control de responsabilidades",
      "📊 Analizar patrones para mejorar sistema de almacenamiento",
      "🔒 Los movimientos son inmutables - no intentar modificar"
    ]
  },
  "Vehicle Documents": {
    steps: [
      "📄 **Registro:** Permiso circulación, ITV, seguro, documentación legal.",
      "📍 **Ubicación:** Dónde se almacena físicamente cada documento.",
      "✅ **Estado:** Original, copia, pendiente, entregado.",
      "📅 **Vigencia:** Fechas de expedición y vencimiento.",
      "🔄 **Movimientos:** Trazabilidad de ubicación de cada documento."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de vehicle_documents",
      "🔧 **Mutaciones:** `/api/documentos/crear` para INSERT (nuevo documento)",
      "📊 **Patrón:** Tabla + Formulario + Control de vigencia + API Routes",
      "🔄 **Trigger:** Movimientos se registran automáticamente en document_movements"
    ],
    validations: [
      "❌ NO registrar documentos que no existen físicamente",
      "⚠️ NO entregar sin verificar vigencia de todos los documentos",
      "✅ Actualizar estado inmediatamente al vencimiento",
      "🔍 Alertas automáticas para documentos próximos a vencer"
    ]
  },
  "Document Movements": {
    steps: [
      "📋 **Registro Automático:** Cada movimiento de documento con metadata completa.",
      "📍 **Ubicaciones:** Seguimiento completo de dónde está cada documento.",
      "👤 **Responsable:** Quién maneja y autoriza cada movimiento.",
      "📊 **Historial:** Lista inmutable de todos los movimientos.",
      "🔍 **Auditoría:** Sistema de control total para documentación legal."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de document_movements",
      "📊 **Patrón:** Solo lectura - Historial inmutable de movimientos",
      "🔧 **Creación:** Automática desde UPDATE de vehicle_documents",
      "🔒 **Inmutable:** Registro permanente no modificable"
    ],
    validations: [
      "✅ Revisar historial para localizar documentos",
      "🔍 Usar para auditorías legales y seguros",
      "📊 Analizar para mejorar procesos de gestión documental",
      "🔒 Sistema inmutable - no modificar registros históricos"
    ]
  },
  "Key Document Requests": {
    steps: [
      "📝 **Solicitud:** Usuario solicita llaves/documentos para entrega o gestión.",
      "📋 **Aprobación:** Sistema verifica disponibilidad y autoriza.",
      "📍 **Preparación:** Se localizan y preparan llaves y documentos.",
      "✅ **Entrega:** Se marca como entregado con responsable.",
      "📊 **Seguimiento:** Estado de cada solicitud hasta completar."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de key_document_requests",
      "🔧 **Mutaciones:** `/api/solicitudes/crear` para INSERT (nueva solicitud)",
      "✅ **Aprobar:** `/api/solicitudes/aprobar` para UPDATE (aprobar/rechazar)",
      "📊 **Patrón:** Workflow de aprobación + Estados + API Routes"
    ],
    validations: [
      "❌ NO aprobar sin verificar disponibilidad física",
      "⚠️ NO entregar sin registro completo del responsable",
      "✅ Verificar que los materiales están preparados antes de marcar",
      "🔍 Seguimiento completo hasta devolución o entrega final"
    ]
  },
  "External Material Vehicles": {
    steps: [
      "📦 **Registro:** Materiales externos asociados al vehículo (rueda repuesto, etc).",
      "📍 **Ubicación:** Dónde se almacena cada material.",
      "✅ **Estado:** Disponible, en uso, entregado, faltante.",
      "🔄 **Movimientos:** Trazabilidad de cada material externo.",
      "📋 **Inventario:** Control de materiales antes de cada entrega."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de external_material_vehicles",
      "🔧 **Mutaciones:** `/api/materiales/registrar` para INSERT (nuevo material)",
      "📊 **Patrón:** Sistema de inventario + Ubicaciones + API Routes",
      "🔄 **Control:** Verifica materiales completos antes de entregar"
    ],
    validations: [
      "❌ NO entregar vehículo sin verificar materiales completos",
      "⚠️ NO registrar materiales que no existen físicamente",
      "✅ Actualizar ubicación en cada movimiento",
      "🔍 Revisar inventario completo antes de cada entrega"
    ]
  },
  "Circulation Permit Requests": {
    steps: [
      "📝 **Solicitud:** Se solicita permiso de circulación para gestiones.",
      "📋 **Aprobación:** Sistema verifica disponibilidad del documento.",
      "📍 **Entrega:** Se entrega el permiso al responsable.",
      "⏱️ **Tiempo:** Control de tiempo de uso del documento.",
      "✅ **Devolución:** Registro de devolución del documento."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de circulation_permit_requests",
      "🔧 **Mutaciones:** `/api/permisos/solicitar` para INSERT (nueva solicitud)",
      "✅ **Devolver:** `/api/permisos/devolver` para UPDATE (marcar devuelto)",
      "📊 **Patrón:** Workflow de préstamo + Control temporal + API Routes"
    ],
    validations: [
      "❌ NO prestar sin registro del responsable",
      "⚠️ NO permitir múltiples préstamos del mismo documento",
      "✅ Controlar tiempo de préstamo - alertas si excede plazo",
      "🔍 Verificar devolución física antes de marcar como devuelto"
    ]
  },
  "Historial Recogidas": {
    steps: [
      "🚗 **Registro Recogida:** Vehículo a recoger del cliente o proveedor.",
      "📅 **Programación:** Fecha, hora y ubicación de recogida.",
      "👤 **Responsable:** Quién realiza la recogida.",
      "✅ **Completado:** Confirma recogida exitosa con detalles.",
      "📊 **Estado:** Programada, en curso, completada, cancelada."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de recogidas_historial",
      "🔧 **Mutaciones:** `/api/recogidas/crear` para INSERT (nueva recogida)",
      "✅ **Completar:** `/api/recogidas/completar` para UPDATE (marcar completada)",
      "📊 **Patrón:** Tabla + Formulario + Estados + API Routes"
    ],
    validations: [
      "❌ NO marcar como completada sin verificar recogida física",
      "⚠️ NO cancelar sin notificar al cliente",
      "✅ Registrar detalles del vehículo al momento de recogida",
      "🔍 Verificar documentación al recoger el vehículo"
    ]
  },
  "Nueva Recogida": {
    steps: [
      "📝 **Datos Vehículo:** Matrícula, marca, modelo del vehículo a recoger.",
      "👤 **Datos Cliente:** Información de contacto del propietario.",
      "📍 **Ubicación:** Dirección donde se recogerá el vehículo.",
      "📅 **Programación:** Fecha y hora de recogida.",
      "✅ **Confirmación:** Se crea la recogida y notifica al responsable."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para validaciones",
      "🔧 **Mutaciones:** `/api/recogidas/crear` para INSERT (nueva recogida)",
      "📊 **Patrón:** Formulario multi-paso + Validaciones + API Route",
      "🔔 **Notificación:** Envía notificación al responsable asignado"
    ],
    validations: [
      "❌ NO programar sin confirmar disponibilidad del responsable",
      "⚠️ NO crear sin verificar datos del cliente",
      "✅ Confirmar ubicación y datos de contacto",
      "🔍 Verificar que no existe recogida duplicada"
    ],
    diagram: `
    graph TD
      A[📝 Formulario<br/>Recogida] --> B[🚗 Datos Vehículo]
      A --> C[👤 Datos Cliente]
      A --> D[📍 Ubicación]
      B --> E{✅ Validar}
      C --> E
      D --> E
      E -->|OK| F[📅 Programar<br/>Fecha/Hora]
      E -->|Error| G[❌ Corregir datos]
      F --> H[💾 INSERT<br/>recogidas_historial]
      H --> I[🔔 Notificar<br/>Responsable]
      I --> J[📊 Estado:<br/>programada]
      J --> K[🚗 Realizar<br/>Recogida]
      K --> L[✅ Marcar<br/>completada]
      style H fill:#ccffcc
      style G fill:#ffcccc
      style L fill:#ccffcc
    `
  },
  "Detalle Recogida [id]": {
    steps: [
      "📄 **Información Completa:** Todos los datos de la recogida.",
      "🚗 **Vehículo:** Detalles del vehículo a recoger.",
      "👤 **Cliente:** Información de contacto completa.",
      "📊 **Timeline:** Historial de eventos de la recogida.",
      "📸 **Fotos:** Registro fotográfico al momento de recogida."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT por ID",
      "📊 **Patrón:** Vista detalle + Timeline + Galería de fotos",
      "✅ **Completar:** Acción para marcar como completada",
      "🔧 **Join:** Combina datos de recogida + cliente + fotos"
    ],
    validations: [
      "✅ Revisar timeline completo antes de cualquier acción",
      "🔍 Verificar fotos al momento de recogida",
      "📄 Confirmar documentación entregada por el cliente",
      "🚗 Registrar estado físico del vehículo al recoger"
    ]
  },
  "Gestión Incentivos": {
    steps: [
      "💰 **Tabla de Incentivos:** Lista todos los incentivos del sistema.",
      "📊 **Tipos:** Por venta, por target, bonos especiales.",
      "👤 **Asignados:** A qué vendedores o equipos están asignados.",
      "📅 **Vigencia:** Período de validez del incentivo.",
      "✏️ **Edición:** Modificar condiciones o montos."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de incentivos",
      "🔧 **Mutaciones:** `/api/incentivos/editar` para UPDATE",
      "🗑️ **Eliminar:** `/api/incentivos/eliminar` para DELETE",
      "📊 **Patrón:** Tabla + Modal edición + Cálculos + API Routes"
    ],
    validations: [
      "❌ NO modificar incentivos activos sin autorización",
      "⚠️ NO eliminar incentivos con ventas asociadas",
      "✅ Verificar cálculos antes de confirmar incentivos",
      "🔍 Revisar impacto en ventas existentes antes de cambios"
    ],
    diagram: `
    graph TD
      A[📋 Crear Incentivo] --> B[💰 Definir Tipo<br/>y Monto]
      B --> C[👥 Asignar<br/>Vendedores]
      C --> D[📅 Establecer<br/>Vigencia]
      D --> E[💾 incentivos<br/>activo]
      E --> F[💰 Venta realizada]
      F --> G{✅ Cumple<br/>condiciones?}
      G -->|SÍ| H[💵 Calcular<br/>incentivo]
      G -->|NO| I[⏭️ Skip]
      H --> J[📊 Registrar<br/>en historial]
      J --> K[🔔 Notificar<br/>Vendedor]
      style E fill:#ccffcc
      style H fill:#cce5ff
      style K fill:#ffffcc
    `
  },
  "Nuevo Incentivo": {
    steps: [
      "📝 **Tipo:** Seleccionar tipo de incentivo (por venta, por objetivo, etc).",
      "💰 **Monto:** Definir cantidad o porcentaje del incentivo.",
      "👤 **Destinatarios:** Asignar a vendedores o equipos.",
      "📅 **Vigencia:** Establecer fechas de inicio y fin.",
      "✅ **Confirmación:** Se crea el incentivo y se activa."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para validaciones",
      "🔧 **Mutaciones:** `/api/incentivos/crear` para INSERT",
      "📊 **Patrón:** Formulario + Calculadora + Validaciones + API Route",
      "💰 **Cálculo:** Sistema calcula automáticamente valores proyectados"
    ],
    validations: [
      "❌ NO crear sin definir claramente las condiciones",
      "⚠️ NO activar sin verificar presupuesto disponible",
      "✅ Confirmar que las condiciones son alcanzables",
      "🔍 Verificar que no se solapa con otros incentivos"
    ]
  },
  "Detalle Incentivo [id]": {
    steps: [
      "📄 **Información Completa:** Todos los datos del incentivo.",
      "👥 **Participantes:** Lista de vendedores incluidos.",
      "📊 **Performance:** Progreso hacia objetivos del incentivo.",
      "💰 **Pagos:** Historial de pagos realizados.",
      "📈 **Estadísticas:** Impacto en ventas y resultados."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT por ID + cálculos",
      "📊 **Patrón:** Vista detalle + Dashboard de progreso",
      "📈 **Agregaciones:** Cálculos en tiempo real de performance",
      "💰 **Join:** Combina incentivo + ventas + pagos"
    ],
    validations: [
      "✅ Revisar progreso regularmente para motivación",
      "🔍 Verificar cálculos antes de aprobar pagos",
      "📊 Analizar impacto en ventas para futuros incentivos",
      "💰 Confirmar todos los pagos estén documentados"
    ]
  },
  "Soporte Tickets": {
    steps: [
      "🎫 **Lista de Tickets:** Todos los tickets de soporte del sistema.",
      "📊 **Estados:** Abierto, en progreso, resuelto, cerrado.",
      "🔍 **Filtros:** Por prioridad, categoría, asignado, fecha.",
      "✏️ **Gestión:** Asignar, comentar, cambiar estado.",
      "📈 **Métricas:** Tiempo de resolución, satisfacción."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de soporte_tickets",
      "🔧 **Mutaciones:** `/api/soporte/actualizar` para UPDATE",
      "✅ **Cerrar:** `/api/soporte/cerrar` para UPDATE (marcar resuelto)",
      "📊 **Patrón:** Sistema de ticketing + Asignación + API Routes"
    ],
    validations: [
      "❌ NO cerrar tickets sin confirmar resolución con usuario",
      "⚠️ NO ignorar tickets de alta prioridad",
      "✅ Asignar responsable inmediatamente a tickets nuevos",
      "🔍 Documentar solución para futura referencia"
    ]
  },
  "Nuevo Ticket": {
    steps: [
      "📝 **Descripción:** Detalle completo del problema o solicitud.",
      "📊 **Categoría:** Tipo de soporte (técnico, funcional, etc).",
      "⚠️ **Prioridad:** Baja, media, alta, crítica.",
      "👤 **Asignación:** Responsable del ticket (automático o manual).",
      "✅ **Creación:** Se crea el ticket y notifica al responsable."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para validaciones",
      "🔧 **Mutaciones:** `/api/soporte/crear` para INSERT",
      "📊 **Patrón:** Formulario + Auto-asignación + Notificaciones + API Route",
      "🔔 **Notificación:** Email/Push al responsable asignado"
    ],
    validations: [
      "❌ NO crear tickets duplicados - buscar primero",
      "⚠️ NO asignar sin verificar disponibilidad del responsable",
      "✅ Incluir toda la información necesaria para resolución",
      "🔍 Adjuntar capturas o archivos relevantes"
    ]
  },
  "Incidencias Historial": {
    steps: [
      "📋 **Registro:** Todas las incidencias del sistema histórico.",
      "🚗 **Por Vehículo:** Incidencias asociadas a cada vehículo.",
      "📊 **Tipos:** Mecánicas, estéticas, documentales.",
      "✅ **Resolución:** Estado y solución aplicada.",
      "📈 **Análisis:** Patrones y frecuencia de incidencias."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de incidencias_historial",
      "📊 **Patrón:** Solo lectura - Historial inmutable",
      "🔧 **Join:** Combina con stock para contexto completo",
      "📈 **Análisis:** Agregaciones para identificar patrones"
    ],
    validations: [
      "✅ Revisar historial antes de vender/entregar vehículo",
      "🔍 Analizar incidencias recurrentes para prevención",
      "📊 Usar para mejorar procesos de inspección",
      "🚗 Documentar bien cada incidencia para trazabilidad"
    ]
  },
  // FASE 4: GARANTÍAS Y TASACIONES
  "Garantías Brutas MM": {
    steps: [
      "📊 **Datos BMW/MINI:** Información de garantías para vehículos BMW y MINI.",
      "💰 **Costes:** Registro de costes de garantía por vehículo.",
      "📅 **Período:** Fechas de cobertura de garantía.",
      "🔍 **Análisis:** Estadísticas de costes por modelo y período.",
      "📈 **Tendencias:** Evolución de costes de garantía en el tiempo."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de garantias_brutas_mm",
      "📊 **Patrón:** Solo lectura - Datos importados desde fuentes externas",
      "📈 **Análisis:** Agregaciones para estadísticas de costes",
      "🔧 **Join:** Combina con stock para análisis completo"
    ],
    validations: [
      "✅ Datos de solo lectura - no modificar directamente",
      "🔍 Usar para análisis de costes operativos",
      "📊 Revisar regularmente para detectar patrones",
      "💰 Considerar en pricing de vehículos con garantía"
    ]
  },
  "Garantías Brutas MMC": {
    steps: [
      "📊 **Datos BMW Motorrad:** Información de garantías para motos BMW.",
      "💰 **Costes:** Registro de costes de garantía por modelo.",
      "📅 **Período:** Cobertura y vigencia de garantías.",
      "🔍 **Comparativa:** Diferencias con vehículos BMW/MINI.",
      "📈 **Tendencias:** Análisis de evolución de costes."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de garantias_brutas_mmc",
      "📊 **Patrón:** Solo lectura - Datos importados de sistemas BMW",
      "📈 **Análisis:** Estadísticas específicas para motos",
      "🔧 **Join:** Relación con stock de motos"
    ],
    validations: [
      "✅ Información de solo lectura - no editar",
      "🔍 Análisis de costes para motos específicamente",
      "📊 Comparar con garantías de coches para análisis completo",
      "💰 Factor importante en pricing de motos"
    ]
  },
  "Gestión Tasaciones": {
    steps: [
      "💰 **Tabla de Tasaciones:** Lista todas las tasaciones realizadas.",
      "🚗 **Vehículo Tasado:** Datos del vehículo del cliente.",
      "📊 **Valor:** Precio tasado y condiciones de compra.",
      "👤 **Cliente:** Información de contacto del propietario.",
      "✅ **Estado:** Pendiente, aceptada, rechazada, en negociación."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de tasaciones",
      "🔧 **Mutaciones:** `/api/tasaciones/editar` para UPDATE",
      "✅ **Aceptar:** `/api/tasaciones/aceptar` para UPDATE (confirmar compra)",
      "📊 **Patrón:** Tabla + Modal edición + Workflow de aprobación + API Routes"
    ],
    validations: [
      "❌ NO aceptar sin verificar fondos disponibles",
      "⚠️ NO tasar sin inspección física del vehículo",
      "✅ Verificar documentación completa del vehículo",
      "🔍 Comparar con valores de mercado actuales"
    ],
    diagram: `
    graph TD
      A[👤 Cliente solicita<br/>tasación] --> B[📝 Crear Tasación]
      B --> C[🚗 Datos Vehículo<br/>+ Fotos]
      C --> D[💰 Sistema calcula<br/>valor mercado]
      D --> E[📋 tasaciones<br/>pendiente]
      E --> F{✅ Decisión?}
      F -->|Aceptar| G[💾 Actualizar<br/>estado: aceptada]
      F -->|Rechazar| H[❌ estado: rechazada]
      F -->|Negociar| I[💬 Modificar precio]
      G --> J[🚗 Pasar a Stock]
      I --> E
      style E fill:#cce5ff
      style G fill:#ccffcc
      style H fill:#ffcccc
      style J fill:#ccffcc
    `
  },
  "Nueva Tasación": {
    steps: [
      "🚗 **Datos Vehículo:** Matrícula, marca, modelo, año, kilometraje.",
      "👤 **Datos Cliente:** Información de contacto del propietario.",
      "📸 **Fotos:** Registro fotográfico del estado del vehículo.",
      "💰 **Valoración:** Sistema sugiere precio basado en mercado.",
      "✅ **Confirmación:** Se crea la tasación y notifica al cliente."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para validaciones y referencias",
      "🔧 **Mutaciones:** `/api/tasaciones/crear` para INSERT",
      "📊 **Patrón:** Formulario multi-paso + Calculadora + Fotos + API Route",
      "💰 **Cálculo:** Algoritmo de valoración basado en datos de mercado"
    ],
    validations: [
      "❌ NO crear sin inspección visual mínima",
      "⚠️ NO omitir fotos - son fundamentales para tasación",
      "✅ Verificar datos del vehículo con DGT si es posible",
      "🔍 Considerar estado real vs. kilometraje declarado"
    ]
  },
  "Detalle Tasación [id]": {
    steps: [
      "📄 **Información Completa:** Todos los datos de la tasación.",
      "🚗 **Vehículo:** Detalles completos del vehículo tasado.",
      "👤 **Cliente:** Información de contacto y documentación.",
      "📸 **Galería:** Fotos del vehículo en el momento de tasación.",
      "💰 **Historial:** Cambios de precio y negociación."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT por ID",
      "📊 **Patrón:** Vista detalle + Galería de fotos + Timeline",
      "✅ **Acciones:** Aprobar, rechazar, renegociar precio",
      "🔧 **Join:** Combina datos de tasación + cliente + fotos"
    ],
    validations: [
      "✅ Revisar todas las fotos antes de aprobar precio",
      "🔍 Verificar timeline de negociación",
      "📊 Comparar con tasaciones similares recientes",
      "💰 Confirmar margen de beneficio antes de aceptar"
    ]
  },
  "Advisor Links": {
    steps: [
      "🔗 **Enlaces Comerciales:** Links personalizados para asesores comerciales.",
      "📊 **Tracking:** Seguimiento de visitas y conversiones por link.",
      "👤 **Asignación:** Cada asesor tiene su link único.",
      "📈 **Performance:** Estadísticas de efectividad por asesor.",
      "💰 **Comisiones:** Cálculo automático basado en ventas por link."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de advisor_links",
      "🔧 **Mutaciones:** `/api/advisor-links/crear` para INSERT",
      "📊 **Patrón:** Sistema de tracking + Analytics + Generación de links",
      "🔗 **Generación:** Links únicos con códigos de seguimiento"
    ],
    validations: [
      "❌ NO crear múltiples links para el mismo asesor sin razón",
      "⚠️ NO modificar links activos - rompe el tracking",
      "✅ Verificar que los links redirigen correctamente",
      "🔍 Monitorear regularmente para detectar links rotos"
    ]
  },
  "Estadísticas Garantías": {
    steps: [
      "📊 **Costes Totales:** Suma de todos los costes de garantía.",
      "🚗 **Por Marca:** Desglose BMW, MINI, BMW Motorrad.",
      "📅 **Evolución:** Tendencia de costes en el tiempo.",
      "🔍 **Por Modelo:** Qué modelos tienen más costes de garantía.",
      "💰 **Impacto:** Efecto en el margen de beneficio."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT con agregaciones",
      "📊 **Patrón:** Solo lectura - Dashboard de estadísticas",
      "📈 **Agregaciones:** SUM, AVG, COUNT, GROUP BY",
      "🎨 **Visualización:** Cards + Charts (Recharts) para métricas"
    ],
    validations: [
      "✅ Actualizar regularmente para decisiones informadas",
      "🔍 Analizar modelos con costes altos de garantía",
      "📊 Usar para ajustar pricing y política de compra",
      "💰 Considerar en negociaciones con proveedores"
    ]
  },
  "Configuración Garantías": {
    steps: [
      "⚙️ **Parámetros:** Configuración de umbrales y alertas de garantía.",
      "📊 **Categorías:** Tipos de costes de garantía a trackear.",
      "💰 **Límites:** Establecer límites de coste por categoría.",
      "🔔 **Alertas:** Configurar notificaciones para costes altos.",
      "✅ **Guardado:** Se aplican cambios a todo el sistema."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de configuración",
      "🔧 **Mutaciones:** `/api/garantias/config` para UPDATE",
      "📊 **Patrón:** Formulario de configuración + API Route",
      "⚙️ **Settings:** Afecta cálculos y alertas del sistema"
    ],
    validations: [
      "❌ NO modificar sin autorización de administración",
      "⚠️ NO establecer límites irrealistas",
      "✅ Probar configuración antes de aplicar en producción",
      "🔍 Documentar cambios para auditoría"
    ]
  },
  "Estadísticas Tasaciones": {
    steps: [
      "📊 **Totales:** Número de tasaciones, aceptadas, rechazadas.",
      "💰 **Valores:** Promedio de tasación, rango de precios.",
      "📈 **Conversión:** Porcentaje de tasaciones que se convierten en compra.",
      "👤 **Por Asesor:** Performance de cada tasador.",
      "📅 **Tendencias:** Evolución del mercado en el tiempo."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT con agregaciones",
      "📊 **Patrón:** Solo lectura - Dashboard de estadísticas",
      "📈 **Agregaciones:** Cálculos complejos para métricas",
      "🎨 **Visualización:** Multiple charts y KPIs"
    ],
    validations: [
      "✅ Revisar regularmente para ajustar estrategia de compra",
      "🔍 Analizar tasaciones rechazadas para mejoras",
      "📊 Usar para training de tasadores",
      "💰 Comparar con mercado para pricing competitivo"
    ]
  },
  "Configuración Tasaciones": {
    steps: [
      "⚙️ **Parámetros:** Factores de depreciación, ajustes por kilometraje.",
      "📊 **Algoritmo:** Configurar cómo se calculan las tasaciones automáticas.",
      "💰 **Márgenes:** Establecer márgenes mínimos de beneficio.",
      "🔔 **Notificaciones:** Configurar alertas para tasaciones especiales.",
      "✅ **Guardado:** Se aplican a todas las nuevas tasaciones."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de settings",
      "🔧 **Mutaciones:** `/api/tasaciones/config` para UPDATE",
      "📊 **Patrón:** Formulario avanzado + Calculadora + API Route",
      "⚙️ **Impacto:** Afecta cálculos automáticos de valoración"
    ],
    validations: [
      "❌ NO modificar sin conocimiento del mercado actual",
      "⚠️ NO establecer parámetros que generen tasaciones irrealistas",
      "✅ Validar cambios con tasaciones de prueba",
      "🔍 Revisar impacto en tasaciones existentes"
    ]
  },
  // FASE 5: ADMINISTRACIÓN Y CONFIGURACIÓN
  "Gestión Usuarios": {
    steps: [
      "👥 **Lista de Usuarios:** Todos los usuarios del sistema con sus roles.",
      "🔒 **Roles:** Admin, Vendedor, Fotógrafo, Mecánico, etc.",
      "✅ **Estado:** Activo, inactivo, bloqueado.",
      "📧 **Contacto:** Email, teléfono, información adicional.",
      "✏️ **Edición:** Modificar roles, permisos y estado."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de profiles",
      "🔧 **Mutaciones:** `/api/admin/users/editar` para UPDATE (solo admin)",
      "📊 **Patrón:** Tabla + Modal edición + Control de permisos + API Routes",
      "🔒 **Seguridad:** Solo admin puede modificar roles y permisos"
    ],
    validations: [
      "❌ NO modificar rol admin sin autorización del super admin",
      "⚠️ NO desactivar usuarios sin verificar impact en procesos activos",
      "✅ Verificar que el usuario tenga email válido antes de activar",
      "🔍 Auditar cambios de roles regularmente"
    ]
  },
  "Nuevo Usuario": {
    steps: [
      "📝 **Datos Básicos:** Nombre, apellidos, email, teléfono.",
      "🔒 **Credenciales:** Email será el usuario, password temporal.",
      "👤 **Rol:** Asignar rol según responsabilidades.",
      "📧 **Notificación:** Se envía email de bienvenida con credenciales.",
      "✅ **Activación:** Usuario puede acceder inmediatamente."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para validaciones",
      "🔧 **Mutaciones:** `/api/admin/users/crear` para INSERT (auth + profile)",
      "📊 **Patrón:** Formulario + Validaciones + Envío email + API Route",
      "🔒 **Auth:** Crea usuario en Supabase Auth + profile en database"
    ],
    validations: [
      "❌ NO crear sin email válido y único",
      "⚠️ NO asignar rol admin sin autorización explícita",
      "✅ Verificar que el email no existe previamente",
      "🔍 Generar password temporal fuerte"
    ]
  },
  "Editar Usuario [id]": {
    steps: [
      "📄 **Información Completa:** Todos los datos del usuario.",
      "🔒 **Cambio de Rol:** Modificar permisos y accesos.",
      "📧 **Datos de Contacto:** Actualizar email, teléfono.",
      "✅ **Estado:** Activar, desactivar o bloquear usuario.",
      "📊 **Actividad:** Historial de acciones del usuario."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT por ID",
      "🔧 **Mutaciones:** `/api/admin/users/editar` para UPDATE",
      "📊 **Patrón:** Formulario detalle + Timeline + API Route",
      "🔒 **Permisos:** Solo admin puede acceder a esta vista"
    ],
    validations: [
      "❌ NO cambiar email sin verificar nuevo email",
      "⚠️ NO modificar tu propio rol admin",
      "✅ Confirmar cambios críticos con el usuario",
      "🔍 Revisar actividad antes de bloquear"
    ]
  },
  "Gestión Avatares": {
    steps: [
      "🖼️ **Biblioteca de Avatares:** Todos los avatares disponibles.",
      "📤 **Subir Nuevo:** Agregar nuevos avatares al sistema.",
      "🎨 **Categorías:** Organizar por tipo (hombre, mujer, neutro).",
      "✏️ **Asignación:** Asignar avatar predeterminado a usuarios.",
      "🗑️ **Eliminar:** Remover avatares no utilizados."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de avatar list",
      "🔧 **Mutaciones:** `/api/admin/avatares/subir` para INSERT + Storage",
      "📊 **Patrón:** Galería + Upload + Supabase Storage + API Routes",
      "🖼️ **Storage:** Archivos en Supabase Storage, URLs en database"
    ],
    validations: [
      "❌ NO eliminar avatares asignados a usuarios activos",
      "⚠️ NO subir imágenes muy grandes - optimizar primero",
      "✅ Verificar formato de imagen (PNG, JPG, WebP)",
      "🔍 Mantener biblioteca organizada y limpia"
    ]
  },
  "Avatar Mappings": {
    steps: [
      "🔗 **Mapeo:** Relación entre usuarios y sus avatares.",
      "🎨 **Asignación Automática:** Sistema asigna avatar por defecto.",
      "✏️ **Personalización:** Usuario puede cambiar su avatar.",
      "📊 **Estadísticas:** Avatares más usados, preferencias.",
      "🔄 **Sincronización:** Actualización en tiempo real en UI."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de avatar_mappings",
      "🔧 **Mutaciones:** `/api/avatares/asignar` para UPDATE",
      "📊 **Patrón:** Sistema de preferencias + Update en tiempo real",
      "🔄 **Cache:** Avatares se cachean para mejor performance"
    ],
    validations: [
      "✅ Permitir a usuarios cambiar su propio avatar",
      "🔍 Validar que el avatar existe antes de asignar",
      "📊 No forzar avatar específico sin consentimiento",
      "🎨 Ofrecer variedad de opciones"
    ]
  },
  "Footer Settings": {
    steps: [
      "📝 **Texto Footer:** Editar texto de copyright y enlaces.",
      "🔗 **Enlaces:** Configurar links a políticas, contacto, etc.",
      "🎨 **Estilo:** Colores y formato del footer.",
      "📊 **Información:** Versión del sistema, última actualización.",
      "✅ **Guardado:** Cambios se aplican inmediatamente."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de footer_settings",
      "🔧 **Mutaciones:** `/api/config/footer` para UPDATE",
      "📊 **Patrón:** Formulario de configuración + Preview + API Route",
      "🔄 **Cache:** Settings se cachean, se invalida al actualizar"
    ],
    validations: [
      "❌ NO modificar sin autorización de administración",
      "⚠️ NO eliminar información legal requerida",
      "✅ Verificar que los links funcionan antes de guardar",
      "🔍 Mantener información de versión actualizada"
    ]
  },
  "Filter Configs": {
    steps: [
      "🔍 **Configuración de Filtros:** Definir filtros disponibles en cada tabla.",
      "📊 **Campos:** Qué campos se pueden filtrar.",
      "🎨 **Tipo:** Tipo de filtro (texto, fecha, select, etc).",
      "✅ **Activar/Desactivar:** Habilitar o deshabilitar filtros.",
      "💾 **Guardar:** Configuración se aplica a todas las tablas."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de filter_configs",
      "🔧 **Mutaciones:** `/api/config/filters` para UPDATE",
      "📊 **Patrón:** Sistema de configuración dinámico + JSON",
      "🔄 **Aplicación:** Filtros se regeneran dinámicamente en tablas"
    ],
    validations: [
      "❌ NO eliminar filtros críticos para operación",
      "⚠️ NO cambiar tipos de filtro sin considerar datos existentes",
      "✅ Probar filtros después de cada cambio",
      "🔍 Documentar cambios para usuarios"
    ]
  },
  "Filter Processing Log": {
    steps: [
      "📋 **Log de Procesamiento:** Historial de ejecución de filtros.",
      "⏱️ **Performance:** Tiempo de ejecución de cada filtro.",
      "❌ **Errores:** Registro de filtros que fallaron.",
      "📊 **Estadísticas:** Filtros más usados, más lentos.",
      "🔍 **Debug:** Información para optimización."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de filter_processing_log",
      "📊 **Patrón:** Solo lectura - Log inmutable para análisis",
      "📈 **Análisis:** Identificar cuellos de botella",
      "🔍 **Debug:** Ayuda a optimizar queries lentas"
    ],
    validations: [
      "✅ Revisar regularmente para optimización",
      "🔍 Identificar filtros lentos y optimizarlos",
      "📊 Usar para decisiones de caching",
      "⏱️ Establecer alertas para filtros muy lentos"
    ]
  },
  "Column Mappings": {
    steps: [
      "🗂️ **Mapeo de Columnas:** Relación entre columnas de diferentes fuentes.",
      "🔄 **Sincronización:** Cómo se mapean datos entre tablas.",
      "📊 **Transformaciones:** Reglas de conversión de datos.",
      "✏️ **Edición:** Modificar reglas de mapeo.",
      "✅ **Validación:** Verificar integridad de mapeos."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de column_mappings",
      "🔧 **Mutaciones:** `/api/config/mappings` para UPDATE",
      "📊 **Patrón:** Sistema de ETL + Validaciones + API Routes",
      "🔄 **Crítico:** Afecta sincronización de datos entre sistemas"
    ],
    validations: [
      "❌ NO modificar sin backup y plan de rollback",
      "⚠️ NO cambiar mapeos activos sin testing exhaustivo",
      "✅ Verificar que los datos se transforman correctamente",
      "🔍 Documentar cada cambio detalladamente"
    ]
  },
  "User Preferences": {
    steps: [
      "⚙️ **Preferencias Usuario:** Configuración personalizada por usuario.",
      "🎨 **Tema:** Dark mode, light mode, colores.",
      "📊 **Vista:** Preferencias de tablas, filtros guardados.",
      "🔔 **Notificaciones:** Qué notificaciones recibir.",
      "💾 **Auto-guardado:** Preferencias se guardan automáticamente."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de user_preferences",
      "🔧 **Mutaciones:** `/api/preferences/update` para UPDATE",
      "📊 **Patrón:** Sistema de preferencias + Auto-save + Local Storage",
      "🔄 **Sync:** Sincroniza entre dispositivos del usuario"
    ],
    validations: [
      "✅ Permitir usuarios personalizar su experiencia",
      "🔍 Respetar preferencias de privacidad",
      "📊 Ofrecer reset a valores predeterminados",
      "💾 Guardar automáticamente sin molestar al usuario"
    ]
  },
  "Forced Updates": {
    steps: [
      "🔄 **Actualizaciones Forzadas:** Control de versiones del frontend.",
      "📊 **Versión Mínima:** Versión mínima requerida para usar el sistema.",
      "⚠️ **Alertas:** Notificar a usuarios sobre actualizaciones.",
      "🔒 **Bloqueo:** Bloquear acceso si versión es muy antigua.",
      "✅ **Configuración:** Establecer políticas de actualización."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de forced_updates",
      "🔧 **Mutaciones:** `/api/config/forced-updates` para UPDATE",
      "📊 **Patrón:** Sistema de versionado + Verificación en startup",
      "🔒 **Control:** Previene uso de versiones con bugs críticos"
    ],
    validations: [
      "❌ NO forzar updates sin comunicación previa",
      "⚠️ NO bloquear sin dar tiempo razonable para actualizar",
      "✅ Proveer instrucciones claras de actualización",
      "🔍 Usar solo para fixes críticos de seguridad"
    ]
  },
  "Locations": {
    steps: [
      "📍 **Ubicaciones:** Gestión de ubicaciones físicas del negocio.",
      "🏢 **Tipos:** Taller, almacén, showroom, parking.",
      "📊 **Capacidad:** Número de vehículos por ubicación.",
      "🗺️ **Coordenadas:** Dirección y ubicación en mapa.",
      "✏️ **Edición:** Modificar detalles de ubicaciones."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de locations",
      "🔧 **Mutaciones:** `/api/config/locations` para INSERT/UPDATE",
      "📊 **Patrón:** CRUD completo + Mapas + API Routes",
      "🗺️ **Integración:** Puede incluir Google Maps API"
    ],
    validations: [
      "❌ NO eliminar ubicaciones con vehículos asignados",
      "⚠️ NO modificar direcciones sin verificar",
      "✅ Mantener capacidad actualizada",
      "🔍 Verificar coordenadas en mapa antes de guardar"
    ]
  },
  "Delivery Centers": {
    steps: [
      "🚚 **Centros de Entrega:** Ubicaciones donde se entregan vehículos.",
      "📍 **Dirección:** Información completa de ubicación.",
      "📅 **Horarios:** Horarios de operación del centro.",
      "👥 **Personal:** Responsables de cada centro.",
      "📊 **Estadísticas:** Entregas realizadas por centro."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de delivery_centers",
      "🔧 **Mutaciones:** `/api/config/delivery-centers` para INSERT/UPDATE",
      "📊 **Patrón:** CRUD + Horarios + Asignación + API Routes",
      "🔄 **Relación:** Se usa en programación de entregas"
    ],
    validations: [
      "❌ NO eliminar centros con entregas programadas",
      "⚠️ NO modificar horarios sin notificar a clientes afectados",
      "✅ Verificar que el personal asignado está activo",
      "🔍 Mantener información de contacto actualizada"
    ]
  },
  "Expense Types": {
    steps: [
      "💰 **Tipos de Gasto:** Categorías de gastos para vehículos.",
      "📊 **Categorías:** Mecánica, pintura, documentación, etc.",
      "✏️ **Descripción:** Detalle de cada tipo de gasto.",
      "💵 **Presupuesto:** Límites por categoría (opcional).",
      "📈 **Estadísticas:** Gastos por categoría y período."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de expense_types",
      "🔧 **Mutaciones:** `/api/config/expense-types` para INSERT/UPDATE",
      "📊 **Patrón:** CRUD + Presupuestos + API Routes",
      "💰 **Uso:** Se usa en registro de gastos de vehículos"
    ],
    validations: [
      "❌ NO eliminar tipos con gastos registrados",
      "⚠️ NO modificar sin considerar reportes existentes",
      "✅ Mantener categorías claras y específicas",
      "🔍 Revisar regularmente para agregar nuevas necesarias"
    ]
  },
  "Dashboard Reportes": {
    steps: [
      "📊 **Panel de Reportes:** Vista general de todos los reportes disponibles.",
      "📈 **Categorías:** Ventas, stock, finanzas, fotos, etc.",
      "🔍 **Búsqueda:** Buscar reportes específicos.",
      "⭐ **Favoritos:** Marcar reportes más usados.",
      "📥 **Exportar:** Exportar datos en diferentes formatos."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para múltiples queries",
      "📊 **Patrón:** Dashboard de reportes + Navegación + Exportación",
      "📈 **Agregaciones:** Múltiples queries complejas",
      "📥 **Export:** Genera Excel, PDF, CSV según reporte"
    ],
    validations: [
      "✅ Cachear reportes pesados para mejor performance",
      "🔍 Validar rangos de fechas antes de generar",
      "📊 Limitar exportaciones muy grandes",
      "⏱️ Mostrar indicador de carga para reportes lentos"
    ]
  },
  "Reportes Ventas": {
    steps: [
      "💰 **Reporte de Ventas:** Análisis detallado de ventas.",
      "📅 **Período:** Seleccionar rango de fechas.",
      "📊 **Desglose:** Por vendedor, marca, modelo, tipo.",
      "📈 **Gráficos:** Visualizaciones de tendencias.",
      "📥 **Exportar:** Descargar reporte completo."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con agregaciones complejas",
      "📊 **Patrón:** Reporte avanzado + Múltiples gráficos + Exportación",
      "📈 **Charts:** Recharts para visualizaciones",
      "📥 **Export:** Excel con múltiples hojas"
    ],
    validations: [
      "✅ Validar que el rango de fechas es razonable",
      "🔍 Mostrar advertencia para rangos muy amplios",
      "📊 Ofrecer filtros adicionales para refinar datos",
      "⏱️ Implementar paginación para datasets grandes"
    ]
  },
  "Reportes Stock": {
    steps: [
      "🚗 **Reporte de Inventario:** Estado actual del stock.",
      "📊 **Por Estado:** Disponible, vendido, en preparación.",
      "📈 **Rotación:** Días promedio en stock.",
      "💰 **Valoración:** Valor total del inventario.",
      "📥 **Exportar:** Listado completo con detalles."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT con cálculos",
      "📊 **Patrón:** Reporte de inventario + Cálculos financieros",
      "📈 **Métricas:** Rotación, edad, valoración",
      "📥 **Export:** Excel con fórmulas para análisis"
    ],
    validations: [
      "✅ Actualizar valoración según precios de mercado",
      "🔍 Identificar vehículos con rotación lenta",
      "📊 Considerar depreciación en valoración",
      "💰 Incluir costes de preparación en valoración total"
    ]
  },
  "Reportes Financieros": {
    steps: [
      "💰 **Reporte Financiero:** Análisis de ingresos, gastos, márgenes.",
      "📊 **Ingresos:** Desglose por fuente de ingreso.",
      "💸 **Gastos:** Categorización de todos los gastos.",
      "📈 **Márgenes:** Margen bruto y neto por vehículo.",
      "📥 **Exportar:** Reporte contable completo."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con múltiples joins",
      "📊 **Patrón:** Reporte contable + Cálculos complejos",
      "💰 **Finanzas:** Ingresos, gastos, márgenes, ROI",
      "📥 **Export:** Excel formato contable"
    ],
    validations: [
      "✅ Verificar que todos los gastos están registrados",
      "🔍 Revisar márgenes negativos para análisis",
      "📊 Incluir todos los costes ocultos",
      "💰 Validar cálculos con departamento financiero"
    ]
  },
  "Reportes Fotográficos": {
    steps: [
      "📸 **Reporte de Fotos:** Estadísticas del sistema fotográfico.",
      "👤 **Por Fotógrafo:** Performance individual.",
      "📊 **Completitud:** Vehículos con fotos completas vs. pendientes.",
      "⏱️ **Tiempos:** Promedio de tiempo de completado.",
      "📥 **Exportar:** Reporte de productividad."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con agregaciones",
      "📊 **Patrón:** Reporte de KPIs + Ranking + Gráficos",
      "📈 **Métricas:** Completitud, velocidad, calidad",
      "📥 **Export:** Excel con análisis de performance"
    ],
    validations: [
      "✅ Considerar complejidad de vehículos al evaluar",
      "🔍 Identificar cuellos de botella en el proceso",
      "📊 Usar para distribución equitativa de carga",
      "⏱️ Establecer benchmarks realistas"
    ]
  },
  "Reportes Entregas": {
    steps: [
      "🚚 **Reporte de Entregas:** Análisis de entregas realizadas.",
      "📅 **Puntualidad:** Entregas a tiempo vs. retrasadas.",
      "📍 **Por Centro:** Performance de cada centro de entrega.",
      "😊 **Satisfacción:** Feedback de clientes (si aplica).",
      "📥 **Exportar:** Reporte de calidad de servicio."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con cálculos de fechas",
      "📊 **Patrón:** Reporte de servicio + Análisis temporal",
      "📈 **Métricas:** Puntualidad, completitud, incidencias",
      "📥 **Export:** Excel con análisis de calidad"
    ],
    validations: [
      "✅ Revisar causas de retrasos para mejoras",
      "🔍 Identificar patrones de incidencias",
      "📊 Usar para optimización de procesos",
      "📅 Considerar factores externos (festivos, clima)"
    ]
  },
  "Reportes Recogidas": {
    steps: [
      "🚗 **Reporte de Recogidas:** Análisis de recogidas realizadas.",
      "📊 **Éxito:** Recogidas completadas vs. canceladas.",
      "⏱️ **Tiempos:** Eficiencia en el proceso de recogida.",
      "👤 **Por Responsable:** Performance individual.",
      "📥 **Exportar:** Reporte de operaciones."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con análisis temporal",
      "📊 **Patrón:** Reporte operacional + Métricas de eficiencia",
      "📈 **Análisis:** Tasa de éxito, tiempos, costes",
      "📥 **Export:** Excel con datos operacionales"
    ],
    validations: [
      "✅ Analizar motivos de cancelaciones",
      "🔍 Optimizar rutas y horarios",
      "📊 Considerar costes de desplazamiento",
      "⏱️ Establecer SLAs para recogidas"
    ]
  },
  "Reportes Garantías": {
    steps: [
      "💰 **Reporte de Garantías:** Análisis de costes de garantía.",
      "🚗 **Por Modelo:** Qué modelos tienen más costes.",
      "📅 **Evolución:** Tendencia de costes en el tiempo.",
      "📊 **Comparativa:** BMW vs. MINI vs. Motorrad.",
      "📥 **Exportar:** Reporte de costes operativos."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con agregaciones complejas",
      "📊 **Patrón:** Reporte financiero + Análisis comparativo",
      "📈 **Análisis:** Por marca, modelo, tipo de gasto",
      "📥 **Export:** Excel con análisis de costes"
    ],
    validations: [
      "✅ Usar para decisiones de compra",
      "🔍 Identificar modelos problemáticos",
      "📊 Considerar en pricing de vehículos",
      "💰 Negociar con proveedores basado en datos"
    ]
  },
  "Reportes Tasaciones": {
    steps: [
      "💰 **Reporte de Tasaciones:** Análisis del proceso de tasación.",
      "📊 **Conversión:** Tasaciones que se convierten en compra.",
      "🚗 **Valoración:** Precisión de las tasaciones.",
      "👤 **Por Tasador:** Performance individual.",
      "📥 **Exportar:** Reporte de efectividad."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con cálculos de conversión",
      "📊 **Patrón:** Reporte de sales + Análisis de conversión",
      "📈 **Métricas:** Tasa de conversión, precisión, valores",
      "📥 **Export:** Excel con análisis de efectividad"
    ],
    validations: [
      "✅ Revisar tasaciones rechazadas para aprendizaje",
      "🔍 Ajustar algoritmo de valoración según resultados",
      "📊 Training de tasadores basado en datos",
      "💰 Comparar con mercado real regularmente"
    ]
  },
  "Reportes Personalizados": {
    steps: [
      "⚙️ **Crear Reporte:** Constructor de reportes personalizados.",
      "📊 **Seleccionar Datos:** Elegir tablas y campos.",
      "🔍 **Filtros:** Aplicar filtros personalizados.",
      "📈 **Visualización:** Elegir tipo de gráfico.",
      "💾 **Guardar:** Guardar configuración para reutilizar."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con queries dinámicas",
      "🔧 **Mutaciones:** `/api/reportes/crear` para INSERT (guardar config)",
      "📊 **Patrón:** Query builder + Visualizaciones dinámicas",
      "⚙️ **Complejo:** Requiere validación de queries para seguridad"
    ],
    validations: [
      "❌ NO permitir queries sin límites - puede sobrecargar sistema",
      "⚠️ NO exponer datos sensibles sin permisos",
      "✅ Validar y sanitizar todas las queries",
      "🔍 Limitar complejidad de queries permitidas"
    ]
  },
  "Exportar Reportes": {
    steps: [
      "📥 **Seleccionar Formato:** Excel, PDF, CSV.",
      "📊 **Configurar:** Qué datos incluir en la exportación.",
      "🎨 **Formato:** Aplicar estilos y formato al export.",
      "📧 **Enviar:** Opción de enviar por email.",
      "💾 **Descargar:** Descargar archivo directamente."
    ],
    technical: [
      "💻 **Consultas:** Usa datos del reporte actual",
      "🔧 **Generación:** Libraries: ExcelJS, jsPDF, Papa Parse",
      "📊 **Patrón:** Sistema de exportación + Generación de archivos",
      "📧 **Email:** Opcional - envía archivo por correo"
    ],
    validations: [
      "✅ Validar tamaño del export antes de generar",
      "🔍 No exportar datos sensibles sin autorización",
      "📊 Incluir metadatos (fecha generación, usuario)",
      "💾 Limpiar archivos temporales después de descarga"
    ]
  },
  // FASE 6: NOTICIAS Y COMUNICACIÓN
  "Noticias BMW": {
    steps: [
      "📰 **Gestión de Noticias:** Publicación de noticias BMW para el equipo.",
      "✏️ **Crear/Editar:** Redactar y publicar noticias.",
      "📸 **Multimedia:** Agregar imágenes a las noticias.",
      "📊 **Categorías:** Productos, eventos, promociones, etc.",
      "✅ **Publicar:** Hacer visible la noticia para el equipo."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de bmw_noticias",
      "🔧 **Mutaciones:** `/api/noticias/crear` para INSERT",
      "✏️ **Editar:** `/api/noticias/editar` para UPDATE",
      "📊 **Patrón:** CRUD completo + Editor de texto + Imágenes + API Routes"
    ],
    validations: [
      "❌ NO publicar sin revisar contenido",
      "⚠️ NO eliminar noticias importantes sin backup",
      "✅ Verificar imágenes antes de publicar",
      "🔍 Mantener archivo organizado de noticias pasadas"
    ]
  },
  "Nueva Noticia": {
    steps: [
      "📝 **Título:** Título claro y descriptivo.",
      "📄 **Contenido:** Cuerpo de la noticia con formato.",
      "📸 **Imágenes:** Subir imágenes relacionadas.",
      "🏷️ **Categoría:** Clasificar la noticia.",
      "✅ **Publicar:** Hacer visible inmediatamente o programar."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para validaciones",
      "🔧 **Mutaciones:** `/api/noticias/crear` para INSERT",
      "📊 **Patrón:** Formulario + Editor de texto rico + Upload imágenes + API Route",
      "🖼️ **Storage:** Imágenes en Supabase Storage"
    ],
    validations: [
      "❌ NO publicar sin revisar ortografía y formato",
      "⚠️ NO subir imágenes de baja calidad",
      "✅ Verificar que los links funcionan",
      "🔍 Programar noticias importantes para horario óptimo"
    ]
  },
  "Editar Noticia [id]": {
    steps: [
      "📄 **Vista Completa:** Todos los datos de la noticia.",
      "✏️ **Modificar:** Editar título, contenido, imágenes.",
      "📊 **Estadísticas:** Visualizaciones, engagement.",
      "🗑️ **Eliminar:** Opción de eliminar noticia.",
      "✅ **Guardar:** Actualizar noticia publicada."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT por ID",
      "🔧 **Mutaciones:** `/api/noticias/editar` para UPDATE",
      "📊 **Patrón:** Formulario de edición + Preview + API Route",
      "📈 **Analytics:** Tracking de visualizaciones opcional"
    ],
    validations: [
      "❌ NO modificar noticias antiguas sin razón válida",
      "⚠️ NO cambiar contenido radicalmente - mejor crear nueva",
      "✅ Mantener historial de cambios",
      "🔍 Verificar impacto en enlaces compartidos"
    ]
  },
  "Configuración Notificaciones": {
    steps: [
      "🔔 **Tipos de Notificación:** Push, email, SMS, in-app.",
      "⚙️ **Eventos:** Qué eventos generan notificaciones.",
      "👥 **Destinatarios:** Quiénes reciben cada tipo de notificación.",
      "📝 **Plantillas:** Editar plantillas de mensajes.",
      "✅ **Activar/Desactivar:** Control global de notificaciones."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de config",
      "🔧 **Mutaciones:** `/api/config/notifications` para UPDATE",
      "📊 **Patrón:** Sistema de configuración + Plantillas + API Routes",
      "🔔 **Integración:** Push API, Nodemailer, SMS gateway"
    ],
    validations: [
      "❌ NO desactivar notificaciones críticas",
      "⚠️ NO spam - respetar preferencias de usuarios",
      "✅ Probar notificaciones antes de activar en producción",
      "🔍 Monitorear tasa de entrega de notificaciones"
    ]
  },
  "Email Templates": {
    steps: [
      "📧 **Plantillas de Email:** Gestión de plantillas de correo.",
      "✏️ **Editor:** Editor visual para crear/editar plantillas.",
      "🎨 **Diseño:** HTML + CSS para emails profesionales.",
      "🔧 **Variables:** Usar variables dinámicas (nombre, fecha, etc).",
      "📤 **Probar:** Enviar email de prueba antes de usar."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de templates",
      "🔧 **Mutaciones:** `/api/config/email-templates` para INSERT/UPDATE",
      "📊 **Patrón:** Editor de templates + Preview + Testing + API Routes",
      "📧 **Render:** Usa librería de templating (Handlebars o similar)"
    ],
    validations: [
      "❌ NO usar HTML no válido - puede romper visualización",
      "⚠️ NO incluir imágenes externas que puedan fallar",
      "✅ Probar en múltiples clientes de email",
      "🔍 Verificar que las variables se reemplazan correctamente"
    ]
  },
  "Activate Push": {
    steps: [
      "🔔 **Activar Push:** Proceso para habilitar notificaciones push.",
      "📱 **Permisos:** Solicitar permisos del navegador.",
      "📝 **Suscripción:** Crear suscripción de notificaciones.",
      "✅ **Verificar:** Confirmar que funciona con notificación de prueba.",
      "💾 **Guardar:** Suscripción se guarda en el servidor."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para verificar suscripción",
      "🔧 **Mutaciones:** `/api/push/subscribe` para INSERT (nueva suscripción)",
      "📊 **Patrón:** Service Worker + Push API + Suscripción + API Route",
      "🔔 **Web Push:** Usa Web Push API y VAPID keys"
    ],
    validations: [
      "✅ Solicitar permisos de forma amigable",
      "🔍 Explicar beneficios de activar notificaciones",
      "📱 Verificar compatibilidad del navegador",
      "🔔 Enviar notificación de confirmación al activar"
    ]
  },
  "Check Subscriptions": {
    steps: [
      "📊 **Ver Suscripciones:** Lista todas las suscripciones activas del usuario.",
      "📱 **Por Dispositivo:** Muestra cada dispositivo suscrito.",
      "✅ **Estado:** Activa, inactiva, expirada.",
      "🗑️ **Eliminar:** Desuscribir dispositivos específicos.",
      "🔄 **Renovar:** Renovar suscripciones expiradas."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de suscripciones",
      "🔧 **Mutaciones:** `/api/push/unsubscribe` para DELETE",
      "📊 **Patrón:** Lista de suscripciones + Gestión + API Routes",
      "🔔 **Control:** Usuario controla sus propias suscripciones"
    ],
    validations: [
      "✅ Permitir gestión fácil de suscripciones",
      "🔍 Limpiar suscripciones expiradas automáticamente",
      "📱 Identificar claramente cada dispositivo",
      "🔔 Confirmar antes de eliminar suscripciones"
    ]
  },
  "Process Emails": {
    steps: [
      "📧 **Procesador de Emails:** Sistema que procesa emails entrantes.",
      "📥 **Inbox:** Recibe emails de clientes, proveedores.",
      "🔍 **Clasificación:** Clasifica automáticamente por tipo.",
      "⚡ **Acciones:** Dispara acciones automáticas según contenido.",
      "📊 **Log:** Registro de todos los emails procesados."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de email log",
      "🔧 **Procesamiento:** Background job + Email parsing",
      "📊 **Patrón:** Sistema de automatización + Reglas + Triggers",
      "📧 **IMAP:** Conexión a servidor de email para recibir"
    ],
    validations: [
      "✅ Revisar regularmente que el procesamiento funciona",
      "🔍 Verificar reglas de clasificación",
      "📊 Monitorear errores en el proceso",
      "📧 Mantener credenciales de email actualizadas"
    ]
  },
  "Noticias": {
    steps: [
      "📰 **Vista Pública:** Página donde se muestran las noticias publicadas.",
      "📊 **Filtros:** Por categoría, fecha, relevancia.",
      "📖 **Lectura:** Vista de lectura optimizada.",
      "💬 **Comentarios:** Opción de comentar (si está habilitado).",
      "📱 **Responsive:** Optimizada para móvil y desktop."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de noticias públicas",
      "📊 **Patrón:** Solo lectura - Vista de noticias + Paginación",
      "🎨 **UI:** Diseño limpio y legible",
      "📱 **Responsive:** Adaptada a diferentes dispositivos"
    ],
    validations: [
      "✅ Mantener diseño limpio y profesional",
      "🔍 Cargar imágenes de forma optimizada",
      "📊 Implementar paginación para mejor performance",
      "📱 Probar en múltiples dispositivos"
    ]
  },
  "BMW Noticias": {
    steps: [
      "📰 **Noticias BMW:** Gestión de noticias BMW específicas.",
      "🔍 **Filtrado:** Solo noticias relacionadas con BMW.",
      "📊 **Categorías:** Nuevos modelos, actualizaciones, eventos.",
      "✏️ **Gestión:** Crear, editar, eliminar noticias BMW.",
      "📥 **Exportar:** Exportar archivo de noticias."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT filtrado por marca",
      "🔧 **Mutaciones:** Usa las mismas API Routes que noticias generales",
      "📊 **Patrón:** Vista filtrada + CRUD + API Routes",
      "🔍 **Filtro:** WHERE marca = 'BMW'"
    ],
    validations: [
      "✅ Mantener coherencia con branding BMW",
      "🔍 Verificar información oficial BMW",
      "📊 Actualizar regularmente con novedades",
      "🎨 Usar colores y estilo BMW oficial"
    ]
  },
  // FASE 7: TRANSACCIONES Y PÁGINAS PÚBLICAS
  "Professional Sales": {
    steps: [
      "💼 **Ventas Profesionales:** Sistema de ventas para clientes B2B.",
      "🏢 **Empresas:** Registro de empresas clientes.",
      "📊 **Volumen:** Ventas múltiples y descuentos por volumen.",
      "💰 **Condiciones:** Términos especiales para profesionales.",
      "📄 **Contratos:** Gestión de contratos empresariales."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de professional_sales",
      "🔧 **Mutaciones:** `/api/professional/crear` para INSERT",
      "📊 **Patrón:** Sistema B2B + Contratos + Descuentos + API Routes",
      "💼 **Especial:** Lógica de pricing diferente a ventas normales"
    ],
    validations: [
      "❌ NO aplicar descuentos sin autorización",
      "⚠️ NO crear contratos sin verificación legal",
      "✅ Validar datos fiscales de la empresa",
      "🔍 Revisar términos antes de finalizar contrato"
    ]
  },
  "PDF Extracted Data": {
    steps: [
      "📄 **Datos Extraídos:** Información extraída de PDFs automáticamente.",
      "🔍 **OCR:** Tesseract extrae texto de certificados.",
      "📊 **Validación:** Sistema verifica datos extraídos.",
      "✏️ **Corrección:** Permite corregir errores de OCR.",
      "✅ **Aplicar:** Datos se aplican a vehículos correspondientes."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de pdf_extracted_data",
      "🔧 **Mutaciones:** `/api/pdf/validar` para UPDATE (corregir datos)",
      "📊 **Patrón:** OCR + Validación + Corrección manual + API Routes",
      "🔍 **Tesseract:** Extracción automática de texto de PDFs"
    ],
    validations: [
      "❌ NO confiar 100% en OCR - siempre revisar",
      "⚠️ NO aplicar datos sin validación humana",
      "✅ Corregir errores de extracción antes de aplicar",
      "🔍 Mejorar templates de extracción según patrones"
    ]
  },
  "About": {
    steps: [
      "ℹ️ **Acerca de:** Página de información de la aplicación.",
      "📖 **Descripción:** Qué es y para qué sirve el sistema.",
      "👥 **Equipo:** Información del equipo de desarrollo.",
      "📧 **Contacto:** Información de contacto y soporte.",
      "📄 **Versión:** Versión actual del sistema."
    ],
    technical: [
      "💻 **Consultas:** Ninguna - contenido estático",
      "📊 **Patrón:** Página estática + Componentes de UI",
      "🎨 **Diseño:** Página informativa profesional",
      "📄 **Versión:** Se lee de archivo de configuración"
    ],
    validations: [
      "✅ Mantener información actualizada",
      "🔍 Verificar que los links de contacto funcionan",
      "📊 Actualizar versión automáticamente",
      "🎨 Diseño profesional y claro"
    ]
  },
  "Política de Privacidad": {
    steps: [
      "📋 **Política Legal:** Términos de uso y privacidad.",
      "🔒 **GDPR:** Cumplimiento con regulaciones de datos.",
      "📄 **Contenido:** Texto legal completo.",
      "✏️ **Edición:** Solo admin puede modificar.",
      "📅 **Versiones:** Historial de cambios en la política."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de policy content",
      "🔧 **Mutaciones:** `/api/admin/policy` para UPDATE (solo admin)",
      "📊 **Patrón:** Contenido legal + Versionado + Editor + API Routes",
      "🔒 **Legal:** Requiere aprobación legal antes de publicar"
    ],
    validations: [
      "❌ NO modificar sin revisión legal",
      "⚠️ NO publicar cambios sin notificar a usuarios",
      "✅ Mantener versiones anteriores archivadas",
      "🔍 Verificar cumplimiento GDPR"
    ]
  },
  "Reset Password": {
    steps: [
      "🔒 **Solicitud:** Usuario solicita reset de contraseña.",
      "📧 **Email:** Se envía link de recuperación al email.",
      "⏱️ **Token:** Link temporal con expiración.",
      "🔑 **Nueva Contraseña:** Usuario establece nueva contraseña.",
      "✅ **Confirmación:** Se actualiza y se puede acceder."
    ],
    technical: [
      "💻 **Consultas:** Ninguna - flujo de Supabase Auth",
      "🔧 **Auth:** Usa sistema de reset de Supabase Auth",
      "📊 **Patrón:** Formulario + Email + Supabase Auth API",
      "🔒 **Seguridad:** Tokens temporales, expiración, validación"
    ],
    validations: [
      "✅ Validar que el email existe antes de enviar",
      "🔍 Tokens deben expirar en tiempo razonable",
      "🔒 Requerir contraseña fuerte",
      "📧 Notificar al usuario del cambio de contraseña"
    ]
  },
  "Auth Reset Password": {
    steps: [
      "🔑 **Confirmar Nueva Contraseña:** Página de confirmación del reset.",
      "✅ **Validar Token:** Verificar que el token es válido.",
      "🔒 **Nueva Contraseña:** Ingresar y confirmar nueva contraseña.",
      "📧 **Notificación:** Confirmar cambio por email.",
      "✅ **Redirect:** Redirigir al login después de completar."
    ],
    technical: [
      "💻 **Consultas:** Validación de token de Supabase Auth",
      "🔧 **Auth:** Usa updateUser de Supabase Auth",
      "📊 **Patrón:** Formulario + Validación + Supabase Auth API",
      "🔒 **Seguridad:** Verificación de token, validación de contraseña"
    ],
    validations: [
      "✅ Validar fortaleza de nueva contraseña",
      "🔍 Verificar que las contraseñas coinciden",
      "🔒 Limpiar token después de usar",
      "📧 Enviar confirmación de cambio exitoso"
    ]
  },
  "Force Password Change": {
    steps: [
      "🔒 **Cambio Forzado:** Usuario debe cambiar contraseña obligatoriamente.",
      "⚠️ **Razón:** Por seguridad, primera vez, política.",
      "🔑 **Nueva Contraseña:** Establecer contraseña fuerte.",
      "✅ **Confirmación:** Después de cambiar puede acceder al sistema.",
      "📧 **Notificación:** Confirmar cambio por email."
    ],
    technical: [
      "💻 **Consultas:** Verifica metadata del usuario (force_password_change)",
      "🔧 **Auth:** updateUser de Supabase Auth + metadata",
      "📊 **Patrón:** Formulario obligatorio + Middleware + Auth API",
      "🔒 **Middleware:** Verifica en cada request si necesita cambiar"
    ],
    validations: [
      "✅ No permitir bypass del cambio forzado",
      "🔍 Validar fortaleza de contraseña",
      "🔒 Limpiar flag después de cambiar exitosamente",
      "📧 Notificar al admin del cambio"
    ]
  },
  "Dashboard Cliente": {
    steps: [
      "👤 **Panel del Cliente:** Vista simplificada para clientes.",
      "🚗 **Sus Vehículos:** Lista de vehículos que ha comprado.",
      "📄 **Documentación:** Acceso a contratos y documentos.",
      "📅 **Citas:** Entregas programadas y servicios.",
      "📧 **Mensajes:** Comunicación con el concesionario."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` filtrado por cliente actual",
      "📊 **Patrón:** Dashboard simplificado + Solo lectura mayormente",
      "🔒 **Seguridad:** RLS para que solo vea sus propios datos",
      "🎨 **UI:** Diseño simple y amigable para clientes"
    ],
    validations: [
      "✅ Mostrar solo información relevante para el cliente",
      "🔍 No exponer datos internos del negocio",
      "📊 Diseño intuitivo para usuarios no técnicos",
      "🔒 Verificar RLS funciona correctamente"
    ]
  },
  "Transacciones (Públicas)": {
    steps: [
      "💳 **Transacciones Públicas:** Ventas y operaciones para vista pública.",
      "📊 **Listado:** Vehículos vendidos recientemente (opcional).",
      "💰 **Transparencia:** Información pública de transacciones.",
      "🔍 **Filtros:** Búsqueda por tipo, fecha, marca.",
      "📄 **Detalles:** Información general sin datos sensibles."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con RLS público",
      "📊 **Patrón:** Vista pública + Filtros + Sin datos sensibles",
      "🔒 **RLS:** Políticas estrictas para datos públicos",
      "🎨 **UI:** Diseño profesional para vista externa"
    ],
    validations: [
      "❌ NO exponer precios reales sin autorización",
      "⚠️ NO mostrar datos de clientes",
      "✅ Solo información general y estadísticas",
      "🔍 Verificar que RLS funciona correctamente"
    ]
  },
  "Clear SW": {
    steps: [
      "🔧 **Limpiar Service Worker:** Utilidad para limpiar cache del SW.",
      "📱 **Propósito:** Resolver problemas de cache y versiones.",
      "🔄 **Proceso:** Desregistra SW y limpia cache.",
      "✅ **Reload:** Recarga la página con versión fresca.",
      "📊 **Debug:** Herramienta de troubleshooting."
    ],
    technical: [
      "💻 **Consultas:** Ninguna - operación del navegador",
      "🔧 **SW:** navigator.serviceWorker.getRegistrations()",
      "📊 **Patrón:** Utilidad de mantenimiento del cliente",
      "🔄 **Cache:** Limpia caches del Service Worker"
    ],
    validations: [
      "✅ Usar solo cuando hay problemas de cache",
      "🔍 Advertir al usuario que se limpiará cache",
      "📊 Recargar automáticamente después de limpiar",
      "🔧 Útil para debugging de versiones"
    ]
  },
  // FASE 8: DEBUG & TESTING (Versión simplificada - Solo para desarrollo)
  "Debug Auth": {
    steps: [
      "🔍 **Propósito:** Verificar autenticación y sesión del usuario.",
      "🧪 **Prueba:** Estado de auth, tokens, permisos.",
      "✅ **Resultado:** Muestra información de debug de autenticación."
    ],
    technical: ["🔧 **Solo desarrollo** - Muestra estado interno de Supabase Auth"],
    validations: ["⚠️ NO usar en producción - solo para debugging"]
  },
  "Debug Session": {
    steps: ["🔍 Verificar estado de sesión actual", "🧪 Prueba tokens y expiración", "✅ Debug de problemas de sesión"],
    technical: ["🔧 Solo desarrollo - Estado de sesión de Supabase"],
    validations: ["⚠️ No usar en producción"]
  },
  "Debug Roles": {
    steps: ["🔍 Verificar roles y permisos", "🧪 Prueba asignación de roles", "✅ Debug de RLS"],
    technical: ["🔧 Solo desarrollo - Verifica roles del usuario"],
    validations: ["⚠️ No usar en producción"]
  },
  "Debug SMTP": {
    steps: ["🔍 Probar configuración SMTP", "🧪 Enviar emails de prueba", "✅ Verificar conexión servidor email"],
    technical: ["🔧 Solo desarrollo - Testing de Nodemailer config"],
    validations: ["⚠️ No enviar emails reales desde debug"]
  },
  "Debug SMTP Config": {
    steps: ["🔍 Ver configuración SMTP actual", "🧪 Validar credenciales", "✅ Probar conexión"],
    technical: ["🔧 Solo desarrollo - Muestra config de email"],
    validations: ["⚠️ No exponer credenciales en producción"]
  },
  "Debug Stock Client": {
    steps: ["🔍 Verificar datos de stock", "🧪 Probar queries de stock", "✅ Debug de sincronización"],
    technical: ["🔧 Solo desarrollo - Testing de queries de stock"],
    validations: ["⚠️ No modificar datos reales"]
  },
  "Debug Table Structure": {
    steps: ["🔍 Ver estructura de tablas", "🧪 Verificar columnas y tipos", "✅ Debug de schema"],
    technical: ["🔧 Solo desarrollo - Introspección de database schema"],
    validations: ["⚠️ Solo lectura - no modificar estructura"]
  },
  "Debug Vehicle Data": {
    steps: ["🔍 Verificar datos de vehículos", "🧪 Probar integridad de datos", "✅ Debug de inconsistencias"],
    technical: ["🔧 Solo desarrollo - Validación de datos de vehículos"],
    validations: ["⚠️ No modificar datos sin autorización"]
  },
  "Debug VAPID Keys": {
    steps: ["🔍 Verificar claves VAPID", "🧪 Probar push notifications", "✅ Debug de configuración push"],
    technical: ["🔧 Solo desarrollo - Testing de Web Push"],
    validations: ["⚠️ No exponer claves privadas"]
  },
  "Debug User Lookup": {
    steps: ["🔍 Buscar usuarios", "🧪 Verificar datos de usuarios", "✅ Debug de auth"],
    technical: ["🔧 Solo desarrollo - Búsqueda de usuarios"],
    validations: ["⚠️ No exponer datos sensibles"]
  },
  "Debug Notifications": {
    steps: ["🔍 Probar sistema de notificaciones", "🧪 Enviar notificaciones de prueba", "✅ Verificar entrega"],
    technical: ["🔧 Solo desarrollo - Testing de notificaciones"],
    validations: ["⚠️ No enviar a usuarios reales"]
  },
  "Debug Push Processor": {
    steps: ["🔍 Verificar procesador de push", "🧪 Probar envío de push", "✅ Debug de queue"],
    technical: ["🔧 Solo desarrollo - Testing de push queue"],
    validations: ["⚠️ No sobrecargar con tests masivos"]
  },
  "Debug Subscriptions": {
    steps: ["🔍 Ver todas las suscripciones", "🧪 Verificar estado", "✅ Debug de suscripciones"],
    technical: ["🔧 Solo desarrollo - Listado de suscripciones push"],
    validations: ["⚠️ No modificar suscripciones reales"]
  },
  "Debug Subscription Creation": {
    steps: ["🔍 Probar creación de suscripciones", "🧪 Verificar proceso", "✅ Debug de registro"],
    technical: ["🔧 Solo desarrollo - Testing de creación"],
    validations: ["⚠️ Limpiar suscripciones de prueba"]
  },
  "Debug Sales Dashboard": {
    steps: ["🔍 Verificar dashboard de ventas", "🧪 Probar cálculos", "✅ Debug de métricas"],
    technical: ["🔧 Solo desarrollo - Testing de agregaciones"],
    validations: ["⚠️ Usar datos de prueba"]
  },
  "Debug Test": {
    steps: ["🔍 Pruebas generales del sistema", "🧪 Testing de funcionalidades", "✅ Debug general"],
    technical: ["🔧 Solo desarrollo - Sandbox de pruebas"],
    validations: ["⚠️ No afectar datos de producción"]
  },
  "Test Auth": {
    steps: ["🔍 Probar autenticación", "🧪 Login/logout/refresh", "✅ Verificar flujo completo"],
    technical: ["🔧 Testing de Supabase Auth flows"],
    validations: ["⚠️ Usar usuarios de prueba"]
  },
  "Test SMTP": {
    steps: ["🔍 Probar envío de emails", "🧪 Templates y destinatarios", "✅ Verificar entrega"],
    technical: ["🔧 Testing de Nodemailer"],
    validations: ["⚠️ No enviar a clientes reales"]
  },
  "Test Notifications": {
    steps: ["🔍 Probar notificaciones", "🧪 Push, email, in-app", "✅ Verificar todos los tipos"],
    technical: ["🔧 Testing de sistema de notificaciones completo"],
    validations: ["⚠️ No spam a usuarios reales"]
  },
  "Test Photo Assignment": {
    steps: ["🔍 Probar asignación de fotos", "🧪 Algoritmo automático", "✅ Verificar distribución"],
    technical: ["🔧 Testing de asignación automática de fotógrafos"],
    validations: ["⚠️ Usar datos de prueba"]
  },
  "Diagnostico Fotos": {
    steps: ["🔍 Diagnóstico del sistema de fotos", "🧪 Verificar estados", "✅ Identificar problemas"],
    technical: ["🔧 Debug de sistema fotográfico"],
    validations: ["⚠️ Solo lectura para diagnóstico"]
  },
  "Diagnostico Asignación": {
    steps: ["🔍 Diagnóstico de asignaciones", "🧪 Verificar algoritmo", "✅ Identificar errores"],
    technical: ["🔧 Debug de asignación de fotógrafos"],
    validations: ["⚠️ No modificar asignaciones reales"]
  },
  "Test Fotos": {
    steps: ["🔍 Pruebas del sistema de fotos", "🧪 Upload, delete, update", "✅ Verificar funcionalidad"],
    technical: ["🔧 Testing de CRUD de fotos"],
    validations: ["⚠️ Limpiar fotos de prueba"]
  },
  "Debug Recogidas": {
    steps: ["🔍 Debug del sistema de recogidas", "🧪 Verificar flujo completo", "✅ Identificar problemas"],
    technical: ["🔧 Debug de recogidas"],
    validations: ["⚠️ Usar datos de prueba"]
  },
  "Debug Entregas": {
    steps: ["🔍 Debug del sistema de entregas", "🧪 Verificar workflow", "✅ Identificar errores"],
    technical: ["🔧 Debug de entregas y triggers"],
    validations: ["⚠️ No crear entregas falsas"]
  },
  "Debug Email Preview": {
    steps: ["🔍 Preview de templates de email", "🧪 Ver renderizado", "✅ Verificar variables"],
    technical: ["🔧 Testing de email templates"],
    validations: ["⚠️ No enviar, solo preview"]
  },
  "PDF Debug": {
    steps: ["🔍 Debug de procesamiento de PDFs", "🧪 Probar OCR", "✅ Verificar extracción"],
    technical: ["🔧 Testing de Tesseract OCR"],
    validations: ["⚠️ Usar PDFs de prueba"]
  },
  "Test Save PDF": {
    steps: ["🔍 Probar guardado de PDFs", "🧪 Storage y metadata", "✅ Verificar integridad"],
    technical: ["🔧 Testing de Supabase Storage para PDFs"],
    validations: ["⚠️ Limpiar archivos de prueba"]
  },
  "Debug Coordenadas": {
    steps: ["🔍 Debug de coordenadas en mapas", "🧪 Probar geolocalización", "✅ Verificar precisión"],
    technical: ["🔧 Testing de mapeo de coordenadas"],
    validations: ["⚠️ Usar ubicaciones de prueba"]
  },
  "Validación Debug": {
    steps: ["🔍 Debug del sistema de validaciones", "🧪 Probar reglas", "✅ Verificar cumplimiento"],
    technical: ["🔧 Testing de validaciones de negocio"],
    validations: ["⚠️ No saltarse validaciones en producción"]
  },
  "Test Map": {
    steps: ["🔍 Probar funcionalidad de mapas", "🧪 Renderizado y markers", "✅ Verificar interacción"],
    technical: ["🔧 Testing de componentes de mapa"],
    validations: ["⚠️ Verificar API keys de mapas"]
  },
  "Images Gallery": {
    steps: ["🔍 Galería de imágenes de prueba", "🧪 Testing de visualización", "✅ Verificar carga"],
    technical: ["🔧 Testing de galería de imágenes"],
    validations: ["⚠️ Optimizar imágenes antes de subir"]
  },
  "Demo SVG Mapper": {
    steps: ["🔍 Demo de mapeo SVG", "🧪 Probar coordenadas en SVG", "✅ Verificar precisión"],
    technical: ["🔧 Demo de sistema de mapeo de daños"],
    validations: ["⚠️ Solo para demostración"]
  },
  "Debug Add Column": {
    steps: ["🔧 Herramienta para agregar columnas a tablas", "🧪 Testing de migraciones"],
    technical: ["⚠️ Solo desarrollo - No usar en producción"],
    validations: ["❌ Puede romper la estructura de datos"]
  },
  "Notifications Debug": {
    steps: ["🔔 Debug avanzado de notificaciones", "🧪 Testing de envío"],
    technical: ["🔧 Herramienta de troubleshooting"],
    validations: ["⚠️ No enviar a usuarios reales"]
  },
  "Notifications Fix": {
    steps: ["🔧 Reparar problemas de notificaciones", "🧪 Fix de bugs"],
    technical: ["🔧 Utilidad de mantenimiento"],
    validations: ["⚠️ Hacer backup antes de usar"]
  },
  "Notifications Simple": {
    steps: ["📨 Test de notificaciones simples", "✅ Verificar entrega"],
    technical: ["🔧 Testing básico de notificaciones"],
    validations: ["⚠️ Solo para pruebas"]
  },
  "Test Sales Layout": {
    steps: ["🎨 Probar layout de ventas", "🧪 Testing de UI"],
    technical: ["🔧 Testing de componentes visuales"],
    validations: ["✅ No afecta datos reales"]
  },
  "Test PDF Extract": {
    steps: ["📄 Probar extracción de PDFs", "🔍 Testing OCR"],
    technical: ["🔧 Testing de Tesseract"],
    validations: ["⚠️ Usar PDFs de prueba"]
  },
  "Test Email Docuware": {
    steps: ["📧 Test de emails Docuware", "✅ Verificar integración"],
    technical: ["🔧 Testing de integración externa"],
    validations: ["⚠️ No enviar a clientes"]
  },
  "Test Email Realizado": {
    steps: ["📧 Test de email realizado", "✅ Verificar template"],
    technical: ["🔧 Testing de templates"],
    validations: ["⚠️ Solo emails de prueba"]
  },
  "Test Entrega En Mano": {
    steps: ["🤝 Test de entrega en mano", "✅ Verificar workflow"],
    technical: ["🔧 Testing de proceso especial"],
    validations: ["⚠️ Usar datos de prueba"]
  },
  "Test New Sale": {
    steps: ["💰 Test de nueva venta", "✅ Verificar notificaciones"],
    technical: ["🔧 Testing de notificaciones de venta"],
    validations: ["⚠️ No crear ventas reales"]
  },
  "Test Failed Sale": {
    steps: ["❌ Test de venta fallida", "✅ Verificar manejo de errores"],
    technical: ["🔧 Testing de error handling"],
    validations: ["⚠️ Casos de error controlados"]
  },
  "Test Vehicle Certification": {
    steps: ["📋 Test de certificación", "✅ Verificar workflow"],
    technical: ["🔧 Testing de proceso de certificación"],
    validations: ["⚠️ Datos de prueba"]
  },
  "Force Activate Push": {
    steps: ["🔔 Forzar activación de push", "⚠️ Bypass de validaciones"],
    technical: ["🔧 Solo para troubleshooting"],
    validations: ["❌ Solo usar si normal falla"]
  },
  // FASE 9: DASHBOARD Y PÁGINAS ESPECIALES
  "Dashboard": {
    steps: [
      "📊 **Panel Principal:** Vista general del estado del negocio.",
      "🚗 **Stock:** Total de vehículos, disponibles, vendidos.",
      "💰 **Ventas:** Ventas del mes, ingresos, tendencias.",
      "📸 **Fotos:** Estado del sistema fotográfico.",
      "⏱️ **Taller:** Promedio de días en taller, saturación.",
      "📈 **KPIs:** Métricas clave del negocio en tiempo real."
    ],
    technical: [
      "💻 **Consultas:** Múltiples `createClientComponentClient()` para diferentes agregaciones",
      "📊 **Patrón:** Dashboard complejo + Múltiples componentes + Real-time",
      "📈 **Componentes:** Cards, Charts, Rankings, Activity Feed",
      "🔄 **Real-time:** Se actualiza automáticamente con Supabase Realtime"
    ],
    validations: [
      "✅ Optimizar queries para carga rápida",
      "🔍 Cachear datos que no cambian frecuentemente",
      "📊 Mostrar indicadores de carga para datos pesados",
      "🎨 Diseño claro y profesional - primera impresión del sistema"
    ]
  },
  "Mapa de Flujo": {
    steps: [
      "🗺️ **Manual de Instrucciones:** Esta página - Documentación completa del sistema.",
      "📊 **Estadísticas:** Tablas, triggers, páginas, API routes.",
      "🔍 **Explorador:** Navegación por todas las páginas del sistema.",
      "📋 **Explicaciones:** Flujo de datos, validaciones, patrones técnicos.",
      "⚡ **Diagramas:** Visualización del flujo de datos entre componentes."
    ],
    technical: [
      "💻 **Consultas:** Ninguna - documentación estática",
      "📊 **Patrón:** Página de documentación + Diagramas Mermaid.js",
      "🗺️ **Mermaid:** Renderizado de diagramas de flujo",
      "🎨 **Explorador:** Sidebar navegable con estructura completa"
    ],
    validations: [
      "✅ Mantener actualizada con cambios del sistema",
      "🔍 Verificar que todos los diagramas renderizan correctamente",
      "📊 Actualizar estadísticas cuando se agregan tablas/triggers",
      "📝 Documentar nuevas páginas inmediatamente al crearlas"
    ]
  },
  "Búsqueda Global": {
    steps: [
      "🔍 **Búsqueda Universal:** Buscar en vehículos, clientes, ventas, etc.",
      "⚡ **Rápida:** Resultados en tiempo real mientras escribe.",
      "📊 **Categorías:** Resultados agrupados por tipo.",
      "🔗 **Navegación:** Click para ir directamente al registro.",
      "📱 **Responsive:** Funciona en modal compacto en móvil."
    ],
    technical: [
      "💻 **Consultas:** Múltiples `createClientComponentClient()` en paralelo",
      "🔧 **Search:** Búsqueda full-text en múltiples tablas",
      "📊 **Patrón:** Componente global + Modal + Debounce + Múltiples queries",
      "⚡ **Performance:** Debounce, límite de resultados, índices en DB"
    ],
    validations: [
      "✅ Implementar debounce para no sobrecargar",
      "🔍 Limitar resultados para mejor performance",
      "📊 Usar índices en columnas buscadas",
      "⚡ Mostrar indicador de carga durante búsqueda"
    ]
  },
  "Chat AI": {
    steps: [
      "💬 **Chat con IA:** Asistente virtual para consultas del sistema.",
      "🤖 **OpenAI:** Integración con GPT para respuestas inteligentes.",
      "📊 **Contexto:** IA tiene acceso a datos del sistema.",
      "🔍 **Consultas:** Puede buscar información en la base de datos.",
      "💾 **Historial:** Guarda conversaciones para referencia."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` según necesite la IA",
      "🔧 **API:** `/api/chat` para comunicación con OpenAI",
      "📊 **Patrón:** Chat UI + Streaming + OpenAI API + Function calling",
      "🤖 **Functions:** IA puede ejecutar funciones para consultar datos"
    ],
    validations: [
      "❌ NO exponer datos sensibles a la IA sin permisos",
      "⚠️ NO permitir a la IA modificar datos",
      "✅ Validar respuestas de la IA antes de mostrar",
      "🔍 Monitorear costes de API de OpenAI"
    ]
  },
  "Notificaciones (Centro)": {
    steps: [
      "🔔 **Centro de Notificaciones:** Lista todas las notificaciones del usuario.",
      "📊 **Tipos:** Ventas, entregas, asignaciones, alertas.",
      "✅ **Leídas/No leídas:** Marcar como leído.",
      "🗑️ **Eliminar:** Limpiar notificaciones antiguas.",
      "⚙️ **Preferencias:** Link a configuración de notificaciones."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de notificaciones del usuario",
      "🔧 **Mutaciones:** `/api/notifications/mark-read` para UPDATE",
      "📊 **Patrón:** Lista de notificaciones + Real-time + API Routes",
      "🔔 **Real-time:** Se actualizan en tiempo real con Supabase Realtime"
    ],
    validations: [
      "✅ Mostrar notificaciones más recientes primero",
      "🔍 Agrupar notificaciones similares",
      "📊 Auto-marcar como leído al hacer click",
      "🗑️ Auto-eliminar notificaciones muy antiguas"
    ]
  },
  // PÁGINAS ADICIONALES IMPORTANTES
  "Pedidos Validados": {
    steps: [
      "✅ **Vehículos Validados:** Lista de vehículos con CyP y 360 completos.",
      "📋 **Listo para Vender:** Vehículos que cumplen todos los requisitos.",
      "📊 **Estado:** Validado, en venta, vendido.",
      "🔍 **Filtros:** Por marca, modelo, precio, ubicación.",
      "💰 **Disponibilidad:** Solo vehículos listos para entrega inmediata."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de pedidos_validados",
      "📊 **Patrón:** Tabla filtrada + Solo lectura",
      "✅ **Validación:** WHERE cyp_completo = true AND 360_completo = true",
      "🔄 **Fuente:** Se alimenta automáticamente desde stock validado"
    ],
    validations: [
      "✅ Solo vehículos con documentación completa",
      "🔍 Verificar estado antes de mostrar al cliente",
      "📊 Actualizar automáticamente cuando se validan nuevos",
      "💰 Usar esta vista para ventas rápidas"
    ]
  },
  "Añadir Nueva Entrada": {
    steps: [
      "📝 **Formulario Manual:** Crear entrada nueva sin esperar a DUC.",
      "🚗 **Datos Vehículo:** Matrícula, marca, modelo, etc.",
      "📅 **Fecha Entrada:** Cuándo se espera el vehículo.",
      "👤 **Responsable:** Quién recepciona el vehículo.",
      "✅ **Crear:** Se crea en nuevas_entradas para tracking."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para validaciones",
      "🔧 **Mutaciones:** `/api/nuevas-entradas/crear` para INSERT",
      "📊 **Patrón:** Formulario + Validaciones + API Route",
      "🔄 **Alternativa:** Permite entrada manual si DUC no tiene el vehículo"
    ],
    validations: [
      "❌ NO duplicar vehículos que ya están en DUC",
      "⚠️ NO crear sin verificar que el vehículo llegará",
      "✅ Verificar que la matrícula no existe en el sistema",
      "🔍 Confirmar datos con proveedor antes de crear"
    ]
  },
  "Estadísticas Recogidas": {
    steps: [
      "📊 **Métricas de Recogidas:** KPIs del proceso de recogida.",
      "📈 **Tendencias:** Evolución en el tiempo.",
      "👤 **Por Responsable:** Performance individual.",
      "💰 **Costes:** Análisis de costes de recogida.",
      "📥 **Exportar:** Reporte completo."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con agregaciones",
      "📊 **Patrón:** Dashboard de estadísticas + Gráficos",
      "📈 **Análisis:** Tasa de éxito, tiempos, costes",
      "🎨 **Visualización:** Charts de tendencias y comparativas"
    ],
    validations: [
      "✅ Revisar regularmente para optimizar proceso",
      "🔍 Analizar causas de cancelaciones",
      "📊 Usar para planificación de recursos",
      "💰 Optimizar rutas para reducir costes"
    ]
  },
  "Estadísticas Recogidas": {
    steps: [
      "📊 **KPIs Recogidas:** Métricas operacionales.",
      "📈 **Performance:** Tasa de éxito, tiempos promedio.",
      "💰 **Eficiencia:** Costes vs. beneficios.",
      "👤 **Rankings:** Mejores responsables de recogida.",
      "📅 **Histórico:** Tendencias a largo plazo."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con agregaciones complejas",
      "📊 **Patrón:** Dashboard analítico + KPIs + Ranking",
      "📈 **Métricas:** Múltiples agregaciones y cálculos",
      "🎨 **Charts:** Líneas, barras, tortas según métrica"
    ],
    validations: [
      "✅ Actualizar datos regularmente",
      "🔍 Identificar oportunidades de mejora",
      "📊 Benchmarking contra objetivos",
      "💰 Análisis coste-beneficio periódico"
    ]
  },
  "Configuración Recogidas": {
    steps: [
      "⚙️ **Config de Recogidas:** Parámetros del sistema de recogidas.",
      "📍 **Zonas:** Definir zonas de recogida y costes.",
      "⏱️ **SLAs:** Tiempos máximos de respuesta.",
      "👥 **Asignación:** Reglas de asignación automática.",
      "✅ **Guardar:** Aplicar configuración al sistema."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de config",
      "🔧 **Mutaciones:** `/api/recogidas/config` para UPDATE",
      "📊 **Patrón:** Formulario de configuración + Validaciones",
      "⚙️ **Afecta:** Cálculos de costes y asignación automática"
    ],
    validations: [
      "❌ NO modificar sin considerar impacto operacional",
      "⚠️ NO establecer SLAs irrealistas",
      "✅ Probar con casos de prueba antes de aplicar",
      "🔍 Documentar cambios para el equipo"
    ]
  },
  "Estadísticas Incentivos": {
    steps: [
      "📊 **Métricas de Incentivos:** Performance del sistema de incentivos.",
      "💰 **Pagado vs. Proyectado:** Análisis de pagos.",
      "📈 **Efectividad:** Impacto en ventas.",
      "👤 **Por Vendedor:** Quién ha ganado más incentivos.",
      "📥 **Exportar:** Reporte de incentivos."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con cálculos complejos",
      "📊 **Patrón:** Dashboard financiero + Análisis de ROI",
      "💰 **Cálculos:** Suma de pagos, proyecciones, efectividad",
      "📈 **Visualización:** Charts de impacto en ventas"
    ],
    validations: [
      "✅ Validar cálculos con finanzas",
      "🔍 Analizar ROI de cada incentivo",
      "📊 Usar para diseñar futuros incentivos",
      "💰 Verificar presupuesto vs. gastado"
    ]
  },
  "Configuración Incentivos": {
    steps: [
      "⚙️ **Config de Incentivos:** Parámetros del sistema.",
      "💰 **Tipos:** Definir tipos de incentivos disponibles.",
      "📊 **Cálculos:** Fórmulas de cálculo automático.",
      "🔔 **Notificaciones:** Cuándo notificar logros.",
      "✅ **Guardar:** Aplicar configuración."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de config",
      "🔧 **Mutaciones:** `/api/incentivos/config` para UPDATE",
      "📊 **Patrón:** Sistema de configuración + Calculadora",
      "💰 **Impacto:** Afecta cálculos automáticos de incentivos"
    ],
    validations: [
      "❌ NO modificar fórmulas sin validación matemática",
      "⚠️ NO cambiar tipos activos sin migración de datos",
      "✅ Probar cálculos con datos históricos",
      "🔍 Documentar fórmulas claramente"
    ]
  },
  "Gestión de Vehículos": {
    steps: [
      "🚗 **Panel de Gestión:** Vista avanzada de todos los vehículos.",
      "📊 **Múltiples vistas:** Tabla, tarjetas, calendario.",
      "🔍 **Filtros Avanzados:** Filtros complejos y combinados.",
      "📈 **Analytics:** Análisis en tiempo real del inventario.",
      "⚡ **Acciones Masivas:** Operaciones en múltiples vehículos."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con joins complejos",
      "🔧 **Mutaciones:** `/api/vehicles/batch-update` para UPDATE masivo",
      "📊 **Patrón:** Panel avanzado + Múltiples vistas + Operaciones batch",
      "⚡ **Performance:** Paginación, virtual scroll, lazy loading"
    ],
    validations: [
      "❌ NO hacer operaciones masivas sin confirmación",
      "⚠️ NO aplicar cambios sin preview",
      "✅ Validar cada operación individualmente",
      "🔍 Permitir deshacer operaciones masivas"
    ]
  },
  "Detalle Vehículo": {
    steps: [
      "📄 **Vista Completa:** Toda la información del vehículo.",
      "📸 **Galería:** Todas las fotos del vehículo.",
      "📊 **Historial:** Timeline de todos los eventos.",
      "💰 **Financiero:** Costes, precio venta, margen.",
      "🔗 **Relaciones:** Ventas, entregas, incidencias asociadas."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT por ID con joins múltiples",
      "📊 **Patrón:** Vista detalle completa + Joins + Timeline",
      "🔧 **Joins:** stock + fotos + sales + entregas + incidencias + gastos",
      "📈 **Visualización:** Layout complejo con múltiples secciones"
    ],
    validations: [
      "✅ Mostrar información completa y organizada",
      "🔍 Timeline cronológico de eventos",
      "📊 Cálculos financieros precisos",
      "🔗 Links directos a registros relacionados"
    ]
  },
  "Movimientos": {
    steps: [
      "📋 **Historial de Movimientos:** Todos los movimientos del vehículo por matrícula.",
      "📍 **Ubicaciones:** Cambios de ubicación física.",
      "👤 **Responsables:** Quién autorizó cada movimiento.",
      "📅 **Timeline:** Vista cronológica completa.",
      "🔍 **Trazabilidad:** Sistema inmutable de auditoría."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT por matrícula",
      "📊 **Patrón:** Vista de historial + Timeline + Solo lectura",
      "🔒 **Inmutable:** Datos históricos no editables",
      "🔍 **Auditoría:** Para trazabilidad completa"
    ],
    validations: [
      "✅ Usar para encontrar vehículos",
      "🔍 Revisar en caso de problemas de ubicación",
      "📊 Análisis de patrones de movimiento",
      "🔒 Sistema inmutable - no modificar"
    ]
  },
  "Asignaciones": {
    steps: [
      "📸 **Todas las Asignaciones:** Vista completa de asignaciones fotográficas.",
      "👤 **Por Fotógrafo:** Desglose de carga de trabajo.",
      "📊 **Estado:** Pendiente, en proceso, completado.",
      "📅 **Calendario:** Vista de asignaciones por fecha.",
      "⚡ **Reasignar:** Cambiar asignaciones si es necesario."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` para SELECT de assignments",
      "🔧 **Mutaciones:** `/api/photos/reasignar` para UPDATE",
      "📊 **Patrón:** Vista múltiple (tabla + calendario) + Gestión",
      "🔄 **Real-time:** Actualiza en tiempo real al completar fotos"
    ],
    validations: [
      "❌ NO reasignar sin notificar al fotógrafo afectado",
      "⚠️ NO sobrecargar a un solo fotógrafo",
      "✅ Balancear carga equitativamente",
      "🔍 Considerar ubicación al reasignar"
    ]
  },
  "Estadísticas Vehículos": {
    steps: [
      "📊 **Métricas de Vehículos:** KPIs del inventario.",
      "🚗 **Por Tipo:** Coches vs. motos, BMW vs. MINI.",
      "📈 **Rotación:** Velocidad de venta por categoría.",
      "💰 **Valoración:** Valor del inventario por segmento.",
      "📥 **Exportar:** Reporte de inventario."
    ],
    technical: [
      "💻 **Consultas:** `createClientComponentClient()` con múltiples agregaciones",
      "📊 **Patrón:** Dashboard analítico + Segmentación",
      "📈 **Análisis:** Por marca, tipo, precio, antigüedad",
      "🎨 **Charts:** Múltiples visualizaciones comparativas"
    ],
    validations: [
      "✅ Actualizar valoración regularmente",
      "🔍 Identificar segmentos con rotación lenta",
      "📊 Usar para decisiones de compra",
      "💰 Ajustar pricing según análisis"
    ]
  },
  "Gestión (Vehiculos)": {
    steps: [
      "🚗 **Gestión Completa:** Panel de gestión de flota completo.",
      "📊 **Dashboard:** Métricas y KPIs generales.",
      "🔍 **Búsqueda Avanzada:** Múltiples criterios.",
      "⚡ **Acciones Rápidas:** Operaciones frecuentes.",
      "📈 **Analytics:** Análisis profundo del inventario."
    ],
    technical: [
      "💻 **Consultas:** Múltiples queries complejas en paralelo",
      "📊 **Patrón:** Dashboard super complejo + Múltiples componentes",
      "🔧 **Integración:** Combina funcionalidad de múltiples páginas",
      "⚡ **Performance:** Lazy loading, paginación, caching"
    ],
    validations: [
      "✅ Optimizar carga inicial",
      "🔍 Implementar búsqueda eficiente",
      "📊 Balance entre funcionalidad y performance",
      "🎨 UI intuitiva a pesar de la complejidad"
    ]
  }
}
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

            {/* Explicación detallada */}
            {pageExplanations[selectedPage.name] ? (
              <div className="space-y-4">
                {/* Flujo de Datos */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">📋 Flujo de Datos</h4>
                  <ul className="space-y-1 text-sm">
                    {pageExplanations[selectedPage.name].steps.map((step: string, idx: number) => (
                      <li key={idx} className="text-blue-800 dark:text-blue-200" dangerouslySetInnerHTML={{ __html: step }} />
                    ))}
                  </ul>
                </div>

                {/* Diagrama Individual */}
                {pageExplanations[selectedPage.name].diagram && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Network className="h-5 w-5 text-green-600" />
                        Diagrama de Flujo - {selectedPage.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mermaid-print-area">
                        <pre className="mermaid">
                          {pageExplanations[selectedPage.name].diagram}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Información Técnica */}
                {pageExplanations[selectedPage.name].technical && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">💻 Patrón Técnico (según GUIA_CONSTRUCCION_PAGINAS)</h4>
                    <ul className="space-y-1 text-sm">
                      {pageExplanations[selectedPage.name].technical.map((tech: string, idx: number) => (
                        <li key={idx} className="text-purple-800 dark:text-purple-200 font-mono text-xs" dangerouslySetInnerHTML={{ __html: tech }} />
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validaciones Importantes */}
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <h4 className="font-semibold mb-2 text-red-900 dark:text-red-100">⚠️ Validaciones Importantes - QUÉ NO HACER</h4>
                  <ul className="space-y-1 text-sm">
                    {pageExplanations[selectedPage.name].validations.map((validation: string, idx: number) => (
                      <li key={idx} className="text-red-800 dark:text-red-200" dangerouslySetInnerHTML={{ __html: validation }} />
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Próximamente:</strong> Explicación detallada del flujo de datos, validaciones importantes y diagramas individuales para esta página.
                </p>
              </div>
            )}
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

