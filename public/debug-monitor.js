/**
 * 🔍 MONITOR DE DEBUG - Detecta cuándo y cómo falla el sistema
 * 
 * Pega este código en la CONSOLE del navegador para monitorear en tiempo real
 * 
 * Copia y pega TODO este código en Console (F12) y presiona Enter
 */

(function() {
  console.log('%c🔍 MONITOR DE DEBUG ACTIVADO', 'background: blue; color: white; padding: 5px; font-weight: bold;');
  
  // Contador de instancias de Supabase
  window.__supabaseInstances = window.__supabaseInstances || [];
  window.__queryLog = [];
  window.__errorLog = [];
  
  // Detectar creación de nuevas instancias
  const originalFetch = window.fetch;
  let queryCount = 0;
  
  window.fetch = async function(...args) {
    const url = args[0]?.toString() || '';
    
    // Si es consulta a Supabase
    if (url.includes('supabase.co')) {
      queryCount++;
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = {
        time: timestamp,
        count: queryCount,
        url: url.substring(0, 100),
        page: window.location.pathname
      };
      
      window.__queryLog.push(logEntry);
      
      // Log cada 5 consultas
      if (queryCount % 5 === 0) {
        console.log(`%c📊 ${queryCount} consultas Supabase realizadas`, 'color: orange');
      }
    }
    
    try {
      const response = await originalFetch.apply(this, args);
      return response;
    } catch (error) {
      if (url.includes('supabase.co')) {
        window.__errorLog.push({
          time: new Date().toLocaleTimeString(),
          error: error.message,
          url: url.substring(0, 100)
        });
        console.error('❌ Error en consulta Supabase:', error);
      }
      throw error;
    }
  };
  
  // Monitorear cookies
  const checkCookies = () => {
    const cookies = document.cookie.split(';');
    const supabaseCookies = cookies.filter(c => c.includes('sb-'));
    
    supabaseCookies.forEach(cookie => {
      const [name, value] = cookie.split('=');
      if (value && value.trim().startsWith('base64-')) {
        console.error('%c🚨 COOKIE CORRUPTA DETECTADA', 'background: red; color: white; padding: 5px; font-weight: bold;');
        console.error('Cookie:', name.trim());
        console.error('Valor:', value.substring(0, 50) + '...');
      }
    });
  };
  
  // Revisar cookies cada 10 segundos
  setInterval(checkCookies, 10000);
  
  // Monitorear navegación
  let lastPage = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== lastPage) {
      console.log(`%c🔄 Navegación: ${lastPage} → ${window.location.pathname}`, 'color: cyan');
      lastPage = window.location.pathname;
    }
  }, 1000);
  
  // Comandos disponibles en console
  window.debugMonitor = {
    getStats: () => {
      console.log('%c📊 ESTADÍSTICAS', 'background: green; color: white; padding: 5px; font-weight: bold;');
      console.log(`Total consultas Supabase: ${queryCount}`);
      console.log(`Total errores: ${window.__errorLog.length}`);
      console.log(`Página actual: ${window.location.pathname}`);
      
      // Agrupar consultas por página
      const byPage = {};
      window.__queryLog.forEach(entry => {
        byPage[entry.page] = (byPage[entry.page] || 0) + 1;
      });
      console.log('Consultas por página:', byPage);
      
      return {
        totalQueries: queryCount,
        totalErrors: window.__errorLog.length,
        currentPage: window.location.pathname,
        queriesByPage: byPage
      };
    },
    
    getErrors: () => {
      console.log('%c❌ ERRORES', 'background: red; color: white; padding: 5px; font-weight: bold;');
      console.table(window.__errorLog);
      return window.__errorLog;
    },
    
    getLastQueries: (n = 10) => {
      console.log(`%c📋 ÚLTIMAS ${n} CONSULTAS`, 'background: purple; color: white; padding: 5px; font-weight: bold;');
      console.table(window.__queryLog.slice(-n));
      return window.__queryLog.slice(-n);
    },
    
    checkCookiesNow: () => {
      console.log('%c🍪 VERIFICANDO COOKIES', 'background: orange; color: white; padding: 5px; font-weight: bold;');
      checkCookies();
      
      const cookies = document.cookie.split(';');
      const supabaseCookies = cookies.filter(c => c.includes('sb-'));
      console.log(`Total cookies Supabase: ${supabaseCookies.length}`);
      return supabaseCookies;
    },
    
    reset: () => {
      window.__queryLog = [];
      window.__errorLog = [];
      queryCount = 0;
      console.log('✅ Monitor reseteado');
    }
  };
  
  console.log('%c📖 COMANDOS DISPONIBLES:', 'background: blue; color: white; padding: 5px; font-weight: bold;');
  console.log('  debugMonitor.getStats()       - Ver estadísticas generales');
  console.log('  debugMonitor.getErrors()      - Ver errores registrados');
  console.log('  debugMonitor.getLastQueries() - Ver últimas consultas');
  console.log('  debugMonitor.checkCookiesNow() - Verificar cookies ahora');
  console.log('  debugMonitor.reset()          - Resetear monitor');
  console.log('\n✅ Monitor activo. Continúa usando la app normalmente.\n');
})();


