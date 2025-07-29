# Guía de Permisos y Roles

## 👥 Roles del Sistema

### 1. **admin**
- **Acceso completo** a todas las funcionalidades
- **Puede editar** cualquier vehículo
- **Puede eliminar** ventas y registros
- **Puede acceder** a todas las pestañas
- **Puede modificar** configuraciones del sistema

### 2. **user** (por defecto)
- **Acceso limitado** a funcionalidades básicas
- **Puede ver** vehículos en stock
- **Puede editar** campos básicos (OR, cargo gastos)
- **NO puede eliminar** ventas
- **NO puede acceder** a configuraciones avanzadas

### 3. **photographer**
- **Acceso específico** a funcionalidades de fotos
- **Puede ver** vehículos pendientes de fotos
- **Puede marcar** fotos como completadas
- **Acceso limitado** a otras funcionalidades

## 🔐 Permisos por Funcionalidad

### Tabla de Stock
```typescript
// Verificar permisos antes de mostrar opciones
const canEdit = userRoles.includes('admin') || userRoles.includes('user')
const canDelete = userRoles.includes('admin')
const canViewAllTabs = userRoles.includes('admin')
```

### Edición de Vehículos
```typescript
// Campos editables según rol
const editableFields = {
  admin: ['all'],
  user: ['or', 'expense_charge', 'work_center'],
  photographer: ['photo_status']
}
```

### Eliminación de Ventas
```typescript
// Solo admin puede eliminar ventas
const canDeleteSale = userRoles.includes('admin')
```

## 🛡️ Implementación de Seguridad

### 1. Verificación de Roles en Frontend
```typescript
// En componentes
const { userRoles } = useAuth()

// Verificar antes de mostrar opciones
{userRoles.includes('admin') && (
  <Button onClick={handleDelete}>Eliminar</Button>
)}
```

### 2. Verificación de Roles en Backend
```typescript
// En API routes
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('roles')
  .eq('id', user.id)
  .single()

if (!profile.roles.includes('admin')) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
}
```

### 3. Row Level Security (RLS)
```sql
-- Ejemplo de política RLS
CREATE POLICY "Users can view their own data" ON stock
FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all data" ON stock
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND 'admin' = ANY(profiles.roles)
  )
);
```

## 📊 Matriz de Permisos

| Funcionalidad | admin | user | photographer |
|---------------|-------|------|--------------|
| Ver todos los vehículos | ✅ | ✅ | ✅ |
| Editar campos básicos | ✅ | ✅ | ❌ |
| Editar estados | ✅ | ❌ | ❌ |
| Eliminar ventas | ✅ | ❌ | ❌ |
| Ver pestaña "Vendido" | ✅ | ✅ | ❌ |
| Ver pestaña "No Retail" | ✅ | ✅ | ❌ |
| Ver pestaña "Entregados" | ✅ | ✅ | ❌ |
| Acceder a configuraciones | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

## 🔧 Funciones de Verificación

### Hook de Autenticación
```typescript
// hooks/use-auth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Verificar roles
  const hasRole = (role: string) => userRoles.includes(role)
  const hasAnyRole = (roles: string[]) => roles.some(role => userRoles.includes(role))

  return { user, userRoles, loading, hasRole, hasAnyRole }
}
```

### Componente de Protección
```typescript
// components/auth/protected-route.tsx
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles: string[]
  fallback?: React.ReactNode
}

export const ProtectedRoute = ({ children, requiredRoles, fallback }: ProtectedRouteProps) => {
  const { userRoles, loading } = useAuth()
  
  if (loading) return <div>Cargando...</div>
  
  const hasAccess = requiredRoles.some(role => userRoles.includes(role))
  
  if (!hasAccess) {
    return fallback || <div>No tienes permisos para acceder a esta página</div>
  }
  
  return <>{children}</>
}
```

## 🚨 Casos de Uso Específicos

### 1. Edición de Vehículos
```typescript
// Verificar antes de permitir edición
const canEditVehicle = (item: StockItem) => {
  if (userRoles.includes('admin')) return true
  if (userRoles.includes('user')) {
    // Solo campos básicos
    return ['or', 'expense_charge', 'work_center'].includes(field)
  }
  return false
}
```

### 2. Eliminación de Ventas
```typescript
// Solo admin puede eliminar
const handleDeleteSale = async (saleId: string) => {
  if (!userRoles.includes('admin')) {
    toast.error('No tienes permisos para eliminar ventas')
    return
  }
  // Proceder con eliminación
}
```

### 3. Acceso a Pestañas
```typescript
// Mostrar pestañas según rol
const visibleTabs = [
  { value: 'all', label: 'Todos', roles: ['admin', 'user', 'photographer'] },
  { value: 'vendido', label: 'Vendido', roles: ['admin', 'user'] },
  { value: 'profesionales', label: 'No Retail', roles: ['admin', 'user'] },
  { value: 'entregados', label: 'Entregados', roles: ['admin', 'user'] }
].filter(tab => tab.roles.some(role => userRoles.includes(role)))
```

## 📝 Checklist de Implementación

### Frontend
- [ ] Implementar verificación de roles en componentes
- [ ] Ocultar/mostrar elementos según permisos
- [ ] Mostrar mensajes de error apropiados
- [ ] Implementar fallbacks para usuarios sin permisos

### Backend
- [ ] Verificar roles en todas las API routes
- [ ] Implementar RLS en tablas sensibles
- [ ] Validar permisos antes de operaciones críticas
- [ ] Logging de acciones administrativas

### Base de Datos
- [ ] Configurar políticas RLS
- [ ] Crear índices para consultas de roles
- [ ] Implementar auditoría de cambios
- [ ] Backup de configuraciones de permisos 