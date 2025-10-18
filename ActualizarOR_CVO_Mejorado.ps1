# CVO - Actualizador OR (Version mejorada)
# Atajo: Ctrl+Shift+O

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Crear formulario compacto sin barra
$form = New-Object System.Windows.Forms.Form
$form.Size = New-Object System.Drawing.Size(190, 30)
$form.StartPosition = "Manual"
$form.Location = New-Object System.Drawing.Point(
    ([System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Width - 190),
    50
)
$form.TopMost = $true
$form.FormBorderStyle = "None"
$form.BackColor = [System.Drawing.Color]::FromArgb(32, 32, 32)
$form.ShowInTaskbar = $true

# TextBox OR (izquierda)
$textOR = New-Object System.Windows.Forms.TextBox
$textOR.Location = New-Object System.Drawing.Point(3, 3)
$textOR.Size = New-Object System.Drawing.Size(55, 24)
$textOR.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$textOR.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
$textOR.ForeColor = [System.Drawing.Color]::FromArgb(255, 215, 0)
$textOR.BorderStyle = "FixedSingle"
$textOR.Text = "OR"
$form.Controls.Add($textOR)

# TextBox Matricula (centro)
$textMatricula = New-Object System.Windows.Forms.TextBox
$textMatricula.Location = New-Object System.Drawing.Point(60, 3)
$textMatricula.Size = New-Object System.Drawing.Size(85, 24)
$textMatricula.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$textMatricula.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
$textMatricula.ForeColor = [System.Drawing.Color]::White
$textMatricula.BorderStyle = "FixedSingle"
$textMatricula.CharacterCasing = "Upper"
$textMatricula.Text = "MAT"
$form.Controls.Add($textMatricula)

# Boton Guardar (icono)
$btnGuardar = New-Object System.Windows.Forms.Button
$btnGuardar.Location = New-Object System.Drawing.Point(148, 3)
$btnGuardar.Size = New-Object System.Drawing.Size(38, 24)
$btnGuardar.Text = [char]0x2714  # Checkmark
$btnGuardar.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$btnGuardar.BackColor = [System.Drawing.Color]::FromArgb(0, 150, 0)
$btnGuardar.ForeColor = [System.Drawing.Color]::White
$btnGuardar.FlatStyle = "Flat"
$btnGuardar.FlatAppearance.BorderSize = 0
$btnGuardar.Cursor = "Hand"
$form.Controls.Add($btnGuardar)

# Limpiar placeholder al hacer clic
$textOR.Add_GotFocus({
    if ($textOR.Text -eq "OR") {
        $textOR.Text = ""
        $textOR.ForeColor = [System.Drawing.Color]::White
    }
})

$textMatricula.Add_GotFocus({
    if ($textMatricula.Text -eq "MAT") {
        $textMatricula.Text = ""
    }
})

# Variables globales
$global:lastClipboard = ""
$global:dragging = $false
$global:dragCursorPoint = New-Object System.Drawing.Point(0, 0)
$global:dragFormPoint = New-Object System.Drawing.Point(0, 0)

# Permitir mover la ventana arrastrando
$form.Add_MouseDown({
    if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $global:dragging = $true
        $global:dragCursorPoint = [System.Windows.Forms.Cursor]::Position
        $global:dragFormPoint = $form.Location
    }
})

$form.Add_MouseMove({
    if ($global:dragging) {
        $dif = New-Object System.Drawing.Point(
            ([System.Windows.Forms.Cursor]::Position.X - $global:dragCursorPoint.X),
            ([System.Windows.Forms.Cursor]::Position.Y - $global:dragCursorPoint.Y)
        )
        $form.Location = New-Object System.Drawing.Point(
            ($global:dragFormPoint.X + $dif.X),
            ($global:dragFormPoint.Y + $dif.Y)
        )
    }
})

$form.Add_MouseUp({
    if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $global:dragging = $false
    }
})

