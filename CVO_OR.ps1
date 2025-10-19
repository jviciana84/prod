# CVO - Actualizador OR
# Ctrl+º para mostrar/ocultar

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Crear formulario compacto
$form = New-Object System.Windows.Forms.Form
$form.Text = "CVO"
$form.Size = New-Object System.Drawing.Size(250, 90)
$form.StartPosition = "CenterScreen"
$form.TopMost = $true
$form.FormBorderStyle = "FixedToolWindow"
$form.BackColor = [System.Drawing.Color]::FromArgb(32, 32, 32)
$form.ShowInTaskbar = $true
$form.Visible = $false  # Inicia oculto

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
$textOR.Size = New-Object System.Drawing.Size(185, 22)
$textOR.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
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
$textMatricula.Size = New-Object System.Drawing.Size(185, 22)
$textMatricula.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$textMatricula.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
$textMatricula.ForeColor = [System.Drawing.Color]::White
$textMatricula.BorderStyle = "FixedSingle"
$textMatricula.CharacterCasing = "Upper"
$form.Controls.Add($textMatricula)

# Funcion guardar
function Guardar {
    $or = $textOR.Text.Trim()
    $mat = $textMatricula.Text.Trim()
    
    if ($or -eq "" -or $mat -eq "") {
        $textOR.BackColor = [System.Drawing.Color]::FromArgb(150, 0, 0)
        $textMatricula.BackColor = [System.Drawing.Color]::FromArgb(150, 0, 0)
        Start-Sleep -Milliseconds 200
        $textOR.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
        $textMatricula.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
        return
    }
    
    # AQUI IRA CONEXION SUPABASE
    Write-Host "Guardado: OR=$or MAT=$mat"
    
    # Limpiar y ocultar
    $textOR.Text = ""
    $textMatricula.Text = ""
    $form.Visible = $false
}

# Funcion mostrar ventana
function MostrarVentana {
    # Copiar texto seleccionado
    Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class Key {
            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
        }
"@
    
    [Key]::keybd_event(0x11, 0, 0, 0)  # Ctrl down
    [Key]::keybd_event(0x43, 0, 0, 0)  # C down
    [Key]::keybd_event(0x43, 0, 2, 0)  # C up
    [Key]::keybd_event(0x11, 0, 2, 0)  # Ctrl up
    
    Start-Sleep -Milliseconds 100
    
    if ([System.Windows.Forms.Clipboard]::ContainsText()) {
        $textOR.Text = [System.Windows.Forms.Clipboard]::GetText().Trim()
    }
    
    $form.Visible = $true
    $form.Activate()
    $textMatricula.Focus()
}

# Enter = guardar y cerrar
$textOR.Add_KeyDown({
    if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Enter) {
        Guardar
        $_.SuppressKeyPress = $true
    }
})

$textMatricula.Add_KeyDown({
    if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Enter) {
        Guardar
        $_.SuppressKeyPress = $true
    }
})

# Evitar que se cierre al presionar X, solo ocultar
$form.Add_FormClosing({
    param($sender, $e)
    if ($e.CloseReason -eq [System.Windows.Forms.CloseReason]::UserClosing) {
        $e.Cancel = $true
        $form.Visible = $false
    }
})

# Registrar hotkey Ctrl+º
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class HK {
    [DllImport("user32.dll")]
    public static extern bool RegisterHotKey(IntPtr hWnd, int id, int fsModifiers, int vk);
    [DllImport("user32.dll")]
    public static extern bool UnregisterHotKey(IntPtr hWnd, int id);
}
"@

$MOD_CONTROL = 0x0002
$VK_OEM_5 = 0xDC  # º

# Esperar a que el formulario tenga handle
$form.Show()
$form.Visible = $false

try {
    [HK]::RegisterHotKey($form.Handle, 1, $MOD_CONTROL, $VK_OEM_5)
    Write-Host "CVO activo. Presiona Ctrl+º para usar."
} catch {
    Write-Host "Error al registrar Ctrl+º. Intentando tecla alternativa..."
    $VK_OEM_3 = 0xC0
    [HK]::RegisterHotKey($form.Handle, 1, $MOD_CONTROL, $VK_OEM_3)
}

# Capturar hotkey
Add-Type @"
using System;
using System.Windows.Forms;
public class HKWin : NativeWindow {
    public Action<Message> Handler;
    protected override void WndProc(ref Message m) {
        if (Handler != null) Handler(m);
        base.WndProc(ref m);
    }
}
"@

$nativeWin = New-Object HKWin
$nativeWin.AssignHandle($form.Handle)
$nativeWin.Handler = {
    param($m)
    if ($m.Msg -eq 0x0312) {  # WM_HOTKEY
        if ($form.Visible) {
            $form.Visible = $false
        } else {
            MostrarVentana
        }
    }
}

# Limpiar al cerrar realmente
$form.Add_Disposed({
    try {
        [HK]::UnregisterHotKey($form.Handle, 1)
    } catch {}
    $nativeWin.ReleaseHandle()
})

# Loop de mensajes
[System.Windows.Forms.Application]::Run($form)





