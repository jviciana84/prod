export interface PageInfo {
  id: string
  path: string
  title: string
  icon: string
}

export interface UserPreferences {
  id: string
  user_id: string
  theme: "light" | "dark" | "system" | "ocre"
  main_page: PageInfo | null
  favorite_pages: PageInfo[]
  created_at: string
  updated_at: string
}

export interface UserPreferencesInput {
  theme?: "light" | "dark" | "system" | "ocre"
  main_page?: PageInfo | null
  favorite_pages?: PageInfo[]
}
