import { NextApiRequest, NextApiResponse } from 'next';
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
}