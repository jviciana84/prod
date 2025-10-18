# 🔄 ROLLBACK SEGURO A COMMIT 1efad8c

## ✅ PASO 1: Guardar trabajo actual (noticias + wrapper)

```powershell
# Crear rama de respaldo con TODO el trabajo actual
git branch backup-noticias-wrapper

# Verificar que se creó
git branch
```

## ✅ PASO 2: Volver al commit que funcionaba (1efad8c)

```powershell
# Volver a ese commit (antes de noticias)
git reset --hard 1efad8c

# Forzar push a producción
git push origin main --force
```

## ✅ PASO 3: Esperar deploy de Vercel (2-3 minutos)

Vercel detectará el cambio y desplegará automáticamente.

## ✅ PASO 4: Probar en producción

1. Ve a https://www.controlvo.ovh/dashboard/ventas
2. Navega: Fotos → Ventas → Fotos → Ventas
3. Verifica que todo carga correctamente

---

## 🔙 PASO 5: Si funciona, recuperar noticias con el fix

```powershell
# Ver los commits de la rama de backup
git log backup-noticias-wrapper --oneline -5

# Crear cherry-pick de solo los commits de noticias (SIN el wrapper fallido)
git cherry-pick 67e504f  # commit de noticias
git cherry-pick ddcfc2b  # script búsqueda Quadis  
git cherry-pick fe01fbf  # fix orden noticias

# Ahora aplicar el wrapper corregido
git cherry-pick 912bbc2  # wrapper automático

# Push a producción
git push origin main
```

---

## 🎯 RESUMEN:

1. **Backup** → Guarda todo en `backup-noticias-wrapper`
2. **Rollback** → Vuelve a `1efad8c` (funcionaba)
3. **Probar** → Confirma que funciona
4. **Recuperar** → Cherry-pick de noticias + wrapper

**NO PIERDES NADA**, todo está guardado en la rama de backup.

---

## ⚠️ Si algo sale mal:

```powershell
# Volver al estado actual
git reset --hard backup-noticias-wrapper
git push origin main --force
```

