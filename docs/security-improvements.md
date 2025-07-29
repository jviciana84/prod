# Mejoras de Seguridad - CVO Dashboard

## Análisis de Seguridad Actual

### ✅ **Fortalezas**
- Autenticación con Supabase Auth
- RLS (Row Level Security) implementado
- Middleware de protección de rutas
- Validación de roles y permisos

### ⚠️ **Vulnerabilidades Identificadas**

#### 1. **Manejo de Errores Expuesto**
```typescript
// ❌ Actual - Información sensible en logs
console.error("Error al obtener usuario:", error)

// ✅ Mejorado - Logs sanitizados
console.error("Error de autenticación:", {
  code: error.code,
  status: error.status,
  // Sin exponer datos sensibles
})
```

#### 2. **Validación de Input Insuficiente**
```typescript
// ❌ Actual - Sin validación
const handleSubmit = (data: any) => {
  // Procesar datos sin validar
}

// ✅ Mejorado - Con Zod
import { z } from 'zod'

const VehicleSchema = z.object({
  licensePlate: z.string().regex(/^[0-9]{4}[A-Z]{3}$/),
  model: z.string().min(1).max(100),
  price: z.number().positive(),
})

const handleSubmit = (data: unknown) => {
  const validated = VehicleSchema.parse(data)
  // Procesar datos validados
}
```

#### 3. **Rate Limiting Faltante**
```typescript
// Implementar rate limiting en APIs
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas requests desde esta IP'
})
```

### 3. **Mejoras de Seguridad Recomendadas**

#### A. **Implementar CSP (Content Security Policy)**
```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://*.supabase.co;
    `
  }
]
```

#### B. **Validación de Archivos Mejorada**
```typescript
// utils/file-validation.ts
export function validateFileUpload(file: File) {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
  
  if (file.size > MAX_SIZE) {
    throw new Error('Archivo demasiado grande')
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido')
  }
  
  // Verificar contenido real del archivo
  return validateFileContent(file)
}
```

#### C. **Auditoría de Acciones**
```sql
-- Crear tabla de auditoría
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para auditoría automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id, 
    old_values, new_values, ip_address
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### D. **Encriptación de Datos Sensibles**
```typescript
// utils/encryption.ts
import crypto from 'crypto'

export function encryptSensitiveData(data: string): string {
  const algorithm = 'aes-256-gcm'
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32)
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipher(algorithm, key)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return `${iv.toString('hex')}:${encrypted}`
}
```

### 4. **Monitoreo de Seguridad**

#### A. **Implementar Logs de Seguridad**
```typescript
// lib/security-logger.ts
export function logSecurityEvent(event: {
  type: 'login' | 'logout' | 'permission_denied' | 'suspicious_activity'
  userId?: string
  details: Record<string, any>
}) {
  console.log(`[SECURITY] ${event.type}:`, {
    timestamp: new Date().toISOString(),
    userId: event.userId,
    ip: getClientIP(),
    userAgent: getUserAgent(),
    ...event.details
  })
}
```

#### B. **Alertas de Seguridad**
```typescript
// Implementar alertas para:
// - Múltiples intentos de login fallidos
// - Acceso a rutas restringidas
// - Cambios en datos críticos
// - Actividad fuera de horario laboral
```

### 5. **Plan de Implementación**

1. **Semana 1**: Validación de input con Zod
2. **Semana 2**: Rate limiting y CSP
3. **Semana 3**: Auditoría y logs de seguridad
4. **Semana 4**: Encriptación de datos sensibles
5. **Semana 5**: Monitoreo y alertas 