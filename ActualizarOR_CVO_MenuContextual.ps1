# Script para actualizar campo OR en CVO desde menu contextual
# Captura texto seleccionado automaticamente

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Obtener texto seleccionado del portapapeles
$textoSeleccionado = ""
try {
    # Simular Ctrl+C para copiar texto seleccionado
    Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class KeyboardSimulator {
            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
        }
"@
    
    # Esperar un momento y copiar
    Start-Sleep -Milliseconds 200
    [KeyboardSimulator]::keybd_event(0x11, 0, 0, 0) # Ctrl down
    [KeyboardSimulator]::keybd_event(0x43, 0, 0, 0) # C down
    [KeyboardSimulator]::keybd_event(0x43, 0, 2, 0) # C up
    [KeyboardSimulator]::keybd_event(0x11, 0, 2, 0) # Ctrl up
    Start-Sleep -Milliseconds 200
    
    if ([System.Windows.Forms.Clipboard]::ContainsText()) {
        $textoSeleccionado = [System.Windows.Forms.Clipboard]::GetText().Trim()
    }
} catch {}

# Crear formulario
$form = New-Object System.Windows.Forms.Form
$form.Text = "CVO - Exportar OR"
$form.Size = New-Object System.Drawing.Size(400, 220)
$form.StartPosition = "CenterScreen"
$form.TopMost = $true
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(240, 240, 240)

# Label OR
$labelOR = New-Object System.Windows.Forms.Label
$labelOR.Location = New-Object System.Drawing.Point(20, 20)
$labelOR.Size = New-Object System.Drawing.Size(100, 20)
$labelOR.Text = "Numero OR:"
$labelOR.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($labelOR)

# TextBox OR
$textOR = New-Object System.Windows.Forms.TextBox
$textOR.Location = New-Object System.Drawing.Point(20, 45)
$textOR.Size = New-Object System.Drawing.Size(340, 25)
$textOR.Font = New-Object System.Drawing.Font("Segoe UI", 11)
$textOR.Text = $textoSeleccionado
$textOR.BackColor = [System.Drawing.Color]::FromArgb(255, 255, 200)
$form.Controls.Add($textOR)

# Label Matricula
$labelMatricula = New-Object System.Windows.Forms.Label
$labelMatricula.Location = New-Object System.Drawing.Point(20, 80)
$labelMatricula.Size = New-Object System.Drawing.Size(100, 20)
$labelMatricula.Text = "Matricula:"
$labelMatricula.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($labelMatricula)

# TextBox Matricula
$textMatricula = New-Object System.Windows.Forms.TextBox
$textMatricula.Location = New-Object System.Drawing.Point(20, 105)
$textMatricula.Size = New-Object System.Drawing.Size(340, 25)
$textMatricula.Font = New-Object System.Drawing.Font("Segoe UI", 11)
$textMatricula.CharacterCasing = "Upper"
$form.Controls.Add($textMatricula)

# Boton Actualizar
$btnActualizar = New-Object System.Windows.Forms.Button
$btnActualizar.Location = New-Object System.Drawing.Point(20, 145)
$btnActualizar.Size = New-Object System.Drawing.Size(340, 35)
$btnActualizar.Text = "ACTUALIZAR OR EN CVO"
$btnActualizar.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$btnActualizar.BackColor = [System.Drawing.Color]::FromArgb(46, 125, 50)
$btnActualizar.ForeColor = [System.Drawing.Color]::White
$btnActualizar.FlatStyle = "Flat"
$btnActualizar.Cursor = "Hand"
$form.Controls.Add($btnActualizar)

# Evento boton Actualizar
$btnActualizar.Add_Click({
    $or = $textOR.Text.Trim()
    $matricula = $textMatricula.Text.Trim()
    
    if ($or -eq "" -or $matricula -eq "") {
        [System.Windows.Forms.MessageBox]::Show(
            "Por favor completa ambos campos.",
            "Campos vacios",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Warning
        )
        return
    }
    
    # AQUI IRA LA CONEXION A SUPABASE
    $mensaje = "DATOS CAPTURADOS:`n`n" +
               "OR: $or`n" +
               "Matricula: $matricula`n`n" +
               "(Aqui se actualizara la base de datos)"
    
    $resultado = [System.Windows.Forms.MessageBox]::Show(
        $mensaje,
        "Vista previa - Menu Contextual",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    )
    
    $form.Close()
})

# Enter en matricula = actualizar
$textMatricula.Add_KeyDown({
    if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Enter) {
        $btnActualizar.PerformClick()
    }
})

# Focus inicial
$form.Add_Shown({ $textMatricula.Focus() })

# Mostrar formulario
[void]$form.ShowDialog()


















