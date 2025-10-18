# Ir al commit dabb4d7 específicamente
Write-Host "=== VOLVIENDO AL COMMIT dabb4d7 ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Paso 1: Reset a dabb4d7..." -ForegroundColor Yellow
git reset --hard dabb4d7

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Reset exitoso a dabb4d7" -ForegroundColor Green
} else {
    Write-Host "❌ Error en reset" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Paso 2: Force push a producción..." -ForegroundColor Yellow
git push origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push exitoso" -ForegroundColor Green
} else {
    Write-Host "❌ Error en push" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Paso 3: Trigger deploy..." -ForegroundColor Yellow
git commit --allow-empty -m "chore: deploy dabb4d7"
git push origin main

Write-Host ""
Write-Host "=== COMPLETADO ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Commit actual: dabb4d7" -ForegroundColor Green
Write-Host "📋 Espera 2-3 minutos para el deploy de Vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "Verifica el commit actual:" -ForegroundColor Yellow
git log --oneline -1

