import { NextResponse } from 'next/server';
import { 
  FILES,
  fileExists,
  createSuccessResponse,
  withErrorHandling,
  initializeFileSystem
} from '@/lib';
import fs from 'fs';

// Initialize file system on module load
initializeFileSystem().catch(console.error);

export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  if (fileExists(FILES.MTGJSON_ALLPRICES)) {
    try {
      const stats = fs.statSync(FILES.MTGJSON_ALLPRICES);
      return createSuccessResponse({ 
        exists: true, 
        size: stats.size 
      });
    } catch (error) {
      console.error('Error reading file stats:', error);
      return createSuccessResponse({ exists: false });
    }
  }
  
  return createSuccessResponse({ exists: false });
});
