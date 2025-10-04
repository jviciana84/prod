'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface FeedbackButtonsProps {
  messageId: string
  conversationId?: string
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative', feedbackText?: string) => void
  className?: string
}

export function FeedbackButtons({ messageId, conversationId, onFeedback, className = '' }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
  const [showNegativeDialog, setShowNegativeDialog] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedback = async (type: 'positive' | 'negative') => {
    if (type === 'negative') {
      setShowNegativeDialog(true)
      return
    }

    // Feedback positivo - envío directo
    setFeedback(type)
    setIsSubmitting(true)
    
    try {
      await onFeedback?.(messageId, type)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNegativeFeedbackSubmit = async () => {
    setFeedback('negative')
    setIsSubmitting(true)
    
    try {
      await onFeedback?.(messageId, 'negative', feedbackText)
      setShowNegativeDialog(false)
      setFeedbackText('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNegativeFeedbackSubmit()
    }
  }

  return (
    <>
      <div className={`flex gap-1 ${className}`}>
        <Button
          onClick={() => handleFeedback('positive')}
          variant="ghost"
          size="sm"
          disabled={isSubmitting}
          className={`h-5 w-5 p-0 transition-all duration-200 hover:bg-green-500/20 hover:scale-110 ${
            feedback === 'positive' 
              ? 'bg-green-500/30 text-green-400 scale-110' 
              : 'text-white/50 hover:text-green-400 hover:bg-green-500/10'
          } ${isSubmitting ? 'opacity-50' : ''}`}
        >
          <ThumbsUp className={`h-3 w-3 transition-all duration-200 ${
            feedback === 'positive' ? 'drop-shadow-lg' : ''
          }`} />
        </Button>
        
        <Button
          onClick={() => handleFeedback('negative')}
          variant="ghost"
          size="sm"
          disabled={isSubmitting}
          className={`h-5 w-5 p-0 transition-all duration-200 hover:bg-red-500/20 hover:scale-110 ${
            feedback === 'negative' 
              ? 'bg-red-500/30 text-red-400 scale-110' 
              : 'text-white/50 hover:text-red-400 hover:bg-red-500/10'
          } ${isSubmitting ? 'opacity-50' : ''}`}
        >
          <ThumbsDown className={`h-3 w-3 transition-all duration-200 ${
            feedback === 'negative' ? 'drop-shadow-lg' : ''
          }`} />
        </Button>
      </div>

      {/* Diálogo compacto para feedback negativo */}
      {showNegativeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNegativeDialog(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              ¿Qué no te gustó de esta respuesta?
            </h3>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Cuéntanos qué podemos mejorar..."
              className="mb-3 min-h-[80px] resize-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNegativeDialog(false)
                  setFeedbackText('')
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleNegativeFeedbackSubmit}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                <Send className="h-4 w-4 mr-1" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
