import { NextResponse } from 'next/server';
import { 
  FILES,
  fileExists,
  deleteFile,
  createSuccessResponse,
  withErrorHandling,
  initializeFileSystem
} from '@/lib';

// Initialize file system on module load
initializeFileSystem().catch(console.error);

export const POST = withErrorHandling(async (): Promise<NextResponse> => {
  let removed = false;
  const messages: string[] = [];
  
  // Remove the main lock file
  if (fileExists(FILES.IMPORT_PROGRESS_LOCK)) {
    deleteFile(FILES.IMPORT_PROGRESS_LOCK);
    removed = true;
    messages.push('Removed import lock file');
  }
  
  // Remove the progress file
  if (fileExists(FILES.IMPORT_PROGRESS_DATA)) {
    deleteFile(FILES.IMPORT_PROGRESS_DATA);
    removed = true;
    messages.push('Removed import progress data');
  }
  
  if (!removed) {
    messages.push('No lock files found to remove');
  }
  
  return createSuccessResponse({ 
    removed, 
    message: messages.join(', ') 
  });
});
