"use client"

import { Bot } from "lucide-react"

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
        <Bot className="h-3 w-3 text-white" />
      </div>
      <div className="flex-1">
        <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-xs">
          <div className="flex items-center gap-1">
            <span>Edelweiss está escribiendo</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-muted-foreground rounded-full typing-dot"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full typing-dot"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full typing-dot"></div>
            </div>
          </div>
        </div>
        <div className="text-xs opacity-70 mt-1 text-right">
          {new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  )
}
