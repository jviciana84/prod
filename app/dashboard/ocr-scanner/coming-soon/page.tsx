'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Scan, 
  Construction, 
  Clock, 
  Sparkles, 
  ArrowLeft,
  Camera,
  FileText,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ComingSoonPage() {
  const router = useRouter();

  const features = [
    {
      icon: <Camera className="h-6 w-6" />,
      title: "Escaneo con Cámara",
      description: "Captura matrículas y texto directamente con tu dispositivo"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "OCR Inteligente",
      description: "Reconocimiento óptico de caracteres avanzado"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Procesamiento Rápido",
      description: "Resultados instantáneos y precisos"
    }
  ];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Scan className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Scanner OCR</h1>
          </div>
          <Badge variant="secondary" className="mb-4">
            <Construction className="h-3 w-3 mr-1" />
            En Desarrollo
          </Badge>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Estamos trabajando en una herramienta revolucionaria para escanear matrículas 
            y texto con tu cámara. ¡Pronto estará disponible!
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
            <Construction className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Funcionalidad en Construcción</CardTitle>
          <p className="text-muted-foreground">
            Esta característica está siendo desarrollada activamente por nuestro equipo
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4 rounded-lg border bg-card">
                <div className="mx-auto mb-3 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-semibold">¿Cuándo estará disponible?</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Estamos trabajando arduamente para lanzar esta funcionalidad lo antes posible. 
              Los administradores ya pueden probar la versión beta.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">
                Acceso anticipado disponible para administradores
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact/Support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">¿Necesitas ayuda?</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Si tienes alguna pregunta sobre esta funcionalidad o necesitas acceso anticipado, 
            contacta con el administrador del sistema.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Ir al Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push('/soporte')}>
              Contactar Soporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
