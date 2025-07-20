export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      avatar_mappings: {
        Row: {
          blob_url: string
          created_at: string
          filename: string
          id: string
          local_path: string
        }
        Insert: {
          blob_url: string
          filename: string
          id?: string
          local_path: string
        }
        Update: {
          blob_url?: string
          filename?: string
          id?: string
          local_path?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alias: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          position: string | null
          updated_at: string
          welcome_email_sent: boolean | null
        }
        Insert: {
          alias?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          welcome_email_sent?: boolean | null
        }
        Update: {
          alias?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          welcome_email_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // NUEVA TABLA: incentivos
      incentivos: {
        Row: {
          id: number
          fecha_entrega: string | null
          matricula: string | null
          modelo: string | null
          asesor: string | null
          forma_pago: string | null // Nuevo campo
          precio_venta: number | null // Nuevo campo
          precio_compra: number | null // Nuevo campo
          dias_stock: number | null
          gastos_estructura: number | null // Nuevo campo
          garantia: number | null
          gastos_360: number | null
          antiguedad: boolean | null
          financiado: boolean | null
          otros: number | null
          importe_minimo: number | null
          margen: number | null
          importe_total: number | null
          tramitado: boolean | null
          otros_observaciones: string | null
          porcentaje_margen_config_usado: number | null
          or: string | null
          created_at: string // Asumiendo que existe
          updated_at: string // Asumiendo que existe
        }
        Insert: {
          fecha_entrega?: string | null
          matricula?: string | null
          modelo?: string | null
          asesor?: string | null
          forma_pago?: string | null
          precio_venta?: number | null
          precio_compra?: number | null
          dias_stock?: number | null
          gastos_estructura?: number | null
          garantia?: number | null
          gastos_360?: number | null
          antiguedad?: boolean | null
          financiado?: boolean | null
          otros?: number | null
          importe_minimo?: number | null
          margen?: number | null
          importe_total?: number | null
          tramitado?: boolean | null
          otros_observaciones?: string | null
          porcentaje_margen_config_usado?: number | null
          or?: string | null
          id?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          fecha_entrega?: string | null
          matricula?: string | null
          modelo?: string | null
          asesor?: string | null
          forma_pago?: string | null
          precio_venta?: number | null
          precio_compra?: number | null
          dias_stock?: number | null
          gastos_estructura?: number | null
          garantia?: number | null
          gastos_360?: number | null
          antiguedad?: boolean | null
          financiado?: boolean | null
          otros?: number | null
          importe_minimo?: number | null
          margen?: number | null
          importe_total?: number | null
          tramitado?: boolean | null
          otros_observaciones?: string | null
          porcentaje_margen_config_usado?: number | null
          or?: string | null
          id?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // NUEVA TABLA: sales_vehicles
      sales_vehicles: {
        Row: {
          id: number
          matricula: string
          payment_method: string | null
          price: number | null
          purchase_price: number | null
          created_at: string // Asumiendo que existe
          updated_at: string // Asumiendo que existe
          // Añade aquí cualquier otra columna relevante de tu tabla sales_vehicles
        }
        Insert: {
          matricula: string
          payment_method?: string | null
          price?: number | null
          purchase_price?: number | null
          id?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          matricula?: string
          payment_method?: string | null
          price?: number | null
          purchase_price?: number | null
          id?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // NUEVA TABLA: incentivos_config
      incentivos_config: {
        Row: {
          id: number
          gastos_estructura: number | null
          created_at: string // Asumiendo que existe
          updated_at: string // Asumiendo que existe
          // Añade aquí cualquier otra columna relevante de tu tabla incentivos_config
        }
        Insert: {
          gastos_estructura?: number | null
          id?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          gastos_estructura?: number | null
          id?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // NUEVA TABLA: filter_configs
      filter_configs: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          disponibilidad_filter: string[] | null
          marca_filter: string[] | null
          precio_min: number | null
          precio_max: number | null
          km_min: number | null
          km_max: number | null
          libre_siniestros: boolean | null
          concesionario_filter: string[] | null
          combustible_filter: string[] | null
          año_min: number | null
          año_max: number | null
          dias_stock_min: number | null
          dias_stock_max: number | null
          max_vehicles_per_batch: number
          auto_process: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          disponibilidad_filter?: string[] | null
          marca_filter?: string[] | null
          precio_min?: number | null
          precio_max?: number | null
          km_min?: number | null
          km_max?: number | null
          libre_siniestros?: boolean | null
          concesionario_filter?: string[] | null
          combustible_filter?: string[] | null
          año_min?: number | null
          año_max?: number | null
          dias_stock_min?: number | null
          dias_stock_max?: number | null
          max_vehicles_per_batch?: number
          auto_process?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          last_used_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          disponibilidad_filter?: string[] | null
          marca_filter?: string[] | null
          precio_min?: number | null
          precio_max?: number | null
          km_min?: number | null
          km_max?: number | null
          libre_siniestros?: boolean | null
          concesionario_filter?: string[] | null
          combustible_filter?: string[] | null
          año_min?: number | null
          año_max?: number | null
          dias_stock_min?: number | null
          dias_stock_max?: number | null
          max_vehicles_per_batch?: number
          auto_process?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          last_used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filter_configs_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // NUEVA TABLA: filter_processing_log
      filter_processing_log: {
        Row: {
          id: string
          filter_config_id: string | null
          total_vehicles_found: number
          vehicles_processed: number
          vehicles_added_to_nuevas_entradas: number
          vehicles_skipped: number
          errors_count: number
          status: string
          error_message: string | null
          processed_by: string | null
          started_at: string
          completed_at: string | null
          config_snapshot: Json | null
        }
        Insert: {
          id?: string
          filter_config_id?: string | null
          total_vehicles_found?: number
          vehicles_processed?: number
          vehicles_added_to_nuevas_entradas?: number
          vehicles_skipped?: number
          errors_count?: number
          status?: string
          error_message?: string | null
          processed_by?: string | null
          started_at?: string
          completed_at?: string | null
          config_snapshot?: Json | null
        }
        Update: {
          id?: string
          filter_config_id?: string | null
          total_vehicles_found?: number
          vehicles_processed?: number
          vehicles_added_to_nuevas_entradas?: number
          vehicles_skipped?: number
          errors_count?: number
          status?: string
          error_message?: string | null
          processed_by?: string | null
          started_at?: string
          completed_at?: string | null
          config_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "filter_processing_log_filter_config_id_fkey"
            columns: ["filter_config_id"]
            referencedRelation: "filter_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filter_processing_log_processed_by_fkey"
            columns: ["processed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // NUEVA TABLA: duc_scraper
      duc_scraper: {
        Row: {
          id: string
          "ID Anuncio": string | null
          "Anuncio": string | null
          "BPS / NEXT": string | null
          "Cambio": string | null
          "Certificado": string | null
          "Chasis": string | null
          "Color Carrocería": string | null
          "Color tapizado": string | null
          "Combustible": string | null
          "Concesionario": string | null
          "Creado con": string | null
          "Destino": string | null
          "Disponibilidad": string | null
          "Distintivo ambiental": string | null
          "Días creado": string | null
          "Días desde compra DMS": string | null
          "Días desde matriculación": string | null
          "Días publicado": string | null
          "e-code": string | null
          "El precio es": string | null
          "En uso": string | null
          "Fecha compra DMS": string | null
          "Fecha creación": string | null
          "Fecha disponibilidad": string | null
          "Fecha entrada VO": string | null
          "Fecha fabricación": string | null
          "Fecha modificación": string | null
          "Fecha primera matriculación": string | null
          "Fecha primera publicación": string | null
          "Garantía": string | null
          "KM": string | null
          "Libre de siniestros": string | null
          "Marca": string | null
          "Moneda": string | null
          "No completados": string | null
          "Nota interna": string | null
          "Observaciones": string | null
          "Origen": string | null
          "Origenes unificados": string | null
          "País origen": string | null
          "Potencia Cv": string | null
          "Precio": string | null
          "Precio compra": string | null
          "Precio cuota alquiler": string | null
          "Precio cuota renting": string | null
          "Precio estimado medio": string | null
          "Precio exportación": string | null
          "Precio financiado": string | null
          "Precio vehículo nuevo": string | null
          "Precio profesional": string | null
          "Proveedor": string | null
          "Referencia": string | null
          "Referencia interna": string | null
          "Regimen fiscal": string | null
          "Tienda": string | null
          "Tipo de distribución": string | null
          "Tipo motor": string | null
          "Trancha 1": string | null
          "Trancha 2": string | null
          "Trancha 3": string | null
          "Trancha 4": string | null
          "Trancha Combustible": string | null
          "Trancha YUC": string | null
          "Ubicación tienda": string | null
          "URL": string | null
          "URL foto 1": string | null
          "URL foto 2": string | null
          "URL foto 3": string | null
          "URL foto 4": string | null
          "URL foto 5": string | null
          "URL foto 6": string | null
          "URL foto 7": string | null
          "URL foto 8": string | null
          "URL foto 9": string | null
          "URL foto 10": string | null
          "URL foto 11": string | null
          "URL foto 12": string | null
          "URL foto 13": string | null
          "URL foto 14": string | null
          "URL foto 15": string | null
          "Válido para certificado": string | null
          "Valor existencia": string | null
          "Vehículo importado": string | null
          "Versión": string | null
          "Extras": string | null
          "BuNo": string | null
          "Código INT": string | null
          "Código fabricante": string | null
          "Equipamiento de serie": string | null
          "Estado": string | null
          "Carrocería": string | null
          "Días stock": string | null
          "Matrícula": string | null
          "Modelo": string | null
          file_name: string | null
          import_date: string | null
          last_seen_date: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          "ID Anuncio"?: string | null
          "Anuncio"?: string | null
          "BPS / NEXT"?: string | null
          "Cambio"?: string | null
          "Certificado"?: string | null
          "Chasis"?: string | null
          "Color Carrocería"?: string | null
          "Color tapizado"?: string | null
          "Combustible"?: string | null
          "Concesionario"?: string | null
          "Creado con"?: string | null
          "Destino"?: string | null
          "Disponibilidad"?: string | null
          "Distintivo ambiental"?: string | null
          "Días creado"?: string | null
          "Días desde compra DMS"?: string | null
          "Días desde matriculación"?: string | null
          "Días publicado"?: string | null
          "e-code"?: string | null
          "El precio es"?: string | null
          "En uso"?: string | null
          "Fecha compra DMS"?: string | null
          "Fecha creación"?: string | null
          "Fecha disponibilidad"?: string | null
          "Fecha entrada VO"?: string | null
          "Fecha fabricación"?: string | null
          "Fecha modificación"?: string | null
          "Fecha primera matriculación"?: string | null
          "Fecha primera publicación"?: string | null
          "Garantía"?: string | null
          "KM"?: string | null
          "Libre de siniestros"?: string | null
          "Marca"?: string | null
          "Moneda"?: string | null
          "No completados"?: string | null
          "Nota interna"?: string | null
          "Observaciones"?: string | null
          "Origen"?: string | null
          "Origenes unificados"?: string | null
          "País origen"?: string | null
          "Potencia Cv"?: string | null
          "Precio"?: string | null
          "Precio compra"?: string | null
          "Precio cuota alquiler"?: string | null
          "Precio cuota renting"?: string | null
          "Precio estimado medio"?: string | null
          "Precio exportación"?: string | null
          "Precio financiado"?: string | null
          "Precio vehículo nuevo"?: string | null
          "Precio profesional"?: string | null
          "Proveedor"?: string | null
          "Referencia"?: string | null
          "Referencia interna"?: string | null
          "Regimen fiscal"?: string | null
          "Tienda"?: string | null
          "Tipo de distribución"?: string | null
          "Tipo motor"?: string | null
          "Trancha 1"?: string | null
          "Trancha 2"?: string | null
          "Trancha 3"?: string | null
          "Trancha 4"?: string | null
          "Trancha Combustible"?: string | null
          "Trancha YUC"?: string | null
          "Ubicación tienda"?: string | null
          "URL"?: string | null
          "URL foto 1"?: string | null
          "URL foto 2"?: string | null
          "URL foto 3"?: string | null
          "URL foto 4"?: string | null
          "URL foto 5"?: string | null
          "URL foto 6"?: string | null
          "URL foto 7"?: string | null
          "URL foto 8"?: string | null
          "URL foto 9"?: string | null
          "URL foto 10"?: string | null
          "URL foto 11"?: string | null
          "URL foto 12"?: string | null
          "URL foto 13"?: string | null
          "URL foto 14"?: string | null
          "URL foto 15"?: string | null
          "Válido para certificado"?: string | null
          "Valor existencia"?: string | null
          "Vehículo importado"?: string | null
          "Versión"?: string | null
          "Extras"?: string | null
          "BuNo"?: string | null
          "Código INT"?: string | null
          "Código fabricante"?: string | null
          "Equipamiento de serie"?: string | null
          "Estado"?: string | null
          "Carrocería"?: string | null
          "Días stock"?: string | null
          "Matrícula"?: string | null
          "Modelo"?: string | null
          file_name?: string | null
          import_date?: string | null
          last_seen_date?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          "ID Anuncio"?: string | null
          "Anuncio"?: string | null
          "BPS / NEXT"?: string | null
          "Cambio"?: string | null
          "Certificado"?: string | null
          "Chasis"?: string | null
          "Color Carrocería"?: string | null
          "Color tapizado"?: string | null
          "Combustible"?: string | null
          "Concesionario"?: string | null
          "Creado con"?: string | null
          "Destino"?: string | null
          "Disponibilidad"?: string | null
          "Distintivo ambiental"?: string | null
          "Días creado"?: string | null
          "Días desde compra DMS"?: string | null
          "Días desde matriculación"?: string | null
          "Días publicado"?: string | null
          "e-code"?: string | null
          "El precio es"?: string | null
          "En uso"?: string | null
          "Fecha compra DMS"?: string | null
          "Fecha creación"?: string | null
          "Fecha disponibilidad"?: string | null
          "Fecha entrada VO"?: string | null
          "Fecha fabricación"?: string | null
          "Fecha modificación"?: string | null
          "Fecha primera matriculación"?: string | null
          "Fecha primera publicación"?: string | null
          "Garantía"?: string | null
          "KM"?: string | null
          "Libre de siniestros"?: string | null
          "Marca"?: string | null
          "Moneda"?: string | null
          "No completados"?: string | null
          "Nota interna"?: string | null
          "Observaciones"?: string | null
          "Origen"?: string | null
          "Origenes unificados"?: string | null
          "País origen"?: string | null
          "Potencia Cv"?: string | null
          "Precio"?: string | null
          "Precio compra"?: string | null
          "Precio cuota alquiler"?: string | null
          "Precio cuota renting"?: string | null
          "Precio estimado medio"?: string | null
          "Precio exportación"?: string | null
          "Precio financiado"?: string | null
          "Precio vehículo nuevo"?: string | null
          "Precio profesional"?: string | null
          "Proveedor"?: string | null
          "Referencia"?: string | null
          "Referencia interna"?: string | null
          "Regimen fiscal"?: string | null
          "Tienda"?: string | null
          "Tipo de distribución"?: string | null
          "Tipo motor"?: string | null
          "Trancha 1"?: string | null
          "Trancha 2"?: string | null
          "Trancha 3"?: string | null
          "Trancha 4"?: string | null
          "Trancha Combustible"?: string | null
          "Trancha YUC"?: string | null
          "Ubicación tienda"?: string | null
          "URL"?: string | null
          "URL foto 1"?: string | null
          "URL foto 2"?: string | null
          "URL foto 3"?: string | null
          "URL foto 4"?: string | null
          "URL foto 5"?: string | null
          "URL foto 6"?: string | null
          "URL foto 7"?: string | null
          "URL foto 8"?: string | null
          "URL foto 9"?: string | null
          "URL foto 10"?: string | null
          "URL foto 11"?: string | null
          "URL foto 12"?: string | null
          "URL foto 13"?: string | null
          "URL foto 14"?: string | null
          "URL foto 15"?: string | null
          "Válido para certificado"?: string | null
          "Valor existencia"?: string | null
          "Vehículo importado"?: string | null
          "Versión"?: string | null
          "Extras"?: string | null
          "BuNo"?: string | null
          "Código INT"?: string | null
          "Código fabricante"?: string | null
          "Equipamiento de serie"?: string | null
          "Estado"?: string | null
          "Carrocería"?: string | null
          "Días stock"?: string | null
          "Matrícula"?: string | null
          "Modelo"?: string | null
          file_name?: string | null
          import_date?: string | null
          last_seen_date?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      // NUEVA TABLA: column_mappings
      column_mappings: {
        Row: {
          id: string
          name: string
          duc_scraper_column: string
          nuevas_entradas_column: string
          is_active: boolean
          transformation_rule: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          duc_scraper_column: string
          nuevas_entradas_column: string
          is_active?: boolean
          transformation_rule?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          duc_scraper_column?: string
          nuevas_entradas_column?: string
          is_active?: boolean
          transformation_rule?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_mappings_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // NUEVA TABLA: nuevas_entradas
      nuevas_entradas: {
        Row: {
          id: string
          license_plate: string
          model: string
          origin_location_id: number | null
          expense_type_id: number | null
          purchase_date: string | null
          is_received: boolean | null
          reception_date: string | null
          expense_charge: string | null
          created_at: string
          updated_at: string | null
          purchase_price: number | null
          vehicle_type: string | null
          location_id: number | null
        }
        Insert: {
          id?: string
          license_plate: string
          model: string
          origin_location_id?: number | null
          expense_type_id?: number | null
          purchase_date?: string | null
          is_received?: boolean | null
          reception_date?: string | null
          expense_charge?: string | null
          created_at?: string
          updated_at?: string | null
          purchase_price?: number | null
          vehicle_type?: string | null
          location_id?: number | null
        }
        Update: {
          id?: string
          license_plate?: string
          model?: string
          origin_location_id?: number | null
          expense_type_id?: number | null
          purchase_date?: string | null
          is_received?: boolean | null
          reception_date?: string | null
          expense_charge?: string | null
          created_at?: string
          updated_at?: string | null
          purchase_price?: number | null
          vehicle_type?: string | null
          location_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nuevas_entradas_expense_type_id_fkey"
            columns: ["expense_type_id"]
            referencedRelation: "expense_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nuevas_entradas_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_permission_names: {
        Args: { user_id_param: string }
        Returns: string[]
      }
      get_user_role_names: {
        Args: { user_id_param: string }
        Returns: string[]
      }
      user_has_permission: {
        Args: { user_id_param: string; permission_name_param: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { user_id_param: string; role_name_param: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type Table<TableName extends keyof Database["public"]["Tables"] & string> =
  Database["public"]["Tables"][TableName]["Row"]
