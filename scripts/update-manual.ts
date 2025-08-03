#!/usr/bin/env tsx

import { 
  getAllManualSections, 
  getManualSection, 
  PROJECT_INFO, 
  TECH_STACK,
  updateManualSection,
  updateProjectInfo,
  updateTechStack
} from '../lib/manual-content'

function printUsage() {
  console.log(`
Uso: npm run update-manual [opciones]

Opciones:
  --section <id>     Mostrar una sección específica del manual
  --project          Mostrar información del proyecto
  --tech             Mostrar stack tecnológico
  --list             Listar todas las secciones disponibles

Ejemplos:
  npm run update-manual --list
  npm run update-manual --section dashboard
  npm run update-manual --project
  npm run update-manual --tech
`)
}

function listSections() {
  console.log('\n📚 SECCIONES DISPONIBLES DEL MANUAL:\n')
  const sections = getAllManualSections()
  sections.forEach((section, index) => {
    console.log(`${index + 1}. ${section.title}`)
    console.log(`   ID: ${section.id}`)
    console.log(`   Descripción: ${section.description}`)
    console.log('')
  })
}

function showSection(sectionId: string) {
  const section = getManualSection(sectionId)
  if (!section) {
    console.log(`❌ Sección "${sectionId}" no encontrada`)
    return
  }

  console.log(`\n📖 SECCIÓN: ${section.title.toUpperCase()}\n`)
  console.log(`Descripción: ${section.description}\n`)
  console.log(`Resumen: ${section.content.overview}\n`)
  
  console.log('🚀 CARACTERÍSTICAS PRINCIPALES:')
  section.content.features.forEach((feature, index) => {
    console.log(`   ${index + 1}. ${feature}`)
  })
  console.log('')

  if (section.content.subsections) {
    section.content.subsections.forEach((subsection, index) => {
      console.log(`📋 ${subsection.title.toUpperCase()}:`)
      subsection.content.forEach((item, subIndex) => {
        console.log(`   ${subIndex + 1}. ${item}`)
      })
      console.log('')
    })
  }
}

function showProjectInfo() {
  console.log('\n📋 INFORMACIÓN DEL PROYECTO:\n')
  console.log(`Nombre: ${PROJECT_INFO.name}`)
  console.log(`Versión: ${PROJECT_INFO.version}`)
  console.log(`Desarrollador: ${PROJECT_INFO.developer}`)
  console.log(`Descripción: ${PROJECT_INFO.description}\n`)
  
  console.log('🚀 CARACTERÍSTICAS PRINCIPALES:')
  PROJECT_INFO.features.forEach((feature, index) => {
    console.log(`   ${index + 1}. ${feature}`)
  })
  console.log('')
  
  console.log('ℹ️ INFORMACIÓN TÉCNICA:')
  PROJECT_INFO.techInfo.forEach((info, index) => {
    console.log(`   ${index + 1}. ${info}`)
  })
  console.log('')
}

function showTechStack() {
  console.log('\n🛠️ STACK TECNOLÓGICO:\n')
  
  const categories = ['frontend', 'backend', 'tools']
  
  categories.forEach(category => {
    const categoryItems = TECH_STACK.filter(item => item.category === category)
    if (categoryItems.length > 0) {
      console.log(`${category.toUpperCase()}:`)
      categoryItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} - ${item.description}`)
      })
      console.log('')
    }
  })
}

function parseArgs() {
  const args = process.argv.slice(2)
  const options: { [key: string]: string | boolean } = {}
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg === '--') {
      continue // Ignorar el -- que npm run añade
    }
    
    if (arg.startsWith('--')) {
      const option = arg.slice(2)
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options[option] = args[i + 1]
        i++ // Saltar el siguiente argumento
      } else {
        options[option] = true
      }
    }
  }
  
  return options
}

function main() {
  const options = parseArgs()
  
  if (Object.keys(options).length === 0) {
    printUsage()
    return
  }
  
  if (options.list) {
    listSections()
    return
  }
  
  if (options.section) {
    showSection(options.section as string)
    return
  }
  
  if (options.project) {
    showProjectInfo()
    return
  }
  
  if (options.tech) {
    showTechStack()
    return
  }
  
  printUsage()
}

main() 