# Configuración de OpenAI para Edelweiss

## Pasos para configurar OpenAI:

### 1. Obtener API Key de OpenAI
1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Crea una nueva API key
4. Copia la clave (empieza con `sk-`)

### 2. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto con:

```env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

### 3. Reiniciar el servidor
```bash
npm run dev
```

### 4. Probar el chat
- Abre el chat con el botón 'E' en el footer
- Escribe un mensaje
- Edelweiss responderá con IA real

## Funcionalidades disponibles con OpenAI:

✅ **Consultas inteligentes** sobre vehículos BMW
✅ **Análisis de datos** del concesionario  
✅ **Búsquedas avanzadas** por múltiples criterios
✅ **Respuestas contextuales** basadas en la base de datos
✅ **Memoria de conversación** para consultas relacionadas

## Sin OpenAI:
- Funciona con respuestas simuladas
- No hay acceso a datos reales
- Respuestas básicas sin contexto

