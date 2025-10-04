'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Phone, Mail, ExternalLink, Calculator } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SmartContentDetectorProps {
  content: string
  className?: string
}

export function SmartContentDetector({ content, className = '' }: SmartContentDetectorProps) {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())

  // Detectar fórmulas de Excel (comienzan con = y contienen funciones)
  const detectExcelFormulas = (text: string): Array<{match: string, start: number, end: number}> => {
    const excelPattern = /(=[A-Z]+\d*\([^)]*\)|=\w+\s*[\+\-\*\/]\s*\w+|=\w+\s*[<>]=?\s*\w+)/gi
    const matches = []
    let match
    
    while ((match = excelPattern.exec(text)) !== null) {
      matches.push({
        match: match[1],
        start: match.index,
        end: match.index + match[1].length
      })
    }
    return matches
  }

  // Detectar teléfonos (formato español)
  const detectPhones = (text: string): Array<{match: string, start: number, end: number}> => {
    const phonePattern = /(\+?34\s?)?[6-9]\d{2}\s?\d{3}\s?\d{3}|[6-9]\d{2}\s?\d{3}\s?\d{3}/g
    const matches = []
    let match
    
    while ((match = phonePattern.exec(text)) !== null) {
      matches.push({
        match: match[1] || match[0],
        start: match.index,
        end: match.index + (match[1] || match[0]).length
      })
    }
    return matches
  }

  // Detectar emails
  const detectEmails = (text: string): Array<{match: string, start: number, end: number}> => {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const matches = []
    let match
    
    while ((match = emailPattern.exec(text)) !== null) {
      matches.push({
        match: match[0],
        start: match.index,
        end: match.index + match[0].length
      })
    }
    return matches
  }

  // Detectar URLs
  const detectUrls = (text: string): Array<{match: string, start: number, end: number}> => {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/g
    const matches = []
    let match
    
    while ((match = urlPattern.exec(text)) !== null) {
      matches.push({
        match: match[1],
        start: match.index,
        end: match.index + match[1].length
      })
    }
    return matches
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItems(prev => new Set([...prev, text]))
      toast({
        title: "Copiado",
        description: `${type} copiado al portapapeles`,
        duration: 2000
      })
      
      // Remover del estado después de 2 segundos
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(text)
          return newSet
        })
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive"
      })
    }
  }

  const makeCall = (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '')
    window.open(`tel:${cleanPhone}`, '_self')
  }

  const sendEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self')
  }

  const openUrl = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    window.open(fullUrl, '_blank')
  }

  // Procesar el contenido y crear elementos interactivos
  const processContent = () => {
    const formulas = detectExcelFormulas(content)
    const phones = detectPhones(content)
    const emails = detectEmails(content)
    const urls = detectUrls(content)

    // Combinar todos los elementos detectados
    const allElements = [
      ...formulas.map(f => ({ ...f, type: 'formula' as const })),
      ...phones.map(p => ({ ...p, type: 'phone' as const })),
      ...emails.map(e => ({ ...e, type: 'email' as const })),
      ...urls.map(u => ({ ...u, type: 'url' as const }))
    ].sort((a, b) => a.start - b.start)

    if (allElements.length === 0) {
      return <span>{content}</span>
    }

    const elements = []
    let lastIndex = 0

    allElements.forEach((element, index) => {
      // Agregar texto antes del elemento
      if (element.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {content.slice(lastIndex, element.start)}
          </span>
        )
      }

      // Crear el elemento interactivo
      const isCopied = copiedItems.has(element.match)
      
      elements.push(
        <span key={`element-${index}`} className="inline-flex items-center gap-1 mx-1">
          <span className="font-mono bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded text-sm">
            {element.match}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(element.match, getTypeLabel(element.type))}
              title={`Copiar ${getTypeLabel(element.type)}`}
            >
              <Copy className={`h-3 w-3 ${isCopied ? 'text-green-600' : ''}`} />
            </Button>
            
            {element.type === 'formula' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(element.match, 'fórmula de Excel')}
                title="Copiar fórmula"
              >
                <Calculator className="h-3 w-3" />
              </Button>
            )}
            
            {element.type === 'phone' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => makeCall(element.match)}
                title="Llamar"
              >
                <Phone className="h-3 w-3" />
              </Button>
            )}
            
            {element.type === 'email' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => sendEmail(element.match)}
                title="Enviar email"
              >
                <Mail className="h-3 w-3" />
              </Button>
            )}
            
            {element.type === 'url' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => openUrl(element.match)}
                title="Abrir enlace"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </span>
      )

      lastIndex = element.end
    })

    // Agregar texto restante
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end">
          {content.slice(lastIndex)}
        </span>
      )
    }

    return <span className={className}>{elements}</span>
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'formula': return 'fórmula'
      case 'phone': return 'teléfono'
      case 'email': return 'email'
      case 'url': return 'enlace'
      default: return 'contenido'
    }
  }

  return processContent()
}
