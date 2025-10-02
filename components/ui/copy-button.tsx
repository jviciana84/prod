'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  return (
    <Button
      onClick={handleCopy}
      variant="ghost"
      size="sm"
      className={`h-5 w-5 p-0 transition-all duration-200 hover:bg-blue-500/20 hover:scale-110 ${
        copied 
          ? 'bg-green-500/30 text-green-400 scale-110' 
          : 'text-white/50 hover:text-blue-400 hover:bg-blue-500/10'
      } ${className}`}
    >
      {copied ? (
        <Check className="h-3 w-3 drop-shadow-lg transition-all duration-200" />
      ) : (
        <Copy className="h-3 w-3 transition-all duration-200" />
      )}
    </Button>
  )
}
