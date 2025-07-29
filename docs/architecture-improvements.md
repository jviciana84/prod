# Mejoras de Arquitectura - CVO Dashboard

## Análisis de Arquitectura Actual

### ✅ **Fortalezas**
- Next.js App Router bien estructurado
- Separación clara de componentes
- Supabase como backend completo
- Sistema de autenticación centralizado

### ⚠️ **Problemas Identificados**

#### 1. **Acoplamiento Alto**
- Componentes muy dependientes entre sí
- Lógica de negocio mezclada con UI
- Falta de abstracción de servicios

#### 2. **Gestión de Estado Inconsistente**
- Múltiples fuentes de verdad
- Estado local vs global no sincronizado
- Falta de optimistic updates

#### 3. **Falta de Patrones de Diseño**
- No hay patrón Repository
- Falta de Factory patterns
- Sin implementación de Observer pattern

## Mejoras de Arquitectura

### 1. **Implementar Clean Architecture**

```
src/
├── domain/           # Entidades y reglas de negocio
│   ├── entities/
│   ├── repositories/
│   └── use-cases/
├── infrastructure/   # Implementaciones externas
│   ├── database/
│   ├── auth/
│   └── external-apis/
├── application/      # Casos de uso
│   ├── services/
│   └── dto/
└── presentation/     # UI y controladores
    ├── components/
    ├── pages/
    └── hooks/
```

### 2. **Patrón Repository**

```typescript
// domain/repositories/vehicle-repository.ts
export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>
  findByLicensePlate(plate: string): Promise<Vehicle | null>
  save(vehicle: Vehicle): Promise<Vehicle>
  update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle>
  delete(id: string): Promise<void>
}

// infrastructure/database/supabase-vehicle-repository.ts
export class SupabaseVehicleRepository implements VehicleRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async findById(id: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new VehicleRepositoryError(error.message)
    return data ? Vehicle.fromDatabase(data) : null
  }
}
```

### 3. **Service Layer Pattern**

```typescript
// application/services/vehicle-service.ts
export class VehicleService {
  constructor(
    private vehicleRepo: VehicleRepository,
    private eventBus: EventBus
  ) {}
  
  async createVehicle(data: CreateVehicleDTO): Promise<Vehicle> {
    // Validación de negocio
    const vehicle = Vehicle.create(data)
    
    // Persistencia
    const saved = await this.vehicleRepo.save(vehicle)
    
    // Eventos de dominio
    this.eventBus.emit('vehicle.created', saved)
    
    return saved
  }
  
  async updateVehicleStatus(
    id: string, 
    status: VehicleStatus
  ): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findById(id)
    if (!vehicle) throw new VehicleNotFoundError(id)
    
    vehicle.updateStatus(status)
    const updated = await this.vehicleRepo.update(id, vehicle)
    
    this.eventBus.emit('vehicle.status.updated', updated)
    return updated
  }
}
```

### 4. **Event-Driven Architecture**

```typescript
// domain/events/vehicle-events.ts
export class VehicleCreatedEvent {
  constructor(public vehicle: Vehicle) {}
}

export class VehicleStatusUpdatedEvent {
  constructor(
    public vehicleId: string,
    public oldStatus: VehicleStatus,
    public newStatus: VehicleStatus
  ) {}
}

// application/event-handlers/vehicle-event-handlers.ts
export class VehicleEventHandlers {
  constructor(
    private notificationService: NotificationService,
    private auditService: AuditService
  ) {}
  
  @EventHandler(VehicleCreatedEvent)
  async handleVehicleCreated(event: VehicleCreatedEvent) {
    await this.notificationService.notifyAdmins(
      `Nuevo vehículo registrado: ${event.vehicle.licensePlate}`
    )
    
    await this.auditService.logAction({
      action: 'vehicle.created',
      entityId: event.vehicle.id,
      details: event.vehicle
    })
  }
}
```

### 5. **Dependency Injection**

