'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FeedbackButtonsProps {
  messageId: string
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void
  className?: string
}

export function FeedbackButtons({ messageId, onFeedback, className = '' }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type)
    onFeedback?.(messageId, type)
  }

  return (
    <div className={`flex gap-1 ${className}`}>
      <Button
        onClick={() => handleFeedback('positive')}
        variant="ghost"
        size="sm"
        className={`h-5 w-5 p-0 transition-all duration-200 hover:bg-green-500/20 hover:scale-110 ${
          feedback === 'positive' 
            ? 'bg-green-500/30 text-green-400 scale-110' 
            : 'text-white/50 hover:text-green-400 hover:bg-green-500/10'
        }`}
      >
        <ThumbsUp className={`h-3 w-3 transition-all duration-200 ${
          feedback === 'positive' ? 'drop-shadow-lg' : ''
        }`} />
      </Button>
      
      <Button
        onClick={() => handleFeedback('negative')}
        variant="ghost"
        size="sm"
        className={`h-5 w-5 p-0 transition-all duration-200 hover:bg-red-500/20 hover:scale-110 ${
          feedback === 'negative' 
            ? 'bg-red-500/30 text-red-400 scale-110' 
            : 'text-white/50 hover:text-red-400 hover:bg-red-500/10'
        }`}
      >
        <ThumbsDown className={`h-3 w-3 transition-all duration-200 ${
          feedback === 'negative' ? 'drop-shadow-lg' : ''
        }`} />
      </Button>
    </div>
  )
}
