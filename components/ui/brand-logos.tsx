import Image from "next/image"

export function BMWLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <Image
        src="https://img.icons8.com/ios/24/bmw.png"
        alt="BMW"
        width={24}
        height={24}
        className="dark:invert dark:brightness-0 dark:contrast-100"
      />
    </div>
  )
}

export function MINILogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <Image
        src="https://img.icons8.com/external-tal-revivo-light-tal-revivo/24/external-mini-cooper-a-british-automotive-marque-owned-by-bmw-range-of-small-cars-automotive-light-tal-revivo.png"
        alt="MINI"
        width={24}
        height={24}
        className="dark:invert dark:brightness-0 dark:contrast-100"
      />
    </div>
  )
}

export function PodiumIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="1" y="14" width="6" height="8" rx="1" />
      <rect x="9" y="10" width="6" height="12" rx="1" />
      <rect x="17" y="16" width="6" height="6" rx="1" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="12" cy="8" r="1.5" />
      <circle cx="20" cy="14" r="1.5" />
    </svg>
  )
}

export function LaurelIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M5 12c0-3 2-5 4-6 1-0.5 2-0.5 3 0 2 1 4 3 4 6 0 3-2 5-4 6-1 0.5-2 0.5-3 0-2-1-4-3-4-6z" />
      <path d="M19 12c0-3-2-5-4-6-1-0.5-2-0.5-3 0-2 1-4 3-4 6 0 3 2 5 4 6 1 0.5 2 0.5 3 0 2-1 4-3 4-6z" />
    </svg>
  )
}

export function RacingFlagsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <Image
        src="https://img.icons8.com/comic/100/finish-flag.png"
        alt="Bandera de meta"
        width={24}
        height={24}
        className="w-full h-full object-contain"
      />
    </div>
  )
}

export function TargetIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2 L12 6" />
      <path d="M12 18 L12 22" />
      <path d="M2 12 L6 12" />
      <path d="M18 12 L22 12" />
      {/* Dardo */}
      <path d="M8 8 L12 12 L16 8" fill="currentColor" />
      <path d="M12 12 L12 16" strokeWidth="3" />
    </svg>
  )
}

export function SalesTargetIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12l2 2 4-4" />
      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9" />
      <path d="M16 8l-8 8" />
      <path d="M17.5 6.5L19 5" />
      <path d="M22 2l-3 3" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
