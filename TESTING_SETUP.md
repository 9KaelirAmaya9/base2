# Testing Setup Guide
## Automated Testing Infrastructure

---

## Overview

The project now includes comprehensive automated testing with:
- **Vitest** - Unit and integration tests
- **Playwright** - End-to-end (E2E) tests
- **Testing Library** - React component testing utilities

---

## Unit & Integration Tests (Vitest)

### Setup

Tests are located in `src/test/` directory.

### Running Tests

```bash
# Run all tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests once (CI mode)
npm run test -- --run
```

### Writing Tests

Example test file: `src/test/NotFound.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/pages/NotFound';

describe('NotFound Page', () => {
  it('renders 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});
```

### Test Configuration

- **Config**: `vitest.config.ts`
- **Setup**: `src/test/setup.ts`
- **Environment**: jsdom (browser-like environment)

---

## End-to-End Tests (Playwright)

### Setup

E2E tests are located in `e2e/` directory.

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Run specific browser
npx playwright test --project=chromium
```

### Writing E2E Tests

Example test file: `e2e/homepage.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('should load homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/rico/i);
});
```

### Playwright Configuration

- **Config**: `playwright.config.ts`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Chrome Mobile, Safari Mobile
- **Base URL**: `http://localhost:8080`

### Browser Installation

Playwright browsers are installed automatically. To reinstall:

```bash
npx playwright install
```

---

## Running All Tests

```bash
# Run unit tests and E2E tests
npm run test:all
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test -- --run
      - run: npm run test:e2e
        env:
          CI: true
```

---

## Coverage

Coverage reports are generated in `coverage/` directory.

```bash
npm run test:coverage
```

Open `coverage/index.html` in browser to view detailed coverage report.

---

## Best Practices

1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user flows
4. **Mock External Services**: Mock Supabase, Stripe, etc.
5. **Test Critical Paths**: Focus on order flow, payment, admin

---

## Next Steps

1. Add more unit tests for components
2. Add integration tests for user flows
3. Add E2E tests for critical paths
4. Set up CI/CD pipeline
5. Add visual regression testing

---

## Troubleshooting

### Tests not finding modules

Ensure `vitest.config.ts` has correct path aliases matching `vite.config.ts`.

### Playwright tests failing

1. Ensure dev server is running or use `webServer` config
2. Check browser installation: `npx playwright install`
3. Run with `--debug` flag to see what's happening

### Coverage not working

Install coverage provider:
```bash
npm install @vitest/coverage-v8 --save-dev
```


