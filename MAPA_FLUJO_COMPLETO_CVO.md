# 🗺️ MAPA DE FLUJO COMPLETO - SISTEMA CVO
**Diagramas visuales del flujo de datos entre tablas**

---

## 📊 DIAGRAMA 1: VISTA GENERAL DEL SISTEMA

```mermaid
flowchart TD
    %% NIVEL 0: FUENTES EXTERNAS
    DUC_WEB[🌐 DUC Web<br/>gestionbmw.motorflash.com]
    CMS_WEB[🌐 CMS Web<br/>cmsweb.cmsseguros.es]
    
    %% SCRAPERS
    SCRAPER_DUC[🤖 Scraper DUC<br/>Python cada 8h]
    SCRAPER_CMS[🤖 Scraper CMS<br/>Python cada 8h]
    
    %% TABLAS BRUTAS
    DUC_SCRAPER[(📊 duc_scraper<br/>79 vehículos)]
    GARANTIAS_MM[(📊 garantias_brutas_mm)]
    GARANTIAS_MMC[(📊 garantias_brutas_mmc)]
    
    %% ENTRADA MANUAL
    USUARIO[👤 Usuario CVO]
    NUEVAS_ENTRADAS[(📊 nuevas_entradas<br/>is_received=false)]
    
    %% TABLAS CENTRALES
    STOCK[(📊 STOCK<br/>Tabla Central<br/>168 vehículos)]
    FOTOS[(📊 fotos<br/>Estado pintura)]
    
    %% TABLAS OPERACIONALES
    SALES[(📊 sales_vehicles<br/>Ventas)]
    ENTREGAS[(📊 entregas)]
    INCENTIVOS[(📊 incentivos)]
    RECOGIDAS[(📊 recogidas_historial)]
    
    %% FLUJO SCRAPER DUC
    DUC_WEB -->|Descarga CSV| SCRAPER_DUC
    SCRAPER_DUC -->|INSERT| DUC_SCRAPER
    DUC_SCRAPER -.->|❌ NO CONECTA| STOCK
    
    %% FLUJO SCRAPER CMS
    CMS_WEB -->|Descarga Excel| SCRAPER_CMS
    SCRAPER_CMS -->|INSERT| GARANTIAS_MM
    SCRAPER_CMS -->|INSERT| GARANTIAS_MMC
    
    %% FLUJO ENTRADA MANUAL
    USUARIO -->|Crea entrada| NUEVAS_ENTRADAS
    NUEVAS_ENTRADAS -->|⚡ TRIGGER<br/>is_received=true| STOCK
    NUEVAS_ENTRADAS -->|⚡ TRIGGER<br/>is_received=true| FOTOS
    
    %% FLUJO CENTRAL
    STOCK -->|⚡ TRIGGER<br/>body_status| FOTOS
    STOCK <-->|FK + TRIGGER<br/>is_sold| SALES
    SALES --> ENTREGAS
    SALES --> INCENTIVOS
    
    %% FLUJO GARANTIAS
    GARANTIAS_MM -.->|⚡ TRIGGER<br/>match matrícula| INCENTIVOS
    GARANTIAS_MMC -.->|⚡ TRIGGER<br/>match matrícula| INCENTIVOS
    
    %% TABLA INDEPENDIENTE
    USUARIO -->|Solicita| RECOGIDAS
    
    %% ESTILOS
    classDef scraper fill:#ffd700,stroke:#333,stroke-width:2px
    classDef bruta fill:#ff9999,stroke:#333,stroke-width:2px
    classDef central fill:#90EE90,stroke:#333,stroke-width:3px
    classDef operacional fill:#87CEEB,stroke:#333,stroke-width:2px
    classDef aislada fill:#d3d3d3,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    
    class SCRAPER_DUC,SCRAPER_CMS scraper
    class DUC_SCRAPER,GARANTIAS_MM,GARANTIAS_MMC bruta
    class STOCK,FOTOS central
    class SALES,ENTREGAS,INCENTIVOS operacional
    class RECOGIDAS aislada
```

---

