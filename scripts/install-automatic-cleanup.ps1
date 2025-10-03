# =====================================================
# INSTALACIÓN: SISTEMA AUTOMÁTICO DE LIMPIEZA
# =====================================================
# Descripción: Instalar sistema automático para limpiar vehículos vendidos
# =====================================================

Write-Host "🤖 INSTALANDO SISTEMA AUTOMÁTICO DE LIMPIEZA" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Verificar que existe el archivo SQL
$sqlFile = "scripts/install_automatic_cleanup.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: No se encontró el archivo $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Archivo SQL encontrado: $sqlFile" -ForegroundColor Cyan

# Verificar variables de entorno
$supabaseUrl = $env:SUPABASE_URL
$supabaseKey = $env:SUPABASE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Error: Variables de entorno no configuradas" -ForegroundColor Red
    Write-Host "   SUPABASE_URL: $($supabaseUrl ? '✅' : '❌')" -ForegroundColor $(if ($supabaseUrl) { 'Green' } else { 'Red' })
    Write-Host "   SUPABASE_KEY: $($supabaseKey ? '✅' : '❌')" -ForegroundColor $(if ($supabaseKey) { 'Green' } else { 'Red' })
    Write-Host ""
    Write-Host "💡 Solución: Asegúrate de tener un archivo .env con las variables correctas" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green

# Leer el contenido del archivo SQL
$sqlContent = Get-Content $sqlFile -Raw

Write-Host "📋 Contenido del archivo SQL leído ($($sqlContent.Length) caracteres)" -ForegroundColor Cyan

# Mostrar resumen de lo que se va a instalar
Write-Host ""
Write-Host "🔧 COMPONENTES A INSTALAR:" -ForegroundColor Yellow
Write-Host "   1. Función: handle_vehicle_sold_cleanup()" -ForegroundColor White
Write-Host "   2. Trigger: trigger_vehicle_sold_cleanup (UPDATE)" -ForegroundColor White
Write-Host "   3. Trigger: trigger_vehicle_sold_cleanup_insert (INSERT)" -ForegroundColor White
Write-Host "   4. Documentación y comentarios" -ForegroundColor White

Write-Host ""
Write-Host "⚡ FUNCIONALIDAD:" -ForegroundColor Yellow
Write-Host "   • Automáticamente detecta cuando is_sold = true" -ForegroundColor White
Write-Host "   • Busca fecha de entrega/venta apropiada" -ForegroundColor White
Write-Host "   • Crea registro en tabla entregas" -ForegroundColor White
Write-Host "   • Elimina vehículo del stock" -ForegroundColor White
Write-Host "   • Proceso completamente automático" -ForegroundColor White

Write-Host ""
$confirm = Read-Host "¿Continuar con la instalación? (s/N)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Instalación cancelada por el usuario" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 INICIANDO INSTALACIÓN..." -ForegroundColor Green

# Crear cliente de Supabase usando Node.js
$nodeScript = @"
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function installAutomaticCleanup() {
    try {
        console.log('🔗 Conectando a Supabase...');
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Variables de entorno no configuradas');
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Cliente de Supabase creado');
        
        // Leer archivo SQL
        const sqlContent = fs.readFileSync('scripts/install_automatic_cleanup.sql', 'utf8');
        console.log('📁 Archivo SQL leído');
        
        // Ejecutar SQL
        console.log('⚡ Ejecutando instalación...');
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
        
        if (error) {
            throw error;
        }
        
        console.log('✅ Instalación completada exitosamente');
        console.log('📊 Resultado:', data);
        
    } catch (error) {
        console.error('❌ Error en la instalación:', error);
        process.exit(1);
    }
}

installAutomaticCleanup();
"@

# Guardar script temporal
$tempScript = "temp_install.js"
$nodeScript | Out-File -FilePath $tempScript -Encoding UTF8

try {
    # Ejecutar script
    Write-Host "⚡ Ejecutando instalación en Supabase..." -ForegroundColor Cyan
    node $tempScript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ INSTALACIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Green
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 El sistema automático está ahora activo:" -ForegroundColor Green
        Write-Host "   • Los vehículos marcados como vendidos se procesarán automáticamente" -ForegroundColor White
        Write-Host "   • Se crearán registros en entregas automáticamente" -ForegroundColor White
        Write-Host "   • Se eliminarán del stock automáticamente" -ForegroundColor White
        Write-Host ""
        Write-Host "🔧 Para probar el sistema:" -ForegroundColor Yellow
        Write-Host "   1. Marca un vehículo como vendido (is_sold = true)" -ForegroundColor White
        Write-Host "   2. El sistema automáticamente lo procesará" -ForegroundColor White
        Write-Host "   3. Verifica que aparece en entregas y no en stock" -ForegroundColor White
    } else {
        Write-Host "❌ Error en la instalación" -ForegroundColor Red
    }
} finally {
    # Limpiar archivo temporal
    if (Test-Path $tempScript) {
        Remove-Item $tempScript
    }
}

Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "   1. Integrar el componente MarkAsSoldButton en la interfaz" -ForegroundColor White
Write-Host "   2. Probar marcando un vehículo como vendido" -ForegroundColor White
Write-Host "   3. Verificar que el proceso automático funciona" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Sistema automático listo para usar!" -ForegroundColor Green
