# SISTEMA ACTUAL - SOLO DOCUMENTACIÓN

## 📋 ESTADO ACTUAL DEL SISTEMA

### Tabla Stock (stock-table.tsx)
- **Pestañas existentes**: "Todos", "Pendientes", "En proceso", "Completados", "Ventas Prematuras"
- **Campo is_sold**: true = vendido, false/null = disponible
- **Estados**: body_status, mechanical_status, paint_status

### Tabla duc_scraper
- **Campo "Disponibilidad"**: "RESERVADO", "Disponible", etc.
- **Campo "Matrícula"**: Matrícula del vehículo

### Problema identificado
- Vehículos marcados como "RESERVADO" en duc_scraper aparecen como disponibles en stock
- No hay sincronización automática entre duc_scraper y stock

---

## 🔍 ANÁLISIS SIN MODIFICACIONES

### Flujo actual
1. Scraper → CSV → duc_scraper
2. duc_scraper NO sincroniza con stock
3. Vehículos reservados siguen como disponibles

### Lo que falta
- Trigger para sincronizar duc_scraper con stock
- Marcar is_sold = true cuando "Disponibilidad" = "RESERVADO"

---

## 📝 NOTAS IMPORTANTES

**NO SE HA MODIFICADO NADA**
- Sistema actual intacto
- Solo documentación creada
- Pendiente de entender mejor el flujo antes de sugerir cambios 