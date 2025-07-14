"use client"

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Ejecutar inmediatamente sin esperar
            try {
              // Obtener el tema guardado en localStorage
              const savedTheme = localStorage.getItem('theme');
              let theme = 'dark'; // Tema por defecto
              
              if (savedTheme) {
                if (savedTheme === 'system') {
                  // Detectar tema del sistema
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  theme = systemTheme;
                } else {
                  theme = savedTheme;
                }
              }
              
              // Aplicar el tema inmediatamente para evitar flash
              const html = document.documentElement;
              const body = document.body;
              
              // Remover todas las clases de tema
              html.classList.remove('light', 'dark', 'ocre');
              body.classList.remove('light', 'dark', 'ocre');
              
              // Agregar la clase del tema correcto
              html.classList.add(theme);
              body.classList.add(theme);
              
              // Log para debugging
              console.log('🎨 ThemeScript: Tema aplicado:', theme, 'desde localStorage:', savedTheme);
              
              // Forzar repaint para asegurar que se aplique
              document.body.style.display = 'none';
              document.body.offsetHeight; // Trigger reflow
              document.body.style.display = '';
            } catch (error) {
              console.error('Error al aplicar tema inicial:', error);
              // Fallback a tema oscuro
              document.documentElement.classList.add('dark');
              document.body.classList.add('dark');
            }
          })();
        `,
      }}
    />
  )
} 