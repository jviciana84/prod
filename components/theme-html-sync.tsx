"use client";
import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function ThemeHtmlSync() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      html.classList.remove("light", "dark", "ocre");
      // resolvedTheme es más fiable si enableSystem está activo
      const active = resolvedTheme || theme;
      if (active) html.classList.add(active);
    }
  }, [theme, resolvedTheme]);

  return null;
} 