```typescript
// infrastructure/container.ts
import { Container } from 'inversify'

const container = new Container()

// Registrar servicios
container.bind<VehicleRepository>('VehicleRepository')
  .to(SupabaseVehicleRepository)

container.bind<VehicleService>('VehicleService')
  .to(VehicleService)

container.bind<NotificationService>('NotificationService')
  .to(EmailNotificationService)

// application/hooks/use-vehicle-service.ts
export function useVehicleService() {
  const vehicleService = container.get<VehicleService>('VehicleService')
  
  return {
    createVehicle: vehicleService.createVehicle.bind(vehicleService),
    updateVehicle: vehicleService.updateVehicle.bind(vehicleService),
    // ... otros métodos
  }
}
```

### 6. **CQRS Pattern (Command Query Responsibility Segregation)**

```typescript
// application/commands/create-vehicle-command.ts
export class CreateVehicleCommand {
  constructor(
    public licensePlate: string,
    public model: string,
    public price: number
  ) {}
}

// application/queries/get-vehicle-query.ts
export class GetVehicleQuery {
  constructor(public id: string) {}
}

// application/handlers/vehicle-command-handler.ts
export class VehicleCommandHandler {
  constructor(private vehicleService: VehicleService) {}
  
  async handle(command: CreateVehicleCommand): Promise<Vehicle> {
    return this.vehicleService.createVehicle({
      licensePlate: command.licensePlate,
      model: command.model,
      price: command.price
    })
  }
}

// application/handlers/vehicle-query-handler.ts
export class VehicleQueryHandler {
  constructor(private vehicleRepo: VehicleRepository) {}
  
  async handle(query: GetVehicleQuery): Promise<Vehicle | null> {
    return this.vehicleRepo.findById(query.id)
  }
}
```

### 7. **Microservices Preparation**

```typescript
// infrastructure/api/vehicle-api-client.ts
export class VehicleApiClient {
  constructor(private baseUrl: string) {}
  
  async getVehicle(id: string): Promise<Vehicle> {
    const response = await fetch(`${this.baseUrl}/vehicles/${id}`)
    if (!response.ok) throw new ApiError(response.statusText)
    return response.json()
  }
  
  async createVehicle(data: CreateVehicleDTO): Promise<Vehicle> {
    const response = await fetch(`${this.baseUrl}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new ApiError(response.statusText)
    return response.json()
  }
}
```

### 8. **Caching Strategy**

```typescript
// infrastructure/cache/redis-cache.ts
export class RedisCache implements Cache {
  constructor(private redis: Redis) {}
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)
    return value ? JSON.parse(value) : null
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl || 3600)
  }
}

// application/services/cached-vehicle-service.ts
export class CachedVehicleService implements VehicleService {
  constructor(
    private vehicleService: VehicleService,
    private cache: Cache
  ) {}
  
  async findById(id: string): Promise<Vehicle | null> {
    const cacheKey = `vehicle:${id}`
    
    // Intentar obtener de caché
    const cached = await this.cache.get<Vehicle>(cacheKey)
    if (cached) return cached
    
    // Si no está en caché, obtener del servicio
    const vehicle = await this.vehicleService.findById(id)
    if (vehicle) {
      await this.cache.set(cacheKey, vehicle, 300) // 5 minutos
    }
    
    return vehicle
  }
}
```

### 9. **Plan de Migración**

#### Fase 1: Preparación (Semanas 1-2)
- Crear estructura de carpetas
- Implementar interfaces base
- Configurar DI container

#### Fase 2: Migración Gradual (Semanas 3-6)
- Migrar servicios uno por uno
- Implementar Repository pattern
- Agregar event handlers

#### Fase 3: Optimización (Semanas 7-8)
- Implementar caching
- Agregar CQRS donde sea necesario
- Optimizar consultas

#### Fase 4: Testing (Semanas 9-10)
- Tests unitarios
- Tests de integración
- Performance testing 