# CVO - Actualizador OR
# Atajo: Ctrl+º (selecciona texto, presiona Ctrl+º, escribe matricula, Enter)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Crear formulario en barra de tareas
$form = New-Object System.Windows.Forms.Form
$form.Text = "CVO"
$form.Size = New-Object System.Drawing.Size(250, 110)
$form.StartPosition = "CenterScreen"
$form.TopMost = $true
$form.FormBorderStyle = "FixedToolWindow"
$form.BackColor = [System.Drawing.Color]::FromArgb(32, 32, 32)
$form.ShowInTaskbar = $true
$form.WindowState = "Minimized"  # Inicia minimizado

# Label OR
$labelOR = New-Object System.Windows.Forms.Label
$labelOR.Location = New-Object System.Drawing.Point(10, 10)
$labelOR.Size = New-Object System.Drawing.Size(30, 20)
$labelOR.Text = "OR:"
$labelOR.ForeColor = [System.Drawing.Color]::White
$labelOR.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($labelOR)

# TextBox OR
$textOR = New-Object System.Windows.Forms.TextBox
$textOR.Location = New-Object System.Drawing.Point(45, 8)
$textOR.Size = New-Object System.Drawing.Size(185, 24)
$textOR.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$textOR.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
$textOR.ForeColor = [System.Drawing.Color]::FromArgb(255, 215, 0)
$textOR.BorderStyle = "FixedSingle"
$form.Controls.Add($textOR)

# Label Matricula
$labelMat = New-Object System.Windows.Forms.Label
$labelMat.Location = New-Object System.Drawing.Point(10, 38)
$labelMat.Size = New-Object System.Drawing.Size(30, 20)
$labelMat.Text = "Mat:"
$labelMat.ForeColor = [System.Drawing.Color]::White
$labelMat.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($labelMat)

# TextBox Matricula
$textMatricula = New-Object System.Windows.Forms.TextBox
$textMatricula.Location = New-Object System.Drawing.Point(45, 36)
$textMatricula.Size = New-Object System.Drawing.Size(185, 24)
$textMatricula.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$textMatricula.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
$textMatricula.ForeColor = [System.Drawing.Color]::White
$textMatricula.BorderStyle = "FixedSingle"
$textMatricula.CharacterCasing = "Upper"
$form.Controls.Add($textMatricula)

# Variables globales
$global:lastClipboard = ""

# Funcion para guardar
function GuardarOR {
    $or = $textOR.Text.Trim()
    $matricula = $textMatricula.Text.Trim()
    
    if ($or -eq "" -or $matricula -eq "") {
        $textOR.BackColor = [System.Drawing.Color]::FromArgb(150, 0, 0)
        $textMatricula.BackColor = [System.Drawing.Color]::FromArgb(150, 0, 0)
        Start-Sleep -Milliseconds 300
        $textOR.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
        $textMatricula.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
        return
    }
    
    # AQUI IRA LA CONEXION A SUPABASE
    # Por ahora solo muestra mensaje rapido
    $form.WindowState = "Minimized"
    
    [System.Windows.Forms.MessageBox]::Show(
        "OR: $or`nMatricula: $matricula`n`n(Guardado en CVO)",
        "Confirmacion",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    )
    
    # Limpiar y minimizar
    $textOR.Text = ""
    $textMatricula.Text = ""
}

# Funcion para mostrar ventana y cargar datos
function MostrarVentana {
    # Simular Ctrl+C para copiar texto seleccionado
    Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class KeySim {
            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
        }
"@
    
    # Copiar texto seleccionado
    [KeySim]::keybd_event(0x11, 0, 0, 0)  # Ctrl down
    [KeySim]::keybd_event(0x43, 0, 0, 0)  # C down
    [KeySim]::keybd_event(0x43, 0, 2, 0)  # C up
    [KeySim]::keybd_event(0x11, 0, 2, 0)  # Ctrl up
    
    Start-Sleep -Milliseconds 150
    
    # Obtener del portapapeles
    if ([System.Windows.Forms.Clipboard]::ContainsText()) {
        $textOR.Text = [System.Windows.Forms.Clipboard]::GetText().Trim()
    }
    
    # Mostrar ventana
    $form.WindowState = "Normal"
    $form.Activate()
    $textMatricula.Focus()
}

# Enter en matricula = guardar y cerrar
$textMatricula.Add_KeyDown({
    if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Enter) {
        GuardarOR
        $_.SuppressKeyPress = $true
    }
})

# Registrar hotkey Ctrl+º
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class HotKey {
    [DllImport("user32.dll")]
    public static extern bool RegisterHotKey(IntPtr hWnd, int id, int fsModifiers, int vk);
    [DllImport("user32.dll")]
    public static extern bool UnregisterHotKey(IntPtr hWnd, int id);
}
"@

$MOD_CONTROL = 0x0002
$VK_OEM_5 = 0xDC  # Tecla º (puede variar segun teclado)

try {
    [HotKey]::RegisterHotKey($form.Handle, 1, $MOD_CONTROL, $VK_OEM_5)
} catch {
    # Intentar con otra tecla comun para º
    $VK_OEM_3 = 0xC0
    [HotKey]::RegisterHotKey($form.Handle, 1, $MOD_CONTROL, $VK_OEM_3)
}

# Capturar mensaje de hotkey
Add-Type @"
using System;
using System.Windows.Forms;
public class HotKeyWindow : NativeWindow {
    public Action<Message> Handler;
    protected override void WndProc(ref Message m) {
        if (Handler != null) Handler(m);
        base.WndProc(ref m);
    }
}
"@

$nativeWindow = New-Object HotKeyWindow
$nativeWindow.AssignHandle($form.Handle)
$nativeWindow.Handler = {
    param($m)
    if ($m.Msg -eq 0x0312) {  # WM_HOTKEY
        MostrarVentana
    }
}

# Al cerrar, limpiar hotkey
$form.Add_FormClosing({
    try {
        [HotKey]::UnregisterHotKey($form.Handle, 1)
    } catch {}
    $nativeWindow.ReleaseHandle()
})

# Iniciar minimizado
$form.Add_Shown({
    $form.WindowState = "Minimized"
})

# Mostrar
[void]$form.ShowDialog()
































