// 🔍 MONITOR DE DEBUG V2 - MEJORADO
// Detecta el problema REAL de múltiples instancias de GoTrueClient

(function() {
  console.log('%c🔍 MONITOR V2 ACTIVADO', 'background: blue; color: white; padding: 5px; font-weight: bold;');
  
  window.__queryLog = [];
  window.__errorLog = [];
  window.__goTrueInstances = 0;
  
  // 1. INTERCEPTAR CREACIÓN DE GoTrueClient
  const originalConsoleWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('Multiple GoTrueClient instances')) {
      console.error('%c🚨 MÚLTIPLES INSTANCIAS DETECTADAS', 'background: red; color: white; padding: 10px; font-weight: bold; font-size: 16px;');
      console.error('⚠️ ESTE ES EL PROBLEMA REAL');
      window.__goTrueInstances++;
    }
    originalConsoleWarn.apply(console, args);
  };
  
  // 2. INTERCEPTAR ERRORES DE PARSING DE COOKIES
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('Failed to parse cookie string')) {
      console.log('%c🔴 ERROR DE PARSING DE COOKIE', 'background: red; color: white; padding: 5px; font-weight: bold;');
      console.log('⏰ Tiempo:', new Date().toLocaleTimeString());
      console.log('📍 Página:', window.location.pathname);
      
      window.__errorLog.push({
        time: new Date().toLocaleTimeString(),
        type: 'COOKIE_PARSE_ERROR',
        page: window.location.pathname,
        message: message.substring(0, 200)
      });
    }
    originalConsoleError.apply(console, args);
  };
  
  // 3. MONITOREAR CONSULTAS SUPABASE
  const originalFetch = window.fetch;
  let queryCount = 0;
  let lastMinuteQueries = [];
  
  window.fetch = async function(...args) {
    const url = args[0]?.toString() || '';
    
    if (url.includes('supabase.co')) {
      queryCount++;
      const now = Date.now();
      const timestamp = new Date().toLocaleTimeString();
      
      const logEntry = {
        time: timestamp,
        timestamp: now,
        count: queryCount,
        url: url.substring(0, 100),
        page: window.location.pathname
      };
      
      window.__queryLog.push(logEntry);
      lastMinuteQueries.push(now);
      
      // Limpiar consultas de hace más de 1 minuto
      lastMinuteQueries = lastMinuteQueries.filter(t => now - t < 60000);
      
      // ALERTA: Más de 50 consultas en 1 minuto
      if (lastMinuteQueries.length > 50) {
        console.error('%c⚠️ SOBRECARGA: +50 consultas en 1 minuto', 'background: orange; color: white; padding: 5px; font-weight: bold;');
        console.error(`📊 Total en último minuto: ${lastMinuteQueries.length}`);
      }
      
      if (queryCount % 10 === 0) {
        console.log(`%c📊 ${queryCount} consultas Supabase`, 'color: #00cc00');
      }
    }
    
    try {
      const response = await originalFetch.apply(this, args);
      return response;
    } catch (error) {
      if (url.includes('supabase.co')) {
        window.__errorLog.push({
          time: new Date().toLocaleTimeString(),
          type: 'FETCH_ERROR',
          error: error.message,
          url: url.substring(0, 100),
          page: window.location.pathname
        });
        console.error('%c❌ Error en consulta Supabase:', 'color: red; font-weight: bold;', error);
      }
      throw error;
    }
  };
  
  // 4. DETECTAR NAVEGACIÓN
  let lastPage = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== lastPage) {
      console.log(`%c🔄 Navegación: ${lastPage} → ${window.location.pathname}`, 'color: cyan; font-weight: bold;');
      lastPage = window.location.pathname;
    }
  }, 1000);
  
  // 5. COMANDOS DISPONIBLES
  window.debugMonitor = {
    getStats: () => {
      console.log('%c📊 ESTADÍSTICAS COMPLETAS', 'background: green; color: white; padding: 5px; font-weight: bold;');
      console.log(`Total consultas Supabase: ${queryCount}`);
      console.log(`Total errores: ${window.__errorLog.length}`);
      console.log(`Instancias GoTrueClient: ${window.__goTrueInstances}`);
      console.log(`Página actual: ${window.location.pathname}`);
      console.log(`Consultas último minuto: ${lastMinuteQueries.length}`);
      
      const byPage = {};
      window.__queryLog.forEach(entry => {
        byPage[entry.page] = (byPage[entry.page] || 0) + 1;
      });
      console.log('Consultas por página:', byPage);
      
      const errorsByType = {};
      window.__errorLog.forEach(entry => {
        errorsByType[entry.type] = (errorsByType[entry.type] || 0) + 1;
      });
      console.log('Errores por tipo:', errorsByType);
      
      return {
        totalQueries: queryCount,
        totalErrors: window.__errorLog.length,
        goTrueInstances: window.__goTrueInstances,
        currentPage: window.location.pathname,
        queriesLastMinute: lastMinuteQueries.length,
        queriesByPage: byPage,
        errorsByType: errorsByType
      };
    },
    
    getErrors: () => {
      console.log('%c❌ ERRORES REGISTRADOS', 'background: red; color: white; padding: 5px; font-weight: bold;');
      if (window.__errorLog.length === 0) {
        console.log('✅ No hay errores registrados');
      } else {
        console.table(window.__errorLog);
      }
      return window.__errorLog;
    },
    
    getLastQueries: (n = 20) => {
      console.log(`%c📋 ÚLTIMAS ${n} CONSULTAS`, 'background: purple; color: white; padding: 5px; font-weight: bold;');
      const queries = window.__queryLog.slice(-n);
      if (queries.length === 0) {
        console.log('ℹ️ No hay consultas registradas aún');
      } else {
        console.table(queries);
      }
      return queries;
    },
    
    getQueriesPerMinute: () => {
      console.log('%c⏱️ CONSULTAS POR MINUTO', 'background: blue; color: white; padding: 5px; font-weight: bold;');
      console.log(`Consultas en el último minuto: ${lastMinuteQueries.length}`);
      
      if (lastMinuteQueries.length > 30) {
        console.warn('⚠️ Tasa de consultas elevada (normal: < 30/min)');
      } else {
        console.log('✅ Tasa de consultas normal');
      }
      
      return {
        count: lastMinuteQueries.length,
        status: lastMinuteQueries.length > 30 ? 'HIGH' : 'NORMAL'
      };
    },
    
    reset: () => {
      window.__queryLog = [];
      window.__errorLog = [];
      window.__goTrueInstances = 0;
      queryCount = 0;
      lastMinuteQueries = [];
      console.log('✅ Monitor reseteado');
    },
    
    help: () => {
      console.log('%c📖 COMANDOS DISPONIBLES:', 'background: blue; color: white; padding: 5px; font-weight: bold;');
      console.log('  debugMonitor.getStats()          - Ver estadísticas completas');
      console.log('  debugMonitor.getErrors()         - Ver errores registrados');
      console.log('  debugMonitor.getLastQueries(20)  - Ver últimas 20 consultas');
      console.log('  debugMonitor.getQueriesPerMinute() - Ver tasa de consultas');
      console.log('  debugMonitor.reset()             - Resetear monitor');
      console.log('  debugMonitor.help()              - Ver esta ayuda');
    }
  };
  
  console.log('%c✅ Monitor V2 activo', 'color: green; font-weight: bold;');
  console.log('%c📖 Escribe debugMonitor.help() para ver comandos', 'color: cyan;');
  console.log('\n🎯 Continúa usando la app. Cuando falle, ejecuta: debugMonitor.getStats()\n');
})();

