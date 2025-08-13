import { NextResponse } from 'next/server';
import fs from 'fs';
import { 
  FILES,
  downloadWithProgress,
  readJsonFile,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  initializeFileSystem
} from '@/lib';

// Initialize file system on module load
initializeFileSystem().catch(console.error);

export const POST = withErrorHandling(async (): Promise<NextResponse> => {
  try {
    const downloadUrl = 'https://mtgjson.com/api/v5/AllPrices.json';
    
    // Track progress by writing to progress file
    await downloadWithProgress(
      downloadUrl,
      FILES.MTGJSON_ALLPRICES,
      (progress) => {
        // Write progress to file synchronously for immediate availability
        fs.writeFileSync(FILES.DOWNLOAD_PROGRESS, JSON.stringify(progress));
      }
    );
    
    return createSuccessResponse({ 
      ok: true, 
      path: FILES.MTGJSON_ALLPRICES 
    });
  } catch (error) {
    console.error('Download failed:', error);
    return createErrorResponse(error, 'Failed to download MTGJSON data', 500);
  }
});

// GET returns download progress
export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  try {
    const progressData = await readJsonFile(FILES.DOWNLOAD_PROGRESS);
    return createSuccessResponse(progressData);
  } catch {
    // Return default progress if no progress file exists
    return createSuccessResponse({ 
      received: 0, 
      total: 0, 
      percent: 0 
    });
  }
});
