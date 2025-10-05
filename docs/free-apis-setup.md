# Configuración de APIs Gratuitas

## 🆓 APIs Gratuitas Implementadas

### 1. Bing Search API
- **Límite**: 1000 búsquedas/mes gratis
- **Registro**: https://azure.microsoft.com/en-us/services/cognitive-services/bing-web-search-api/
- **Variable de entorno**: `BING_SEARCH_API_KEY`

### 2. News API
- **Límite**: 1000 requests/día gratis
- **Registro**: https://newsapi.org/
- **Variable de entorno**: `NEWS_API_KEY`

## 🔧 Configuración

### Variables de Entorno
Agrega estas variables a tu archivo `.env.local`:

```bash
# APIs Gratuitas (Opcionales)
BING_SEARCH_API_KEY=tu_bing_api_key_aqui
NEWS_API_KEY=tu_news_api_key_aqui
```

### Sin APIs (Modo Fallback)
Si no configuras las APIs, el sistema usará datos mejorados como fallback:
- ✅ **Fórmula 1**: Datos actualizados de 2025
- ✅ **Fútbol**: Información de La Liga
- ✅ **Tecnología**: Tendencias actuales
- ✅ **Noticias**: Información general

## 📊 Estrategia de Uso

### 1. Cache Inteligente
- **TTL**: 15 minutos para búsquedas web
- **Beneficio**: Reduce uso de APIs gratuitas
- **Resultado**: Más búsquedas disponibles

### 2. Fallback Automático
- **Bing Search** → **News API** → **Datos Mejorados**
- **Sin coste** si las APIs fallan
- **Funcionalidad garantizada** siempre

### 3. Optimización de Cuotas
- **Consultas del concesionario**: Base de datos (gratis)
- **Consultas generales**: APIs gratuitas
- **Cache**: Reduce llamadas repetidas

## 🎯 Beneficios

- **0€/mes** de coste adicional
- **Búsquedas reales** cuando las APIs están disponibles
- **Fallback inteligente** cuando no hay cuota
- **Cache optimizado** para maximizar uso
- **Experiencia consistente** para el usuario

## 🚀 Uso Recomendado

1. **Configura las APIs** si quieres búsquedas 100% reales
2. **Sin configuración** funciona perfectamente con datos mejorados
3. **Cache automático** optimiza el uso de cuotas
4. **Fallback garantizado** para cualquier situación
