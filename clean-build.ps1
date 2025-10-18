# Script para limpiar completamente el build de Next.js
Write-Host "🧹 Limpiando build de Next.js..." -ForegroundColor Cyan

# 1. Eliminar .next
if (Test-Path ".next") {
    Write-Host "🗑️ Eliminando .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
    Write-Host "✅ .next eliminado" -ForegroundColor Green
} else {
    Write-Host "⚠️ .next no existe" -ForegroundColor Yellow
}

# 2. Eliminar node_modules/.cache
if (Test-Path "node_modules/.cache") {
    Write-Host "🗑️ Eliminando node_modules/.cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules/.cache
    Write-Host "✅ node_modules/.cache eliminado" -ForegroundColor Green
}

# 3. Eliminar archivos temporales de Next.js
if (Test-Path ".swc") {
    Write-Host "🗑️ Eliminando .swc..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .swc
    Write-Host "✅ .swc eliminado" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Limpieza completada!" -ForegroundColor Green
Write-Host "📝 Ahora ejecuta: npm run dev" -ForegroundColor Cyan

