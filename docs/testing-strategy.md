# Estrategia de Testing - CVO Dashboard

## Estado Actual de Testing

### ❌ **Problemas Identificados**
- Sin tests unitarios
- Sin tests de integración
- Sin tests E2E
- Falta de cobertura de código
- No hay testing automatizado

### ✅ **Oportunidades**
- Next.js con Jest y Testing Library
- Supabase con testing utilities
- Playwright para E2E testing
- GitHub Actions para CI/CD

## Estrategia de Testing

### 1. **Testing Pyramid**

```
    E2E Tests (10%)
   ┌─────────────────┐
   │ Integration     │
   │ Tests (20%)     │
   └─────────────────┘
  ┌─────────────────────┐
  │ Unit Tests (70%)    │
  └─────────────────────┘
```

### 2. **Unit Tests**

#### A. **Componentes React**
```typescript
// __tests__/components/vehicle-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { VehicleCard } from '@/components/vehicles/vehicle-card'

describe('VehicleCard', () => {
  const mockVehicle = {
    id: '1',
    licensePlate: '1234ABC',
    model: 'BMW X3',
    status: 'available'
  }

  it('should render vehicle information correctly', () => {
    render(<VehicleCard vehicle={mockVehicle} />)
    
    expect(screen.getByText('1234ABC')).toBeInTheDocument()
    expect(screen.getByText('BMW X3')).toBeInTheDocument()
    expect(screen.getByText('available')).toBeInTheDocument()
  })

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(<VehicleCard vehicle={mockVehicle} onEdit={onEdit} />)
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(mockVehicle.id)
  })
})
```

#### B. **Hooks Personalizados**
```typescript
// __tests__/hooks/use-vehicle-data.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useVehicleData } from '@/hooks/use-vehicle-data'
import { createMockSupabaseClient } from '@/__mocks__/supabase'

jest.mock('@/lib/supabase/client', () => ({
  createClientComponentClient: () => createMockSupabaseClient()
}))

describe('useVehicleData', () => {
  it('should fetch vehicle data successfully', async () => {
    const { result } = renderHook(() => useVehicleData('1234ABC'))
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined()
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.data?.licensePlate).toBe('1234ABC')
  })

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useVehicleData('invalid'))
    
    await waitFor(() => {
      expect(result.current.error).toBeDefined()
      expect(result.current.isLoading).toBe(false)
    })
  })
})
```

#### C. **Utilidades y Helpers**
```typescript
// __tests__/utils/date-utils.test.ts
import { 
  formatDate, 
  calculateDaysDifference,
  isDateValid 
} from '@/lib/date-utils'

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('15/01/2024')
    })
  })

  describe('calculateDaysDifference', () => {
    it('should calculate days difference correctly', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-15')
      expect(calculateDaysDifference(start, end)).toBe(14)
    })
  })

  describe('isDateValid', () => {
    it('should validate date correctly', () => {
      expect(isDateValid('2024-01-15')).toBe(true)
      expect(isDateValid('invalid-date')).toBe(false)
    })
  })
})
```

### 3. **Integration Tests**

#### A. **API Routes**
```typescript
// __tests__/api/vehicles.test.ts
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/vehicles/route'

describe('/api/vehicles', () => {
  describe('GET', () => {
    it('should return vehicles list', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '10' }
      })

      await GET(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(Array.isArray(data.vehicles)).toBe(true)
    })
  })

  describe('POST', () => {
    it('should create new vehicle', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          licensePlate: '1234ABC',
          model: 'BMW X3',
          price: 45000
        }
      })

      await POST(req, res)

      expect(res._getStatusCode()).toBe(201)
      const data = JSON.parse(res._getData())
      expect(data.vehicle.licensePlate).toBe('1234ABC')
    })
  })
})
```

