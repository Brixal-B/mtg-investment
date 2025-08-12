import { NextResponse } from 'next/server';
import { 
  FILES,
  fileExists,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  initializeFileSystem
} from '@/lib';
import fs from 'fs';

// Initialize file system on module load
initializeFileSystem().catch(console.error);

export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  // Check for the public file first, then the temp file
  const filePath = fileExists(FILES.MTGJSON_ALLPRICES_LOCAL) 
    ? FILES.MTGJSON_ALLPRICES_LOCAL 
    : FILES.MTGJSON_ALLPRICES;
  
  if (!fileExists(filePath)) {
    return createErrorResponse(
      new Error('AllPrices.json not found'),
      'AllPrices.json not found. Please download MTGJSON data first.',
      404
    );
  }
  
  try {
    // Read a sample of the file to extract meta information
    const fileHandle = fs.openSync(filePath, 'r');
    const sampleSize = 10 * 1024 * 1024; // 10MB sample
    const buffer = Buffer.alloc(sampleSize);
    const bytesRead = fs.readSync(fileHandle, buffer, 0, sampleSize, 0);
    fs.closeSync(fileHandle);
    
    const partialContent = buffer.toString('utf8', 0, bytesRead);
    
    // Find the data section
    const dataStart = partialContent.indexOf('"data": {');
    if (dataStart === -1) {
      throw new Error('Invalid JSON structure - no data field found');
    }
    
    // Extract meta information
    const metaMatch = partialContent.match(/"meta":\s*({[^}]+})/);
    if (!metaMatch) {
      throw new Error('Invalid JSON structure - no meta field found');
    }
    
    const meta = JSON.parse(metaMatch[1]);
    const stats = fs.statSync(filePath);
    
    return createSuccessResponse({
      meta,
      fileSize: stats.size,
      data: {
        message: "Data loading simplified due to file size constraints",
        totalSize: `${(stats.size / (1024 * 1024 * 1024)).toFixed(2)} GB`,
        suggestion: "Use the admin import tools to process this data server-side first"
      }
    });
  } catch (error) {
    console.error('Error loading MTGJSON data:', error);
    return createErrorResponse(
      error,
      'Failed to load MTGJSON data',
      500
    );
  }
});
