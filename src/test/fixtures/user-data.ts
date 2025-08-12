export const mockUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

export const mockAuthResponse = {
  success: true,
  token: 'mock-jwt-token',
  user: mockUser
};

export const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '3',
    email: 'moderator@example.com',
    name: 'Moderator User',
    role: 'moderator',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

export const mockInvalidCredentials = {
  email: 'invalid@example.com',
  password: 'wrongpassword'
};

export const mockValidCredentials = {
  email: 'admin@example.com',
  password: 'admin'
};