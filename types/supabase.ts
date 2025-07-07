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
