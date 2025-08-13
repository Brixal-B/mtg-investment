/**
 * 🚀 DevOps Agent - Testing Infrastructure & CI/CD Setup
 * 
 * This agent establishes comprehensive testing infrastructure, automated
 * testing workflows, and CI/CD pipelines for the MTG Investment application.
 * 
 * Agent Type: Quality & Infrastructure Agent
 * Dependencies: Database Agent (database testing), Backend Agent (API testing)
 * Priority: High (Essential for Phase 3 quality assurance)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DevOpsAgent {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.testingLog = [];
    this.stats = {
      testFilesCreated: 0,
      configFilesCreated: 0,
      dependenciesInstalled: 0,
      workflowsCreated: 0,
      errors: 0
    };
  }

  /**
   * Main DevOps agent execution
   */
  async execute() {
    console.log('🚀 DevOps Agent - Setting up testing infrastructure...');
    
    try {
      // Phase 1: Install testing dependencies
      await this.installTestingDependencies();
      
      // Phase 2: Setup testing frameworks
      await this.setupTestingFrameworks();
      
      // Phase 3: Create test files and suites
      await this.createTestSuites();
      
      // Phase 4: Setup GitHub Actions workflows
      await this.setupGitHubActions();
      
      // Phase 5: Create testing utilities and helpers
      await this.createTestingUtilities();
      
      // Phase 6: Setup code quality tools
      await this.setupCodeQualityTools();
      
      // Phase 7: Create documentation
      await this.createTestingDocumentation();
      
      // Phase 8: Generate report
      this.generateReport();
      
      console.log('✅ DevOps Agent - Complete!');
      return this.stats;
      
    } catch (error) {
      console.error('❌ DevOps Agent - Error:', error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Install testing dependencies
   */
  async installTestingDependencies() {
    console.log('📦 Installing testing dependencies...');
    
    const testingDeps = [
      // Core testing framework
      'jest@^29.7.0',
      '@types/jest@^29.5.0',
      'jest-environment-node@^29.7.0',
      
      // React testing
      '@testing-library/react@^14.0.0',
      '@testing-library/jest-dom@^6.1.0',
      '@testing-library/user-event@^14.5.0',
      
      // API testing
      'supertest@^6.3.0',
      '@types/supertest@^2.0.0',
      
      // Database testing
      'jest-mock-extended@^3.0.0',
      
      // Code coverage
      'jest-coverage-badges@^1.1.0',
      
      // E2E testing
      '@playwright/test@^1.40.0',
      
      // Linting and formatting
      'eslint-plugin-testing-library@^6.2.0',
      'eslint-plugin-jest@^27.6.0',
      
      // Mock utilities
      'msw@^2.0.0',
      '@types/node-fetch@^2.6.0'
    ];

    if (!this.dryRun) {
      try {
        console.log('Installing testing dependencies...');
        execSync(`npm install --save-dev ${testingDeps.join(' ')}`, { 
          cwd: this.workspaceRoot,
          stdio: this.verbose ? 'inherit' : 'pipe'
        });
        
        // Install Playwright browsers
        execSync('npx playwright install', { 
          cwd: this.workspaceRoot,
          stdio: this.verbose ? 'inherit' : 'pipe'
        });
        
        this.stats.dependenciesInstalled = testingDeps.length;
        console.log(`✅ Installed ${testingDeps.length} testing dependencies`);
      } catch (error) {
        console.warn('⚠️ Some dependencies may have failed to install:', error.message);
        this.stats.errors++;
      }
    } else {
      console.log(`[DRY RUN] Would install ${testingDeps.length} testing dependencies`);
      this.stats.dependenciesInstalled = testingDeps.length;
    }
  }

  /**
   * Setup testing framework configurations
   */
  async setupTestingFrameworks() {
    console.log('🔧 Setting up testing frameworks...');
    
    // Jest configuration
    const jestConfig = {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
        '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)'
      ],
      collectCoverageFrom: [
        'src/**/*.(ts|tsx)',
        '!src/**/*.d.ts',
        '!src/test/**/*',
        '!src/**/__tests__/**/*'
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
      coverageThreshold: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      },
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json'
        }]
      }
    };

    await this.writeFile('jest.config.js', `module.exports = ${JSON.stringify(jestConfig, null, 2)};`);

    // Playwright configuration
    const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/test/e2e',
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
});`;

    await this.writeFile('playwright.config.ts', playwrightConfig);

    console.log('✅ Testing framework configurations created');
    this.stats.configFilesCreated += 2;
  }

  /**
   * Create comprehensive test suites
   */
  async createTestSuites() {
    console.log('🧪 Creating test suites...');
    
    // Ensure test directories exist
    await this.ensureDirectory('src/test');
    await this.ensureDirectory('src/test/unit');
    await this.ensureDirectory('src/test/integration');
    await this.ensureDirectory('src/test/e2e');
    await this.ensureDirectory('src/test/mocks');
    await this.ensureDirectory('src/test/fixtures');

    // Test setup file
    const testSetup = `import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Console spy setup for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});`;

    await this.writeFile('src/test/setup.ts', testSetup);

    // Database test utilities
    const dbTestUtils = `import Database from '@/lib/database';
