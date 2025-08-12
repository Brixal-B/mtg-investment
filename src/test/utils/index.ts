export * from './api';
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
};