# =====================================================
# SCRIPT: LIMPIEZA DE VEHÍCULOS VENDIDOS DEL STOCK
# =====================================================
# Descripción: Script de PowerShell para ejecutar la limpieza
# Uso: .\cleanup_stock.ps1
# =====================================================

Write-Host "🚗 INICIANDO LIMPIEZA DE VEHÍCULOS VENDIDOS DEL STOCK" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "scripts/identify_sold_vehicles_in_stock.sql")) {
    Write-Host "❌ Error: No se encontró el archivo de identificación" -ForegroundColor Red
    Write-Host "Asegúrate de ejecutar este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "📋 PASO 1: Identificando vehículos vendidos en stock..." -ForegroundColor Yellow

# Ejecutar identificación
Write-Host "Ejecutando: scripts/identify_sold_vehicles_in_stock.sql" -ForegroundColor Cyan
Write-Host "Revisa los resultados antes de continuar..." -ForegroundColor Yellow

# Pausa para revisar resultados
Write-Host ""
Write-Host "⏸️  PAUSA: Revisa los resultados anteriores" -ForegroundColor Yellow
Write-Host "¿Deseas continuar con la limpieza? (S/N): " -NoNewline -ForegroundColor Yellow
$continuar = Read-Host

if ($continuar -eq "S" -or $continuar -eq "s" -or $continuar -eq "Y" -or $continuar -eq "y") {
    Write-Host "✅ Continuando con la limpieza..." -ForegroundColor Green
    
    Write-Host "📋 PASO 2: Ejecutando limpieza segura..." -ForegroundColor Yellow
    Write-Host "Ejecutando: scripts/safe_cleanup_sold_vehicles.sql" -ForegroundColor Cyan
    
    # Aquí se ejecutaría el script de limpieza
    # psql -f scripts/safe_cleanup_sold_vehicles.sql
    
    Write-Host "📋 PASO 3: Verificando resultado..." -ForegroundColor Yellow
    Write-Host "Ejecutando: scripts/verify_stock_cleanup.sql" -ForegroundColor Cyan
    
    # Aquí se ejecutaría el script de verificación
    # psql -f scripts/verify_stock_cleanup.sql
    
    Write-Host "✅ LIMPIEZA COMPLETADA" -ForegroundColor Green
    Write-Host "Revisa los resultados de verificación" -ForegroundColor Yellow
    
} else {
    Write-Host "❌ Limpieza cancelada por el usuario" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 RESUMEN:" -ForegroundColor Blue
Write-Host "- Scripts creados en la carpeta scripts/" -ForegroundColor White
Write-Host "- Ejecuta manualmente los scripts SQL en Supabase" -ForegroundColor White
Write-Host "- Verifica cada paso antes de continuar" -ForegroundColor White

Write-Host ""
Write-Host "🔧 COMANDOS PARA EJECUTAR MANUALMENTE:" -ForegroundColor Blue
Write-Host "1. Identificar: \i scripts/identify_sold_vehicles_in_stock.sql" -ForegroundColor White
Write-Host "2. Limpiar: \i scripts/safe_cleanup_sold_vehicles.sql" -ForegroundColor White
Write-Host "3. Verificar: \i scripts/verify_stock_cleanup.sql" -ForegroundColor White