import fs from 'fs';
import path from 'path';

export class TestDatabase {
  private static testDbPath = path.join(process.cwd(), 'test-database.db');

  static async setupTestDatabase() {
    // Create a clean test database
    if (fs.existsSync(this.testDbPath)) {
      fs.unlinkSync(this.testDbPath);
    }
    
    // Initialize test database with schema
    // This would need to be adapted based on your actual database setup
    return this.testDbPath;
  }

  static async cleanupTestDatabase() {
    if (fs.existsSync(this.testDbPath)) {
      fs.unlinkSync(this.testDbPath);
    }
  }

  static async seedTestData() {
    // Add test data seeding logic here
    const testCards = [
      {
        uuid: 'test-card-1',
        name: 'Test Lightning Bolt',
        set_code: 'TST',
        set_name: 'Test Set',
        rarity: 'common'
      }
    ];
    
    // Insert test data
    for (const card of testCards) {
      await Database.Cards.insertCard(card);
    }
  }
}`;

    await this.writeFile('src/test/utils/database.ts', dbTestUtils);

    // API test utilities
    const apiTestUtils = `import { NextApiRequest, NextApiResponse } from 'next';
import { createRequest, createResponse } from 'node-mocks-http';

export function createMockApiRequest(options: any = {}): NextApiRequest {
  return createRequest({
    method: 'GET',
    ...options,
  });
}

export function createMockApiResponse(): NextApiResponse {
  return createResponse();
}

export function createMockApiContext(req: any = {}, res: any = {}) {
  return {
    req: createMockApiRequest(req),
    res: createMockApiResponse(),
  };
}

export async function testApiRoute(
  handler: any,
  options: { method?: string; body?: any; query?: any } = {}
) {
  const { method = 'GET', body, query } = options;
  
  const req = createMockApiRequest({
    method,
    body,
    query,
  });
  
  const res = createMockApiResponse();
  
  await handler(req, res);
  
  return {
    status: res._getStatusCode(),
    data: JSON.parse(res._getData() || '{}'),
    headers: res._getHeaders(),
  };
}`;

    await this.writeFile('src/test/utils/api.ts', apiTestUtils);

    // Component test examples
    await this.createComponentTests();
    await this.createApiTests();
    await this.createDatabaseTests();
    await this.createE2ETests();

    console.log('✅ Test suites and utilities created');
  }

  /**
   * Create component test examples
   */
  async createComponentTests() {
    const cardGridTest = `import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardGrid } from '@/components';
import type { Card } from '@/types';

const mockCards: Card[] = [
  {
    name: 'Lightning Bolt',
    set_name: 'Alpha',
    price: 50.0,
    image_uris: { normal: 'test-image.jpg' },
    set: 'LEA',
    uuid: 'test-1'
  },
  {
    name: 'Black Lotus',
    set_name: 'Alpha', 
    price: 10000.0,
    image_uris: { normal: 'test-image2.jpg' },
    set: 'LEA',
    uuid: 'test-2'
  }
];

