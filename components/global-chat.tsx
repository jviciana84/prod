"use client"

import { useChat } from "@/contexts/chat-context"
import { CompactChatWindow } from "@/components/ui/compact-chat-window"

export function GlobalChat() {
  const { isChatOpen, closeChat } = useChat()

  return (
    <CompactChatWindow 
      isOpen={isChatOpen} 
      onClose={closeChat} 
    />
  )
}
