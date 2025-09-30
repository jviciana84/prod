"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
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
  Scan,
} from "lucide-react"
import { AddCarIcon, CarFrontDoubleIcon } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollIndicator } from "@/components/ui/scroll-indicator"

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  title: string
  isActive: boolean
  isExpanded: boolean
}

function SidebarItem({ href, icon, title, isActive, isExpanded }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent whitespace-nowrap",
        isActive ? "bmw-sidebar-active text-accent-foreground" : "text-muted-foreground hover:text-accent-foreground",
        !isExpanded && "justify-center px-0",
      )}
    >
      {icon}
      {isExpanded && <span className="truncate">{title}</span>}
    </Link>
  )
}

interface SidebarGroupProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  isExpanded: boolean
}

function SidebarGroup({ title, icon, children, defaultOpen = false, isExpanded }: SidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex w-full items-center justify-between px-3 py-2 text-sm font-medium whitespace-nowrap",
            !isExpanded && "justify-center px-0",
            "bmw-m-hover-border",
          )}
        >
          <div className={cn("flex items-center gap-3", !isExpanded && "justify-center")}>
            {icon}
            {isExpanded && <span className="truncate">{title}</span>}
          </div>
          {isExpanded && (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("pt-1", isExpanded ? "pl-6" : "pl-0")}>{children}</CollapsibleContent>
    </Collapsible>
  )
}

interface DashboardSidebarProps {
  roles: string[]
}

