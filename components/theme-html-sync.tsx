"use client";
import { useThemeSync } from "@/hooks/use-theme-sync";

export default function ThemeHtmlSync() {
  // Usar el hook personalizado que maneja toda la sincronización
  useThemeSync();
  
  return null;
} 