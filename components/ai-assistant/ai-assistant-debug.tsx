"use client"

import { useState } from "react"

export function AIAssistantDebug() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Botón flotante ultra simple para debug */}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          width: '60px',
          height: '60px',
          backgroundColor: 'red',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        onClick={() => {
          console.log('🤖 Botón del asistente clickeado!')
          setIsOpen(!isOpen)
        }}
      >
        <span style={{ color: 'white', fontSize: '24px' }}>🤖</span>
      </div>

      {/* Modal ultra simple para debug */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px 0', color: 'black' }}>
              🤖 Asistente IA - Debug
            </h2>
            <p style={{ color: 'black', margin: '0 0 16px 0' }}>
              ¡El asistente está funcionando correctamente!
            </p>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
