# Configuración de la API para CVO Scraper

## 1. Configurar API Key

### Añadir al archivo `.env.local`:
```bash
# API Key para el CVO Scraper
CVO_SCRAPER_API_KEY=cvo-scraper-2024-secure-key
```

### O si prefieres una API key más segura:
```bash
# Generar una API key segura
CVO_SCRAPER_API_KEY=cvo-scraper-$(openssl rand -hex 16)
```

## 2. Endpoint de la API

### URL de la API:
```
POST https://tu-dominio.com/api/import-csv
```

### Headers requeridos:
```
Content-Type: application/json
```

### Body del request:
```json
{
  "csv_data": {
    "ID Anuncio": "12345",
    "Anuncio": "BMW X3 2023",
    "Chasis": "WBA12345678901234",
    "Concesionario": "BMW Madrid",
    "Precio": "45000",
    "Marca": "BMW",
    "Modelo": "X3",
    "Disponibilidad": "Disponible"
  },
  "file_name": "scraping_20241215_1430.csv",
  "api_key": "cvo-scraper-2024-secure-key"
}
```

## 3. Configurar el exe

### En el archivo `cvo_scraper_gui.py`, líneas 25-26:
```python
# Configuración de la API (hardcodeada)
self.api_url = "https://tu-dominio.com/api/import-csv"  # Cambiar por tu URL real
self.api_key = "cvo-scraper-2024-secure-key"  # Cambiar por tu API key real
```

## 4. Funcionalidades de la API

### ✅ Procesamiento automático:
- **Registro único**: Si envías un objeto
- **Múltiples registros**: Si envías un array
- **Actualización**: Si existe el mismo "ID Anuncio"
- **Inserción**: Si es un nuevo "ID Anuncio"

### ✅ Validaciones:
- **API Key**: Verifica que la key sea válida
- **Datos**: Verifica que se reciban datos CSV
- **Campos**: Mapea todos los 91 campos del CSV

### ✅ Respuestas:
```json
{
  "success": true,
  "action": "inserted|updated",
  "record_id": "uuid-del-registro",
  "message": "Registro procesado correctamente"
}
```

## 5. Probar la API

### Endpoint de prueba:
```
GET https://tu-dominio.com/api/import-csv
```

### Respuesta esperada:
```json
{
  "success": true,
  "message": "CVO Scraper API funcionando correctamente",
  "endpoint": "/api/import-csv",
  "method": "POST",
  "required_fields": ["csv_data", "file_name", "api_key"]
}
```

## 6. Seguridad

### ✅ Medidas implementadas:
- **API Key requerida** para todas las operaciones
- **Validación de datos** antes de procesar
- **Manejo de errores** detallado
- **Logs de auditoría** en consola

### ⚠️ Recomendaciones:
- **Cambiar la API key** por defecto
- **Usar HTTPS** en producción
- **Limitar acceso** por IP si es necesario
- **Monitorear logs** de acceso

## 7. Próximos pasos

1. **Configurar la API key** en `.env.local`
2. **Actualizar el exe** con la URL y API key reales
3. **Probar la API** con datos de ejemplo
4. **Compilar el exe** final
5. **Desplegar y probar** en producción 