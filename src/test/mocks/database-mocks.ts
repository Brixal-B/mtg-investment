/**
 * Database mocks for testing
 */

export const mockDatabase: any = {
  cards: [],
  users: [],
  prices: [],
  
  // Mock database operations
  findMany: jest.fn(() => Promise.resolve([])),
  findUnique: jest.fn(() => Promise.resolve(null)),
  create: jest.fn((data: any) => Promise.resolve({ id: '1', ...data })),
  update: jest.fn((data: any) => Promise.resolve({ id: '1', ...data })),
  delete: jest.fn(() => Promise.resolve({ id: '1' })),
  count: jest.fn(() => Promise.resolve(0)),
  
  // Transaction mock
  $transaction: jest.fn((callback: any) => callback(mockDatabase)),
  
  // Connection mock
  $connect: jest.fn(() => Promise.resolve()),
  $disconnect: jest.fn(() => Promise.resolve()),
};

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockDatabase),
}));

// Database utility mocks
export const mockDbUtils = {
  getDatabaseInfo: jest.fn(() => Promise.resolve({
    tables: ['cards', 'users', 'prices'],
    totalRecords: 1000,
    dbSize: '50MB'
  })),
  
  vacuum: jest.fn(() => Promise.resolve()),
  
  backup: jest.fn(() => Promise.resolve('backup-path')),
  
  migrate: jest.fn(() => Promise.resolve({ success: true })),
};

export default mockDatabase;