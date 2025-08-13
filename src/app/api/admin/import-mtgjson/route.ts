import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import { exec } from 'child_process';
import { 
  FILES,
  fileExists,
  readJsonFile,
  deleteFile,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  initializeFileSystem
} from '@/lib';
import fs from 'fs';

// Initialize file system on module load
initializeFileSystem().catch(console.error);

export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  // Check for debug mode
  const url = new URL(req.url);
  const debugMode = url.searchParams.get('debug') === 'true';
  
  // Check if already in progress
  if (fileExists(FILES.IMPORT_PROGRESS_LOCK)) {
    // Check if the lock file is stale (older than 10 minutes)
    try {
      const stats = fs.statSync(FILES.IMPORT_PROGRESS_LOCK);
      const fileAge = Date.now() - stats.mtime.getTime();
      const tenMinutes = 10 * 60 * 1000; // 10 minutes
      
      if (fileAge > tenMinutes) {
        console.log('Removing stale import lock file (older than 10 minutes)');
        deleteFile(FILES.IMPORT_PROGRESS_LOCK);
      } else {
        return createErrorResponse(
          new Error(`Import already in progress. Started ${Math.round(fileAge / 1000)} seconds ago.`),
          `Import already in progress. Started ${Math.round(fileAge / 1000)} seconds ago.`,
          409
        );
      }
    } catch {
      // If we can't read the file stats, remove it
      console.log('Removing unreadable import lock file');
      deleteFile(FILES.IMPORT_PROGRESS_LOCK);
    }
  }
  
  // Create lock file
  fs.writeFileSync(FILES.IMPORT_PROGRESS_LOCK, '1');
  
  // Clear previous log
  deleteFile(FILES.IMPORT_LOG);
  
  // Build command with debug flag if requested
  const command = debugMode 
    ? 'node load-mtgjson-price-history.js --debug' 
    : 'node load-mtgjson-price-history.js';
  
  console.log(`Starting import command: ${command}`);
  
  return new Promise((resolve) => {
    const child = exec(command, (_, stdout, stderr) => {
      // Always remove the lock file when process finishes
      deleteFile(FILES.IMPORT_PROGRESS_LOCK);
      
      // Append final output to log
      fs.appendFileSync(FILES.IMPORT_LOG, '\n=== Process finished ===\n');
      
      if (error) {
        fs.appendFileSync(FILES.IMPORT_LOG, `\nERROR: ${stderr || error.message}\n`);
        resolve(createErrorResponse(error, stderr || error.message, 500));
      } else {
        fs.appendFileSync(FILES.IMPORT_LOG, `\nSUCCESS: ${stdout}\n`);
        resolve(createSuccessResponse({ ok: true, output: stdout }));
      }
    });
    
    // Pipe stdout/stderr to log file
    child.stdout?.on('data', (data) => {
      fs.appendFileSync(FILES.IMPORT_LOG, data);
    });
    child.stderr?.on('data', (data) => {
      fs.appendFileSync(FILES.IMPORT_LOG, data);
    });
    
    // Handle process termination
    child.on('exit', (code) => {
      console.log(`Import process exited with code: ${code}`);
    });
  });
});

// GET /api/admin/import-mtgjson?progress=1 or ?log=1
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const url = new URL(req.url);
  
  if (url.searchParams.get('progress') === '1') {
    const inProgress = fileExists(FILES.IMPORT_PROGRESS_LOCK);
    let progressData = null;
    
    try {
      progressData = await readJsonFile(FILES.IMPORT_PROGRESS_DATA);
    } catch {
      // Progress file doesn't exist or is invalid
    }
    
    return createSuccessResponse({ 
      inProgress, 
      ...progressData 
    });
  }
  
  if (url.searchParams.get('log') === '1') {
    try {
      const log = fs.readFileSync(FILES.IMPORT_LOG, 'utf8');
      return createSuccessResponse({ log });
    } catch {
      return createSuccessResponse({ log: '' });
    }
  }
  
  return createSuccessResponse({});
});
