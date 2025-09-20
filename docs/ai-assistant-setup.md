# 🌸 Edelweiss - Asistente IA para CVO - Guía de Instalación

## ✅ **IMPLEMENTACIÓN COMPLETADA**

Edelweiss ya está implementado y funcionando con respuestas inteligentes predefinidas. No requiere configuración adicional.

## 🚀 **FUNCIONALIDADES INCLUIDAS**

### **Características Principales:**
- ✅ **Chat interactivo** con interfaz moderna
- ✅ **Reconocimiento de voz** (si el navegador lo soporta)
- ✅ **Respuestas inteligentes** basadas en datos reales del sistema
- ✅ **Sugerencias contextuales** según la página actual
- ✅ **Integración completa** con Supabase
- ✅ **Diseño responsive** y accesible

### **Consultas Soportadas:**
- 📊 **Stock**: Vehículos disponibles, por marca, modelo
- 💰 **Ventas**: Información de ventas, asesores, períodos
- 🚚 **Entregas**: Estado de entregas pendientes y completadas
- 📋 **CVO**: Gestión de certificados y permisos
- 🔧 **Taller**: Estado de reparaciones y vehículos
- 📈 **Estadísticas**: Resúmenes generales del sistema

## 🎯 **CÓMO USAR**

### **1. Acceder a Edelweiss:**
- Haz clic en el botón "Edelweiss" en el centro del header (solo PC)
- El botón tiene un ícono de robot 🤖

### **2. Hacer Preguntas:**
- Escribe tu pregunta en el campo de texto
- Presiona Enter o haz clic en el botón de enviar
- Usa el micrófono para dictar (si está disponible)

### **3. Ejemplos de Preguntas:**
```
• "¿Cuántos vehículos hay en stock?"
• "¿Cuáles son las ventas de este mes?"
• "¿Hay entregas pendientes?"
• "¿Cómo funciona el sistema CVO?"
• "¿Cuál es el estado del taller?"
```

## 🔧 **CONFIGURACIÓN OPCIONAL**

### **Para usar IA Externa (Opcional):**

Si quieres respuestas más avanzadas, puedes configurar:

#### **Meta Llama 2 (Gratuito):**
1. Regístrate en [replicate.com](https://replicate.com)
2. Obtén tu API token
3. Añade a `.env.local`:
```env
REPLICATE_API_TOKEN=tu_token_de_replicate
```

#### **OpenAI (De pago):**
1. Obtén API key de OpenAI
2. Añade a `.env.local`:
```env
OPENAI_API_KEY=tu_api_key_de_openai
```

## 📁 **ARCHIVOS CREADOS**

- `components/ai-assistant/ai-assistant.tsx` - Componente principal
- `app/api/ai-assistant/chat/route.ts` - API endpoint
- `components/ai-assistant/contextual-suggestions.tsx` - Sugerencias
- `components/root-layout-client.tsx` - Integración en layout

## 🚀 **DESPLIEGUE EN VERCEL**

El asistente ya está listo para desplegarse en Vercel:

1. **Commit y push** de los cambios
2. **Vercel detectará** automáticamente los cambios
3. **Despliegue automático** en unos minutos
4. **Funcionará inmediatamente** sin configuración adicional

## 🎨 **PERSONALIZACIÓN**

### **Cambiar Colores:**
Edita en `ai-assistant.tsx`:
```typescript
className="bg-gradient-to-r from-blue-500 to-purple-600"
```

### **Añadir Nuevas Consultas:**
Edita en `route.ts`:
```typescript
if (matches(lowerMessage, ['nueva_consulta'])) {
  return getNuevaConsultaInfo(context)
}
```

### **Modificar Sugerencias:**
Edita en `contextual-suggestions.tsx`:
```typescript
const suggestionsMap = {
  '/nueva_pagina': [
    "Nueva sugerencia 1",
    "Nueva sugerencia 2"
  ]
}
```

## 🐛 **SOLUCIÓN DE PROBLEMAS**

### **El asistente no aparece:**
- Verifica que `AIAssistant` esté importado en `root-layout-client.tsx`
- Revisa la consola del navegador para errores

### **No responde a preguntas:**
- Verifica que la API `/api/ai-assistant/chat` esté funcionando
- Revisa los logs de Vercel para errores

### **Reconocimiento de voz no funciona:**
- Asegúrate de usar HTTPS (requerido para micrófono)
- Verifica permisos del navegador

## 📞 **SOPORTE**

Si tienes problemas:
1. Revisa los logs de Vercel
2. Verifica la consola del navegador
3. Comprueba que Supabase esté funcionando
4. Contacta al desarrollador

---

**¡Edelweiss está listo para usar! 🌸🎉**
