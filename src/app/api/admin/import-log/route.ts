import { NextResponse } from 'next/server';
import { 
  FILES,
  fileExists,
  createErrorResponse,
  withErrorHandling,
  initializeFileSystem
} from '@/lib';
import fs from 'fs';

// Initialize file system on module load
initializeFileSystem().catch(console.error);

export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  if (!fileExists(FILES.IMPORT_LOG)) {
    return createErrorResponse(
      new Error('Log file not found'),
      'Log file not found',
      404
    );
  }

  try {
    const log = fs.readFileSync(FILES.IMPORT_LOG);
    return new NextResponse(log, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="AllPrices.import.log"',
      },
    });
  } catch (error) {
    console.error('Failed to read log file:', error);
    return createErrorResponse(error, 'Failed to read log file', 500);
  }
});
