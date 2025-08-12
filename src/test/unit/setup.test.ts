// Simple utility test to verify Jest setup
describe('DevOps Agent - Testing Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async tests', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should have proper environment setup', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