# Funcion para actualizar OR desde portapapeles
function ActualizarORDesdePortapapeles {
    try {
        if ([System.Windows.Forms.Clipboard]::ContainsText()) {
            $clipboardText = [System.Windows.Forms.Clipboard]::GetText().Trim()
            if ($clipboardText -ne $global:lastClipboard -and $clipboardText -ne "") {
                $global:lastClipboard = $clipboardText
                $textOR.Text = $clipboardText
                $textOR.ForeColor = [System.Drawing.Color]::White
                $textOR.BackColor = [System.Drawing.Color]::FromArgb(0, 100, 0)
                Start-Sleep -Milliseconds 300
                $textOR.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
                $textMatricula.Focus()
            }
        }
    } catch {}
}

# Timer para detectar portapapeles
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 300
$timer.Add_Tick({
    ActualizarORDesdePortapapeles
})
$timer.Start()

# Evento guardar
$btnGuardar.Add_Click({
    $or = $textOR.Text.Trim()
    $matricula = $textMatricula.Text.Trim()
    
    if ($or -eq "" -or $or -eq "OR" -or $matricula -eq "" -or $matricula -eq "MAT") {
        $textOR.BackColor = [System.Drawing.Color]::FromArgb(150, 0, 0)
        $textMatricula.BackColor = [System.Drawing.Color]::FromArgb(150, 0, 0)
        Start-Sleep -Milliseconds 500
        $textOR.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
        $textMatricula.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
        return
    }
    
    # AQUI IRA LA CONEXION A SUPABASE
    $mensaje = "GUARDADO:`n`nOR: $or`nMatricula: $matricula`n`n(Proximamente: conexion a base de datos)"
    
    [System.Windows.Forms.MessageBox]::Show(
        $mensaje,
        "CVO - Confirmacion",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    )
    
    # Limpiar campos
    $textOR.Text = "OR"
    $textOR.ForeColor = [System.Drawing.Color]::FromArgb(255, 215, 0)
    $textMatricula.Text = "MAT"
    $textOR.Focus()
})

# Enter en cualquier campo = guardar
$textOR.Add_KeyDown({
    if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Enter) {
        $btnGuardar.PerformClick()
    }
})

$textMatricula.Add_KeyDown({
    if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Enter) {
        $btnGuardar.PerformClick()
    }
})

# Registrar hotkey global Ctrl+Shift+O
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class HotKeyManager {
    [DllImport("user32.dll")]
    public static extern bool RegisterHotKey(IntPtr hWnd, int id, int fsModifiers, int vk);
    [DllImport("user32.dll")]
    public static extern bool UnregisterHotKey(IntPtr hWnd, int id);
}
"@

$MOD_CONTROL = 0x0002
$MOD_SHIFT = 0x0004
$VK_O = 0x4F

try {
    [HotKeyManager]::RegisterHotKey($form.Handle, 1, ($MOD_CONTROL -bor $MOD_SHIFT), $VK_O)
} catch {}

# Evento para capturar hotkey
$form.Add_KeyDown({
    if ($_.Control -and $_.Shift -and $_.KeyCode -eq [System.Windows.Forms.Keys]::O) {
        ActualizarORDesdePortapapeles
        $form.Activate()
    }
})

# Manejo de mensaje Windows para hotkey global
$WndProc = {
    param($m)
    if ($m.Msg -eq 0x0312) {  # WM_HOTKEY
        ActualizarORDesdePortapapeles
        $form.Activate()
        $textMatricula.Focus()
    }
}

# Agregar NativeWindow para capturar mensajes
Add-Type @"
using System;
using System.Windows.Forms;
public class HotKeyNativeWindow : NativeWindow {
    public Action<Message> MessageHandler;
    protected override void WndProc(ref Message m) {
        if (MessageHandler != null) MessageHandler(m);
        base.WndProc(ref m);
    }
}
"@

$nativeWindow = New-Object HotKeyNativeWindow
$nativeWindow.AssignHandle($form.Handle)
$nativeWindow.MessageHandler = $WndProc

# Limpiar al cerrar
$form.Add_FormClosing({
    try {
        [HotKeyManager]::UnregisterHotKey($form.Handle, 1)
    } catch {}
    $timer.Stop()
    $nativeWindow.ReleaseHandle()
})

# Mostrar formulario
$form.Add_Shown({
    $textOR.Focus()
})

[void]$form.ShowDialog()