## 📊 DIAGRAMA 2: CASCADA VERTICAL - FLUJO PRINCIPAL

```mermaid
flowchart TB
    %% NIVEL 1
    USUARIO1[👤 Usuario crea vehículo]
    
    %% NIVEL 2
    NE[(nuevas_entradas<br/>is_received = FALSE)]
    
    %% NIVEL 3
    RECEPCION[🚚 Usuario marca RECIBIDO<br/>is_received = TRUE]
    
    %% NIVEL 4
    STOCK[(STOCK<br/>paint_status: pendiente<br/>body_status: pendiente<br/>mechanical_status: pendiente)]
    FOTOS[(fotos<br/>estado_pintura: pendiente)]
    
    %% NIVEL 5
    INSPECCION[🔍 Mecánico inspecciona]
    
    %% NIVEL 6
    STOCK2[(STOCK<br/>body_status: apto)]
    FOTOS2[(fotos<br/>estado_pintura: apto)]
    
    %% NIVEL 7
    FOTOGRAFIA[📷 Fotógrafo asignado]
    
    %% NIVEL 8
    FOTOS3[(fotos<br/>photos_completed: true)]
    
    %% NIVEL 9
    VENTA[💰 Asesor crea venta]
    
    %% NIVEL 10
    SALES[(sales_vehicles<br/>INSERT nueva venta)]
    
    %% NIVEL 11
    STOCK3[(STOCK<br/>is_sold: TRUE)]
    
    %% NIVEL 12
    ENTREGA[📦 Confirmar entrega]
    
    %% NIVEL 13
    ENTREGAS[(entregas<br/>confirmada: true)]
    
    %% NIVEL 14
    INCENTIVOS[(incentivos<br/>garantia: auto-calculada)]
    
    %% FLUJO
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
    
    %% ESTILOS
    classDef manual fill:#ffd700,stroke:#333,stroke-width:2px
    classDef tabla fill:#90EE90,stroke:#333,stroke-width:2px
    classDef trigger fill:#ff6b6b,stroke:#333,stroke-width:2px
    
    class USUARIO1,RECEPCION,INSPECCION,FOTOGRAFIA,VENTA,ENTREGA manual
    class NE,STOCK,FOTOS,STOCK2,FOTOS2,FOTOS3,SALES,STOCK3,ENTREGAS,INCENTIVOS tabla
```

---

## 📊 DIAGRAMA 3: PASO 1 - SCRAPER DUC (AISLADO)

```mermaid
flowchart LR
    %% INICIO
    DUC[🌐 DUC Web<br/>gestionbmw.motorflash.com<br/>79 vehículos publicados]
    
    %% SCRAPER
    SCRAPER[🤖 Scraper Python<br/>main.py<br/>Cada 8 horas]
    
    %% CSV
    CSV[📄 CSV Descargado<br/>stock_551_0_*.csv<br/>dist/data/duc/]
    
    %% PROCESO
    PANDAS[🐼 pandas.read_csv<br/>Limpieza de datos<br/>Mapeo de columnas]
    
    %% BASE DE DATOS
    DELETE[🗑️ DELETE ALL<br/>duc_scraper]
    INSERT[➕ INSERT nuevos<br/>79 registros]
    
    %% TABLA
    DUC_SCRAPER[(📊 duc_scraper<br/>79 vehículos<br/>~68 DISPONIBLE<br/>~10 RESERVADO<br/>~1 VENDIDO)]
    
    %% PROBLEMA
    STOCK[(📊 stock<br/>168 vehículos)]
    NOCONEXION[❌ NO HAY CONEXIÓN<br/>❌ NO HAY TRIGGER<br/>❌ TABLA AISLADA]
    
    %% FLUJO
    DUC -->|Selenium<br/>Login + Download| SCRAPER
    SCRAPER --> CSV
    CSV --> PANDAS
    PANDAS --> DELETE
    DELETE --> INSERT
    INSERT --> DUC_SCRAPER
    DUC_SCRAPER -.->|NO ALIMENTA| NOCONEXION
    NOCONEXION -.-> STOCK
    
    %% ESTILOS
    classDef external fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef process fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef tabla fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef problema fill:#ffcdd2,stroke:#c62828,stroke-width:3px
    
    class DUC external
    class SCRAPER,PANDAS,DELETE,INSERT process
    class CSV,DUC_SCRAPER,STOCK tabla
    class NOCONEXION problema
```

