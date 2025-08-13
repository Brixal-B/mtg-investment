# 🧪 Testing Guide

This document provides comprehensive guidance for testing the MTG Investment application.

## 📋 Testing Overview

Our testing strategy includes:
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API and database testing  
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load and performance testing
- **Security Tests**: Authentication and validation testing

## 🛠️ Testing Tools

### Primary Testing Stack
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **MSW (Mock Service Worker)**: API mocking
- **Supertest**: HTTP assertion testing

### Testing Utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: DOM testing utilities
- **jest-environment-jsdom**: Browser-like testing environment

## 🚀 Running Tests

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

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### CI Mode
```bash
npm run test:ci
```

## 📁 Test Structure

```
src/test/
├── unit/                    # Unit tests
│   ├── components/          # Component tests
│   ├── lib/                 # Library function tests
│   ├── utils/               # Utility function tests
│   └── services/            # Service layer tests
├── integration/             # Integration tests
│   ├── api/                 # API endpoint tests
│   └── database/            # Database operation tests
├── e2e/                     # End-to-end tests
├── performance/             # Performance tests
├── security/                # Security tests
├── fixtures/                # Test data
├── mocks/                   # Mock implementations
└── utils/                   # Test utilities
```

## 🧩 Writing Tests

### Component Testing Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const mockHandler = jest.fn();
    render(<MyComponent onAction={mockHandler} />);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

### API Testing Example

```typescript
import request from 'supertest';
import { createMockApp } from '@/test/utils/api-test-utils';

describe('/api/cards', () => {
  it('returns cards list', async () => {
    const app = createMockApp();
    
    const response = await request(app)
      .get('/api/cards')
      .expect(200);
      
    expect(response.body).toHaveProperty('cards');
    expect(Array.isArray(response.body.cards)).toBe(true);
  });
});
```

### E2E Testing Example

```typescript
import { test, expect } from '@playwright/test';

test('user can login and view cards', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

## 🎯 Testing Best Practices

### 1. Test Behavior, Not Implementation
- Focus on what the component does, not how it does it
- Test user interactions and expected outcomes
- Avoid testing internal state or implementation details

### 2. Use Descriptive Test Names
```typescript
// Good
it('shows error message when login fails with invalid credentials')

// Bad  
it('handles error')
```

### 3. Follow the Testing Trophy
- **Unit Tests**: Fast, isolated, high confidence for utilities
- **Integration Tests**: Medium speed, medium confidence for API/DB
- **E2E Tests**: Slow, high confidence for critical user flows

### 4. Mock External Dependencies
- Use MSW for API mocking
- Mock external services and APIs
- Keep tests isolated and deterministic

### 5. Test Edge Cases
- Empty states
- Error conditions
- Loading states
- Invalid inputs

## 📊 Coverage Goals

| Test Type | Coverage Target |
|-----------|----------------|
| Unit Tests | 80%+ |
| Integration Tests | 70%+ |
| E2E Tests | Critical paths |
| Overall Coverage | 75%+ |

## 🔧 Test Configuration

### Jest Configuration
Located in `jest.config.js` with:
- JSDOM environment for component testing
- SWC for fast TypeScript compilation
- Coverage thresholds
- Module name mapping

### Playwright Configuration
Located in `playwright.config.ts` with:
- Multiple browser testing
- Parallel execution
- Screenshot on failure
- Video recording

## 🚨 Common Testing Patterns

### Testing Hooks
```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

test('hook updates state correctly', () => {
  const { result } = renderHook(() => useMyHook());
  
  act(() => {
    result.current.updateValue('new value');
  });
  
  expect(result.current.value).toBe('new value');
});
```

### Testing Context Providers
```typescript
import { render } from '@/test/utils/render-utils';
import { MyComponent } from '@/components/MyComponent';

test('component uses context correctly', () => {
  render(<MyComponent />, {
    providerProps: { user: mockUser }
  });
  
  expect(screen.getByText(mockUser.name)).toBeInTheDocument();
});
```

### Testing Error Boundaries
```typescript
test('error boundary catches and displays error', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
});
```

## 🔍 Debugging Tests

### Running Single Test
```bash
npm test -- --testNamePattern="specific test name"
```

### Debug Mode
```bash
npm run test:debug
```

### Verbose Output
```bash
npm test -- --verbose
```

### Coverage for Specific Files
```bash
npm test -- --collectCoverageFrom="src/components/MyComponent.tsx"
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

## 🎯 Testing Checklist

- [ ] All new features have unit tests
- [ ] Critical user flows have E2E tests
- [ ] API endpoints have integration tests
- [ ] Error conditions are tested
- [ ] Loading states are tested
- [ ] Edge cases are covered
- [ ] Tests are deterministic and reliable
- [ ] Coverage thresholds are met

---

**Happy Testing!** 🧪✨