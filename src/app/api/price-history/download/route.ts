import { NextResponse } from 'next/server';
import { 
  FILES, 
  fileExists, 
  createErrorResponse,
  withErrorHandling,
  initializeFileSystem
} from '@/lib';
import { promises as fs } from 'fs';

// Initialize file system on module load
initializeFileSystem().catch(console.error);

export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  if (!fileExists(FILES.PRICE_HISTORY)) {
    return createErrorResponse(new Error('No price history found'), 'No price history found', 404);
  }

  try {
    const data = await fs.readFile(FILES.PRICE_HISTORY, 'utf-8');
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="price-history.json"',
      },
    });
  } catch (error) {
    console.error('Failed to read price history for download:', error);
    return createErrorResponse(error, 'Failed to read price history file', 500);
  }
});