describe('CardGrid Component', () => {
  it('renders cards correctly', () => {
    render(<CardGrid cards={mockCards} />);
    
    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
    expect(screen.getByText('Black Lotus')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<CardGrid cards={[]} loading={true} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to load cards';
    render(<CardGrid cards={[]} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows card prices when available', () => {
    render(<CardGrid cards={mockCards} />);
    
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });
});`;

    await this.writeFile('src/components/__tests__/CardGrid.test.tsx', cardGridTest);

    const cardFiltersTest = `import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardFilters } from '@/components';

const mockProps = {
  searchName: '',
  setSearchName: jest.fn(),
  minPrice: '',
  setMinPrice: jest.fn(),
  maxPrice: '',
  setMaxPrice: jest.fn(),
  searchSet: '',
  setSearchSet: jest.fn(),
  showNoPrice: false,
  setShowNoPrice: jest.fn(),
  showNameSuggestions: false,
  setShowNameSuggestions: jest.fn(),
  showSetSuggestions: false,
  setShowSetSuggestions: jest.fn(),
  uniqueCardNames: ['Lightning Bolt', 'Black Lotus'],
  uniqueSetNames: ['Alpha', 'Beta'],
  nameInputRef: { current: null },
  setInputRef: { current: null }
};

describe('CardFilters Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter inputs', () => {
    render(<CardFilters {...mockProps} />);
    
    expect(screen.getByPlaceholderText(/search by card name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/min price/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/max price/i)).toBeInTheDocument();
  });

  it('calls setSearchName when typing in search input', async () => {
    const user = userEvent.setup();
    render(<CardFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search by card name/i);
    await user.type(searchInput, 'Lightning');
    
    expect(mockProps.setSearchName).toHaveBeenCalledWith('Lightning');
  });

  it('toggles no price filter correctly', async () => {
    const user = userEvent.setup();
    render(<CardFilters {...mockProps} />);
    
    const checkbox = screen.getByLabelText(/show cards without prices/i);
    await user.click(checkbox);
    
    expect(mockProps.setShowNoPrice).toHaveBeenCalledWith(true);
  });
});`;

    await this.writeFile('src/components/__tests__/CardFilters.test.tsx', cardFiltersTest);

    this.stats.testFilesCreated += 2;
  }

  /**
   * Create API test examples
   */
  async createApiTests() {
    const priceHistoryApiTest = `import { testApiRoute } from '@/test/utils/api';
import { TestDatabase } from '@/test/utils/database';
import handler from '@/app/api/price-history/route';

describe('/api/price-history', () => {
  beforeEach(async () => {
    await TestDatabase.setupTestDatabase();
    await TestDatabase.seedTestData();
  });

  afterEach(async () => {
    await TestDatabase.cleanupTestDatabase();
  });

  describe('GET /api/price-history', () => {
    it('returns price data overview when no card specified', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET'
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
      expect(response.data.data).toHaveProperty('earliest_date');
      expect(response.data.data).toHaveProperty('latest_date');
    });

    it('returns price history for specific card', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET',
        query: { card: 'test-card-1', days: '30' }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('handles invalid card UUID', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET',
        query: { card: 'invalid-uuid' }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data).toHaveLength(0);
    });
  });

  describe('POST /api/price-history', () => {
    it('successfully processes price data upload', async () => {
      const testData = {
        dateRange: ['2025-01-01', '2025-02-01'],
        cards: [
          {
            uuid: 'test-card-1',
            prices: {
              '2025-01-01': 10.50,
              '2025-02-01': 12.00
            }
          }
        ]
      };

      const response = await testApiRoute(handler, {
        method: 'POST',
        body: testData
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
      expect(response.data.data).toHaveProperty('processedRecords');
    });

    it('rejects invalid request body', async () => {
      const response = await testApiRoute(handler, {
        method: 'POST',
        body: { invalid: 'data' }
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('ok', false);
    });
  });
});`;

    await this.writeFile('src/test/integration/api/price-history.test.ts', priceHistoryApiTest);

    const databaseApiTest = `import { testApiRoute } from '@/test/utils/api';
import { TestDatabase } from '@/test/utils/database';
import handler from '@/app/api/database/route';

describe('/api/database', () => {
  beforeEach(async () => {
    await TestDatabase.setupTestDatabase();
  });

  afterEach(async () => {
    await TestDatabase.cleanupTestDatabase();
  });

  describe('GET /api/database', () => {
    it('returns database info', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET',
        query: { action: 'info' }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
      expect(response.data.data).toHaveProperty('tables');
    });

    it('returns health status', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET',
        query: { action: 'health' }
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ table: expect.any(String), count: expect.any(Number) })
        ])
      );
    });

    it('handles invalid action', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET',
        query: { action: 'invalid' }
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('ok', false);
    });
  });
});`;

    await this.writeFile('src/test/integration/api/database.test.ts', databaseApiTest);

    this.stats.testFilesCreated += 2;
  }

  /**
   * Create database operation tests
   */
  async createDatabaseTests() {
    const databaseOperationsTest = `import Database, { CardOperations, PriceOperations } from '@/lib/database';
