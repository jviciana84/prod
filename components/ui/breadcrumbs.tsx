"use client"

import { ChevronRight, Home, CircuitBoard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface BreadcrumbsProps {
  className?: string
  homeHref?: string
  showHome?: boolean
  items?: {
    label: string
    href?: string
  }[]
}

export function Breadcrumbs({
  className,
  homeHref = "/dashboard",
  showHome = true,
  items: propItems,
}: BreadcrumbsProps) {
  const pathname = usePathname()
  const [items, setItems] = useState(propItems || [])

  // Si no se proporcionan elementos, generarlos a partir de la ruta
  useEffect(() => {
    if (propItems) return

    const pathSegments = pathname
      .split("/")
      .filter(Boolean)
      .filter((segment) => segment !== "dashboard")

    const breadcrumbItems = pathSegments.map((segment, index) => {
      // Construir la URL para este segmento
      const href = `/dashboard/${pathSegments.slice(0, index + 1).join("/")}`

      // Formatear el segmento para mostrar (capitalizar, reemplazar guiones, etc.)
      let label = segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())

      // Manejar casos especiales
      if (segment.includes("[") && segment.includes("]")) {
        label = "Detalle"
      }

      return { label, href }
    })

    setItems(breadcrumbItems)
  }, [pathname, propItems])

  if (!items.length && !showHome) return null

  return (
    <nav
      className={cn(
        "flex items-center space-x-1 text-sm font-medium text-muted-foreground mb-4 overflow-x-auto pb-1 scrollbar-hide",
        className,
      )}
      aria-label="Breadcrumbs"
    >
      <ol className="flex items-center space-x-1">
        {showHome && (
          <li className="flex items-center relative group">
            <Link href={homeHref} className="flex items-center hover:text-primary transition-colors">
              <span className="sr-only">Inicio</span>
              <Home className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
              <div className="w-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-red-500 group-hover:w-full transition-all duration-300 absolute bottom-0 left-0"></div>
            </Link>
          </li>
        )}

        {items.map((item, index) => (
          <Fragment key={index}>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" aria-hidden="true" />
            </li>
            <li className="relative group">
              {item.href ? (
                <Link href={item.href} className="flex items-center hover:text-primary transition-colors">
                  {index === items.length - 1 && <CircuitBoard className="h-3.5 w-3.5 mr-1 text-blue-500" />}
                  <span>{item.label}</span>
                  <div className="w-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-red-500 group-hover:w-full transition-all duration-300 absolute bottom-0 left-0"></div>
                </Link>
              ) : (
                <span className="flex items-center">
                  {index === items.length - 1 && <CircuitBoard className="h-3.5 w-3.5 mr-1 text-blue-500" />}
                  {item.label}
                  <div className="w-full h-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-red-500 absolute bottom-0 left-0"></div>
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