---

## 📊 DIAGRAMA 4: PASO 2 - NUEVAS ENTRADAS → STOCK + FOTOS

```mermaid
flowchart TB
    %% USUARIO
    USUARIO[👤 Usuario en<br/>/dashboard/nuevas-entradas]
    
    %% FORMULARIO
    FORM[📝 Formulario<br/>license_plate: 1234ABC<br/>model: BMW 320d<br/>purchase_date<br/>expense_type_id]
    
    %% API
    API1[🔌 API POST<br/>/api/transport/create]
    
    %% TABLA INICIAL
    NE1[(📊 nuevas_entradas<br/>is_received: FALSE<br/>status: pendiente)]
    
    %% ESPERA
    ESPERA[⏳ Vehículo llega<br/>físicamente]
    
    %% MARCA RECIBIDO
    USUARIO2[👤 Usuario marca<br/>RECIBIDO]
    
    %% API UPDATE
    API2[🔌 API POST<br/>/api/transport/update<br/>is_received: TRUE]
    
    %% TABLA ACTUALIZADA
    NE2[(📊 nuevas_entradas<br/>is_received: TRUE ✅)]
    
    %% TRIGGERS
    TRIGGER1[⚡ TRIGGER<br/>nuevas_entradas_to_stock]
    TRIGGER2[⚡ TRIGGER<br/>handle_vehicle_received]
    
    %% RESULTADOS
    STOCK[(📊 STOCK<br/>license_plate: 1234ABC<br/>paint_status: pendiente<br/>body_status: pendiente<br/>mechanical_status: pendiente<br/>reception_date: NOW)]
    
    FOTOS[(📊 fotos<br/>license_plate: 1234ABC<br/>estado_pintura: pendiente<br/>disponible: NOW)]
    
    %% FLUJO
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
    
    %% ESTILOS
    classDef user fill:#ffd54f,stroke:#f57f17,stroke-width:2px
    classDef api fill:#81d4fa,stroke:#0277bd,stroke-width:2px
    classDef tabla fill:#a5d6a7,stroke:#2e7d32,stroke-width:2px
    classDef trigger fill:#ef5350,stroke:#c62828,stroke-width:3px
    
    class USUARIO,USUARIO2,ESPERA user
    class API1,API2,FORM api
    class NE1,NE2,STOCK,FOTOS tabla
    class TRIGGER1,TRIGGER2 trigger
```

---

## 📊 DIAGRAMA 5: RELACIONES HORIZONTALES (MISMO NIVEL)

```mermaid
flowchart LR
    %% TABLAS
    STOCK[(📊 STOCK<br/>body_status)]
    FOTOS[(📊 fotos<br/>estado_pintura)]
    
    SALES[(📊 sales_vehicles<br/>license_plate)]
    STOCK2[(📊 STOCK<br/>is_sold)]
    
    INCENTIVOS[(📊 incentivos<br/>garantia: NULL)]
    GARANTIAS[(📊 garantias_brutas_mm/mmc<br/>Prima Total)]
    
    %% SINCRONIZACIONES
    SYNC1[⚡ TRIGGER<br/>sync_body_status_to_paint_status<br/>Si body_status = apto<br/>→ estado_pintura = apto]
    
    SYNC2[⚡ TRIGGER<br/>sync_stock_on_sale_insert<br/>Si INSERT en sales<br/>→ is_sold = TRUE]
    
    SYNC3[⚡ TRIGGER<br/>update_garantia_incentivos<br/>Busca por matrícula<br/>→ garantia = Prima Total]
    
    %% FLUJOS
    STOCK <-->|Sincronización<br/>automática| SYNC1
    SYNC1 <--> FOTOS
    
    SALES <-->|FK: stock_id<br/>+ Trigger| SYNC2
    SYNC2 <--> STOCK2
    
    INCENTIVOS <-->|Match por<br/>matrícula| SYNC3
    SYNC3 <--> GARANTIAS
    
    %% ESTILOS
    classDef tabla fill:#b2dfdb,stroke:#00695c,stroke-width:2px
    classDef trigger fill:#ffab91,stroke:#d84315,stroke-width:2px
    
    class STOCK,FOTOS,SALES,STOCK2,INCENTIVOS,GARANTIAS tabla
    class SYNC1,SYNC2,SYNC3 trigger
```

