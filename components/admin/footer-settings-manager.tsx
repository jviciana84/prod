"use client"

import { useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Save } from "lucide-react"

interface FooterSettings {
  show_marquee: boolean
  animation_speed: number
  text_color: string
  hover_effect: boolean
}

interface FooterSettingsManagerProps {
  initialSettings: FooterSettings
}

export default function FooterSettingsManager({ initialSettings }: FooterSettingsManagerProps) {
  const [settings, setSettings] = useState<FooterSettings>(initialSettings)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Manejar cambios en los ajustes
  const handleSettingChange = (key: keyof FooterSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Guardar configuración
  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("settings").upsert(
        {
          key: "footer_settings",
          value: settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      )

      if (error) throw error

      toast({
        title: "Configuración guardada",
        description: "La configuración del footer se ha guardado correctamente",
      })
    } catch (error: any) {
      console.error("Error al guardar configuración:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Footer</CardTitle>
        <CardDescription>Personaliza la apariencia y comportamiento del footer de la aplicación.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-marquee" className="text-sm font-medium">
              Mostrar texto en movimiento
            </Label>
            <Switch
              id="show-marquee"
              checked={settings.show_marquee}
              onCheckedChange={(checked) => handleSettingChange("show_marquee", checked)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Activa o desactiva el efecto de texto en movimiento en el footer.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="animation-speed" className="text-sm font-medium">
            Velocidad de animación
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              id="animation-speed"
              min={5}
              max={40}
              step={1}
              value={[settings.animation_speed]}
              onValueChange={(value) => handleSettingChange("animation_speed", value[0])}
              disabled={!settings.show_marquee}
              className="flex-1"
            />
            <span className="w-12 text-center text-sm">{settings.animation_speed}s</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Ajusta la velocidad de la animación del texto en movimiento (en segundos).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="text-color" className="text-sm font-medium">
            Color del texto
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="text-color"
              type="color"
              value={settings.text_color}
              onChange={(e) => handleSettingChange("text_color", e.target.value)}
              className="w-16 h-10 p-1"
            />
            <Input
              type="text"
              value={settings.text_color}
              onChange={(e) => handleSettingChange("text_color", e.target.value)}
              className="flex-1"
              placeholder="#666666"
            />
          </div>
          <p className="text-xs text-muted-foreground">Selecciona el color del texto en el footer.</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="hover-effect" className="text-sm font-medium">
              Efecto al pasar el cursor
            </Label>
            <Switch
              id="hover-effect"
              checked={settings.hover_effect}
              onCheckedChange={(checked) => handleSettingChange("hover_effect", checked)}
              disabled={!settings.show_marquee}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Activa o desactiva el efecto de degradado al pasar el cursor sobre el texto.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} disabled={isLoading} className="ml-auto">
          {isLoading ? <BMWMSpinner size={16} className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar configuración
        </Button>
      </CardFooter>
    </Card>
  )
}
