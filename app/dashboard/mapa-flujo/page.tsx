"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Map, Network, GitBranch, Zap, AlertCircle, Battery, CheckCircle2, Key, AlertTriangle, MessageSquare, Printer } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export default function MapaFlujoPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [mermaidLoaded, setMermaidLoaded] = useState(false)

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
              <h1 className="text-3xl font-bold tracking-tight">Mapa de Flujo del Sistema</h1>
              <p className="text-muted-foreground">
                Diagramas visuales del flujo de datos entre tablas
              </p>
            </div>
          </div>
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir Diagrama
          </Button>
        </div>
      </div>

      {/* Leyenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            Leyenda
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded border border-gray-700"></div>
            <span>Scraper/Usuario</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-300 rounded border border-gray-700"></div>
            <span>Tabla bruta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-300 rounded border border-gray-700"></div>
            <span>Tabla central</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-sky-300 rounded border border-gray-700"></div>
            <span>Tabla operacional</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">→</span>
            <span>Flujo directo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">- - -→</span>
            <span>No conectado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">⚡</span>
            <span>Trigger automático</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">❌</span>
            <span>Problema</span>
          </div>
        </CardContent>
      </Card>

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
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Total de tablas en el sistema: 40+ | <a href="/LISTADO_COMPLETO_TABLAS_CVO.md" target="_blank" className="text-blue-600 hover:underline">Ver listado completo</a>
          </div>
        </div>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-600" />
                Vista General del Sistema
              </CardTitle>
              <CardDescription>
                Todas las tablas y cómo se conectan entre sí
              </CardDescription>
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

    </div>
  )
}

