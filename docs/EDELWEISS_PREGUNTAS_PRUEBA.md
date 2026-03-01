# Preguntas de prueba para Edelweiss

## Ejecutar desde terminal (recomendado)

Con el servidor en marcha (`npm run dev`), puedes lanzar las preguntas directamente contra la API:

```bash
node scripts/test-edelweiss-questions.js
```

Verás cada pregunta y la respuesta de Edelweiss en la terminal. Para ejecutar solo las N primeras preguntas:

```bash
node scripts/test-edelweiss-questions.js 3
```

Si el servidor no está en `localhost:3000`:

```bash
EDELWEISS_TEST_URL=http://localhost:3001 node scripts/test-edelweiss-questions.js
```

---

## Copiar y pegar en el chat

Si prefieres probar en la web, copia y pega estas preguntas en el chat de Edelweiss.

---

## Ventas

- Cuántos coches hemos vendido esta semana
- Cuántos BMW hemos vendido la semana pasada
- Ventas del mes
- Dime las ventas de hoy
- ¿Qué color es el que más se vende?
- ¿Qué modelo se vende más?

---

## Entregas

- Cuántos coches hemos entregado esta semana
- Cuántos coches hemos entregado
- Listado de entregas de la semana pasada
- Entregas del mes

---

## Stock / vehículos

- Qué vehículos hay en stock
- Buscar BMW X3
- Hay algún Serie 1 disponible

---

## Contactos

- Teléfono de [nombre de asesor]
- Buscar contacto de [nombre]

---

## Otros

- ¿Quién ganó el último GP de F1?
- Resumen de noticias de hoy