---

## 📊 DIAGRAMA 6: TRIGGERS DEL SISTEMA

```mermaid
flowchart TD
    %% TÍTULO
    TITLE[🔥 TODOS LOS TRIGGERS ACTIVOS]
    
    %% TRIGGER 1
    T1[⚡ nuevas_entradas_to_stock<br/>WHEN: is_received = TRUE<br/>ACTION: INSERT INTO stock]
    
    %% TRIGGER 2
    T2[⚡ handle_vehicle_received<br/>WHEN: is_received = TRUE<br/>ACTION: INSERT INTO fotos]
    
    %% TRIGGER 3
    T3[⚡ sync_body_status_to_paint_status<br/>WHEN: body_status = apto<br/>ACTION: UPDATE fotos.estado_pintura]
    
    %% TRIGGER 4
    T4[⚡ sync_stock_on_sale_insert<br/>WHEN: INSERT en sales_vehicles<br/>ACTION: UPDATE stock.is_sold = TRUE]
    
    %% TRIGGER 5
    T5[⚡ sync_stock_on_sale_delete<br/>WHEN: DELETE en sales_vehicles<br/>ACTION: UPDATE stock.is_sold = FALSE]
    
    %% TRIGGER 6
    T6[⚡ sync_stock_on_sale_update<br/>WHEN: UPDATE license_plate en sales<br/>ACTION: UPDATE ambos stocks]
    
    %% TRIGGER 7
    T7[⚡ update_garantia_incentivos<br/>WHEN: INSERT en garantias_brutas<br/>ACTION: UPDATE incentivos.garantia]
    
    %% TRIGGER 8
    T8[⚡ update_garantia_incentivos<br/>WHEN: INSERT en incentivos<br/>ACTION: Buscar garantía + UPDATE]
    
    %% FLUJO
    TITLE --> T1
    TITLE --> T2
    TITLE --> T3
    TITLE --> T4
    TITLE --> T5
    TITLE --> T6
    TITLE --> T7
    TITLE --> T8
    
    %% TABLAS AFECTADAS
    T1 --> STOCK1[(stock)]
    T2 --> FOTOS1[(fotos)]
    T3 --> FOTOS2[(fotos)]
    T4 --> STOCK2[(stock)]
    T5 --> STOCK3[(stock)]
    T6 --> STOCK4[(stock)]
    T7 --> INC1[(incentivos)]
    T8 --> INC2[(incentivos)]
    
    %% ESTILOS
    classDef trigger fill:#ff7043,stroke:#bf360c,stroke-width:2px
    classDef tabla fill:#90caf9,stroke:#1565c0,stroke-width:2px
    
    class T1,T2,T3,T4,T5,T6,T7,T8 trigger
    class STOCK1,STOCK2,STOCK3,STOCK4,FOTOS1,FOTOS2,INC1,INC2 tabla
```

---

## 📊 DIAGRAMA 7: PROBLEMA - duc_scraper AISLADO

