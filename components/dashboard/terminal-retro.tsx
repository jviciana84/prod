"use client"

import React, { useRef, useEffect, useState } from "react"

// Estilos inline para efecto retro
const styles: React.CSSProperties = {
  background: "#181c1b",
  color: "#39ff14",
  fontFamily: '"Fira Mono", "Consolas", "Courier New", monospace',
  fontSize: "1.1rem",
  borderRadius: 12,
  boxShadow: "0 0 24px #0f0a, 0 0 2px #39ff14",
  padding: 24,
  minHeight: 340,
  position: "relative",
  overflow: "hidden",
  border: "2px solid #39ff14",
  textShadow: "0 0 2px #39ff14, 0 0 8px #39ff14",
  animation: "terminalBoot 2s ease-out",
}

const scanlineStyle: React.CSSProperties = {
  pointerEvents: "none",
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background:
    "repeating-linear-gradient(180deg, transparent, transparent 6px, rgba(57,255,20,0.07) 7px, transparent 8px)",
  zIndex: 2,
  mixBlendMode: "screen",
  animation: "scanlines 0.1s linear infinite",
}

const cursorStyle: React.CSSProperties = {
  display: "inline-block",
  width: 10,
  height: 22,
  background: "#39ff14",
  marginLeft: 2,
  animation: "blink 1s steps(1) infinite",
  verticalAlign: "bottom",
}

// Animaciones CSS
const animations = `
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes terminalBoot {
  0% { opacity: 0; transform: scale(0.95); }
  50% { opacity: 0.5; transform: scale(0.98); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes scanlines {
  0% { transform: translateY(0); }
  100% { transform: translateY(8px); }
}

@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}

@keyframes matrix {
  0% { opacity: 0; transform: translateY(-20px); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translateY(20px); }
}
`

interface TerminalLine {
  type: 'system' | 'user' | 'response' | 'error'
  content: string
  timestamp: Date
}

export function TerminalRetro() {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [bootSequence, setBootSequence] = useState(true)
  const [glitchMode, setGlitchMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Secuencia de boot divertida
  useEffect(() => {
    const bootMessages = [
      "Iniciando Terminal Retro IA...",
      "Cargando módulos de datos...",
      "Conectando con la base de datos...",
      "Sincronizando con el sistema...",
      "¡Terminal lista! 🚀"
    ]

    let currentIndex = 0
    const bootInterval = setInterval(() => {
      if (currentIndex < bootMessages.length) {
        setLines(prev => [...prev, {
          type: 'system',
          content: bootMessages[currentIndex],
          timestamp: new Date()
        }])
        currentIndex++
      } else {
        setBootSequence(false)
        clearInterval(bootInterval)
        setLines(prev => [...prev, {
          type: 'system',
          content: "Escribe tu pregunta sobre los datos internos de la app:",
          timestamp: new Date()
        }])
      }
    }, 800)

    return () => clearInterval(bootInterval)
  }, [])

  useEffect(() => {
    if (!bootSequence) {
      inputRef.current?.focus()
    }
  }, [bootSequence])

  useEffect(() => {
    // Auto-scroll al final
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  // Efecto glitch ocasional
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.02) { // 2% de probabilidad
        setGlitchMode(true)
        setTimeout(() => setGlitchMode(false), 200)
      }
    }, 5000)

    return () => clearInterval(glitchInterval)
  }, [])

  const addLine = (type: TerminalLine['type'], content: string) => {
    setLines(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || bootSequence) return

    const question = input.trim()
    setInput("")
    addLine('user', `> ${question}`)
    setIsLoading(true)

    // Easter egg: comandos especiales
    if (question.toLowerCase().includes('matrix')) {
      setTimeout(() => {
        addLine('response', "🌌 Bienvenido al mundo de Matrix...\n  • Los datos fluyen como código\n  • La realidad es una simulación\n  • ¿Qué es real? 🤖")
      }, 1000)
      setIsLoading(false)
      return
    }

    if (question.toLowerCase().includes('hack')) {
      setTimeout(() => {
        addLine('response', "💻 HACKING IN PROGRESS...\n  • Bypassing firewall... ✓\n  • Accessing mainframe... ✓\n  • Downloading data... ✓\n  • Just kidding! 😄")
      }, 1500)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/terminal-retro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question })
      })

      const data = await response.json()
      
      if (data.error) {
        addLine('error', data.response)
      } else {
        addLine('response', data.response)
      }
    } catch (error) {
      addLine('error', "💥 Error de conexión. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const getLineStyle = (type: TerminalLine['type']) => {
    const baseStyle = { lineHeight: "1.6" }
    
    switch (type) {
      case 'user':
        return { ...baseStyle, color: '#39ff14' }
      case 'response':
        return { ...baseStyle, color: '#00ff88' }
      case 'error':
        return { ...baseStyle, color: '#ff4444' }
      default:
        return { ...baseStyle, color: '#39ff14' }
    }
  }

  const terminalStyle = {
    ...styles,
    animation: glitchMode ? "glitch 0.2s ease-in-out" : undefined
  }

  return (
    <div style={terminalStyle} className="relative w-full max-w-2xl mx-auto mt-6 mb-6">
      <style>{animations}</style>
      <div style={scanlineStyle} />
      <div 
        ref={terminalRef}
        className="min-h-[220px] pb-2 max-h-[400px] overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {lines.map((line, i) => (
          <div key={i} style={getLineStyle(line.type)}>
            {line.content}
          </div>
        ))}
        {isLoading && (
          <div style={{color: '#39ff14', lineHeight: "1.6"}}>
            <span style={{animation: "blink 0.5s steps(1) infinite"}}>▌</span> Procesando...
          </div>
        )}
        {!bootSequence && (
          <form onSubmit={handleSubmit} className="flex items-center mt-2">
            <span>&gt; </span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#39ff14",
                fontFamily: 'inherit',
                fontSize: "1.1rem",
                width: "100%",
                caretColor: "#39ff14",
                textShadow: "0 0 2px #39ff14, 0 0 8px #39ff14",
                opacity: isLoading ? 0.5 : 1
              }}
              className="flex-1"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder="Ej: ¿Qué color se vende más?"
            />
            {!isLoading && <span style={cursorStyle} />}
          </form>
        )}
      </div>
      <div className="absolute left-4 bottom-2 text-xs text-[#39ff14] opacity-60 select-none">
        Terminal Retro IA v1.0
      </div>
              <div className="absolute right-4 bottom-2 text-xs text-[#39ff14] opacity-60 select-none">
          SIN LÍMITES
        </div>
      {glitchMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ff00ff',
            fontSize: '2rem',
            animation: 'matrix 0.3s ease-out',
            zIndex: 10
          }}>
            MATRIX
          </div>
        </div>
      )}
    </div>
  )
}

export default TerminalRetro 