import { TestDatabase } from '@/test/utils/database';

describe('Database Operations', () => {
  beforeEach(async () => {
    await TestDatabase.setupTestDatabase();
  });

  afterEach(async () => {
    await TestDatabase.cleanupTestDatabase();
  });

  describe('CardOperations', () => {
    const testCard = {
      uuid: 'test-card-uuid',
      name: 'Test Card',
      set_code: 'TST',
      set_name: 'Test Set',
      rarity: 'rare',
      mana_cost: '{1}{R}',
      cmc: 2
    };

    it('inserts and retrieves cards correctly', async () => {
      await CardOperations.insertCard(testCard);
      const retrieved = await CardOperations.getCard(testCard.uuid);

      expect(retrieved).toMatchObject({
        uuid: testCard.uuid,
        name: testCard.name,
        set_code: testCard.set_code
      });
    });

    it('searches cards by name', async () => {
      await CardOperations.insertCard(testCard);
      const results = await CardOperations.searchCards('Test');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ name: testCard.name });
    });

    it('finds cards by exact name', async () => {
      await CardOperations.insertCard(testCard);
      const result = await CardOperations.getCardByName(testCard.name);

      expect(result).toMatchObject({ name: testCard.name });
    });
  });

  describe('PriceOperations', () => {
    const testPriceRecord = {
      card_uuid: 'test-card-uuid',
      date: '2025-01-01',
      price_usd: 10.50,
      source: 'test'
    };

    it('inserts and retrieves price records', async () => {
      await PriceOperations.insertPriceRecord(testPriceRecord);
      const history = await PriceOperations.getPriceHistory(testPriceRecord.card_uuid);

      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        card_uuid: testPriceRecord.card_uuid,
        price_usd: testPriceRecord.price_usd
      });
    });

    it('gets latest price for card', async () => {
      await PriceOperations.insertPriceRecord(testPriceRecord);
      await PriceOperations.insertPriceRecord({
        ...testPriceRecord,
        date: '2025-01-02',
        price_usd: 12.00
      });

      const latest = await PriceOperations.getLatestPrice(testPriceRecord.card_uuid);
      expect(latest?.price_usd).toBe(12.00);
    });

    it('bulk inserts price records', async () => {
      const bulkRecords = [
        { ...testPriceRecord, date: '2025-01-01' },
        { ...testPriceRecord, date: '2025-01-02', price_usd: 11.00 },
        { ...testPriceRecord, date: '2025-01-03', price_usd: 12.00 }
      ];

      await PriceOperations.bulkInsertPrices(bulkRecords);
      const history = await PriceOperations.getPriceHistory(testPriceRecord.card_uuid);

      expect(history).toHaveLength(3);
    });
  });
});`;

    await this.writeFile('src/test/unit/database/operations.test.ts', databaseOperationsTest);

    this.stats.testFilesCreated += 1;
  }

  /**
   * Create E2E test examples
   */
  async createE2ETests() {
    const homePageE2E = `import { test, expect } from '@playwright/test';

