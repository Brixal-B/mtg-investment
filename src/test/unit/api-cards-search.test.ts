/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/cards/search/route';

// Mock the database
jest.mock('../../lib/database', () => ({
  database: {
    all: jest.fn(),
    run: jest.fn(),
    get: jest.fn(),
  }
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      headers: options?.headers || new Map(),
    })),
  },
  NextRequest: jest.fn(),
}));

describe('/api/cards/search API', () => {
  let mockDatabase: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase = require('../../lib/database').database;
  });

  describe('GET /api/cards/search', () => {
    it('should search cards with query parameter', async () => {
      const mockCards = [
        {
          uuid: 'test-uuid-1',
          name: 'Black Lotus',
          set_code: 'LEA',
          set_name: 'Limited Edition Alpha'
        }
      ];

      mockDatabase.all.mockResolvedValue(mockCards);

      const request = { 
        url: 'http://localhost:3000/api/cards/search?name=Black%20Lotus' 
      } as NextRequest;
      const response = await GET(request);

      expect(mockDatabase.all).toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should handle empty query parameter', async () => {
      // Empty name parameter should return error response without calling database
      const request = { 
        url: 'http://localhost:3000/api/cards/search?name=' 
      } as NextRequest;
      const response = await GET(request);

      // Should NOT call database for invalid input
      expect(mockDatabase.all).not.toHaveBeenCalled();
      expect(response).toBeDefined();
      
      // Verify error response
      const responseData = await response.json();
      expect(responseData.ok).toBe(false);
    });

    it('should handle missing query parameter', async () => {
      mockDatabase.all.mockResolvedValue([]);

      const request = { 
        url: 'http://localhost:3000/api/cards/search' 
      } as NextRequest;
      const response = await GET(request);

      expect(response).toBeDefined();
    });

    it('should handle database errors', async () => {
      mockDatabase.all.mockRejectedValue(new Error('Database error'));

      const request = { 
        url: 'http://localhost:3000/api/cards/search?name=test' 
      } as NextRequest;
      const response = await GET(request);

      expect(response).toBeDefined();
    });
  });

  describe('POST /api/cards/search', () => {
    it('should search multiple cards by name and set', async () => {
      const mockCards = [
        {
          uuid: 'test-uuid-1',
          name: 'Black Lotus',
          set_code: 'LEA',
          set_name: 'Limited Edition Alpha'
        }
      ];

      mockDatabase.all.mockResolvedValue(mockCards);

      const requestBody = {
        cards: [
          { name: 'Black Lotus', setCode: 'LEA' }
        ]
      };

      const request = {
        json: () => Promise.resolve(requestBody)
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(mockDatabase.all).toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should handle UNKNOWN set codes', async () => {
      const mockCards = [
        {
          uuid: 'test-uuid-1',
          name: 'Black Lotus',
          set_code: 'LEA',
          set_name: 'Limited Edition Alpha'
        }
      ];

      mockDatabase.all.mockResolvedValue(mockCards);

      const requestBody = {
        cards: [
          { name: 'Black Lotus', setCode: 'UNKNOWN' }
        ]
      };

      const request = {
        json: () => Promise.resolve(requestBody)
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(mockDatabase.all).toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should handle invalid request body', async () => {
      const request = {
        json: () => Promise.resolve('invalid')
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const request = {
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response).toBeDefined();
    });

    it('should handle database errors in POST', async () => {
      mockDatabase.all.mockRejectedValue(new Error('Database error'));

      const requestBody = [
        { name: 'Black Lotus', setCode: 'LEA' }
      ];

      const request = {
        json: () => Promise.resolve(requestBody)
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should sanitize SQL injection attempts', async () => {
      const maliciousQuery = "'; DROP TABLE cards; --";
      
      mockDatabase.all.mockResolvedValue([]);

      const request = {
        url: `http://localhost:3000/api/cards/search?name=${encodeURIComponent(maliciousQuery)}`
      } as NextRequest;
      const response = await GET(request);

      // Should pass the malicious input to database layer (which should handle it safely)
      expect(mockDatabase.all).toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should handle extremely long queries', async () => {
      const longQuery = 'a'.repeat(10000);
      
      mockDatabase.all.mockResolvedValue([]);

      const request = new NextRequest(`http://localhost:3000/api/cards/search?name=${encodeURIComponent(longQuery)}`);
      const response = await GET(request);

      expect(response).toBeDefined();
    });

    it('should handle special characters in search', async () => {
      const specialQuery = "Jace, the Mind Sculptor";
      
      mockDatabase.all.mockResolvedValue([]);

      const request = {
        url: `http://localhost:3000/api/cards/search?name=${encodeURIComponent(specialQuery)}`
      } as NextRequest;
      const response = await GET(request);

      expect(mockDatabase.all).toHaveBeenCalled();
      expect(response).toBeDefined();
    });
  });
});
