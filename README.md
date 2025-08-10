# SCRAPER CMS - Automático

Scraper automático para descargar garantías brutas de CMS MM y MMC y subirlas a Supabase.

## Características

- ✅ **Scraping automático** de CMS MM y MMC
- ✅ **Programación automática** cada 8 horas (configurable)
- ✅ **Ejecución manual** disponible
- ✅ **Interfaz gráfica** intuitiva
- ✅ **Configuración persistente** de credenciales y horarios
- ✅ **Logs en tiempo real** en la interfaz
- ✅ **Descarga automática** de Excel con garantías
- ✅ **Upload a Supabase** de los datos procesados
- ✅ **Filtros automáticos**: Producción, Estado Vigente, 6 meses atrás

## Instalación

1. **Clonar o descargar** el proyecto
2. **Instalar dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurar Supabase**:
   - Crear archivo `.env` basado en `config_example.env`
   - Configurar `SUPABASE_URL` y `SUPABASE_KEY`

4. **Crear tablas en Supabase**:
   - Ejecutar el script `create_tables.sql` en tu proyecto Supabase

5. **Configurar Chrome WebDriver**:
   - Descargar ChromeDriver compatible con tu versión de Chrome
   - Asegurarse de que esté en el PATH o en el directorio del proyecto

## Uso

### Ejecutar el scraper:
```bash
python scraper_cms.py
```

### Configuración inicial:
1. **Credenciales CMS**: Introducir usuario y contraseña para MM y MMC
2. **Programación**: Configurar horario y intervalo (por defecto 8 horas)
3. **Guardar configuración**: Los cambios se guardan automáticamente

### Funcionalidades:
- **Ejecutar Manual**: Inicia scraping inmediatamente
- **Programación automática**: Se ejecuta automáticamente según configuración
- **Logs en tiempo real**: Ver progreso en la interfaz
- **Archivos organizados**: Los Excel se guardan en `garantias/MM/` y `garantias/MMC/`

## Estructura del proyecto

```
scraper-cms/
├── scraper_cms.py          # Scraper principal
├── requirements.txt        # Dependencias Python
├── create_tables.sql       # Script SQL para Supabase
├── config_example.env      # Ejemplo de configuración
├── .gitignore             # Archivos a ignorar
├── README.md              # Este archivo
├── logs/                  # Logs del scraper
├── downloads/             # Archivos temporales
├── screenshots/           # Screenshots de debug
└── garantias/             # Excel descargados
    ├── MM/
    └── MMC/
```

## Configuración

### Variables de entorno (.env):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
DEBUG_MODE=true
HEADLESS_MODE=false
```

### Configuración de programación:
- **Hora inicio**: Hora de inicio del horario laboral
- **Hora fin**: Hora de fin del horario laboral  
- **Intervalo**: Cada cuántas horas ejecutar (por defecto 8)

## Logs

Los logs se guardan en:
- **Interfaz**: Tiempo real en la GUI
- **Archivo**: `logs/scraper.log`
- **Límite**: 1000 líneas en la interfaz

## Troubleshooting

### Problemas comunes:
1. **ChromeDriver no encontrado**: Descargar versión compatible
2. **Credenciales incorrectas**: Verificar usuario/contraseña CMS
3. **Supabase no configurado**: Configurar variables de entorno
4. **Elementos no encontrados**: Verificar que la página CMS no haya cambiado

### Debug:
- Activar `DEBUG_MODE=true` en `.env`
- Revisar screenshots en `screenshots/`
- Verificar logs en `logs/scraper.log`

## Desarrollo

### Modo desarrollo:
```bash
# Activar modo debug
export DEBUG_MODE=true

# Ejecutar sin headless para ver el navegador
export HEADLESS_MODE=false
```

### Estructura del código:
- `ScraperCMS`: Clase principal
- `scrape_cms_mm()`: Scraping específico para MM
- `scrape_cms_mmc()`: Scraping específico para MMC
- `configure_filters()`: Configuración de filtros
- `process_and_upload()`: Procesamiento y upload a Supabase

## Licencia

Proyecto interno para automatización de scraping CMS.
