#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

// Obtener argumentos después de --
const args = process.argv.slice(2)

// Ejecutar el script TypeScript con los argumentos
const scriptPath = path.join(__dirname, 'update-manual.ts')
const child = spawn('npx', ['tsx', scriptPath, ...args], {
  stdio: 'inherit',
  shell: true
})

child.on('close', (code) => {
  process.exit(code)
}) 