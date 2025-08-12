# 🧪 Testing Guide - MTG Investment Next

## Overview

This project uses a comprehensive testing strategy with multiple layers to ensure code quality and reliability.

## Testing Stack

- **Unit Testing**: Jest + React Testing Library
- **Integration Testing**: Jest + Supertest
- **E2E Testing**: Playwright
- **Database Testing**: Custom test utilities with SQLite
- **API Testing**: MSW (Mock Service Worker)
- **CI/CD**: GitHub Actions

## Test Structure

```
src/test/
├── unit/           # Unit tests for individual components/functions
├── integration/    # Integration tests for API routes and database
├── e2e/           # End-to-end tests with Playwright
├── mocks/         # Mock service worker setup and handlers
├── utils/         # Testing utilities and helpers
└── setup.ts       # Global test setup
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

### Watch Mode (Development)
```bash
npm run test:watch
```

## Writing Tests

### Unit Tests

Unit tests focus on individual components or functions in isolation:

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Integration Tests

Integration tests verify API routes and database operations:

```typescript
import { testApiRoute } from '@/test/utils/api';
import { TestDatabase } from '@/test/utils/database';
import handler from '@/app/api/my-route/route';

describe('/api/my-route', () => {
  beforeEach(async () => {
    await TestDatabase.setupTestDatabase();
  });

  it('handles requests correctly', async () => {
    const response = await testApiRoute(handler, {
      method: 'GET'
    });
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests

End-to-end tests verify complete user workflows:

```typescript
import { test, expect } from '@playwright/test';

test('user can complete workflow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="action-button"]');
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

## Database Testing

Use the TestDatabase utility for database operations:

```typescript
import { TestDatabase } from '@/test/utils/database';

beforeEach(async () => {
  await TestDatabase.setupTestDatabase();
  await TestDatabase.seedTestData();
});

afterEach(async () => {
  await TestDatabase.cleanupTestDatabase();
});
```

## Mocking

### API Mocking with MSW

Mock external APIs using Mock Service Worker:

```typescript
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Override specific handlers for individual tests
server.use(
  http.get('/api/custom', () => {
    return HttpResponse.json({ custom: 'response' });
  })
);
```

### Component Mocking

Mock complex components or external dependencies:

```typescript
jest.mock('@/components/ComplexComponent', () => {
  return function MockComplexComponent(props: any) {
    return <div data-testid="mock-complex">{props.children}</div>;
  };
});
```

## Coverage Requirements

- **Minimum Coverage**: 70% for all metrics
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Data Test IDs**: Add `data-testid` attributes for stable selectors
3. **Mock External Dependencies**: Isolate units under test
4. **Keep Tests Simple**: One assertion per test when possible
5. **Use Descriptive Names**: Test names should clearly describe the scenario
6. **Setup and Teardown**: Clean up after each test to avoid side effects

## CI/CD Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- GitHub Actions workflow

The pipeline includes:
- Linting and type checking
- Unit and integration tests
- E2E tests
- Coverage reporting
- Security auditing

## Debugging Tests

### Debug Mode
```bash
npm run test:debug
```

### VS Code Integration
1. Install Jest Runner extension
2. Use built-in test debugging features
3. Set breakpoints in test files

### Playwright Debug
```bash
npx playwright test --debug
```

## Performance Testing

While not included in this initial setup, consider adding:
- Load testing with Artillery or k6
- Performance regression testing
- Bundle size monitoring

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)