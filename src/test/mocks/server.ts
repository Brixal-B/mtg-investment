import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup Mock Service Worker for API mocking
export const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after tests are finished
afterAll(() => server.close());