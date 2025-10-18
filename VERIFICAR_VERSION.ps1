# Verificar qué versión tenemos
Write-Host "=== VERIFICACIÓN DE VERSIÓN ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Commit actual:" -ForegroundColor Yellow
git log --oneline -1

Write-Host ""
Write-Host "Últimos 5 commits:" -ForegroundColor Yellow
git log --oneline -5

Write-Host ""
Write-Host "Estado del repositorio:" -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "Rama actual:" -ForegroundColor Yellow
git branch --show-current

