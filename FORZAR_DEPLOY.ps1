# Script para forzar deploy en Vercel
Write-Host "=== FORZANDO DEPLOY EN VERCEL ===" -ForegroundColor Cyan
Write-Host ""

# Opción 1: Trigger con commit vacío
Write-Host "Creando commit vacío para trigger deploy..." -ForegroundColor Yellow
git commit --allow-empty -m "chore: trigger vercel redeploy - rollback to 1efad8c"
git push origin main

Write-Host ""
Write-Host "✅ Push realizado. Vercel debería detectar el cambio ahora." -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Ve a: https://vercel.com/jviciana84s-projects"
Write-Host "2. Busca tu proyecto 'prod' o 'controlvo'"
Write-Host "3. Verás un deploy en progreso"
Write-Host "4. Espera 2-3 minutos"
Write-Host "5. Prueba: https://www.controlvo.ovh/dashboard/ventas"
Write-Host ""
Write-Host "⚠️ Si aún no deploya:" -ForegroundColor Yellow
Write-Host "   - Ve a Vercel Dashboard"
Write-Host "   - Click en tu proyecto"
Write-Host "   - Click en 'Deployments'"
Write-Host "   - Click en los '...' del último deploy"
Write-Host "   - Click 'Redeploy'"

