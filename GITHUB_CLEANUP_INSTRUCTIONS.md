# 🧹 Limpieza del Proyecto para GitHub

## 🎯 Objetivo
Limpiar el proyecto para poder hacer push a GitHub sin problemas de tamaño.

## ✅ Cambios Realizados

### 1. **URL de API Corregida**
- ❌ Antes: `https://controlvo.vercel.app/api/import-csv`
- ✅ Ahora: `https://controlvo.ovh/api/import-csv`

### 2. **Archivos Actualizados**
- `scripts/cvo_scraper_gui_updated.py` - URL corregida
- `scripts/build_updated_scraper.py` - URL corregida

## 🚀 Proceso de Limpieza

### Paso 1: Ejecutar Script de Limpieza
```bash
python cleanup_for_github.py
```

### Paso 2: Lo que hace el script
- 📦 **Mueve ejecutables** a `../cursor_backup_files/executables/`
- 📊 **Mueve archivos CSV** a `../cursor_backup_files/csv_files/`
- 🧹 **Limpia archivos de build** (.next, dist, build, etc.)
- 📝 **Actualiza .gitignore** para evitar archivos pesados
- 📜 **Crea script de restauración** (`restore_files.py`)

### Paso 3: Hacer Push a GitHub
```bash
git add .
git commit -m "Clean project for GitHub - API configured and heavy files moved"
git push
```

## 📁 Estructura de Backup

```
../cursor_backup_files/
├── executables/
│   ├── CVO_Scraper.exe
│   ├── BMW_Scraper.exe
│   ├── chromedriver.exe
│   └── dist/
├── csv_files/
│   └── *.csv
├── build_files/
└── node_modules_backup/
```

## 🔄 Restaurar Archivos (si es necesario)

```bash
python restore_files.py
```

## 📦 Reinstalar Dependencias

```bash
npm install
```

## 🎯 Archivos que se Mueven/Eliminan

### 📦 Ejecutables (movidos a backup)
- `scripts/CVO_Scraper.exe` (20MB)
- `scripts/BMW_Scraper.exe`
- `scripts/chromedriver.exe` (18MB)
- `scripts/dist/`
- `scripts/build/`
- `scripts/*.spec`

### 📊 Archivos CSV (movidos a backup)
- `scripts/descargas/*.csv` (1.9MB cada uno)
- `*.csv`

### 🧹 Archivos Eliminados
- `.next/`
- `out/`
- `dist/`
- `build/`
- `*.log`
- `*.tmp`

## ✅ Beneficios

1. **Tamaño reducido**: El repositorio será mucho más pequeño
2. **Push exitoso**: Sin problemas de límites de GitHub
3. **Backup seguro**: Todos los archivos importantes están respaldados
4. **Fácil restauración**: Script automático para restaurar archivos
5. **API configurada**: URL correcta para producción

## 🚨 Importante

- Los archivos pesados están **respaldaos** en `../cursor_backup_files/`
- Puedes **restaurarlos** cuando los necesites
- El **ejecutable actualizado** se puede compilar después del push
- La **API está configurada** con la URL correcta

## 🎉 Resultado Final

- ✅ Proyecto limpio para GitHub
- ✅ API configurada correctamente
- ✅ Archivos pesados respaldados
- ✅ Script de restauración disponible
- ✅ .gitignore actualizado 