export default function DashboardSidebar({ roles }: DashboardSidebarProps) {
  const pathname = usePathname()
  const isAdmin = roles.includes("admin")
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <aside
      className={cn(
        "dashboard-sidebar transition-all duration-300 ease-in-out relative",
        isExpanded ? "expanded" : "",
      )}
      style={{
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className={cn("flex flex-col gap-2 p-4 overflow-y-auto", !isExpanded && "items-center")}>
        <SidebarItem
          href="/dashboard"
          icon={<LayoutDashboard className="h-5 w-5" />}
          title="Dashboard"
          isActive={pathname === "/dashboard"}
          isExpanded={isExpanded}
        />

        {isAdmin && (
          <SidebarGroup
            title="Administración"
            icon={<Settings className="h-5 w-5" />}
            defaultOpen={pathname.startsWith("/dashboard/admin")}
            isExpanded={isExpanded}
          >
            <SidebarItem
              href="/dashboard/admin/users"
              icon={<Users className="h-5 w-5" />}
              title="Usuarios"
              isActive={pathname === "/dashboard/admin/users"}
              isExpanded={isExpanded}
            />
            <SidebarItem
              href="/dashboard/admin/avatares"
              icon={<ImageIcon className="h-5 w-5" />}
              title="Avatares"
              isActive={pathname === "/dashboard/admin/avatares"}
              isExpanded={isExpanded}
            />
            <SidebarItem
              href="/dashboard/admin/notifications"
              icon={<Bell className="h-5 w-5" />}
              title="Notificaciones"
              isActive={pathname === "/dashboard/admin/notifications"}
              isExpanded={isExpanded}
            />
            <SidebarItem
              href="/dashboard/admin/carga-masiva"
              icon={<FileCheck className="h-5 w-5" />}
              title="Carga Masiva"
              isActive={pathname === "/dashboard/admin/carga-masiva"}
              isExpanded={isExpanded}
            />
            <SidebarItem
              href="/dashboard/admin/blob-files"
              icon={<PackageOpen className="h-5 w-5" />}
              title="Archivos Blob"
              isActive={pathname === "/dashboard/admin/blob-files"}
              isExpanded={isExpanded}
            />
            <SidebarItem
              href="/dashboard/admin/configuracion"
              icon={<Settings className="h-5 w-5" />}
              title="Configuración Sistema"
              isActive={pathname === "/dashboard/admin/configuracion"}
              isExpanded={isExpanded}
            />
            <SidebarItem
              href="/dashboard/admin/objetivos"
              icon={<Target className="h-5 w-5" />}
              title="Objetivos"
              isActive={pathname === "/dashboard/admin/objetivos"}
              isExpanded={isExpanded}
            />
            <SidebarItem
              href="/dashboard/admin/email-config"
              icon={<Mail className="h-5 w-5" />}
              title="Configuración Email"
              isActive={pathname === "/dashboard/admin/email-config"}
              isExpanded={isExpanded}
            />
            <SidebarItem
              href="/dashboard/columnas"
              icon={<Database className="h-5 w-5" />}
              title="Gestión de Columnas"
              isActive={pathname === "/dashboard/columnas"}
              isExpanded={isExpanded}
            />
            <SidebarItem
              href="/dashboard/admin/column-mapping"
              icon={<Database className="h-5 w-5" />}
              title="Mapeo de Columnas DUC"
              isActive={pathname === "/dashboard/admin/column-mapping"}
              isExpanded={isExpanded}
            />
            <SidebarItem
              href="/dashboard/filter-config"
              icon={<Database className="h-5 w-5" />}
              title="Configuración de Filtros"
              isActive={pathname === "/dashboard/filter-config"}
              isExpanded={isExpanded}
            />
            <SidebarGroup
              title="Diagnósticos"
              icon={<Stethoscope className="h-5 w-5" />}
              defaultOpen={pathname.startsWith("/dashboard/admin/diagnosticos")}
              isExpanded={isExpanded}
            >
              <SidebarItem
                href="/dashboard/admin/diagnosticos"
                icon={<TestTube className="h-5 w-5" />}
                title="Panel General"
                isActive={pathname === "/dashboard/admin/diagnosticos"}
                isExpanded={isExpanded}
              />
              <SidebarItem
                href="/dashboard/admin/diagnosticos/notificaciones"
                icon={<Bell className="h-5 w-5" />}
                title="Notificaciones"
                isActive={pathname === "/dashboard/admin/diagnosticos/notificaciones"}
                isExpanded={isExpanded}
              />
              <SidebarItem
                href="/dashboard/photos/diagnostico"
                icon={<Camera className="h-5 w-5" />}
                title="Fotografías"
                isActive={pathname === "/dashboard/photos/diagnostico"}
                isExpanded={isExpanded}
              />
              <SidebarItem
                href="/dashboard/entregas/diagnostico"
                icon={<PackageOpen className="h-5 w-5" />}
                title="Entregas"
                isActive={pathname === "/dashboard/entregas/diagnostico"}
                isExpanded={isExpanded}
              />
              <SidebarItem
                href="/dashboard/llaves/diagnostico-incidencias"
                icon={<Key className="h-5 w-5" />}
                title="Llaves/Incidencias"
                isActive={pathname === "/dashboard/llaves/diagnostico-incidencias"}
                isExpanded={isExpanded}
              />
            </SidebarGroup>
            {roles.some((role) => role === "admin" || role === "administrador" || role.includes("admin")) && (
              <SidebarItem
                href="/dashboard/admin/footer-messages"
                icon={<MessageSquare size={18} />}
                title="Mensajes Footer"
                isActive={pathname.includes("/dashboard/admin/footer-messages")}
                isExpanded={isExpanded}
              />
            )}
          </SidebarGroup>
        )}

        <SidebarItem
          href="/dashboard/vehicles"
          icon={<CarFrontDoubleIcon className="h-5 w-5" />}
          title="Vehículos"
          isActive={pathname === "/dashboard/vehicles"}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/dashboard/llaves"
          icon={<Key className="h-5 w-5" />}
          title="Llaves y Documentos"
          isActive={pathname === "/dashboard/llaves"}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/dashboard/nuevas-entradas"
          icon={<AddCarIcon className="h-5 w-5" />}
          title="Nuevas Entradas"
          isActive={pathname.startsWith("/dashboard/nuevas-entradas")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/dashboard/photos"
          icon={<Camera className="h-5 w-5" />}
          title="Fotografías"
          isActive={pathname.startsWith("/dashboard/photos")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/dashboard/ventas"
          icon={<ShoppingCart className="h-5 w-5" />}
          title="Gestión ventas"
          isActive={pathname.startsWith("/dashboard/ventas") || pathname.startsWith("/dashboard/sales")}
          isExpanded={isExpanded}
        />



        <SidebarItem
          href="/dashboard/validados"
          icon={<FileCheck className="h-5 w-5" />}
          title="Pedidos Validados"
          isActive={pathname === "/dashboard/validados"}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/dashboard/entregas"
          icon={<PackageOpen className="h-5 w-5" />}
          title="Entregas"
          isActive={pathname === "/dashboard/entregas"}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/dashboard/recogidas"
          icon={<Truck className="h-5 w-5" />}
          title="Solicitar Recogida"
          isActive={pathname === "/dashboard/recogidas"}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/dashboard/entregas/informes"
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Incidencias"
          isActive={pathname === "/dashboard/entregas/informes"}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/dashboard/incentivos"
          icon={<Trophy className="h-5 w-5" />}
          title="Incentivos"
          isActive={pathname === "/dashboard/incentivos"}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/dashboard/extornos"
          icon={<ArrowRightLeft className="h-5 w-5" />}
          title="Extornos"
          isActive={pathname === "/dashboard/extornos"}
          isExpanded={isExpanded}
        />

        {(roles.includes("admin") || roles.includes("Director") || roles.includes("Supervisor")) && (
          <SidebarItem
            href="/dashboard/reports"
            icon={<BarChart className="h-5 w-5" />}
            title="Informes"
            isActive={pathname === "/dashboard/reports"}
            isExpanded={isExpanded}
          />
        )}
        <SidebarItem
          href="/dashboard/admin/soporte"
          icon={<Headphones className="h-5 w-5" />}
          title="Soporte (Tickets)"
          isActive={pathname === "/dashboard/admin/soporte"}
          isExpanded={isExpanded}
        />
      </nav>
      <ScrollIndicator isExpanded={isExpanded} />
    </aside>
  )
}