```mermaid
flowchart LR
    %% DUC SCRAPER
    DUC[(📊 duc_scraper<br/>79 vehículos<br/>~10 RESERVADOS)]
    
    %% PROBLEMA
    PROBLEMA[❌ PROBLEMA<br/>No hay trigger<br/>No hay sincronización<br/>Tabla aislada]
    
    %% STOCK
    STOCK[(📊 stock<br/>168 vehículos<br/>Esos 10 RESERVADOS<br/>no están marcados)]
    
    %% SOLUCIÓN NECESARIA
    SOLUCION[💡 SOLUCIÓN NECESARIA<br/>Crear trigger o script<br/>para sincronizar]
    
    %% FLUJO
    DUC -.->|NO CONECTA| PROBLEMA
    PROBLEMA -.-> STOCK
    PROBLEMA --> SOLUCION
    
    %% TRIGGER PROPUESTO
    TRIGGER[⚡ TRIGGER PROPUESTO<br/>sync_duc_to_stock<br/>IF Disponibilidad = RESERVADO<br/>THEN stock.is_sold = TRUE]
    
    SOLUCION --> TRIGGER
    TRIGGER --> STOCK
    
    %% ESTILOS
    classDef problema fill:#ef5350,stroke:#c62828,stroke-width:3px
    classDef solucion fill:#66bb6a,stroke:#2e7d32,stroke-width:3px
    classDef tabla fill:#90caf9,stroke:#1565c0,stroke-width:2px
    
    class PROBLEMA problema
    class SOLUCION,TRIGGER solucion
    class DUC,STOCK tabla
```

---

## 📊 DIAGRAMA 8: FLUJO COMPLETO DE UN VEHÍCULO

```mermaid
timeline
    title 🚗 Ciclo de Vida Completo de un Vehículo
    
    section Adquisición
        Compra del vehículo : Usuario crea entrada
        nuevas_entradas : is_received = FALSE
    
    section Recepción
        Llega físicamente : Usuario marca recibido
        TRIGGER activa : stock + fotos creados
        Estados: pendiente
    
    section Inspección
        Mecánico inspecciona : Actualiza estados
        body_status = apto : TRIGGER → fotos
        Asigna centro : work_center + OR
    
    section Fotografía
        Asigna fotógrafo : photographer_id
        Completa fotos : photos_completed = true
        Listo para venta
    
    section Venta
        Asesor crea venta : sales_vehicles INSERT
        TRIGGER activa : stock.is_sold = TRUE
        Aparece en DUC : Disponibilidad = RESERVADO
    
    section Entrega
        Agenda entrega : entregas INSERT
        Confirma entrega : confirmada = true
        Cliente recibe
    
    section Incentivos
        Calcula incentivos : incentivos INSERT
        TRIGGER busca : garantias_brutas
        Auto-calcula : garantia + margen
```

---

## 🎯 LEYENDA DE DIAGRAMAS

### Símbolos Usados:

```
🌐 = Web externa (DUC, CMS)
🤖 = Scraper automatizado
👤 = Usuario del sistema
📊 = Tabla en Supabase
⚡ = Trigger automático
🔌 = API Route
📝 = Formulario
🔍 = Proceso de inspección
📷 = Fotografía
💰 = Venta
📦 = Entrega
❌ = Problema/No conexión
💡 = Solución propuesta
✅ = Confirmado/Correcto
```

### Tipos de Líneas:

```
───>  = Flujo directo (INSERT, UPDATE)
-..-> = No hay conexión (problema)
<---> = Sincronización bidireccional
═══>  = Trigger automático
```

### Colores:

```
🟡 Amarillo = Acción manual del usuario
🔵 Azul     = Tabla de base de datos
🔴 Rojo     = Trigger automático
🟢 Verde    = Tabla central (stock, fotos)
⚪ Gris     = Tabla aislada (duc_scraper)
🟠 Naranja  = Proceso/Scraper
```

---

## 📱 CÓMO VISUALIZAR ESTOS DIAGRAMAS

### Opción 1: GitHub
- Sube este archivo a GitHub
- GitHub renderiza Mermaid automáticamente

### Opción 2: Visual Studio Code
- Instala extensión: "Markdown Preview Mermaid Support"
- Abre este archivo
- Preview (Ctrl+Shift+V)

### Opción 3: Online
- https://mermaid.live/
- Copia el código del diagrama
- Visualiza en tiempo real

### Opción 4: Obsidian
- Abre este archivo en Obsidian
- Obsidian soporta Mermaid nativamente

---

**Creado:** 21 de octubre de 2025  
**Tipo:** Mapas visuales del flujo de datos  
**Diagramas:** 8 diagramas Mermaid interactivos


