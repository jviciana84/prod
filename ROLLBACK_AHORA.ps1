# Script de Rollback Seguro
# Ejecuta esto en PowerShell NUEVO

Write-Host "=== ROLLBACK SEGURO ===" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Guardar trabajo actual
Write-Host "Paso 1: Guardando trabajo actual en rama backup..." -ForegroundColor Yellow
git branch backup-noticias-wrapper
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup creado exitosamente" -ForegroundColor Green
} else {
    Write-Host "⚠️ La rama ya existe (está bien, continuar)" -ForegroundColor Yellow
}

Write-Host ""

# Paso 2: Volver al commit 1efad8c
Write-Host "Paso 2: Volviendo al commit 1efad8c..." -ForegroundColor Yellow
git reset --hard 1efad8c
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Rollback local exitoso" -ForegroundColor Green
} else {
    Write-Host "❌ Error en rollback" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 3: Push forzado
Write-Host "Paso 3: Desplegando a producción..." -ForegroundColor Yellow
git push origin main --force
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push exitoso a producción" -ForegroundColor Green
} else {
    Write-Host "❌ Error en push" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== COMPLETADO ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Espera 2-3 minutos a que Vercel despliegue"
Write-Host "2. Ve a: https://www.controlvo.ovh/dashboard/ventas"
Write-Host "3. Prueba: Fotos → Ventas → Fotos → Ventas"
Write-Host "4. Si funciona ✅, dile al asistente para recuperar noticias"
Write-Host ""
Write-Host "💾 BACKUP guardado en rama: backup-noticias-wrapper" -ForegroundColor Green
Write-Host "   (No has perdido nada)"