#### B. **Database Operations**
```typescript
// __tests__/integration/database.test.ts
import { createServerClient } from '@/lib/supabase/server'

describe('Database Integration', () => {
  let supabase: any

  beforeAll(async () => {
    supabase = await createServerClient()
  })

  describe('Vehicle Operations', () => {
    it('should create and retrieve vehicle', async () => {
      const vehicleData = {
        license_plate: 'TEST123',
        model: 'Test Model',
        price: 50000
      }

      // Create
      const { data: created, error: createError } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single()

      expect(createError).toBeNull()
      expect(created.license_plate).toBe('TEST123')

      // Retrieve
      const { data: retrieved, error: retrieveError } = await supabase
        .from('vehicles')
        .select()
        .eq('license_plate', 'TEST123')
        .single()

      expect(retrieveError).toBeNull()
      expect(retrieved.id).toBe(created.id)

      // Cleanup
      await supabase
        .from('vehicles')
        .delete()
        .eq('license_plate', 'TEST123')
    })
  })
})
```

### 4. **E2E Tests con Playwright**

```typescript
// e2e/vehicle-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Vehicle Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('should create new vehicle', async ({ page }) => {
    await page.goto('/dashboard/vehicles')
    
    // Click add vehicle button
    await page.click('[data-testid="add-vehicle-button"]')
    
    // Fill form
    await page.fill('[data-testid="license-plate"]', '1234ABC')
    await page.fill('[data-testid="model"]', 'BMW X3')
    await page.fill('[data-testid="price"]', '45000')
    
    // Submit
    await page.click('[data-testid="submit-button"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Verify vehicle appears in list
    await expect(page.locator('text=1234ABC')).toBeVisible()
  })

  test('should edit vehicle', async ({ page }) => {
    await page.goto('/dashboard/vehicles')
    
    // Click edit button for first vehicle
    await page.click('[data-testid="edit-vehicle-button"]').first()
    
    // Update price
    await page.fill('[data-testid="price"]', '50000')
    await page.click('[data-testid="save-button"]')
    
    // Verify update
    await expect(page.locator('text=50000')).toBeVisible()
  })

  test('should delete vehicle', async ({ page }) => {
    await page.goto('/dashboard/vehicles')
    
    // Click delete button
    await page.click('[data-testid="delete-vehicle-button"]').first()
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]')
    
    // Verify vehicle is removed
    await expect(page.locator('[data-testid="vehicle-row"]')).toHaveCount(0)
  })
})
```

### 5. **Performance Testing**

```typescript
// __tests__/performance/dashboard-load.test.ts
import { test, expect } from '@playwright/test'

test('Dashboard should load within 3 seconds', async ({ page }) => {
  const startTime = Date.now()
  
  await page.goto('/dashboard')
  
  // Wait for main content to load
  await page.waitForSelector('[data-testid="dashboard-content"]')
  
  const loadTime = Date.now() - startTime
  expect(loadTime).toBeLessThan(3000)
})

test('Vehicle list should handle 1000 items', async ({ page }) => {
  await page.goto('/dashboard/vehicles')
  
  // Wait for table to load
  await page.waitForSelector('[data-testid="vehicle-table"]')
  
  // Check if pagination is working
  const paginationInfo = await page.textContent('[data-testid="pagination-info"]')
  expect(paginationInfo).toContain('1000')
})
```

### 6. **Testing Configuration**

#### A. **Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

#### B. **Playwright Configuration**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 7. **CI/CD Pipeline**

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:e2e
```

### 8. **Plan de Implementación**

#### Fase 1: Configuración (Semana 1)
- Configurar Jest y Testing Library
- Configurar Playwright
- Crear mocks y fixtures

#### Fase 2: Unit Tests (Semanas 2-4)
- Tests para componentes principales
- Tests para hooks personalizados
- Tests para utilidades

#### Fase 3: Integration Tests (Semanas 5-6)
- Tests para API routes
- Tests para operaciones de BD
- Tests para autenticación

#### Fase 4: E2E Tests (Semanas 7-8)
- Flujos críticos de usuario
- Tests de performance
- Tests de accesibilidad

#### Fase 5: CI/CD (Semana 9)
- Configurar GitHub Actions
- Integrar con Vercel
- Configurar reportes de cobertura 