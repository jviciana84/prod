# Script para actualizar campo OR en CVO
# Uso: Copiar OR (Ctrl+C) → Escribir matrícula → Enter

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Crear formulario
$form = New-Object System.Windows.Forms.Form
$form.Text = "CVO - Actualizar OR"
$form.Size = New-Object System.Drawing.Size(380, 220)
$form.StartPosition = "CenterScreen"
$form.TopMost = $true  # Siempre visible encima
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(240, 240, 240)

# Label OR
$labelOR = New-Object System.Windows.Forms.Label
$labelOR.Location = New-Object System.Drawing.Point(20, 20)
$labelOR.Size = New-Object System.Drawing.Size(100, 20)
$labelOR.Text = "Número OR:"
$labelOR.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($labelOR)

# TextBox OR (se llena automáticamente del portapapeles)
$textOR = New-Object System.Windows.Forms.TextBox
$textOR.Location = New-Object System.Drawing.Point(20, 45)
$textOR.Size = New-Object System.Drawing.Size(320, 25)
$textOR.Font = New-Object System.Drawing.Font("Segoe UI", 11)
$textOR.BackColor = [System.Drawing.Color]::FromArgb(255, 255, 200)
$form.Controls.Add($textOR)

# Label Matrícula
$labelMatricula = New-Object System.Windows.Forms.Label
$labelMatricula.Location = New-Object System.Drawing.Point(20, 80)
$labelMatricula.Size = New-Object System.Drawing.Size(100, 20)
$labelMatricula.Text = "Matrícula:"
$labelMatricula.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($labelMatricula)

# TextBox Matrícula
$textMatricula = New-Object System.Windows.Forms.TextBox
$textMatricula.Location = New-Object System.Drawing.Point(20, 105)
$textMatricula.Size = New-Object System.Drawing.Size(320, 25)
$textMatricula.Font = New-Object System.Drawing.Font("Segoe UI", 11)
$textMatricula.CharacterCasing = "Upper"  # Convierte a mayúsculas automáticamente
$form.Controls.Add($textMatricula)

# Botón Actualizar
$btnActualizar = New-Object System.Windows.Forms.Button
$btnActualizar.Location = New-Object System.Drawing.Point(20, 145)
$btnActualizar.Size = New-Object System.Drawing.Size(320, 35)
$btnActualizar.Text = "ACTUALIZAR OR EN CVO"
$btnActualizar.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$btnActualizar.BackColor = [System.Drawing.Color]::FromArgb(46, 125, 50)
$btnActualizar.ForeColor = [System.Drawing.Color]::White
$btnActualizar.FlatStyle = "Flat"
$btnActualizar.Cursor = "Hand"
$form.Controls.Add($btnActualizar)

# Timer para detectar portapapeles automáticamente
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 500  # Cada 0.5 segundos
$lastClipboard = ""

$timer.Add_Tick({
    try {
        if ([System.Windows.Forms.Clipboard]::ContainsText()) {
            $clipboardText = [System.Windows.Forms.Clipboard]::GetText()
            if ($clipboardText -ne $script:lastClipboard -and $clipboardText.Trim() -ne "") {
                $script:lastClipboard = $clipboardText
                $textOR.Text = $clipboardText.Trim()
                $textOR.BackColor = [System.Drawing.Color]::FromArgb(200, 255, 200)  # Verde claro
                # Volver a amarillo después de 1 segundo
                Start-Sleep -Milliseconds 100
                $textOR.BackColor = [System.Drawing.Color]::FromArgb(255, 255, 200)
            }
        }
    } catch {}
})

$timer.Start()

# Evento botón Actualizar
$btnActualizar.Add_Click({
    $or = $textOR.Text.Trim()
    $matricula = $textMatricula.Text.Trim()
    
    if ($or -eq "" -or $matricula -eq "") {
        [System.Windows.Forms.MessageBox]::Show(
            "Por favor completa ambos campos.",
            "Campos vacíos",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Warning
        )
        return
    }
    
    # AQUI IRA LA CONEXION A SUPABASE
    # Por ahora solo muestra los datos
    $mensaje = "DATOS CAPTURADOS:`n`n" +
               "OR: $or`n" +
               "Matricula: $matricula`n`n" +
               "(Aqui se actualizara la base de datos)"
    
    [System.Windows.Forms.MessageBox]::Show(
        $mensaje,
        "Vista previa",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    )
    
    # Limpiar campos
    $textOR.Text = ""
    $textMatricula.Text = ""
    $textMatricula.Focus()
})

# Enter en matricula = clic en boton
$textMatricula.Add_KeyDown({
    if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Enter) {
        $btnActualizar.PerformClick()
    }
})

# Focus inicial en matrícula
$form.Add_Shown({ $textMatricula.Focus() })

# Limpiar timer al cerrar
$form.Add_FormClosed({ $timer.Stop() })

# Mostrar formulario
[void]$form.ShowDialog()

