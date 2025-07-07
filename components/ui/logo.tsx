import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ASSETS } from "@/lib/config"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
  linkTo?: string
  showFullName?: boolean
}

export function Logo({ size = "md", showText = true, className, linkTo, showFullName = false }: LogoProps) {
  // Tamaños para diferentes variantes del logo
  const sizes = {
    sm: { width: 48, height: 48, textClass: "text-sm" },
    md: { width: 64, height: 64, textClass: "text-base" },
    lg: { width: 96, height: 96, textClass: "text-xl" },
    xl: { width: 125, height: 125, textClass: "text-2xl" }, // Tamaño extra grande (30% más que lg)
  }

  // Asegurarse de que size sea uno de los valores esperados
  const validSize = size in sizes ? size : "md"

  const { width, height, textClass } = sizes[validSize as keyof typeof sizes]

  const logoContent = (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src={ASSETS?.LOGO || "/placeholder.svg"}
        alt="CVO Logo"
        width={128}
        height={47.36}
        className="object-contain"
        priority
      />
    </div>
  )

  if (linkTo) {
    return (
      <Link href={linkTo} className="hover:opacity-90 transition-opacity">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
