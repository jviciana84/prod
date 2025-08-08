"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  CarFrontIcon,
  ShoppingCart,
  BarChart,
  Settings,
  ChevronDown,
  ChevronRight,
  Camera,
  ImageIcon,
  MessageSquare,
  Key,
  FileCheck,
  PackageOpen,
  AlertTriangle,
  Trophy,
  ArrowRightLeft,
  Bell,
  TestTube,
  Stethoscope,
  Target,
  Mail,
  Car,
  Truck,
  Headphones,
  Database,
  Tag,
} from "lucide-react"
import { AddCarIcon, CarFrontDoubleIcon } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useSidebar } from "@/components/ui/sidebar"
import { useState } from "react"

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  title: string
  isActive: boolean
}

function SidebarItem({ href, icon, title, isActive }: SidebarItemProps) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent whitespace-nowrap",
        isActive ? "bmw-sidebar-active text-accent-foreground" : "text-muted-foreground hover:text-accent-foreground",
      )}
    >
      {icon}
      <span className="truncate">{title}</span>
    </a>
  )
}

interface SidebarGroupProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function SidebarGroup({ title, icon, children, defaultOpen = false }: SidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex w-full items-center justify-between px-3 py-2 text-sm font-medium whitespace-nowrap",
            "bmw-m-hover-border",
          )}
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="truncate">{title}</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 pl-6">{children}</CollapsibleContent>
    </Collapsible>
  )
}

interface MobileSidebarProps {
  roles: string[]
}

export default function MobileSidebar({ roles }: MobileSidebarProps) {
  const pathname = usePathname()
  const isAdmin = roles.includes("admin")
  const { openMobile, setOpenMobile, isMobile } = useSidebar()

  // Solo renderizar en móvil
  if (!isMobile) {
    return null
  }

  const sidebarContent = (
    <nav className="flex flex-col gap-2 p-4">
      <SidebarItem
        href="/dashboard"
        icon={<LayoutDashboard className="h-5 w-5" />}
        title="Dashboard"
        isActive={pathname === "/dashboard"}
      />

      {isAdmin && (
        <SidebarGroup
          title="Administración"
          icon={<Settings className="h-5 w-5" />}
          defaultOpen={pathname.startsWith("/dashboard/admin")}
        >
          <SidebarItem
            href="/dashboard/admin/users"
            icon={<Users className="h-5 w-5" />}
            title="Usuarios"
            isActive={pathname === "/dashboard/admin/users"}
          />
          <SidebarItem
            href="/dashboard/admin/avatares"
            icon={<ImageIcon className="h-5 w-5" />}
            title="Avatares"
            isActive={pathname === "/dashboard/admin/avatares"}
          />
          <SidebarItem
            href="/dashboard/admin/notifications"
            icon={<Bell className="h-5 w-5" />}
            title="Notificaciones"
            isActive={pathname === "/dashboard/admin/notifications"}
          />
          <SidebarItem
            href="/dashboard/admin/carga-masiva"
            icon={<FileCheck className="h-5 w-5" />}
            title="Carga Masiva"
            isActive={pathname === "/dashboard/admin/carga-masiva"}
          />
          <SidebarItem
            href="/dashboard/admin/blob-files"
            icon={<PackageOpen className="h-5 w-5" />}
            title="Archivos Blob"
            isActive={pathname === "/dashboard/admin/blob-files"}
          />
          <SidebarItem
            href="/dashboard/admin/configuracion"
            icon={<Settings className="h-5 w-5" />}
            title="Configuración Sistema"
            isActive={pathname === "/dashboard/admin/configuracion"}
          />
          <SidebarItem
            href="/dashboard/admin/objetivos"
            icon={<Target className="h-5 w-5" />}
            title="Objetivos"
            isActive={pathname === "/dashboard/admin/objetivos"}
          />
          <SidebarItem
            href="/dashboard/admin/email-config"
            icon={<Mail className="h-5 w-5" />}
            title="Configuración Email"
            isActive={pathname === "/dashboard/admin/email-config"}
          />
          <SidebarItem
            href="/dashboard/columnas"
            icon={<Database className="h-5 w-5" />}
            title="Gestión de Columnas"
            isActive={pathname === "/dashboard/columnas"}
          />
          <SidebarItem
            href="/dashboard/admin/user-mappings"
            icon={<Users className="h-5 w-5" />}
            title="Mapeo de Usuarios"
            isActive={pathname === "/dashboard/admin/user-mappings"}
          />
        </SidebarGroup>
      )}

      <SidebarItem
        href="/dashboard/vehicles"
        icon={<CarFrontDoubleIcon className="h-5 w-5" />}
        title="Vehículos"
        isActive={pathname === "/dashboard/vehicles"}
      />

      <SidebarItem
        href="/dashboard/llaves"
        icon={<Key className="h-5 w-5" />}
        title="Llaves y Documentos"
        isActive={pathname === "/dashboard/llaves"}
      />

      <SidebarItem
        href="/dashboard/nuevas-entradas"
        icon={<AddCarIcon className="h-5 w-5" />}
        title="Nuevas Entradas"
        isActive={pathname.startsWith("/dashboard/nuevas-entradas")}
      />

      <SidebarItem
        href="/dashboard/photos"
        icon={<Camera className="h-5 w-5" />}
        title="Fotografías"
        isActive={pathname.startsWith("/dashboard/photos")}
      />

      <SidebarItem
        href="/dashboard/ventas"
        icon={<ShoppingCart className="h-5 w-5" />}
        title="Gestión ventas"
        isActive={pathname.startsWith("/dashboard/ventas") || pathname.startsWith("/dashboard/sales")}
      />

      <SidebarItem
        href="/dashboard/validados"
        icon={<FileCheck className="h-5 w-5" />}
        title="Pedidos Validados"
        isActive={pathname === "/dashboard/validados"}
      />

      <SidebarItem
        href="/dashboard/entregas"
        icon={<PackageOpen className="h-5 w-5" />}
        title="Entregas"
        isActive={pathname === "/dashboard/entregas"}
      />

      <SidebarItem
        href="/dashboard/recogidas"
        icon={<Truck className="h-5 w-5" />}
        title="Solicitar Recogida"
        isActive={pathname === "/dashboard/recogidas"}
      />

      <SidebarItem
        href="/dashboard/entregas/informes"
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Incidencias"
        isActive={pathname === "/dashboard/entregas/informes"}
      />

      <SidebarItem
        href="/dashboard/incentivos"
        icon={<Trophy className="h-5 w-5" />}
        title="Incentivos"
        isActive={pathname === "/dashboard/incentivos"}
      />

      <SidebarItem
        href="/dashboard/extornos"
        icon={<ArrowRightLeft className="h-5 w-5" />}
        title="Extornos"
        isActive={pathname === "/dashboard/extornos"}
      />

      {(roles.includes("admin") || roles.includes("Director") || roles.includes("Supervisor")) && (
        <SidebarItem
          href="/dashboard/reports"
          icon={<BarChart className="h-5 w-5" />}
          title="Informes"
          isActive={pathname === "/dashboard/reports"}
        />
      )}

      <SidebarItem
        href="/dashboard/admin/soporte"
        icon={<Headphones className="h-5 w-5" />}
        title="Soporte (Tickets)"
        isActive={pathname === "/dashboard/admin/soporte"}
      />
    </nav>
  )

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent
        side="left"
        className="w-[280px] bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Menú de Navegación</SheetTitle>
        </SheetHeader>
        <div className="flex h-full w-full flex-col">
          {sidebarContent}
        </div>
      </SheetContent>
    </Sheet>
  )
} 