"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props} defaultTheme="dark" themes={["light", "dark", "ocre"]}>
      {children}
    </NextThemesProvider>
  )
}