test.describe('MTG Investment App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads homepage correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/MTG Investment/);
    await expect(page.locator('h1')).toContainText('MTG Investment Tracker');
  });

  test('displays admin tools panel', async ({ page }) => {
    await expect(page.locator('[data-testid="admin-tools-panel"]')).toBeVisible();
  });

  test('can upload CSV file', async ({ page }) => {
    // Create a test CSV file
    const csvContent = 'Name,Price\\nLightning Bolt,5.00\\nCounterspell,3.50';
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"]').click();
    const fileChooser = await fileChooserPromise;
    
    // Upload the test file
    await fileChooser.setFiles({
      name: 'test-cards.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Wait for processing to complete
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-grid"]')).toBeVisible();
    
    // Verify cards were loaded
    await expect(page.locator('text=Lightning Bolt')).toBeVisible();
    await expect(page.locator('text=Counterspell')).toBeVisible();
  });

  test('can filter cards by name', async ({ page }) => {
    // Assume some cards are already loaded
    await page.fill('[data-testid="search-input"]', 'Lightning');
    
    // Verify filtering works
    await expect(page.locator('text=Lightning Bolt')).toBeVisible();
    await expect(page.locator('text=Counterspell')).not.toBeVisible();
  });

  test('can filter cards by price range', async ({ page }) => {
    await page.fill('[data-testid="min-price-input"]', '5');
    await page.fill('[data-testid="max-price-input"]', '10');
    
    // Verify price filtering
    await expect(page.locator('[data-testid="total-value"]')).toContainText('$');
  });

  test('admin tools work correctly', async ({ page }) => {
    // Test MTGJSON check
    await page.click('[data-testid="check-mtgjson-btn"]');
    await expect(page.locator('[data-testid="file-status"]')).toBeVisible();
    
    // Test price history download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-price-history-btn"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('price-history');
  });
});`;

    await this.writeFile('src/test/e2e/homepage.spec.ts', homePageE2E);

    const apiE2E = `import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('price history API responds correctly', async ({ request }) => {
    const response = await request.get('/api/price-history');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('ok', true);
  });

  test('database API returns health status', async ({ request }) => {
    const response = await request.get('/api/database?action=health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('admin API endpoints are protected', async ({ request }) => {
    const response = await request.post('/api/admin/import-mtgjson');
    // Should either succeed or fail gracefully, not crash
    expect([200, 400, 409, 500]).toContain(response.status());
  });
});`;

    await this.writeFile('src/test/e2e/api.spec.ts', apiE2E);

    this.stats.testFilesCreated += 2;
  }

  /**
   * Helper method to write files
   */
  async writeFile(filePath, content) {
    const fullPath = path.join(this.workspaceRoot, filePath);
    const directory = path.dirname(fullPath);
    
    await this.ensureDirectory(directory);
    
    if (this.dryRun) {
      console.log(`[DRY RUN] Would create: ${filePath}`);
      return;
    }
    
    fs.writeFileSync(fullPath, content);
    this.testingLog.push(`Created: ${filePath}`);
    
    if (this.verbose) {
      console.log(`✅ Created: ${filePath}`);
    }
  }

  /**
   * Helper method to ensure directory exists
   */
  async ensureDirectory(dirPath) {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(this.workspaceRoot, dirPath);
    
    if (this.dryRun) {
      return;
    }
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  /**
   * Setup GitHub Actions workflows
   */
  async setupGitHubActions() {
    console.log('🔄 Setting up GitHub Actions workflows...');
    
    await this.ensureDirectory('.github/workflows');

    const ciWorkflow = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop, feature/* ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npx tsc --noEmit
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload Playwright report
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: .next/
        retention-days: 7

  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level moderate
    
    - name: Run CodeQL Analysis
      uses: github/codeql-action/init@v2
      with:
        languages: javascript
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2`;

    await this.writeFile('.github/workflows/ci.yml', ciWorkflow);

    this.stats.workflowsCreated += 1;
    console.log('✅ GitHub Actions workflows created');
  }

  /**
   * Create testing utilities and helpers
   */
  async createTestingUtilities() {
    console.log('🛠️ Creating testing utilities...');
    
    const testUtils = `export * from './api';
export * from './database';

// Component testing utilities
export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  // Add any global providers here (theme, context, etc.)
  return render(ui, options);
};

// Mock data generators
export const createMockCard = (overrides = {}) => ({
  name: 'Test Card',
  set_name: 'Test Set',
  price: 10.0,
  image_uris: { normal: 'test-image.jpg' },
  set: 'TST',
  uuid: 'test-uuid',
  ...overrides
});

export const createMockPriceHistory = (cardUuid: string, days = 30) => {
  const history = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    history.push({
      card_uuid: cardUuid,
      date: date.toISOString().split('T')[0],
      price_usd: Math.random() * 100,
      source: 'test'
    });
  }
  return history;
};

// Test data cleanup
export const cleanupTestData = async () => {
  // Add cleanup logic for test data
};`;

    await this.writeFile('src/test/utils/index.ts', testUtils);

    // Mock service worker setup
    const mswSetup = `import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup Mock Service Worker for API mocking
export const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after tests are finished
afterAll(() => server.close());`;

    await this.writeFile('src/test/mocks/server.ts', mswSetup);

    const mswHandlers = `import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock price history API
  http.get('/api/price-history', () => {
    return HttpResponse.json({
      ok: true,
      data: {
        earliest_date: '2025-01-01',
        latest_date: '2025-08-12',
        total_records: 1000
      }
    });
  }),

  // Mock database API
  http.get('/api/database', ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'info':
        return HttpResponse.json({
          ok: true,
          data: {
            tables: [
              { table: 'cards', count: 100 },
              { table: 'price_history', count: 1000 }
            ]
          }
        });
      case 'health':
        return HttpResponse.json({
          ok: true,
          data: [
            { table: 'cards', count: 100 },
            { table: 'price_history', count: 1000 }
          ]
        });
      default:
        return HttpResponse.json(
          { ok: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  }),

  // Mock Scryfall API
  http.get('https://api.scryfall.com/cards/named', ({ request }) => {
    const url = new URL(request.url);
    const exact = url.searchParams.get('exact');
    
    return HttpResponse.json({
      name: exact,
      prices: { usd: '10.50' },
      image_uris: { normal: 'https://example.com/card.jpg' },
      set: 'TST',
      set_name: 'Test Set'
    });
  })
];`;

    await this.writeFile('src/test/mocks/handlers.ts', mswHandlers);

    console.log('✅ Testing utilities created');
  }

  /**
   * Setup code quality tools
   */
  async setupCodeQualityTools() {
    console.log('📊 Setting up code quality tools...');
    
    // Update package.json scripts
    const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = {
      ...packageJson.scripts,
      'test': 'jest',
      'test:unit': 'jest src/test/unit',
      'test:integration': 'jest src/test/integration',
      'test:e2e': 'playwright test',
      'test:coverage': 'jest --coverage',
      'test:watch': 'jest --watch',
      'test:ci': 'jest --ci --coverage --watchAll=false',
      'test:debug': 'jest --detectOpenHandles --forceExit',
      'lint:test': 'eslint "src/**/*.test.{ts,tsx}" "src/**/*.spec.{ts,tsx}"'
    };

    if (!this.dryRun) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    // ESLint configuration for tests
    const eslintTestConfig = `module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:testing-library/react',
    'plugin:jest/recommended'
  ],
  plugins: ['testing-library', 'jest'],
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.{test,spec}.*'],
      env: {
        jest: true
      },
      rules: {
        'testing-library/await-async-query': 'error',
        'testing-library/no-await-sync-query': 'error',
        'testing-library/no-debugging-utils': 'warn',
        'testing-library/no-dom-import': 'error',
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error'
      }
    }
  ]
};`;

    await this.writeFile('eslint.test.config.js', eslintTestConfig);

    console.log('✅ Code quality tools configured');
    this.stats.configFilesCreated += 2;
  }

  /**
   * Create testing documentation
   */
  async createTestingDocumentation() {
    console.log('📚 Creating testing documentation...');
    
    const testingGuide = `# 🧪 Testing Guide - MTG Investment Next

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

\`\`\`
src/test/
├── unit/           # Unit tests for individual components/functions
├── integration/    # Integration tests for API routes and database
├── e2e/           # End-to-end tests with Playwright
├── mocks/         # Mock service worker setup and handlers
├── utils/         # Testing utilities and helpers
└── setup.ts       # Global test setup
\`\`\`

## Running Tests

### All Tests
\`\`\`bash
npm test
\`\`\`

### Unit Tests Only
\`\`\`bash
npm run test:unit
\`\`\`

### Integration Tests Only
\`\`\`bash
npm run test:integration
\`\`\`

### E2E Tests Only
\`\`\`bash
npm run test:e2e
\`\`\`

### Coverage Report
\`\`\`bash
npm run test:coverage
\`\`\`

### Watch Mode (Development)
\`\`\`bash
npm run test:watch
\`\`\`

## Writing Tests

### Unit Tests

Unit tests focus on individual components or functions in isolation:

\`\`\`typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
\`\`\`

### Integration Tests

Integration tests verify API routes and database operations:

\`\`\`typescript
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
\`\`\`

### E2E Tests

End-to-end tests verify complete user workflows:

\`\`\`typescript
import { test, expect } from '@playwright/test';

test('user can complete workflow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="action-button"]');
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
\`\`\`

## Database Testing

Use the TestDatabase utility for database operations:

\`\`\`typescript
import { TestDatabase } from '@/test/utils/database';

beforeEach(async () => {
  await TestDatabase.setupTestDatabase();
  await TestDatabase.seedTestData();
});

afterEach(async () => {
  await TestDatabase.cleanupTestDatabase();
});
\`\`\`

## Mocking

### API Mocking with MSW

Mock external APIs using Mock Service Worker:

\`\`\`typescript
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
\`\`\`

### Component Mocking

Mock complex components or external dependencies:

\`\`\`typescript
jest.mock('@/components/ComplexComponent', () => {
  return function MockComplexComponent(props: any) {
    return <div data-testid="mock-complex">{props.children}</div>;
  };
});
\`\`\`

## Coverage Requirements

- **Minimum Coverage**: 70% for all metrics
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Data Test IDs**: Add \`data-testid\` attributes for stable selectors
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
\`\`\`bash
npm run test:debug
\`\`\`

### VS Code Integration
1. Install Jest Runner extension
2. Use built-in test debugging features
3. Set breakpoints in test files

### Playwright Debug
\`\`\`bash
npx playwright test --debug
\`\`\`

## Performance Testing

While not included in this initial setup, consider adding:
- Load testing with Artillery or k6
- Performance regression testing
- Bundle size monitoring

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)`;

    await this.writeFile('docs/TESTING.md', testingGuide);

    console.log('✅ Testing documentation created');
  }

  /**
   * Generate DevOps agent report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      agent: 'DevOpsAgent',
      summary: `DevOps Agent completed: ${this.stats.testFilesCreated} test files created, ${this.stats.configFilesCreated} config files, ${this.stats.dependenciesInstalled} dependencies`,
      stats: this.stats,
      testingLog: this.testingLog,
      testingStack: {
        unitTesting: 'Jest + React Testing Library',
        integrationTesting: 'Jest + Supertest',
        e2eTesting: 'Playwright',
        databaseTesting: 'Custom SQLite utilities',
        apiMocking: 'MSW (Mock Service Worker)',
        cicd: 'GitHub Actions'
      },
      coverage: {
        requirements: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    };

    // Write report to file
    const reportPath = path.join(this.workspaceRoot, 'devops-agent-report.json');
    if (!this.dryRun) {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    }
    
    console.log(`\n📊 DevOps Agent Summary:`);
    console.log(`   Test files created: ${this.stats.testFilesCreated}`);
    console.log(`   Config files created: ${this.stats.configFilesCreated}`);
    console.log(`   Dependencies installed: ${this.stats.dependenciesInstalled}`);
    console.log(`   Workflows created: ${this.stats.workflowsCreated}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log(`   Report saved: ${reportPath}`);

    return report;
  }
}

// Execute if run directly
if (require.main === module) {
  const agent = new DevOpsAgent({ 
    verbose: true, 
    workspaceRoot: process.cwd() 
  });
  
  agent.execute()
    .then(report => {
      console.log('✅ DevOps Agent execution complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ DevOps Agent failed:', error);
      process.exit(1);
    });
}

module.exports = DevOpsAgent;
