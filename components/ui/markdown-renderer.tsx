"use client"

import React from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  // Función para procesar el markdown básico
  const processMarkdown = (text: string) => {
    // Procesar enlaces [texto](url)
    let processed = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
    
    // Procesar negritas **texto**
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Procesar saltos de línea dobles como párrafos
    processed = processed.replace(/\n\n/g, '</p><p>')
    
    // Procesar saltos de línea simples como <br>
    processed = processed.replace(/\n/g, '<br>')
    
    // Envolver en párrafo si no está ya envuelto
    if (!processed.startsWith('<p>')) {
      processed = `<p>${processed}</p>`
    }
    
    return processed
  }

  const htmlContent = processMarkdown(content)

  return (
    <div 
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        lineHeight: '1.4',
        wordBreak: 'break-word'
      }}
    />
  )
}
