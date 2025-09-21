'use client'

import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatMinimizedProps {
  isVisible: boolean
  onMaximize: () => void
  messageCount?: number
}

export function ChatMinimized({ isVisible, onMaximize, messageCount = 0 }: ChatMinimizedProps) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 right-6 z-[10001]"
    >
      <Button
        onClick={onMaximize}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden"
      >
        <img
          src="https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/avatar-1758381451579.png"
          alt="Edelweiss"
          className="w-full h-full object-cover rounded-full"
        />
        {messageCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {messageCount}
          </div>
        )}
      </Button>
    </motion.div>
  )
}
